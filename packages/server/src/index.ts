import { createApp } from './app';
import { config } from './config/env';
import { db } from './config/database';

async function main() {
  // Exécuter les migrations
  console.log('Running database migrations...');
  await db.migrate.latest();
  console.log('Migrations completed.');

  // Créer un utilisateur par défaut (nécessaire pour la FK companies.user_id)
  const defaultUser = await db('users').where({ id: 'default' }).first();
  if (!defaultUser) {
    await db('users').insert({
      id: 'default',
      email: 'local@finthesis.fr',
      password_hash: 'none',
      display_name: 'Utilisateur local',
    });
    console.log('Default user created.');
  }

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
