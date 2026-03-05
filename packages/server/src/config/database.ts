import knex, { Knex } from 'knex';
import { config } from './env';
import { migrationSource } from '../db/migrationSource';

function createKnexConfig(): Knex.Config {
  if (config.databaseType === 'postgresql') {
    // PostgreSQL — production (Neon, Supabase, Vercel Postgres…)
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

  // SQLite — local dev uniquement
  // Le nom est construit dynamiquement pour empêcher le bundler Vercel
  // de tracer le module natif better-sqlite3 dans le bundle Lambda.
  const sqliteClient = ['better', 'sqlite3'].join('-');
  return {
    client: sqliteClient,
    connection: { filename: config.sqlitePath },
    useNullAsDefault: true,
    migrations: { migrationSource },
  };
}

export const knexConfig = createKnexConfig();
export const db: Knex = knex(knexConfig);
