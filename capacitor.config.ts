import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idoneo.app',
  appName: 'Idoneo',
  webDir: 'dist',
  server: {
    // URL of the development server (useful for Live Reload)
    // url: 'http://localhost:3000',
    // cleartext: true,
    // Use HTTPS scheme for better security when using assets
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#00B1FF',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0F172A',
      overlaysWebView: true,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    // Extend content to edges (no safe area padding)
    contentInset: 'never',
    // Mobile-optimized content
    preferredContentMode: 'mobile',
    // Disable link previews for cleaner UX
    allowsLinkPreview: false,
    // Custom URL scheme for deep linking
    scheme: 'idoneo',
    // DEFINITIVE FIX: Match background color to dark mode
    backgroundColor: '#0F172A',
  },
};

export default config;
