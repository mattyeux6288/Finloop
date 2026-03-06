import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { pdfUpload } from '../middleware/pdfUpload.middleware';
import * as krokmouService from '../services/krokmou.service';

const router = Router();
router.use(authMiddleware);

// Envoyer un message (crée ou continue une conversation)
router.post('/:fyId/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Message requis.' },
      });
      return;
    }
    const result = await krokmouService.sendMessage(
      req.params.fyId as string,
      req.userId!,
      conversationId || null,
      message,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[krokmou] Chat error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'KROKMOU_ERROR', message: (err as Error).message },
    });
  }
});

// Lister les conversations d'un exercice
router.get('/:fyId/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const data = await krokmouService.getConversations(req.params.fyId as string, req.userId!);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

// Messages d'une conversation
router.get('/conversations/:convId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const data = await krokmouService.getConversationMessages(req.params.convId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

// Supprimer une conversation
router.delete('/conversations/:convId', async (req: AuthRequest, res: Response) => {
  try {
    await krokmouService.deleteConversation(req.params.convId as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: (err as Error).message },
    });
  }
});

// Uploader un PDF
router.post('/:fyId/documents', pdfUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Aucun fichier PDF fourni.' },
      });
      return;
    }
    const result = await krokmouService.uploadDocument(
      req.params.fyId as string,
      req.userId!,
      req.file.path,
      req.file.originalname,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[krokmou] PDF upload error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: (err as Error).message },
    });
  }
});

// Lister les documents d'un exercice
router.get('/:fyId/documents', async (req: AuthRequest, res: Response) => {
  try {
    const data = await krokmouService.getDocuments(req.params.fyId as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: (err as Error).message },
    });
  }
});

// Supprimer un document
router.delete('/documents/:docId', async (req: AuthRequest, res: Response) => {
  try {
    await krokmouService.deleteDocument(req.params.docId as string);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: (err as Error).message },
    });
  }
});

export default router;
