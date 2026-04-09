import { defineStore } from 'pinia';
import api from '@/shared/services/api';
import type { AdminUser, AdminPhoto } from './admin.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

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

  async function fetchPhotos(): Promise<AdminPhoto[]> {
    const { data } = await api.get('/api/admin/photos');
    return data.map((p: any): AdminPhoto => ({
      id: p.id,
      thumbnailUrl: API_URL + p.thumbnailUrl,
      description: p.description ?? undefined,
      takenAt: p.takenAt ?? undefined,
      address: p.address ?? undefined,
      uploadedAt: p.uploadedAt,
      uploaderUsername: p.uploaderUsername,
      userId: p.userId,
    }));
  }

  return { fetchUsers, fetchPhotos };
});

