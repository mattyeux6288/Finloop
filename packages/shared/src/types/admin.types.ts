/**
 * Types pour l'administration des utilisateurs
 */

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  hasPassword: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companies: AdminUserCompany[];
}

export interface AdminUserCompany {
  id: string;
  name: string;
  siren: string | null;
}

export interface CreateUserDto {
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export interface UpdateUserDto {
  email?: string;
  displayName?: string;
  role?: 'user' | 'admin';
}
