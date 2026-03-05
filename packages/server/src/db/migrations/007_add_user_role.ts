import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('role', 20).notNullable().defaultTo('user');
  });

  // Rendre password_hash nullable (pour le flow premier login)
  // En PostgreSQL on utilise ALTER COLUMN, en SQLite on ne peut pas facilement changer la nullabilité
  // mais Knex gère la compatibilité
  if (knex.client.config.client === 'pg' || knex.client.config.client === 'postgresql') {
    await knex.raw('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
  }
  // Pour SQLite, password_hash est déjà string et accepte null par défaut
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('role');
  });

  if (knex.client.config.client === 'pg' || knex.client.config.client === 'postgresql') {
    await knex.raw('ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL');
  }
}
