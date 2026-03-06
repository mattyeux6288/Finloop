import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

function resolveUploadDir(): string {
  const candidates = [config.uploadDir, '/tmp'];
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const testFile = path.join(dir, '.write-test-pdf');
      fs.writeFileSync(testFile, '');
      fs.unlinkSync(testFile);
      return dir;
    } catch {
      /* try next */
    }
  }
  return '/tmp';
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resolveUploadDir()),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont acceptes pour Krokmou.'));
  }
};

export const pdfUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});
