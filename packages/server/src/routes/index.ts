import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import importRoutes from './import.routes';
import analysisRoutes from './analysis.routes';
import adminRoutes from './admin.routes';
import krokmouRoutes from './krokmou.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/fiscal-years', importRoutes);
router.use('/fiscal-years', analysisRoutes);
router.use('/admin', adminRoutes);
router.use('/krokmou', krokmouRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
