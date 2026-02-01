/**
 * @file capacitor.config.ts
 * @description Capacitor configuration for native iOS app.
 *
 * Capacitor wraps the web app in a native WebView container,
 * providing access to native APIs and App Store distribution.
 *
 * ## Key Configuration
 *
 * - **appId**: Bundle identifier for App Store (com.idoneo.app)
 * - **webDir**: Built web assets directory (dist/)
 * - **server.iosScheme**: HTTPS for secure asset loading
 *
 * ## Plugin Configuration
 *
 * - **SplashScreen**: 2-second branded splash with auto-hide
 * - **StatusBar**: Light text on dark background (#0F172A)
 * - **Keyboard**: Proper resize handling for forms
 * - **PushNotifications**: Badge, sound, and alert presentation
 *
 * ## iOS-Specific Settings
 *
 * - Content extends to screen edges (no safe area inset)
 * - Mobile-optimized content mode
 * - Custom URL scheme for deep linking (idoneo://)
 * - Background color matches dark mode theme
 *
 * ## Building for iOS
 *
 * ```bash
 * npm run build         # Build web assets
 * npx cap sync ios      # Sync to iOS project
 * npx cap open ios      # Open in Xcode
 * ```
 *
 * @see https://capacitorjs.com/docs/config
 */

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
