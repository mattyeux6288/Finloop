/**
 * Vercel Serverless Function — wrape l'app Express pour la prod.
 * Toutes les requêtes /api/* sont redirigées ici par vercel.json.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../packages/server/src/app';
import { db } from '../packages/server/src/config/database';

const app = createApp();

// Flag en mémoire : les migrations ne tournent qu'une fois par instance (cold start)
let initialized = false;

async function initialize() {
  if (initialized) return;
  await db.migrate.latest();

  // Créer l'utilisateur par défaut s'il n'existe pas
  const exists = await db('users').where({ id: 'default' }).first();
  if (!exists) {
    await db('users').insert({
      id:           'default',
      email:        'local@finloop.fr',
      password_hash: 'none',
      display_name: 'Utilisateur local',
    });
  }

  initialized = true;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initialize();

  // Passe la requête à Express
  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
