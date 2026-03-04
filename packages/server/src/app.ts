import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/v1', routes);

  // Error handler
  app.use(errorMiddleware);

  return app;
}
