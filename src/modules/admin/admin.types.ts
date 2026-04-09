export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
}

export interface AdminPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  description?: string;
  takenAt?: string;
  address?: string;
  uploadedAt: string;
  uploaderUsername: string;
  userId: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

