// Robust native iOS / Capacitor app detection
const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.() || cap?.platform === 'ios' || cap?.platform === 'android') {
    return true;
  }

  return (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  );
};

export const API_BASE = (isNativeApp() && !window.location.host.includes('run.app'))
  ? 'https://ais-pre-fercpswbhnqtm3nrhczvka-277174947415.us-west2.run.app'
  : '';

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};
