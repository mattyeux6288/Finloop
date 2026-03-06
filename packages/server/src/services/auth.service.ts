import { db } from '../config/database';
import { supabaseAdmin } from '../config/supabase';

export interface UserRecord {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

/**
 * Get user profile from the custom users table.
 */
export async function getUserById(userId: string) {
  const user = await db('users')
    .where({ id: userId })
    .select('id', 'email', 'display_name', 'role', 'created_at')
    .first();
  if (!user) throw new Error('Utilisateur introuvable.');
  return user;
}

/**
 * Ensure a user profile exists in the custom users table.
 * Called after first successful Supabase login when no local profile exists.
 */
export async function ensureUserProfile(supabaseUserId: string) {
  const existing = await db('users').where({ id: supabaseUserId }).first();
  if (existing) return existing;

  // Fetch user data from Supabase Auth
  const { data: authData, error } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  if (error || !authData.user) {
    throw new Error('Utilisateur Supabase introuvable.');
  }

  const u = authData.user;
  const now = new Date().toISOString();
  await db('users').insert({
    id: u.id,
    email: u.email,
    display_name: u.user_metadata?.display_name || u.email!.split('@')[0],
    role: u.app_metadata?.role || 'user',
    created_at: now,
    updated_at: now,
  });

  return db('users').where({ id: supabaseUserId }).first();
}
