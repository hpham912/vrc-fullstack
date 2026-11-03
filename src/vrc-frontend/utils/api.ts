// Vite substitutes this value at build time.  Keep it empty for the web app,
// where relative /api requests are served by the same Express origin.
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE = configuredApiBase
  ? configuredApiBase.replace(/\/+$/, '')
  : '';

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};
