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
      backgroundColor: '#00B1FF',
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    // Handle safe area automatically
    contentInset: 'automatic',
    // Mobile-optimized content
    preferredContentMode: 'mobile',
    // Disable link previews for cleaner UX
    allowsLinkPreview: false,
    // Custom URL scheme for deep linking
    scheme: 'idoneo',
  },
};

export default config;
