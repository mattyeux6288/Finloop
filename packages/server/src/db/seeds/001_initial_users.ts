import type { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Ne pas réinsérer si des utilisateurs (hors "default") existent déjà
  const existing = await knex('users').whereNot({ id: 'default' }).count('* as count').first();
  if (existing && Number(existing.count) > 0) {
    console.log('Seed: des utilisateurs existent déjà, skip.');
    return;
  }

  // Supprimer l'ancien utilisateur par défaut s'il existe
  await knex('users').where({ id: 'default' }).del();

  const now = new Date().toISOString();
  const testPasswordHash = await bcrypt.hash('INCREDIBLE', 10);

  await knex('users').insert([
    {
      id: uuid(),
      email: 'dutheil.matthieu@outlook.fr',
      password_hash: null,
      display_name: 'head_user',
      role: 'admin',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      email: 'pascaldutheil@orange.fr',
      password_hash: null,
      display_name: 'user_dutheil',
      role: 'user',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      email: 'matthieu@ralyconseils.com',
      password_hash: null,
      display_name: 'user_raly',
      role: 'user',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      email: 'test@finloop.fr',
      password_hash: testPasswordHash,
      display_name: 'user_test',
      role: 'user',
      created_at: now,
      updated_at: now,
    },
  ]);

  console.log('Seed: 4 utilisateurs créés (1 admin + 3 users). user_test a un mot de passe pré-défini.');
}
