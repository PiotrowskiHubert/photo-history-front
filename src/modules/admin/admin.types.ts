export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
}

