import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.middleware';
import * as importService from '../services/import.service';

const router = Router();

// Upload et import d'un fichier FEC/CSV/XLSX
router.post('/:fyId/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Aucun fichier fourni.' },
      });
      return;
    }

    const result = await importService.processImport(
      req.params.fyId as string,
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

// Lister les imports d'un exercice
router.get('/:fyId/imports', async (req: Request, res: Response) => {
  try {
    const imports = await importService.getImportsForFiscalYear(req.params.fyId as string);
    res.json({ success: true, data: imports });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

// Supprimer un import
router.delete('/imports/:importId', async (req: Request, res: Response) => {
  try {
    await importService.deleteImport(req.params.importId as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: (err as Error).message },
    });
  }
});

export default router;