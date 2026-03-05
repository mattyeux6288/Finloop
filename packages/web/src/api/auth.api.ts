import api from './client';
import type { ApiResponse, AuthResponse } from '@finthesis/shared';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  return data.data!;
}

export async function register(email: string, password: string, displayName: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', { email, password, displayName });
  return data.data!;
}

export async function setupPassword(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/setup-password', { email, password });
  return data.data!;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  const { data } = await api.post<ApiResponse<{ success: boolean }>>('/auth/change-password', { currentPassword, newPassword });
  return data.data!;
}

export async function getMe() {
  const { data } = await api.get<ApiResponse<{ id: string; email: string; display_name: string; role: string }>>('/auth/me');
  return data.data!;
}
