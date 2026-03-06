import type { Knex } from 'knex';

/**
 * Seed: placeholder users for local dev only.
 * In production (Vercel), users are created via Supabase Auth in api/[[...route]].ts.
 * This seed inserts minimal rows so local dev can reference user IDs in companies.
 */
export async function seed(knex: Knex): Promise<void> {
  const existing = await knex('users').count('* as count').first();
  if (existing && Number(existing.count) > 0) {
    console.log('Seed: users already exist, skip.');
    return;
  }

  const now = new Date().toISOString();

  await knex('users').insert([
    {
      id: 'local-admin',
      email: 'dutheil.matthieu@outlook.fr',
      display_name: 'head_user',
      role: 'admin',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'local-test',
      email: 'test@finloop.fr',
      display_name: 'user_test',
      role: 'user',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'local-dutheil',
      email: 'pascaldutheil@orange.fr',
      display_name: 'user_dutheil',
      role: 'user',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'local-raly',
      email: 'matthieu@ralyconseils.com',
      display_name: 'user_raly',
      role: 'user',
      created_at: now,
      updated_at: now,
    },
  ]);

  console.log('Seed: 4 local dev users created (1 admin + 3 users).');
}
