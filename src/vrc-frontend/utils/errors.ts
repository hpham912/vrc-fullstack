// Shared frontend error messages — the one place that turns any API
// failure into an accurate, user-facing message in the right language.
// Usage: getErrorMessage(err, language, 'Fallback text if all else fails')
//
// The backend sends a stable `code` with every handled error (see
// src/vrc-backend/middleware/errorHandler.ts); prefer it over the raw
// message, which may be in English only or leak internals on routes
// that haven't migrated to AppError yet.

export type AppLanguage = 'vi' | 'en';

const MESSAGES: Record<string, { vi: string; en: string }> = {
  VERSE_NOT_FOUND: {
    vi: 'Câu Lời Chúa này đã bị xóa rồi.',
    en: 'This verse was already deleted.',
  },
  VALIDATION_ERROR: {
    vi: 'Vui lòng kiểm tra lại các thông tin đã nhập.',
    en: 'Please check the information you entered.',
  },
  ALREADY_EXISTS: {
    vi: 'Đã có dữ liệu này rồi.',
    en: 'This already exists.',
  },
  REFERENCED: {
    vi: 'Không thể thay đổi vì dữ liệu này đang được dùng ở nơi khác.',
    en: 'This cannot be changed because it is still used elsewhere.',
  },
  UNAUTHORIZED: {
    vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    en: 'Your session has expired. Please sign in again.',
  },
  FORBIDDEN: {
    vi: 'Bạn không có quyền thực hiện việc này.',
    en: 'You do not have permission to do this.',
  },
  NOT_FOUND: {
    vi: 'Nội dung này không còn tồn tại.',
    en: 'This item no longer exists.',
  },
  RATE_LIMITED: {
    vi: 'Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.',
    en: 'Too many requests. Please wait a moment and try again.',
  },
  SERVICE_UNAVAILABLE: {
    vi: 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.',
    en: 'The service is temporarily unavailable. Please try again later.',
  },
  INTERNAL_ERROR: {
    vi: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    en: 'Something went wrong. Please try again later.',
  },
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
  const fallbackMessage =
    fallback || (language === 'vi' ? 'Đã xảy ra lỗi. Vui lòng thử lại.' : 'Something went wrong. Please try again.');
  if (!err) return fallbackMessage;
  if (typeof err === 'string') {
    return looksInternal(err) ? fallbackMessage : err;
  }

  const anyErr = err as any;

  // Network failure: fetch throws a TypeError and there is no status.
  if (err instanceof TypeError || anyErr?.name === 'TypeError') {
    return language === 'vi'
      ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng rồi thử lại.'
      : "Couldn't reach the server. Please check your connection and try again.";
  }

  const code = anyErr?.details?.code || anyErr?.code;
  if (typeof code === 'string' && MESSAGES[code]) {
    // Validation errors carry the specific missing-field message from
    // the backend — that is more accurate than the generic wording.
    if (code === 'VALIDATION_ERROR') {
      return backendMessage(anyErr) || MESSAGES[code][language];
    }
    return MESSAGES[code][language];
  }

  const status = anyErr?.status;
  if (typeof status === 'number' && STATUS_TO_CODE[status]) {
    if (status === 400) {
      return backendMessage(anyErr) || MESSAGES[STATUS_TO_CODE[status]][language];
    }
    return MESSAGES[STATUS_TO_CODE[status]][language];
  }

  return backendMessage(anyErr) || fallbackMessage;
}
