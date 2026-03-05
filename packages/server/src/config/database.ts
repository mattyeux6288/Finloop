import knex, { Knex } from 'knex';
import { config } from './env';
import { migrationSource } from '../db/migrationSource';

function createKnexConfig(): Knex.Config {
  if (config.databaseType === 'postgresql') {
    return {
      client: 'pg',
      connection: {
        connectionString: config.databaseUrl,
        ssl: { rejectUnauthorized: false },
      },
      pool: { min: 0, max: 2 },
      migrations: { migrationSource },
    };
  }

  // SQLite — local uniquement. Nom dynamique pour éviter le bundling natif.
  const sqliteClient = ['better', 'sqlite3'].join('-');
  return {
    client: sqliteClient,
    connection: { filename: config.sqlitePath },
    useNullAsDefault: true,
    migrations: { migrationSource },
  };
}

// --- Initialisation LAZY ---
// Knex n'est instancié qu'au premier appel, pas à l'import du module.
// Cela évite que better-sqlite3 soit chargé au démarrage Lambda sur Vercel.
let _instance: Knex | null = null;

function getInstance(): Knex {
  if (!_instance) {
    _instance = knex(createKnexConfig());
  }
  return _instance;
}

// Proxy transparent : db('users'), db.migrate.latest(), etc. fonctionnent normalement
export const db: Knex = new Proxy(function () {} as unknown as Knex, {
  get(_, prop) { return (getInstance() as any)[prop]; },
  apply(_, _thisArg, args) { return (getInstance() as any)(...args); },
});

export const knexConfig = createKnexConfig();
