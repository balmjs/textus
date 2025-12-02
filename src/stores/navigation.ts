import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  getGroupsWithSites,
  createGroup,
  updateGroup,
  deleteGroup,
  updateGroupOrders,
  createSite,
  updateSite,
  deleteSite,
  updateSiteOrders,
  getConfigs,
  setConfig,
} from '@/utils/api';
import type { GroupWithSites, Group, Site } from '@/types';

export const useNavigationStore = defineStore('navigation', () => {
  const groups = ref<GroupWithSites[]>([]);
  const configs = ref<Record<string, string>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadGroups(): Promise<void> {
    try {
      loading.value = true;
      error.value = null;
      groups.value = await getGroupsWithSites();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load groups';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function loadConfigs(): Promise<void> {
    try {
      configs.value = await getConfigs();
    } catch (e) {
      console.error('Failed to load configs:', e);
    }
  }

  async function addGroup(group: Omit<Group, 'id'>): Promise<Group> {
    const newGroup = await createGroup(group);
    await loadGroups();
    return newGroup;
  }

  async function editGroup(id: number, updates: Partial<Group>): Promise<void> {
    await updateGroup(id, updates);
    await loadGroups();
  }

  async function removeGroup(id: number): Promise<void> {
    await deleteGroup(id);
    await loadGroups();
  }

  async function reorderGroups(orders: Array<{ id: number; orderNum: number }>): Promise<void> {
    await updateGroupOrders(orders);
    await loadGroups();
  }

  async function addSite(site: Omit<Site, 'id'>): Promise<Site> {
    const newSite = await createSite(site);
    await loadGroups();
    return newSite;
  }

  async function editSite(id: number, updates: Partial<Site>): Promise<void> {
    await updateSite(id, updates);
    await loadGroups();
  }

  async function removeSite(id: number): Promise<void> {
    await deleteSite(id);
    await loadGroups();
  }

  async function reorderSites(orders: Array<{ id: number; orderNum: number }>): Promise<void> {
    await updateSiteOrders(orders);
    await loadGroups();
  }

  async function updateConfig(key: string, value: string): Promise<void> {
    await setConfig(key, value);
    configs.value[key] = value;
  }

  return {
    groups,
    configs,
    loading,
    error,
    loadGroups,
    loadConfigs,
    addGroup,
    editGroup,
    removeGroup,
    reorderGroups,
    addSite,
    editSite,
    removeSite,
    reorderSites,
    updateConfig,
  };
});
