import { eq, sql } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import { groups, sites, configs } from '../db/schema';
import type {
  Group,
  Site,
  GroupWithSites,
  ExportData,
  ImportResult,
  LoginRequest,
  LoginResponse,
  GroupOrderUpdate,
  SiteOrderUpdate,
} from '../types';
import { JWT, verifyPassword } from '../utils/auth';

export class NavigationService {
  private db: DbClient;
  private jwtService: JWT;
  private authEnabled: boolean;
  private authUsername: string;
  private authPasswordHash: string;
  private authRequiredForRead: boolean;

  constructor(config: {
    db: DbClient;
    authEnabled: boolean;
    authUsername: string;
    authPasswordHash: string;
    authSecret: string;
    authRequiredForRead?: boolean;
  }) {
    this.db = config.db;
    this.authEnabled = config.authEnabled;
    this.authUsername = config.authUsername;
    this.authPasswordHash = config.authPasswordHash;
    this.authRequiredForRead = config.authRequiredForRead ?? false;
    this.jwtService = new JWT(config.authSecret);
  }

  // Auth methods
  async login(request: LoginRequest): Promise<LoginResponse> {
    if (!this.authEnabled) {
      const token = await this.jwtService.sign({ username: 'guest' }, 24 * 60 * 60);
      return {
        success: true,
        token,
        message: 'Authentication disabled, logged in as guest',
      };
    }

    if (request.username !== this.authUsername) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    const isPasswordValid = verifyPassword(request.password, this.authPasswordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }

    const expiresIn = request.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    const token = await this.jwtService.sign({ username: request.username }, expiresIn);

    return {
      success: true,
      token,
      message: 'Login successful',
    };
  }

  async verifyToken(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
    if (!this.authEnabled) {
      return { valid: true };
    }

    return await this.jwtService.verify(token);
  }

  isAuthEnabled(): boolean {
    return this.authEnabled;
  }

  isAuthRequiredForRead(): boolean {
    return this.authRequiredForRead;
  }

  // Group methods
  async getGroups(isAuthenticated: boolean = false): Promise<Group[]> {
    if (isAuthenticated || !this.authRequiredForRead) {
      const query = this.db
        .select()
        .from(groups)
        .orderBy(groups.orderNum);
      
      if (!isAuthenticated && !this.authRequiredForRead) {
        return await query.where(eq(groups.isPublic, 1));
      }
      
      return await query;
    }

    return [];
  }

  async getGroup(id: number, isAuthenticated: boolean = false): Promise<Group | null> {
    const result = await this.db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);

    const group = result[0];

    if (!group) return null;

    if (!isAuthenticated && !this.authRequiredForRead && group.isPublic === 0) {
      return null;
    }

    return group ?? null;
  }

  async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    const result = await this.db
      .insert(groups)
      .values({
        name: group.name,
        parentId: group.parentId,
        orderNum: group.orderNum,
        isPublic: group.isPublic ?? 1,
      })
      .returning();

    return result[0]!;
  }

  async updateGroup(id: number, updates: Partial<Group>): Promise<Group | null> {
    const allowedFields: (keyof typeof updates)[] = ['name', 'parentId', 'orderNum', 'isPublic'];
    const updateData: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 1) {
      throw new Error('No fields to update');
    }

    const result = await this.db
      .update(groups)
      .set(updateData)
      .where(eq(groups.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(groups).where(eq(groups.id, id));
    return result.rowsAffected > 0;
  }

  async updateGroupOrders(orders: GroupOrderUpdate[]): Promise<boolean> {
    await this.db.transaction(async (tx) => {
      for (const order of orders) {
        await tx
          .update(groups)
          .set({ orderNum: order.orderNum, updatedAt: sql`CURRENT_TIMESTAMP` })
          .where(eq(groups.id, order.id));
      }
    });

    return true;
  }

  // Site methods
  async getSites(groupId?: number, isAuthenticated: boolean = false): Promise<Site[]> {
    let query = this.db.select().from(sites).orderBy(sites.orderNum);

    if (groupId !== undefined) {
      query = query.where(eq(sites.groupId, groupId)) as typeof query;
    }

    const allSites = await query;

    if (!isAuthenticated && !this.authRequiredForRead) {
      return allSites.filter((site) => site.isPublic === 1);
    }

    return allSites;
  }

  async getSite(id: number, isAuthenticated: boolean = false): Promise<Site | null> {
    const result = await this.db
      .select()
      .from(sites)
      .where(eq(sites.id, id))
      .limit(1);

    const site = result[0];

    if (!site) return null;

    if (!isAuthenticated && !this.authRequiredForRead && site.isPublic === 0) {
      return null;
    }

    return site ?? null;
  }

  async createSite(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site> {
    const result = await this.db
      .insert(sites)
      .values({
        groupId: site.groupId,
        name: site.name,
        url: site.url,
        icon: site.icon,
        description: site.description,
        notes: site.notes,
        orderNum: site.orderNum,
        isPublic: site.isPublic ?? 1,
      })
      .returning();

    return result[0]!;
  }

  async updateSite(id: number, updates: Partial<Site>): Promise<Site | null> {
    const allowedFields: (keyof typeof updates)[] = [
      'name',
      'url',
      'icon',
      'description',
      'notes',
      'orderNum',
      'isPublic',
      'groupId',
    ];
    const updateData: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 1) {
      throw new Error('No fields to update');
    }

    const result = await this.db
      .update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning();

    return result[0] ?? null;
  }

  async deleteSite(id: number): Promise<boolean> {
    const result = await this.db.delete(sites).where(eq(sites.id, id));
    return result.rowsAffected > 0;
  }

  async updateSiteOrders(orders: SiteOrderUpdate[]): Promise<boolean> {
    await this.db.transaction(async (tx) => {
      for (const order of orders) {
        await tx
          .update(sites)
          .set({ orderNum: order.orderNum, updatedAt: sql`CURRENT_TIMESTAMP` })
          .where(eq(sites.id, order.id));
      }
    });

    return true;
  }

  // Groups with sites
  async getGroupsWithSites(isAuthenticated: boolean = false): Promise<GroupWithSites[]> {
    const allGroups = await this.getGroups(isAuthenticated);
    const allSites = await this.getSites(undefined, isAuthenticated);

    // 1. Create map of all groups
    const groupMap = new Map<number, GroupWithSites>();
    allGroups.forEach((group) => {
      groupMap.set(group.id!, { ...group, sites: [], children: [] });
    });

    // 2. Add sites to groups
    allSites.forEach((site) => {
      const group = groupMap.get(site.groupId);
      if (group) {
        group.sites.push(site);
      }
    });

    // 3. Build tree structure
    const rootGroups: GroupWithSites[] = [];
    groupMap.forEach((group) => {
      if (group.parentId && groupMap.has(group.parentId)) {
        const parent = groupMap.get(group.parentId)!;
        parent.children!.push(group);
      } else {
        rootGroups.push(group);
      }
    });

    // 4. Sort everything
    const sortRecursive = (items: GroupWithSites[]) => {
      items.sort((a, b) => a.orderNum - b.orderNum);
      items.forEach((item) => {
        item.sites.sort((a, b) => a.orderNum - b.orderNum);
        if (item.children?.length) {
          sortRecursive(item.children);
        }
      });
    };

    sortRecursive(rootGroups);
    return rootGroups;
  }

  // Config methods
  async getConfig(key: string): Promise<string | null> {
    const result = await this.db
      .select()
      .from(configs)
      .where(eq(configs.key, key))
      .limit(1);

    return result[0]?.value ?? null;
  }

  async getAllConfigs(): Promise<Record<string, string>> {
    const allConfigs = await this.db.select().from(configs);

    return allConfigs.reduce(
      (acc, config) => {
        acc[config.key] = config.value;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.db
      .insert(configs)
      .values({ key, value })
      .onConflictDoUpdate({
        target: configs.key,
        set: { value, updatedAt: sql`CURRENT_TIMESTAMP` },
      });
  }

  // Export/Import
  async exportData(): Promise<ExportData> {
    const allGroups = await this.getGroups(true);
    const allSites = await this.getSites(undefined, true);
    const allConfigs = await this.getAllConfigs();

    return {
      groups: allGroups,
      sites: allSites,
      configs: allConfigs,
      version: '1.0.0',
      exportDate: new Date().toISOString(),
    };
  }

  async importData(data: ExportData): Promise<ImportResult> {
    const stats = {
      groups: { total: data.groups.length, created: 0, merged: 0 },
      sites: { total: data.sites.length, created: 0, updated: 0, skipped: 0 },
    };

    try {
      await this.db.transaction(async (tx) => {
        const groupIdMap = new Map<number, number>();

        // Pass 1: Create/Merge all groups (ignoring parentId for now)
        for (const group of data.groups) {
          const existing = await tx
            .select()
            .from(groups)
            .where(eq(groups.name, group.name)) // Merge by name might be risky for nested folders with same name? But sticking to existing logic.
            .limit(1);

          if (existing[0]) {
            groupIdMap.set(group.id!, existing[0].id);
            stats.groups.merged++;
            // Optional: Update properties?
          } else {
            const result = await tx
              .insert(groups)
              .values({
                name: group.name,
                orderNum: group.orderNum,
                isPublic: group.isPublic ?? 1,
                // parentId: group.parentId // Skip in pass 1
              })
              .returning();

            groupIdMap.set(group.id!, result[0]!.id);
            stats.groups.created++;
          }
        }

        // Pass 2: Update parent links
        for (const group of data.groups) {
          if (group.parentId) {
             const newGroupId = groupIdMap.get(group.id!);
             const newParentId = groupIdMap.get(group.parentId);
             
             if (newGroupId && newParentId) {
                 await tx.update(groups)
                    .set({ parentId: newParentId })
                    .where(eq(groups.id, newGroupId));
             }
          }
        }

        // Import sites
        for (const site of data.sites) {
          const newGroupId = groupIdMap.get(site.groupId);

          if (!newGroupId) {
            stats.sites.skipped++;
            continue;
          }

          const existing = await tx
            .select()
            .from(sites)
            .where(eq(sites.url, site.url))
            .limit(1);

          if (existing[0] && existing[0].groupId === newGroupId) {
            await tx
              .update(sites)
              .set({
                name: site.name,
                icon: site.icon,
                description: site.description,
                notes: site.notes,
                orderNum: site.orderNum,
                isPublic: site.isPublic ?? 1,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(sites.id, existing[0].id));

            stats.sites.updated++;
          } else {
            await tx.insert(sites).values({
              groupId: newGroupId,
              name: site.name,
              url: site.url,
              icon: site.icon,
              description: site.description,
              notes: site.notes,
              orderNum: site.orderNum,
              isPublic: site.isPublic ?? 1,
            });

            stats.sites.created++;
          }
        }

        // Import configs
        for (const [key, value] of Object.entries(data.configs)) {
          await tx
            .insert(configs)
            .values({ key, value })
            .onConflictDoUpdate({
              target: configs.key,
              set: { value, updatedAt: sql`CURRENT_TIMESTAMP` },
            });
        }
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }
}
