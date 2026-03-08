import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import https from 'https';
import { config } from '../config/env';
import { supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// ── JWKS cache for ES256 verification ──
interface JWKSCache {
  keys: Map<string, string>; // kid → PEM public key
  fetchedAt: number;
}

let jwksCache: JWKSCache | null = null;
const JWKS_CACHE_TTL = 600_000; // 10 minutes
let jwksFetchPromise: Promise<JWKSCache> | null = null;

/**
 * Fetch JWKS from Supabase and convert keys to PEM format.
 * Uses Node.js built-in `crypto` — no external ESM dependencies.
 */
function fetchJWKS(): Promise<JWKSCache> {
  // Deduplicate concurrent requests
  if (jwksFetchPromise) return jwksFetchPromise;

  jwksFetchPromise = new Promise<JWKSCache>((resolve, reject) => {
    const url = `${config.supabaseUrl}/auth/v1/.well-known/jwks.json`;

    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => {
        try {
          const jwks = JSON.parse(body) as { keys: Array<{ kid: string; kty: string; [k: string]: unknown }> };
          const keys = new Map<string, string>();

          for (const jwk of jwks.keys) {
            if (!jwk.kid) continue;
            // Node.js crypto can import JWK directly (Node 16+)
            const keyObj = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: 'jwk' });
            const pem = keyObj.export({ type: 'spki', format: 'pem' }) as string;
            keys.set(jwk.kid, pem);
          }

          const cache: JWKSCache = { keys, fetchedAt: Date.now() };
          jwksCache = cache;
          jwksFetchPromise = null;
          resolve(cache);
        } catch (err) {
          jwksFetchPromise = null;
          reject(err);
        }
      });
      res.on('error', (err) => { jwksFetchPromise = null; reject(err); });
    }).on('error', (err) => { jwksFetchPromise = null; reject(err); });
  });

  return jwksFetchPromise;
}

/**
 * Get the PEM public key for a given `kid`, using cached JWKS.
 */
async function getPublicKey(kid: string): Promise<string | null> {
  // Return from cache if fresh
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_TTL) {
    return jwksCache.keys.get(kid) || null;
  }

  // Refresh cache
  const cache = await fetchJWKS();
  return cache.keys.get(kid) || null;
}

/**
 * Decode JWT header without verification.
 */
function decodeHeader(token: string): { alg?: string; kid?: string } {
  try {
    const headerB64 = token.split('.')[0];
    return JSON.parse(Buffer.from(headerB64, 'base64url').toString());
  } catch {
    return {};
  }
}

/**
 * Auth middleware — verifies Supabase JWT.
 *
 * Supports both:
 *  - ES256 tokens (new Supabase projects) → verified via JWKS + crypto
 *  - HS256 tokens (legacy)                → verified via jwt_secret
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token manquant.' },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const header = decodeHeader(token);
    let decoded: jwt.JwtPayload;

    if (header.alg === 'ES256' && header.kid && config.supabaseUrl) {
      // ── Strategy 1: ES256 via JWKS (new Supabase projects) ──
      const publicKey = await getPublicKey(header.kid);
      if (!publicKey) {
        throw new Error('Public key not found for kid: ' + header.kid);
      }
      decoded = jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as jwt.JwtPayload;
    } else {
      // ── Strategy 2: HS256 with jwt_secret (legacy Supabase projects) ──
      decoded = jwt.verify(token, config.supabaseJwtSecret) as jwt.JwtPayload;
    }

    // Vérifier si l'utilisateur est désactivé
    const appMetadata = (decoded as any).app_metadata || {};
    if (appMetadata.disabled === true) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Votre compte a été désactivé. Contactez votre administrateur.' },
      });
      return;
    }

    req.userId = decoded.sub as string;
    req.userRole = appMetadata.role || 'user';
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token invalide ou expiré.' },
    });
  }
}
