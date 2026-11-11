import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.vrcfamily.app',
  appName: 'PhucHung AZ',
  webDir: 'dist',
  server: {
    // No server.url: the app is bundled into the native shell (the web
    // app is copied into the iOS/Android project by `cap sync`), so it
    // loads offline and is a real app — not a wrapper around a website.
    // Data still comes from the API at runtime (see VITE_API_BASE_URL).
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Vietnamese Revival Church',
    backgroundColor: '#FDFCFB',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
