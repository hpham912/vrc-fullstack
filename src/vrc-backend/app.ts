import express from 'express';
import { corsMiddleware } from './middleware/securityMiddleware.ts';
import { errorHandler } from './middleware/errorHandler.ts';

import authRoutes from './routes/authRoutes.ts';
import eventRoutes from './routes/eventRoutes.ts';
import verseRoutes from './routes/verseRoutes.ts';
import notifRoutes from './routes/notifRoutes.ts';
import devotionalRoutes from './routes/devotionalRoutes.ts';
import spotlightRoutes from './routes/spotlightRoutes.ts';
import churchInfoRoutes from './routes/churchInfoRoutes.ts';

export const createApp = () => {
  const app = express();

  // Security & Parsing Middlewares
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Vietnamese Revival Church API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/verses', verseRoutes);
  app.use('/api/notifications', notifRoutes);
  app.use('/api/ai', devotionalRoutes);
  app.use('/api/spotlight', spotlightRoutes);
  app.use('/api/church-info', churchInfoRoutes);


  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
