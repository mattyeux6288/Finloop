/**
 * MigrationSource statique — Importe toutes les migrations explicitement
 * pour fonctionner en serverless (Vercel) sans lire le système de fichiers.
 */
import type { Knex } from 'knex';
import * as m001 from './migrations/001_create_users';
import * as m002 from './migrations/002_create_companies';
import * as m003 from './migrations/003_create_fiscal_years';
import * as m004 from './migrations/004_create_imports';
import * as m005 from './migrations/005_create_ecritures';
import * as m006 from './migrations/006_create_computed_reports';
import * as m007 from './migrations/007_add_user_role';
import * as m008 from './migrations/008_fix_password_hash_nullable';
import * as m009 from './migrations/009_drop_password_hash';
import * as m010 from './migrations/010_create_krokmou_conversations';
import * as m011 from './migrations/011_create_krokmou_documents';
import * as m012 from './migrations/012_add_dirigeant_to_companies';

interface MigrationModule {
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
}

const ALL_MIGRATIONS: { name: string; mod: MigrationModule }[] = [
  { name: '001_create_users.ts',                  mod: m001 },
  { name: '002_create_companies.ts',              mod: m002 },
  { name: '003_create_fiscal_years.ts',           mod: m003 },
  { name: '004_create_imports.ts',                mod: m004 },
  { name: '005_create_ecritures.ts',              mod: m005 },
  { name: '006_create_computed_reports.ts',       mod: m006 },
  { name: '007_add_user_role.ts',                 mod: m007 },
  { name: '008_fix_password_hash_nullable.ts',    mod: m008 },
  { name: '009_drop_password_hash.ts',            mod: m009 },
  { name: '010_create_krokmou_conversations.ts', mod: m010 },
  { name: '011_create_krokmou_documents.ts',     mod: m011 },
  { name: '012_add_dirigeant_to_companies.ts',  mod: m012 },
];

export const migrationSource: Knex.MigrationSource<{ name: string; mod: MigrationModule }> = {
  getMigrations:   async () => ALL_MIGRATIONS,
  getMigrationName: (m) => m.name,
  getMigration:    (m) => Promise.resolve(m.mod),
};
