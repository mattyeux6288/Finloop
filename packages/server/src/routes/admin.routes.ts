import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import * as adminService from '../services/admin.service';
import * as companyService from '../services/company.service';
import { seedFec2024 } from '../services/admin.seed.service';

const router = Router();

// Toutes les routes admin nécessitent auth + rôle admin
router.use(authMiddleware);
router.use(adminMiddleware);

/** GET /admin/users — Liste tous les utilisateurs */
router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

/** POST /admin/users — Créer un utilisateur (sans mot de passe) */
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { email, displayName, role } = req.body;
    if (!email || !displayName) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'Email et nom requis.' },
      });
      return;
    }
    const user = await adminService.createUser({
      email,
      displayName,
      role: role || 'user',
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: (err as Error).message },
    });
  }
});

/** PUT /admin/users/:id — Modifier un utilisateur */
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: (err as Error).message },
    });
  }
});

/** DELETE /admin/users/:id — Supprimer un utilisateur */
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Empêcher l'auto-suppression
    const id = req.params.id as string;
    if (id === req.userId) {
      res.status(400).json({
        success: false,
        error: { code: 'SELF_DELETE', message: 'Vous ne pouvez pas supprimer votre propre compte.' },
      });
      return;
    }
    await adminService.deleteUser(id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: (err as Error).message },
    });
  }
});

/** PUT /admin/users/:id/toggle-active — Activer/désactiver un utilisateur */
router.put('/users/:id/toggle-active', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (id === req.userId) {
      res.status(400).json({
        success: false,
        error: { code: 'SELF_DISABLE', message: 'Vous ne pouvez pas désactiver votre propre compte.' },
      });
      return;
    }
    const user = await adminService.toggleUserActive(id);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'TOGGLE_FAILED', message: (err as Error).message },
    });
  }
});

/** POST /admin/users/:id/reset-password — Réinitialiser le mot de passe */
router.post('/users/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    await adminService.resetPassword(req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'RESET_FAILED', message: (err as Error).message },
    });
  }
});

/** PUT /admin/companies/:companyId/assign/:userId — Réassigner une entreprise */
router.put('/companies/:companyId/assign/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const company = await adminService.assignCompanyToUser(req.params.companyId as string, req.params.userId as string);
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'ASSIGN_FAILED', message: (err as Error).message },
    });
  }
});

/** DELETE /admin/companies/:id — Supprimer une entreprise (admin) */
router.delete('/companies/:id', async (req: AuthRequest, res: Response) => {
  try {
    await companyService.deleteCompany(req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: (err as Error).message },
    });
  }
});

/** POST /admin/seed-fec-2024 — Génère le FEC fictif 2024 pour "Société Test" */
router.post('/seed-fec-2024', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await seedFec2024();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: 'SEED_FAILED', message: (err as Error).message },
    });
  }
});

export default router;
