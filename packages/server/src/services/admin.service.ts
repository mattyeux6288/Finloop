import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '../config/database';

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Liste tous les utilisateurs avec leurs entreprises associées.
 */
export async function getAllUsers() {
  const users = await db('users')
    .select('id', 'email', 'display_name', 'role', 'password_hash', 'created_at', 'updated_at')
    .orderBy('created_at', 'desc');

  const companies = await db('companies')
    .select('id', 'user_id', 'name', 'siren');

  const companyMap = new Map<string, { id: string; name: string; siren: string | null }[]>();
  for (const c of companies) {
    const list = companyMap.get(c.user_id) || [];
    list.push({ id: c.id, name: c.name, siren: c.siren });
    companyMap.set(c.user_id, list);
  }

  return users.map((u: AdminUserRow) => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    role: u.role,
    hasPassword: u.password_hash !== null,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    companies: companyMap.get(u.id) || [],
  }));
}

/**
 * Créer un utilisateur (sans mot de passe — premier login flow).
 */
export async function createUser(data: { email: string; displayName: string; role: string }) {
  const existing = await db('users').where({ email: data.email }).first();
  if (existing) {
    throw new Error('Un utilisateur avec cet email existe déjà.');
  }

  const id = uuid();
  const now = new Date().toISOString();

  await db('users').insert({
    id,
    email: data.email,
    password_hash: null,
    display_name: data.displayName,
    role: data.role || 'user',
    created_at: now,
    updated_at: now,
  });

  return {
    id,
    email: data.email,
    displayName: data.displayName,
    role: data.role || 'user',
    hasPassword: false,
    createdAt: now,
    updatedAt: now,
    companies: [],
  };
}

/**
 * Mettre à jour un utilisateur (email, displayName, role).
 */
export async function updateUser(userId: string, data: { email?: string; displayName?: string; role?: string }) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('Utilisateur introuvable.');

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.email !== undefined) {
    const dup = await db('users').where({ email: data.email }).whereNot({ id: userId }).first();
    if (dup) throw new Error('Cet email est déjà utilisé par un autre compte.');
    updateData.email = data.email;
  }
  if (data.displayName !== undefined) updateData.display_name = data.displayName;
  if (data.role !== undefined) updateData.role = data.role;

  await db('users').where({ id: userId }).update(updateData);

  const updated = await db('users')
    .where({ id: userId })
    .select('id', 'email', 'display_name', 'role', 'password_hash', 'created_at', 'updated_at')
    .first();

  const companies = await db('companies')
    .where({ user_id: userId })
    .select('id', 'name', 'siren');

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.display_name,
    role: updated.role,
    hasPassword: updated.password_hash !== null,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    companies,
  };
}

/**
 * Supprimer un utilisateur et ses données associées.
 */
export async function deleteUser(userId: string) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('Utilisateur introuvable.');

  const companyIds = await db('companies').where({ user_id: userId }).pluck('id');

  if (companyIds.length > 0) {
    const fyIds = await db('fiscal_years').whereIn('company_id', companyIds).pluck('id');
    if (fyIds.length > 0) {
      await db('computed_reports').whereIn('fiscal_year_id', fyIds).del();
      await db('ecritures').whereIn('fiscal_year_id', fyIds).del();
      await db('imports').whereIn('fiscal_year_id', fyIds).del();
      await db('fiscal_years').whereIn('company_id', companyIds).del();
    }
    await db('companies').where({ user_id: userId }).del();
  }

  await db('users').where({ id: userId }).del();
}

/**
 * Réinitialiser le mot de passe d'un utilisateur (remet à null → premier login flow).
 */
export async function resetPassword(userId: string) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('Utilisateur introuvable.');

  await db('users').where({ id: userId }).update({
    password_hash: null,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Réassigner une entreprise à un utilisateur.
 */
export async function assignCompanyToUser(companyId: string, userId: string) {
  const company = await db('companies').where({ id: companyId }).first();
  if (!company) throw new Error('Entreprise introuvable.');

  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('Utilisateur introuvable.');

  await db('companies').where({ id: companyId }).update({
    user_id: userId,
    updated_at: new Date().toISOString(),
  });

  return db('companies').where({ id: companyId }).first();
}
