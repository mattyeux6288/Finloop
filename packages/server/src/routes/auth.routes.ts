import { Router, Response } from 'express';
import { getUserById, ensureUserProfile } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /auth/me — returns user profile from the custom users table.
 * Auto-creates the profile if it does not exist (sync on first call).
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let user;
    try {
      user = await getUserById(req.userId as string);
    } catch {
      // Profile does not exist yet — create from Supabase data
      user = await ensureUserProfile(req.userId as string);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: (err as Error).message },
    });
  }
});

export default router;
