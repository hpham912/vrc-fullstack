// Detects whether the app is running as a native iOS Capacitor shell or in the browser
const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    window.location.hostname === 'localhost' && window.location.port === ''
  );
};

// Fallback to the live deployed Google Cloud Run backend when running natively on an iPhone
export const API_BASE = isNativeApp()
  ? 'https://ais-pre-fercpswbhnqtm3nrhczvka-277174947415.us-west2.run.app'
  : '';

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
};
