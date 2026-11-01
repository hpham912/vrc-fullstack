import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.vnrevivalchurch.app',
  appName: 'Vietnamese Revival Church',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Vietnamese Revival Church',
    backgroundColor: '#FDFCFB',
  },
};

export default config;
