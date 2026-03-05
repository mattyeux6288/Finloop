import { createApp } from './app';
import { config } from './config/env';
import { db } from './config/database';
import { seed } from './db/seeds/001_initial_users';

async function main() {
  // Exécuter les migrations
  console.log('Running database migrations...');
  await db.migrate.latest();
  console.log('Migrations completed.');

  // Seed des utilisateurs initiaux
  await seed(db as any);

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Finthesis Lite server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Database: ${config.databaseType}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
