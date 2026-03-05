/**
 * Vercel Serverless Function — wrape l'app Express pour la prod.
 * Toutes les requêtes /api/* sont redirigées ici par vercel.json.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../packages/server/src/app';
import { db } from '../packages/server/src/config/database';

// Diagnostic au démarrage — visible dans les logs Vercel
console.log('[finloop] Serverless function loading...');
console.log('[finloop] DATABASE_URL  =', process.env.DATABASE_URL ? '✓ set' : '✗ NOT SET');

// Vérification : DATABASE_URL doit être défini sur Vercel
if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error(
    '[finloop] FATAL: DATABASE_URL is not set. ' +
    'Add your Neon/PostgreSQL connection string in Vercel → Settings → Environment Variables.'
  );
}

const app = createApp();
let initialized = false;

async function initialize() {
  if (initialized) return;

  console.log('[finloop] Running migrations...');
  await db.migrate.latest();
  console.log('[finloop] Migrations done.');

  const exists = await db('users').where({ id: 'default' }).first();
  if (!exists) {
    await db('users').insert({
      id:            'default',
      email:         'local@finloop.fr',
      password_hash: 'none',
      display_name:  'Utilisateur local',
    });
    console.log('[finloop] Default user created.');
  }

  initialized = true;
  console.log('[finloop] Ready.');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await initialize();
  } catch (err) {
    console.error('[finloop] Initialization error:', err);
    (res as any).statusCode = 500;
    (res as any).end(JSON.stringify({ error: 'Server initialization failed', details: String(err) }));
    return;
  }

  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
