/**
 * @file nativeConfig.ts
 * @description Native app configuration and Capacitor plugin initialization.
 *
 * This module configures the iOS/Android app experience, including:
 * - Status bar appearance
 * - Splash screen behavior
 * - Keyboard handling
 * - Back button navigation
 * - Deep link routing
 *
 * ## Initialization
 *
 * Call `initializeNativeApp()` once in `App.tsx` useEffect on mount.
 * This sets up all native configurations for the session.
 *
 * ## Status Bar
 *
 * The app uses a dark status bar background (#0F172A) with light text (Style.Light).
 * The web view extends behind the status bar (overlay mode).
 *
 * ## Deep Links
 *
 * The app handles `idoneo://` URL scheme for deep linking.
 * URLs are parsed and routed via `window.location.href`.
 *
 * @example
 * ```typescript
 * import { initializeNativeApp, setStatusBarDark } from '@/lib/nativeConfig';
 *
 * // In App.tsx
 * useEffect(() => {
 *   initializeNativeApp();
 * }, []);
 *
 * // For light-background pages
 * setStatusBarDark();
 * ```
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize native app configurations
 * Call this once when the app starts (e.g., in App.tsx useEffect)
 */
export async function initializeNativeApp() {
    if (!Capacitor.isNativePlatform()) return;

    // Add platform class to HTML element for platform-specific CSS
    const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
    document.documentElement.classList.add(`capacitor-${platform}`);

    // On Android, env(safe-area-inset-*) returns 0px in WebView
    // even with edge-to-edge enabled. Set CSS variable fallbacks.
    // Status bar: ~24dp (at mdpi) ≈ 40px CSS on most devices.
    // Gesture nav bar: ~48dp ≈ 24px CSS.
    if (platform === 'android') {
        document.documentElement.style.setProperty('--android-status-height', '40px');
        document.documentElement.style.setProperty('--android-nav-height', '24px');
    }

    try {
        // Configure Status Bar - transparent overlay, dark icons for light backgrounds
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });

        // Configure Keyboard behavior - hide accessory bar
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setStyle({ style: KeyboardStyle.Light });

        // Hide Splash Screen after app is ready
        await SplashScreen.hide();

        // Setup back button handling for Android (also useful for iOS gestures)
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                // Optionally minimize app or show exit confirmation
                App.minimizeApp();
            }
        });

        // Handle app URL open (deep links + OAuth callbacks)
        App.addListener('appUrlOpen', async (event) => {
            const url = event.url;

            // Supabase OAuth callback — contains token fragment
            // Format: idoneo://welcome#access_token=...&refresh_token=...
            if (url.includes('access_token') || url.includes('refresh_token') || url.includes('error_description')) {
                // Close the in-app browser
                try { await Browser.close(); } catch (_) {}

                // Extract the fragment and feed it to Supabase
                // Supabase looks at window.location.hash so we set it
                const hashPart = url.split('#')[1];
                if (hashPart) {
                    // Parse tokens from fragment
                    const params = new URLSearchParams(hashPart);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (!error) {
                            window.location.href = '/welcome';
                            return;
                        }
                    }
                }

                // Fallback: let Supabase parse from the URL itself
                await supabase.auth.getSession();
                window.location.href = '/welcome';
                return;
            }

            // Standard deep link navigation
            try {
                const path = new URL(url).pathname;
                if (path) window.location.href = path;
            } catch (_) {}
        });

        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
            // You can pause/resume activities here
        });

    } catch (error) {
        console.error('Error initializing native app:', error);
    }
}

/**
 * Set status bar to light content (for dark backgrounds)
 */
export async function setStatusBarLight() {
    if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({ style: Style.Light });
    }
}

/**
 * Set status bar to dark content (for light backgrounds)
 */
export async function setStatusBarDark() {
    if (Capacitor.isNativePlatform()) {
        await StatusBar.setStyle({ style: Style.Dark });
    }
}

/**
 * Show the status bar
 */
export async function showStatusBar() {
    if (Capacitor.isNativePlatform()) {
        await StatusBar.show();
    }
}

/**
 * Hide the status bar
 */
export async function hideStatusBar() {
    if (Capacitor.isNativePlatform()) {
        await StatusBar.hide();
    }
}

/**
 * Show the splash screen (useful for transitions)
 */
export async function showSplash() {
    if (Capacitor.isNativePlatform()) {
        await SplashScreen.show({
            autoHide: false,
        });
    }
}

/**
 * Hide the splash screen
 */
export async function hideSplash() {
    if (Capacitor.isNativePlatform()) {
        await SplashScreen.hide();
    }
}

/**
 * Get app information
 */
export async function getAppInfo() {
    if (Capacitor.isNativePlatform()) {
        return await App.getInfo();
    }
    return null;
}

/**
 * Exit the app (Android only, iOS will minimize)
 */
export async function exitApp() {
    if (Capacitor.isNativePlatform()) {
        await App.exitApp();
    }
}
