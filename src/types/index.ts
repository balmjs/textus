export interface Group {
  id?: number;
  name: string;
  parentId?: number | null;
  orderNum: number;
  isPublic?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Site {
  id?: number;
  groupId: number;
  name: string;
  url: string;
  icon?: string | null;
  description?: string | null;
  notes?: string | null;
  orderNum: number;
  isPublic?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupWithSites extends Group {
  sites: Site[];
  children?: GroupWithSites[];
}

export interface Config {
  key: string;
  value: string;
}

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
