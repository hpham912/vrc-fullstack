import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.vnrevivalchurch.app',
  appName: 'Vietnamese Revival Church',
  webDir: 'dist',
  server: {
    // Directly wraps the church webpage inside the iOS app shell
    url: 'https://vrcfamily.ai.studio',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'vietnamese-revival-church.ai.studio',
      '*.ai.studio',
      '*.run.app',
      '*.google.com',
    ],
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
