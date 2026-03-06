import type { Knex } from 'knex';

/**
 * Migration: Drop password_hash column from users table.
 * Auth is now handled by Supabase — passwords are stored in auth.users, not here.
 */
export async function up(knex: Knex): Promise<void> {
  const client = knex.client.config.client;

  if (client === 'pg' || client === 'postgresql') {
    await knex.raw('ALTER TABLE users DROP COLUMN IF EXISTS password_hash');
  }
  // SQLite doesn't support DROP COLUMN easily — but since we're migrating to Supabase PostgreSQL,
  // this is sufficient.
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).nullable();
  });
}
