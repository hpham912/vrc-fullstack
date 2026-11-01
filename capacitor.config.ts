import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.vnrevivalchurch.app',
  appName: 'Vietnamese Revival Church',
  webDir: 'dist',
  server: {
    // Directly wraps the live web app so the iOS app immediately connects to the database
    url: 'https://ais-pre-fercpswbhnqtm3nrhczvka-277174947415.us-west2.run.app',
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
