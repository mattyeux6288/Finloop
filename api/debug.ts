/**
 * Endpoint de diagnostic — teste les imports du serveur.
 * GET /api/debug → montre l'erreur exacte si les imports échouent.
 */
import type { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    nodeVersion: process.version,
  };

  // Check if dist files exist
  const basePath = path.join(process.cwd(), 'packages', 'server', 'dist');
  try {
    results.distExists = fs.existsSync(basePath);
    if (results.distExists) {
      results.distFiles = fs.readdirSync(basePath);
      const configPath = path.join(basePath, 'config');
      results.configExists = fs.existsSync(configPath);
      if (results.configExists) {
        results.configFiles = fs.readdirSync(configPath);
      }
    }
  } catch (err) {
    results.fsError = String(err);
  }

  // Try importing the server app
  try {
    const appMod = require('../packages/server/dist/app');
    results.appImport = 'OK';
    results.appExports = Object.keys(appMod);
  } catch (err) {
    results.appImport = 'FAILED';
    results.appError = err instanceof Error ? { message: err.message, stack: err.stack?.split('\n').slice(0, 5) } : String(err);
  }

  // Try importing the database config
  try {
    const dbMod = require('../packages/server/dist/config/database');
    results.dbImport = 'OK';
    results.dbExports = Object.keys(dbMod);
  } catch (err) {
    results.dbImport = 'FAILED';
    results.dbError = err instanceof Error ? { message: err.message, stack: err.stack?.split('\n').slice(0, 5) } : String(err);
  }

  // Try importing pg
  try {
    require('pg');
    results.pgImport = 'OK';
  } catch (err) {
    results.pgImport = 'FAILED';
    results.pgError = err instanceof Error ? err.message : String(err);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(results, null, 2));
}
