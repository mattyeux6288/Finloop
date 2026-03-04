import knex, { Knex } from 'knex';
import { config } from './env';

function createKnexConfig(): Knex.Config {
  if (config.databaseType === 'sqlite') {
    return {
      client: 'better-sqlite3',
      connection: {
        filename: config.sqlitePath,
      },
      useNullAsDefault: true,
      migrations: {
        directory: __dirname + '/../db/migrations',
        extension: 'ts',
      },
      seeds: {
        directory: __dirname + '/../db/seeds',
        extension: 'ts',
      },
    };
  }

  return {
    client: 'pg',
    connection: config.databaseUrl,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: __dirname + '/../db/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: __dirname + '/../db/seeds',
      extension: 'ts',
    },
  };
}

export const knexConfig = createKnexConfig();
export const db: Knex = knex(knexConfig);
