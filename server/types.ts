import type { Group, Site, Config } from './db/schema';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Group with sites
export interface GroupWithSites extends Group {
  sites: Site[];
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export interface AuthStatus {
  authenticated: boolean;
}

// Export/Import types
export interface ExportData {
  groups: Group[];
  sites: Site[];
  configs: Record<string, string>;
  version: string;
  exportDate: string;
}

export interface ImportResult {
  success: boolean;
  stats?: {
    groups: {
      total: number;
      created: number;
      merged: number;
    };
    sites: {
      total: number;
      created: number;
      updated: number;
      skipped: number;
    };
  };
  error?: string;
}

// Batch update types
export interface GroupOrderUpdate {
  id: number;
  orderNum: number;
}

export interface SiteOrderUpdate {
  id: number;
  orderNum: number;
}

export { type Group, type Site, type Config };
