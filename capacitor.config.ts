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
  plugins: {
    // Fullscreen splash (the lockup) while the app loads. Android 12+
    // forces the system splash icon into a circle, so the system splash
    // is kept blank (transparent icon, white bg) and this plugin shows
    // the fullscreen image instead.
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};


export default config;
