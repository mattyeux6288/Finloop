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

  // Database — auto-détecte PostgreSQL si une URL est définie
  // Supporte DATABASE_URL, POSTGRES_URL (Vercel intégration), NEON_DATABASE_URL
  databaseType: (process.env.DATABASE_TYPE || ((process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'postgresql' : 'sqlite')) as 'postgresql' | 'sqlite',
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  sqlitePath: process.env.SQLITE_PATH || path.join(rootDir, 'finthesis.sqlite'),

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long',

  // Anthropic Claude API (Krokmou)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Upload — /tmp en serverless (Vercel), dossier local sinon
  uploadDir: process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp' : path.join(rootDir, 'uploads')),
  maxUploadSize: 50 * 1024 * 1024, // 50 MB
};
