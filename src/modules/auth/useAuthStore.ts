import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import api from '@/shared/services/api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/modules/auth/auth.types';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

const TOKEN_KEY = 'auth_token';

/** Extract the 'sub' claim (user ID) from a JWT token */
function parseJwtSub(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? '';
  } catch {
    return '';
  }
}

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
      id: parseJwtSub(res.token),
      username: res.username,
      email: res.email,
      role: res.role,
      avatar: res.avatarUrl,
    };
  }

  // Restore user from stored token on init (page refresh)
  if (token.value && !user.value) {
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]));
      user.value = {
        id: payload.sub ?? '',
        username: payload.unique_name ?? payload.name ?? '',
        email: payload.email ?? '',
        role: payload.role ?? '',
      };
    } catch {
      // Token is invalid — clear it
      token.value = null;
      localStorage.removeItem(TOKEN_KEY);
    }
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
