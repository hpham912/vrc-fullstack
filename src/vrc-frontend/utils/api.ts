// Only use VITE_API_BASE_URL when running inside a native Capacitor shell (capacitor://).
// On web (http:// or https://), always use same-origin relative /api routes.
const isNativeCapacitor =
  typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
    Boolean((window as any).Capacitor?.isNativePlatform?.()));

const configuredApiBase = isNativeCapacitor
  ? import.meta.env.VITE_API_BASE_URL?.trim()
  : '';

export const API_BASE = configuredApiBase
  ? configuredApiBase.replace(/\/+$/, '')
  : '';

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Common frontend API fetch wrapper that parses JSON responses and throws
 * a structured ApiError with HTTP status and exception message on failure.
 */
export async function apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(endpoint), options);
  const rawText = await res.text();

  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { error: rawText || res.statusText };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText || 'Request failed';
    throw new ApiError(`[HTTP ${res.status}] ${msg}`, res.status, data);
  }

  return data as T;
}
