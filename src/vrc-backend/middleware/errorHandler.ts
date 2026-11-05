import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred.';

  res.status(status).json({
    error: message,
    status,
    code: err.code || undefined,
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};
