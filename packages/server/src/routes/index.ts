import { Router } from 'express';
import companyRoutes from './company.routes';
import importRoutes from './import.routes';
import analysisRoutes from './analysis.routes';

const router = Router();

router.use('/companies', companyRoutes);
router.use('/fiscal-years', importRoutes);
router.use('/fiscal-years', analysisRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
