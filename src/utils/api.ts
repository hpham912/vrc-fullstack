// Robust native iOS / Capacitor app detection
const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check Capacitor object injected by iOS WKWebView
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.() || cap?.platform === 'ios' || cap?.platform === 'android') {
    return true;
  }

  // Check iOS custom protocols
  return (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  );
};

// When running inside native iOS without server.url, route API calls to the live Cloud Run backend
export const API_BASE = (isNativeApp() && !window.location.host.includes('run.app'))
  ? 'https://ais-pre-fercpswbhnqtm3nrhczvka-277174947415.us-west2.run.app'
  : '';

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};
