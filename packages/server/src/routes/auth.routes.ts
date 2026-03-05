import { Router, Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserById,
  setupPassword,
  changePassword,
} from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Email, mot de passe et nom requis.' },
      });
      return;
    }
    const result = await registerUser(email, password, displayName);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'REGISTER_FAILED', message: (err as Error).message },
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Email et mot de passe requis.' },
      });
      return;
    }
    const result = await loginUser(email, password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    const code = err.code || 'LOGIN_FAILED';
    res.status(401).json({
      success: false,
      error: { code, message: err.message },
    });
  }
});

/** Premier login : définir le mot de passe */
router.post('/setup-password', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Email et nouveau mot de passe requis.' },
      });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Le mot de passe doit contenir au moins 6 caractères.' },
      });
      return;
    }
    const result = await setupPassword(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    const message = (err as Error).message;
    // Code spécifique pour distinguer "mdp déjà défini" des autres erreurs
    const code = message.includes('déjà été défini') ? 'PASSWORD_ALREADY_SET' : 'SETUP_FAILED';
    res.status(400).json({
      success: false,
      error: { code, message },
    });
  }
});

/** Changer son mot de passe (authentifié) */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Mot de passe actuel et nouveau requis.' },
      });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' },
      });
      return;
    }
    const result = await changePassword(req.userId as string, currentPassword, newPassword);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'CHANGE_PASSWORD_FAILED', message: (err as Error).message },
    });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Refresh token requis.' },
      });
      return;
    }
    const result = await refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'REFRESH_FAILED', message: (err as Error).message },
    });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId as string);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: (err as Error).message },
    });
  }
});

export default router;
