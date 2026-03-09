import api from './client';
import type { ApiResponse, AdminUser } from '@finthesis/shared';

export async function getUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
  return data.data!;
}

export async function createUser(payload: {
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}): Promise<AdminUser> {
  const { data } = await api.post<ApiResponse<AdminUser>>('/admin/users', payload);
  return data.data!;
}

export async function updateUser(
  userId: string,
  payload: { email?: string; displayName?: string; role?: 'user' | 'admin' },
): Promise<AdminUser> {
  const { data } = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}`, payload);
  return data.data!;
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

export async function resetUserPassword(userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/reset-password`);
}

export async function toggleUserActive(userId: string): Promise<AdminUser> {
  const { data } = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/toggle-active`);
  return data.data!;
}

export async function assignCompany(companyId: string, userId: string): Promise<void> {
  await api.put(`/admin/companies/${companyId}/assign/${userId}`);
}

export async function seedFec2024(): Promise<{ fiscalYearId: string; rowsInserted: number; message: string }> {
  const { data } = await api.post<ApiResponse<{ fiscalYearId: string; rowsInserted: number; message: string }>>('/admin/seed-fec-2024');
  return data.data!;
}
