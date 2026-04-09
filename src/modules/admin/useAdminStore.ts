import { defineStore } from 'pinia';
import api from '@/shared/services/api';
import type { AdminUser } from './admin.types';

export const useAdminStore = defineStore('admin', () => {
  async function fetchUsers(): Promise<AdminUser[]> {
    const { data } = await api.get('/api/admin/users');
    return data.map((u: any): AdminUser => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? undefined,
      lastLogoutAt: u.lastLogoutAt ?? undefined,
    }));
  }

  return { fetchUsers };
});

