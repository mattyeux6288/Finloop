import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Trouver le dossier racine du monorepo (4 niveaux au-dessus: config/ -> src/ -> server/ -> packages/ -> root)
const rootDir = path.resolve(__dirname, '../../../..');

// Charger le .env à la racine du monorepo
dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database - SQLite par défaut (le fichier sera créé automatiquement)
  databaseType: (process.env.DATABASE_TYPE || 'sqlite') as 'postgresql' | 'sqlite',
  databaseUrl: process.env.DATABASE_URL || '',
  sqlitePath: process.env.SQLITE_PATH || path.join(rootDir, 'finthesis.sqlite'),

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Upload
  uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, 'uploads'),
  maxUploadSize: 50 * 1024 * 1024, // 50 MB
};
