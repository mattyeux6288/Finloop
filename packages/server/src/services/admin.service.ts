import { db } from '../config/database';
import { supabaseAdmin } from '../config/supabase';

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Liste tous les utilisateurs avec leurs entreprises associées.
 * Vérifie last_sign_in_at via Supabase pour le statut "Actif".
 */
export async function getAllUsers() {
  const users = await db('users')
    .select('id', 'email', 'display_name', 'role', 'created_at', 'updated_at')
    .orderBy('created_at', 'desc');

  // Fetch Supabase auth users for login status
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const authMap = new Map(authData?.users.map(u => [u.id, u]) || []);

  const companies = await db('companies')
    .select('id', 'user_id', 'name', 'siren');

  const companyMap = new Map<string, { id: string; name: string; siren: string | null }[]>();
  for (const c of companies) {
    const list = companyMap.get(c.user_id) || [];
    list.push({ id: c.id, name: c.name, siren: c.siren });
    companyMap.set(c.user_id, list);
  }

  return users.map((u: AdminUserRow) => {
    const authUser = authMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      hasPassword: authUser?.last_sign_in_at != null,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      companies: companyMap.get(u.id) || [],
    };
  });
}

/**
 * Créer un utilisateur via Supabase Auth + table custom.
 */
export async function createUser(data: { email: string; displayName: string; role: string }) {
  const existing = await db('users').where({ email: data.email }).first();
  if (existing) {
    throw new Error('Un utilisateur avec cet email existe déjà.');
  }

  // Create in Supabase Auth (with a random temp password, user will set their own via invite)
  const tempPassword = crypto.randomUUID();
  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      display_name: data.displayName,
    },
    app_metadata: {
      role: data.role || 'user',
    },
  });

  if (error) throw new Error(error.message);

  const id = authUser.user.id;
  const now = new Date().toISOString();

  // Insert into custom users table
  await db('users').insert({
    id,
    email: data.email,
    display_name: data.displayName,
    role: data.role || 'user',
    created_at: now,
    updated_at: now,
  });

  // Send invite email so user can set their password
  try {
    await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
  } catch {
    // Invite may fail if email already confirmed — non-blocking
    console.warn(`[admin] Could not send invite to ${data.email}`);
  }

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
 * Syncs changes to both custom table and Supabase Auth.
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

  // Sync to Supabase Auth
  const supabaseUpdate: Record<string, unknown> = {};
  if (data.email) supabaseUpdate.email = data.email;
  if (data.displayName) {
    supabaseUpdate.user_metadata = { display_name: data.displayName };
  }
  if (data.role) {
    supabaseUpdate.app_metadata = { role: data.role };
  }
  if (Object.keys(supabaseUpdate).length > 0) {
    await supabaseAdmin.auth.admin.updateUserById(userId, supabaseUpdate);
  }

  const updated = await db('users')
    .where({ id: userId })
    .select('id', 'email', 'display_name', 'role', 'created_at', 'updated_at')
    .first();

  const companies = await db('companies')
    .where({ user_id: userId })
    .select('id', 'name', 'siren');

  // Check login status from Supabase
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
  const hasPassword = authData?.user?.last_sign_in_at != null;

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.display_name,
    role: updated.role,
    hasPassword,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    companies,
  };
}

/**
 * Supprimer un utilisateur et ses données associées.
 * Deletes from both Supabase Auth and custom table.
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

  // Delete from Supabase Auth
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (err) {
    console.warn('[admin] Failed to delete Supabase auth user:', (err as Error).message);
  }
}

/**
 * Réinitialiser le mot de passe — envoie un email de récupération via Supabase.
 */
export async function resetPassword(userId: string) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('Utilisateur introuvable.');

  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  });

  if (error) throw new Error(error.message);
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
