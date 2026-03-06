import api from './client';
import type { ApiResponse } from '@finthesis/shared';

/**
 * Get user profile from the backend custom users table.
 * This is the only auth API call that goes through the Express backend.
 * All other auth operations (login, signup, password) use the Supabase client directly.
 */
export async function getMe() {
  const { data } = await api.get<ApiResponse<{
    id: string;
    email: string;
    display_name: string;
    role: string;
  }>>('/auth/me');
  return data.data!;
}
