import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// ── JWKS client for ES256 verification (new Supabase projects) ──
// The JWKS is fetched once and cached automatically by `jose`.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> | null {
  if (!jwks && config.supabaseUrl) {
    jwks = createRemoteJWKSet(
      new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }
  return jwks;
}

interface SupabaseJWTPayload extends JWTPayload {
  sub: string;
  role?: string;
  app_metadata?: { role?: string };
}

/**
 * Auth middleware — verifies Supabase JWT.
 *
 * Supports both:
 *  • ES256 tokens (new Supabase projects) → verified via JWKS
 *  • HS256 tokens (legacy)                → verified via jwt_secret
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
    // ── Strategy 1: ES256 via JWKS (new Supabase projects) ──
    const remoteJWKS = getJWKS();
    if (remoteJWKS) {
      try {
        const { payload } = await jwtVerify(token, remoteJWKS);
        const p = payload as SupabaseJWTPayload;
        req.userId = p.sub;
        req.userRole = p.app_metadata?.role || 'user';
        next();
        return;
      } catch {
        // JWKS verification failed — fall through to HS256
      }
    }

    // ── Strategy 2: HS256 with jwt_secret (legacy Supabase projects) ──
    const decoded = jwt.verify(token, config.supabaseJwtSecret) as {
      sub: string;
      role: string;
      app_metadata?: { role?: string };
    };

    req.userId = decoded.sub;
    req.userRole = decoded.app_metadata?.role || 'user';
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token invalide ou expiré.' },
    });
  }
}
