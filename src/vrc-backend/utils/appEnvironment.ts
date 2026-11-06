import type { Request } from 'express';

export type AppEnvironment = 'development' | 'production';

/**
 * Determines whether the current request is operating in 'development' or 'production' mode.
 * Evaluates:
 * 1. Explicit client header `X-App-Env`
 * 2. Explicit query param `?env=`
 * 3. Incoming Host/X-Forwarded-Host (e.g. ais-dev-... vs ais-pre-...)
 * 4. Fallback to process.env.NODE_ENV and process.env.APP_URL
 */
export function getAppEnvironment(req?: Request): AppEnvironment {
  if (req) {
    const headerEnv = String(req.headers['x-app-env'] || '').toLowerCase();
    if (headerEnv === 'development' || headerEnv === 'production') {
      return headerEnv;
    }

    const queryEnv = String(req.query?.env || '').toLowerCase();
    if (queryEnv === 'development' || queryEnv === 'production') {
      return queryEnv;
    }

    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    if (host.includes('ais-dev') || host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'development';
    }
    if (host.includes('ais-pre')) {
      return 'production';
    }
  }

  if (process.env.NODE_ENV === 'production' || process.env.APP_URL?.includes('ais-pre')) {
    return 'production';
  }

  return 'development';
}
