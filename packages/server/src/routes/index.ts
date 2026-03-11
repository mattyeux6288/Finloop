import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import importRoutes from './import.routes';
import analysisRoutes from './analysis.routes';
import adminRoutes from './admin.routes';
import mappingRoutes from './mapping.routes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/companies', mappingRoutes);
router.use('/fiscal-years', importRoutes);
router.use('/fiscal-years', analysisRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
