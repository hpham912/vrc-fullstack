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

export const getAppEnvHeader = (): string => {
  // In a native Capacitor shell the page runs on localhost
  // (capacitor://localhost), which is NOT the dev environment — so base
  // the environment on the API base URL instead of the page host.
  // A bundled release build points at the prod app URL
  // (https://my.vrcfamily.org) and must use the prod database.
  if (isNativeCapacitor) {
    const apiHost = API_BASE.toLowerCase();
    if (apiHost.includes('ais-dev') || apiHost.includes('localhost') || apiHost.includes('127.0.0.1')) {
      return 'development';
    }
    return 'production';
  }
  if (typeof window !== 'undefined') {
    const host = window.location.host.toLowerCase();
    if (host.includes('ais-dev') || host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'development';
    }
    if (host.includes('ais-pre')) {
      return 'production';
    }
  }
  return import.meta.env.DEV ? 'development' : 'production';
};

export const apiHeaders = (existing?: HeadersInit): Headers => {
  const headers = new Headers(existing || {});
  if (!headers.has('X-App-Env')) {
    headers.set('X-App-Env', getAppEnvHeader());
  }
  return headers;
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
  const mergedOptions: RequestInit = {
    ...options,
    headers: apiHeaders(options?.headers),
  };

  const res = await fetch(apiUrl(endpoint), mergedOptions);
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
