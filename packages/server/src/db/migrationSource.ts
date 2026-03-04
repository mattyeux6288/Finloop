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

interface MigrationModule {
  up: (knex: Knex) => Promise<void>;
  down: (knex: Knex) => Promise<void>;
}

const ALL_MIGRATIONS: { name: string; mod: MigrationModule }[] = [
  { name: '001_create_users',           mod: m001 },
  { name: '002_create_companies',       mod: m002 },
  { name: '003_create_fiscal_years',    mod: m003 },
  { name: '004_create_imports',         mod: m004 },
  { name: '005_create_ecritures',       mod: m005 },
  { name: '006_create_computed_reports', mod: m006 },
];

export const migrationSource: Knex.MigrationSource<{ name: string; mod: MigrationModule }> = {
  getMigrations:   async () => ALL_MIGRATIONS,
  getMigrationName: (m) => m.name,
  getMigration:    (m) => m.mod,
};
