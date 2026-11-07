// Shared frontend error messages — the one place that turns any API
// failure into an accurate, user-facing message in the right language.
// Usage: getErrorMessage(err, language, 'Fallback text if all else fails')
//
// The backend sends a stable `code` with every handled error (see
// src/vrc-backend/middleware/errorHandler.ts); prefer it over the raw
// message, which may be in English only or leak internals on routes
// that haven't migrated to AppError yet.
//
// The actual wording lives in LanguageContext (translations) — this file
// only maps backend codes to translation keys.

import { translate, type TranslationKey } from '../context/LanguageContext.tsx';

export type AppLanguage = 'vi' | 'en';

const CODE_TO_KEY: Record<string, TranslationKey> = {
  VERSE_NOT_FOUND: 'errVerseNotFound',
  VALIDATION_ERROR: 'errValidation',
  ALREADY_EXISTS: 'errAlreadyExists',
  REFERENCED: 'errReferenced',
  UNAUTHORIZED: 'errUnauthorized',
  FORBIDDEN: 'errForbidden',
  NOT_FOUND: 'errNotFound',
  RATE_LIMITED: 'errRateLimited',
  SERVICE_UNAVAILABLE: 'errServiceUnavailable',
  INTERNAL_ERROR: 'errInternal',
};

const STATUS_TO_CODE: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'ALREADY_EXISTS',
  429: 'RATE_LIMITED',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
};

// Phrases that mean the message is a leaked internal / database error,
// not something a user should ever see.
const INTERNAL_PATTERNS = [
  /duplicate key/i,
  /constraint/i,
  /violates/i,
  /relation "/i,
  /column "/i,
  /null value/i,
  /syntax error/i,
  /ECONN/i,
  /ETIMEDOUT/i,
  /timed out/i,
  /\[HTTP \d+\]/,
];

function looksInternal(message: string): boolean {
  return INTERNAL_PATTERNS.some((re) => re.test(message));
}

function backendMessage(err: any): string | null {
  const msg = err?.details?.error || err?.message;
  if (typeof msg !== 'string' || !msg.trim()) return null;
  const clean = msg.replace(/^\[HTTP \d+\]\s*/, '').trim();
  if (!clean || looksInternal(clean)) return null;
  return clean;
}

export function getErrorMessage(err: unknown, language: AppLanguage, fallback?: string): string {
  const fallbackMessage = fallback || translate('errGeneric', language);
  if (!err) return fallbackMessage;
  if (typeof err === 'string') {
    return looksInternal(err) ? fallbackMessage : err;
  }

  const anyErr = err as any;

  // Network failure: fetch throws a TypeError and there is no status.
  if (err instanceof TypeError || anyErr?.name === 'TypeError') {
    return translate('errNetwork', language);
  }

  const code = anyErr?.details?.code || anyErr?.code;
  if (typeof code === 'string' && CODE_TO_KEY[code]) {
    // Validation errors carry the specific missing-field message from
    // the backend — that is more accurate than the generic wording.
    if (code === 'VALIDATION_ERROR') {
      return backendMessage(anyErr) || translate(CODE_TO_KEY[code], language);
    }
    return translate(CODE_TO_KEY[code], language);
  }

  const status = anyErr?.status;
  if (typeof status === 'number' && STATUS_TO_CODE[status]) {
    if (status === 400) {
      return backendMessage(anyErr) || translate(CODE_TO_KEY[STATUS_TO_CODE[status]], language);
    }
    return translate(CODE_TO_KEY[STATUS_TO_CODE[status]], language);
  }

  return backendMessage(anyErr) || fallbackMessage;
}
