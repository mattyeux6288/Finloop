import type { Knex } from 'knex';

/**
 * Migration 008 : Rendre password_hash nullable pour SQLite.
 * La migration 007 ne gérait que PostgreSQL.
 * En SQLite, ALTER COLUMN n'existe pas — il faut recréer la table.
 */
export async function up(knex: Knex): Promise<void> {
  const client = knex.client.config.client;

  // PostgreSQL a déjà été traité dans la migration 007
  if (client === 'pg' || client === 'postgresql') {
    return;
  }

  // SQLite : recréer la table users avec password_hash nullable
  // 1. Créer une table temporaire
  await knex.schema.createTable('users_tmp', (table) => {
    table.string('id', 36).primary();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).nullable();
    table.string('display_name', 100).notNullable();
    table.string('role', 20).notNullable().defaultTo('user');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Copier les données
  await knex.raw(`
    INSERT INTO users_tmp (id, email, password_hash, display_name, role, created_at, updated_at)
    SELECT id, email, password_hash, display_name, COALESCE(role, 'user'), created_at, updated_at
    FROM users
  `);

  // 3. Supprimer les tables qui référencent users (FK)
  // Les companies ont user_id FK → users.id, il faut les sauvegarder
  await knex.schema.createTable('companies_tmp', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable();
    table.string('name', 255).notNullable();
    table.string('siren', 9).nullable();
    table.string('siret', 14).nullable();
    table.string('naf_code', 6).nullable();
    table.text('address').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    INSERT INTO companies_tmp (id, user_id, name, siren, siret, naf_code, address, created_at, updated_at)
    SELECT id, user_id, name, siren, siret, naf_code, address, created_at, updated_at
    FROM companies
  `);

  // 4. Désactiver les FK le temps de la migration
  await knex.raw('PRAGMA foreign_keys = OFF');

  // 5. Supprimer l'ancienne table users et renommer
  await knex.schema.dropTableIfExists('companies');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.renameTable('users_tmp', 'users');

  // 6. Recréer companies avec la bonne FK
  await knex.schema.createTable('companies', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('siren', 9).nullable();
    table.string('siret', 14).nullable();
    table.string('naf_code', 6).nullable();
    table.text('address').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('user_id');
  });

  await knex.raw(`
    INSERT INTO companies (id, user_id, name, siren, siret, naf_code, address, created_at, updated_at)
    SELECT id, user_id, name, siren, siret, naf_code, address, created_at, updated_at
    FROM companies_tmp
  `);

  await knex.schema.dropTableIfExists('companies_tmp');

  // 7. Réactiver les FK
  await knex.raw('PRAGMA foreign_keys = ON');
}

export async function down(knex: Knex): Promise<void> {
  // Pas de rollback facile — la colonne ne devrait jamais redevenir NOT NULL
}
