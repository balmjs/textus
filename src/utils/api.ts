import type {
  Group,
  Site,
  GroupWithSites,
  LoginRequest,
  LoginResponse,
  AuthStatus,
  ExportData,
  ImportResult,
  ApiResponse,
} from '@/types';

import { useLoadingStore } from '@/stores/loading';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const loadingStore = useLoadingStore();
  loadingStore.startLoading();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok && !data.success) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } finally {
    loadingStore.stopLoading();
  }
}

// Auth API
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await request<{ token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // The API returns { success: true, data: { token: "..." }, message: "..." }
  // We need to convert it to LoginResponse format
  return {
    success: response.success,
    token: response.data?.token,
    message: response.message,
  };
}

export async function logout(): Promise<void> {
  await request('/logout', {
    method: 'POST',
  });
}

export async function checkAuthStatus(): Promise<AuthStatus> {
  const response = await request<AuthStatus>('/auth/status');
  return response.data || { authenticated: false };
}

// Groups API
export async function getGroups(): Promise<Group[]> {
  const response = await request<Group[]>('/groups');
  return response.data || [];
}

export async function getGroup(id: number): Promise<Group> {
  const response = await request<Group>(`/groups/${id}`);
  if (!response.data) throw new Error('Group not found');
  return response.data;
}

export async function createGroup(group: Omit<Group, 'id'>): Promise<Group> {
  const response = await request<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(group),
  });
  if (!response.data) throw new Error('Failed to create group');
  return response.data;
}

export async function updateGroup(id: number, updates: Partial<Group>): Promise<Group> {
  const response = await request<Group>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.data) throw new Error('Failed to update group');
  return response.data;
}

export async function deleteGroup(id: number): Promise<void> {
  await request(`/groups/${id}`, {
    method: 'DELETE',
  });
}

export async function updateGroupOrders(
  orders: Array<{ id: number; orderNum: number }>
): Promise<void> {
  await request('/group-orders', {
    method: 'PUT',
    body: JSON.stringify(orders),
  });
}

// Sites API
export async function getSites(groupId?: number): Promise<Site[]> {
  const endpoint = groupId ? `/sites?groupId=${groupId}` : '/sites';
  const response = await request<Site[]>(endpoint);
  return response.data || [];
}

export async function getSite(id: number): Promise<Site> {
  const response = await request<Site>(`/sites/${id}`);
  if (!response.data) throw new Error('Site not found');
  return response.data;
}

export async function createSite(site: Omit<Site, 'id'>): Promise<Site> {
  const response = await request<Site>('/sites', {
    method: 'POST',
    body: JSON.stringify(site),
  });
  if (!response.data) throw new Error('Failed to create site');
  return response.data;
}

export async function updateSite(id: number, updates: Partial<Site>): Promise<Site> {
  const response = await request<Site>(`/sites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.data) throw new Error('Failed to update site');
  return response.data;
}

export async function deleteSite(id: number): Promise<void> {
  await request(`/sites/${id}`, {
    method: 'DELETE',
  });
}

export async function updateSiteOrders(
  orders: Array<{ id: number; orderNum: number }>
): Promise<void> {
  await request('/site-orders', {
    method: 'PUT',
    body: JSON.stringify(orders),
  });
}

// Groups with sites
export async function getGroupsWithSites(): Promise<GroupWithSites[]> {
  const response = await request<GroupWithSites[]>('/groups-with-sites');
  return response.data || [];
}

// Config API
export async function getConfigs(): Promise<Record<string, string>> {
  const response = await request<Record<string, string>>('/configs');
  return response.data || {};
}

export async function getConfig(key: string): Promise<string | null> {
  try {
    const response = await request<{ key: string; value: string | null }>(`/configs/${key}`);
    return response.data?.value || null;
  } catch {
    return null;
  }
}

export async function setConfig(key: string, value: string): Promise<void> {
  await request(`/configs/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

// Export/Import
export async function exportData(): Promise<ExportData> {
  const response = await request<ExportData>('/export');
  if (!response.data) throw new Error('Failed to export data');
  return response.data;
}

export async function importData(data: ExportData): Promise<ImportResult> {
  const response = await request<ImportResult>('/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // The API returns { success: true, data: ImportResult, message: "..." }
  // We need to return the ImportResult with the outer success status
  if (!response.data) throw new Error('Failed to import data');

  return {
    ...response.data,
    success: response.success && response.data.success,
  };
}
