import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as apiLogin, logout as apiLogout, checkAuthStatus } from '@/utils/api';
import type { LoginRequest } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const initialized = ref(false);
  const loading = ref(false);

  async function login(credentials: LoginRequest): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true;
      const response = await apiLogin(credentials);

      if (response.success) {
        isAuthenticated.value = true;
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      loading.value = true;
      await apiLogout();
      isAuthenticated.value = false;
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      loading.value = false;
    }
  }

  async function checkAuth(): Promise<void> {
    try {
      const status = await checkAuthStatus();
      isAuthenticated.value = status.authenticated;
      initialized.value = true;
    } catch (error) {
      console.error('Auth check failed:', error);
      isAuthenticated.value = false;
      initialized.value = true;
    }
  }

  return {
    isAuthenticated,
    initialized,
    loading,
    login,
    logout,
    checkAuth,
  };
});
