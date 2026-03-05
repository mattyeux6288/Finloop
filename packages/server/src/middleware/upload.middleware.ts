import multer from 'multer';
import path from 'path';
import { config } from '../config/env';
import fs from 'fs';

// Résoudre le dossier d'upload : on essaie le chemin configuré,
// et si le filesystem est en lecture seule (ex: Vercel /var/task),
// on bascule automatiquement sur /tmp.
function resolveUploadDir(): string {
  const candidates = [config.uploadDir, '/tmp'];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Vérifier qu'on peut écrire dans ce dossier
      const testFile = path.join(dir, '.write-test');
      fs.writeFileSync(testFile, '');
      fs.unlinkSync(testFile);
      return dir;
    } catch {
      console.warn(`[upload] Directory "${dir}" not writable, trying next...`);
    }
  }

  // Dernier recours : /tmp sans vérification
  return '/tmp';
}

const effectiveUploadDir = resolveUploadDir();
console.log(`[upload] Using upload directory: ${effectiveUploadDir}`);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, effectiveUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.txt', '.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Extension non supportée: ${ext}. Extensions acceptées: ${allowedExtensions.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxUploadSize },
});
