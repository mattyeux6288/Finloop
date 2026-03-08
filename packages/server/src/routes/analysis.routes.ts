import { Router, Request, Response } from 'express';
import * as analysisService from '../services/analysis.service';
import * as rapportService from '../services/rapport.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/:fyId/dashboard', async (req: Request, res: Response) => {
  try {
    const data = await analysisService.getDashboard(req.params.fyId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

router.get('/:fyId/bilan', async (req: Request, res: Response) => {
  try {
    const data = await analysisService.getBilan(req.params.fyId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

router.get('/:fyId/compte-resultat', async (req: Request, res: Response) => {
  try {
    const data = await analysisService.getCompteDeResultat(req.params.fyId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

router.get('/:fyId/sig', async (req: Request, res: Response) => {
  try {
    const data = await analysisService.getSig(req.params.fyId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

router.get('/:fyId/rapport-activite', async (req: Request, res: Response) => {
  try {
    const data = await rapportService.getRapportActivite(req.params.fyId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

export default router;