import knex, { Knex } from 'knex';
import { config } from './env';
import { migrationSource } from '../db/migrationSource';

function createKnexConfig(): Knex.Config {
  if (config.databaseType === 'sqlite') {
    return {
      client: 'better-sqlite3',
      connection: { filename: config.sqlitePath },
      useNullAsDefault: true,
      migrations: { migrationSource },
    };
  }

  // PostgreSQL — utilisé en production (Neon, Supabase, Vercel Postgres…)
  return {
    client: 'pg',
    connection: {
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false }, // requis pour Neon
    },
    pool: { min: 0, max: 2 }, // min:0 important pour le serverless
    migrations: { migrationSource },
  };
}

export const knexConfig = createKnexConfig();
export const db: Knex = knex(knexConfig);
