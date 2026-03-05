import { Router, Request, Response } from 'express';
import * as companyService from '../services/company.service';

const router = Router();

// Companies
router.get('/', async (_req: Request, res: Response) => {
  try {
    const companies = await companyService.getCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const company = await companyService.createCompany(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const company = await companyService.getCompanyById(req.params.id as string);
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const company = await companyService.updateCompany(req.params.id as string, req.body);
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await companyService.deleteCompany(req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

// Fiscal Years (nested under company)
router.get('/:companyId/fiscal-years', async (req: Request, res: Response) => {
  try {
    const fiscalYears = await companyService.getFiscalYears(req.params.companyId as string);
    res.json({ success: true, data: fiscalYears });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

router.post('/:companyId/fiscal-years', async (req: Request, res: Response) => {
  try {
    const fy = await companyService.createFiscalYear(req.params.companyId as string, req.body);
    res.status(201).json({ success: true, data: fy });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.put('/:companyId/fiscal-years/:fyId', async (req: Request, res: Response) => {
  try {
    const fy = await companyService.updateFiscalYear(req.params.fyId as string, req.body);
    res.json({ success: true, data: fy });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: (err as Error).message } });
  }
});

router.delete('/:companyId/fiscal-years/:fyId', async (req: Request, res: Response) => {
  try {
    await companyService.deleteFiscalYear(req.params.fyId as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: (err as Error).message } });
  }
});

export default router;
