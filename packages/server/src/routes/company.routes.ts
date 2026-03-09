import { Router, Response } from 'express';
import * as companyService from '../services/company.service';
import * as importService from '../services/import.service';
import { upload } from '../middleware/upload.middleware';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes company nécessitent l'authentification
router.use(authMiddleware);

// Companies
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companies = await companyService.getCompanies(req.userId, req.userRole);
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const company = await companyService.createCompany(req.userId as string, req.body);
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const company = await companyService.getCompanyById(req.params.id as string);
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const company = await companyService.updateCompany(req.params.id as string, req.body);
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await companyService.deleteCompany(req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

// Import FEC avec auto-détection de l'exercice fiscal
router.post('/:companyId/import', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Aucun fichier fourni.' },
      });
      return;
    }

    const result = await importService.processImportAutoDetect(
      req.params.companyId as string,
      req.file.path,
      req.file.originalname,
    );

    const statusCode = result.status === 'completed' ? 200 : 400;
    res.status(statusCode).json({ success: result.status === 'completed', data: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: (err as Error).message },
    });
  }
});

// Fiscal Years (nested under company)
router.get('/:companyId/fiscal-years', async (req: AuthRequest, res: Response) => {
  try {
    const fiscalYears = await companyService.getFiscalYears(req.params.companyId as string);
    res.json({ success: true, data: fiscalYears });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

router.post('/:companyId/fiscal-years', async (req: AuthRequest, res: Response) => {
  try {
    const fy = await companyService.createFiscalYear(req.params.companyId as string, req.body);
    res.status(201).json({ success: true, data: fy });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.put('/:companyId/fiscal-years/:fyId', async (req: AuthRequest, res: Response) => {
  try {
    const fy = await companyService.updateFiscalYear(req.params.fyId as string, req.body);
    res.json({ success: true, data: fy });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.delete('/:companyId/fiscal-years/:fyId', async (req: AuthRequest, res: Response) => {
  try {
    await companyService.deleteFiscalYear(req.params.fyId as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

export default router;
