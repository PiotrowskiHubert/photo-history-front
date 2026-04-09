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
      url: API_URL + p.url,
      thumbnailUrl: API_URL + p.thumbnailUrl,
      description: p.description ?? undefined,
      takenAt: p.takenAt ?? undefined,
      address: p.address ?? undefined,
      uploadedAt: p.uploadedAt,
      uploaderUsername: p.uploaderUsername,
      userId: p.userId,
      reviewedAt: p.reviewedAt ?? undefined,
      reviewedBy: p.reviewedBy ?? undefined,
    }));
  }

  /** POST /api/admin/photos/:id/review — mark a photo as reviewed */
  async function reviewPhoto(id: string): Promise<void> {
    await api.post(`/api/admin/photos/${id}/review`);
  }

  /** DELETE /api/admin/photos/:id/reject — reject and delete a photo */
  async function rejectPhoto(id: string): Promise<void> {
    await api.delete(`/api/admin/photos/${id}/reject`);
  }

  /** POST /api/admin/users/:userId/ban then DELETE photo — ban uploader + remove photo */
  async function banUserAndDelete(userId: string, photoId: string): Promise<void> {
    await api.post(`/api/admin/users/${userId}/ban`);
    await api.delete(`/api/admin/photos/${photoId}/reject`);
  }

  /** GET /api/admin/photos/unreviewed-count */
  async function fetchUnreviewedCount(): Promise<number> {
    const { data } = await api.get('/api/admin/photos/unreviewed-count');
    return data.count;
  }

  return { fetchUsers, fetchPhotos, reviewPhoto, rejectPhoto, banUserAndDelete, fetchUnreviewedCount };
});

