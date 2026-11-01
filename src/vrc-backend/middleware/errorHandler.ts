import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err);

  const status = err.status || err.statusCode || 500;
  // Never expose raw database or stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';
  const message = isDev && err.message ? err.message : 'An unexpected error occurred. Please try again.';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
};
