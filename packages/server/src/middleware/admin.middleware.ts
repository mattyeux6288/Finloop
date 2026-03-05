import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware qui vérifie que l'utilisateur connecté a le rôle admin.
 * Doit être utilisé APRÈS authMiddleware.
 */
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs.' },
    });
    return;
  }
  next();
}
