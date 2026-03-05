/**
 * Endpoint de diagnostic — aucun import serveur.
 * GET /api/health → montre l'état des variables d'environnement.
 */
import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    ok: true,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✓ set (' + process.env.DATABASE_URL.slice(0, 20) + '...)' : '✗ NOT SET',
      POSTGRES_URL: process.env.POSTGRES_URL ? '✓ set (' + process.env.POSTGRES_URL.slice(0, 20) + '...)' : '✗ NOT SET',
      VERCEL: process.env.VERCEL || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
    timestamp: new Date().toISOString(),
  }));
}
