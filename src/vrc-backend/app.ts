import express from 'express';
import { corsMiddleware } from './middleware/securityMiddleware.ts';
import { errorHandler } from './middleware/errorHandler.ts';

import authRoutes from './routes/authRoutes.ts';
import eventRoutes from './routes/eventRoutes.ts';
import verseRoutes from './routes/verseRoutes.ts';
import notifRoutes from './routes/notifRoutes.ts';
import spotlightRoutes from './routes/spotlightRoutes.ts';
import churchInfoRoutes from './routes/churchInfoRoutes.ts';
import prayerRoutes from './routes/prayerRoutes.ts';

export const createApp = () => {
  const app = express();

  // Security & Parsing Middlewares
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));

  // Prevent browser caching on dynamic API endpoints to ensure edits persist instantly on reload
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

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
  app.use('/api/spotlight', spotlightRoutes);
  app.use('/api/church-info', churchInfoRoutes);
  app.use('/api/prayers', prayerRoutes);

  // Structured 404 for unmatched API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404,
      method: req.method,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
