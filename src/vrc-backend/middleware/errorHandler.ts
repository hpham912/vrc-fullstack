import { Request, Response, NextFunction } from 'express';

// One shared error type for the whole backend. Throw (or pass to next())
// an AppError whenever the user should see a specific, accurate message;
// anything else is treated as an unexpected server error and the user
// only ever sees a generic message — the real detail stays in the logs.
export class AppError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Translate a Postgres / driver error into an accurate user-facing
// AppError. Drizzle may wrap the pg error, so check both err and
// err.cause for the pg code.
function fromPostgres(err: any): AppError | null {
  const code = err?.code || err?.cause?.code;
  if (!code) return null;
  if (code === '23505') {
    return new AppError('A record with these details already exists.', 409, 'ALREADY_EXISTS');
  }
  if (code === '23503') {
    return new AppError('This item is still referenced by other data and cannot be changed.', 400, 'REFERENCED');
  }
  if (code === '23502') {
    return new AppError('A required field is missing.', 400, 'VALIDATION_ERROR');
  }
  if (code === '22P02' || code === '22003') {
    return new AppError('One of the values is not valid.', 400, 'VALIDATION_ERROR');
  }
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND' || code === '57P01' || code === '53300') {
    return new AppError('The database is temporarily unavailable. Please try again in a moment.', 503, 'SERVICE_UNAVAILABLE');
  }
  return null;
}

function toAppError(err: any): AppError {
  if (err instanceof AppError) return err;
  const pg = fromPostgres(err);
  if (pg) return pg;
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.code === 'ENOTFOUND') {
    return new AppError('The service is temporarily unavailable. Please try again in a moment.', 503, 'SERVICE_UNAVAILABLE');
  }
  // Never send a raw error message (e.g. Postgres internals like
  // "there is no unique or exclusion constraint...") to the user.
  return new AppError('Something went wrong on our side. Please try again.', 500, 'INTERNAL_ERROR');
}

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const appErr = toAppError(err);
  // Log the real error server-side; the response only carries the safe,
  // user-facing message plus a stable `code` the frontend can map to a
  // localized message.
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);

  res.status(appErr.status).json({
    error: appErr.message,
    status: appErr.status,
    code: appErr.code || undefined,
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};
