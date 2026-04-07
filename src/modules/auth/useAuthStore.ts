import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import api from '@/shared/services/api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/modules/auth/auth.types';

export interface AuthUser {
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

const TOKEN_KEY = 'auth_token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<AuthUser | null>(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'Admin' || user.value?.role === 'System');

  /** Persist token to localStorage and store ref */
  function setToken(t: string): void {
    token.value = t;
    localStorage.setItem(TOKEN_KEY, t);
  }

  /** Map API response to local user state */
  function setUserFromResponse(res: AuthResponse): void {
    setToken(res.token);
    user.value = {
      username: res.username,
      email: res.email,
      role: res.role,
      avatar: res.avatarUrl,
    };
  }

  /** POST /api/auth/login */
  async function signIn(payload: LoginRequest): Promise<void> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    setUserFromResponse(data);
  }

  /** POST /api/auth/register */
  async function signUp(payload: RegisterRequest): Promise<void> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
    setUserFromResponse(data);
  }

  /** Clear session */
  function signOut(): void {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return { token, user, isLoggedIn, isAdmin, signIn, signUp, signOut };
});
