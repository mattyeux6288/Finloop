import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// ── JWKS client for ES256 verification (new Supabase projects) ──
// Caches keys automatically, rate-limits requests to the JWKS endpoint.
const client = config.supabaseUrl
  ? jwksClient({
      jwksUri: `${config.supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600_000, // 10 min
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    })
  : null;

/**
 * Decode the JWT header to check the algorithm without verifying.
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
 * Verify an ES256 token using the JWKS endpoint.
 */
function verifyES256(token: string, kid: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('JWKS client not configured'));

    client.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error('Key not found'));

      const publicKey = key.getPublicKey();
      jwt.verify(token, publicKey, { algorithms: ['ES256'] }, (verifyErr, decoded) => {
        if (verifyErr || !decoded) return reject(verifyErr || new Error('Invalid token'));
        resolve(decoded as jwt.JwtPayload);
      });
    });
  });
}

/**
 * Auth middleware — verifies Supabase JWT.
 *
 * Supports both:
 *  - ES256 tokens (new Supabase projects) → verified via JWKS
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

    if (header.alg === 'ES256' && header.kid && client) {
      // ── Strategy 1: ES256 via JWKS (new Supabase projects) ──
      decoded = await verifyES256(token, header.kid);
    } else {
      // ── Strategy 2: HS256 with jwt_secret (legacy Supabase projects) ──
      decoded = jwt.verify(token, config.supabaseJwtSecret) as jwt.JwtPayload;
    }

    req.userId = decoded.sub as string;
    req.userRole = (decoded as any).app_metadata?.role || 'user';
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token invalide ou expiré.' },
    });
  }
}
