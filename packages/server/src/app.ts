import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(helmet());

  // Origines autorisées : localhost en dev + domaines Vercel en prod
  // Ajouter ALLOWED_ORIGIN=https://votre-app.vercel.app dans les variables d'env Railway
  const allowedOrigins: RegExp[] = [
    /^http:\/\/localhost(:\d+)?$/,
    /^https:\/\/.*\.vercel\.app$/,
  ];
  if (process.env.ALLOWED_ORIGIN) {
    // Échapper les points pour les domaines custom
    const escaped = process.env.ALLOWED_ORIGIN.replace(/\./g, '\\.');
    allowedOrigins.push(new RegExp(`^${escaped}$`));
  }

  app.use(cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (Postman, mobile, Electron…)
      if (!origin || allowedOrigins.some(r => r.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin non autorisée → ${origin}`));
      }
    },
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/v1', routes);

  // Error handler
  app.use(errorMiddleware);

  return app;
}
