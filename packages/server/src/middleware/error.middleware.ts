import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message, err.stack);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Erreur interne du serveur.'
        : err.message,
    },
  });
}
