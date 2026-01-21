import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

/**
 * Initialize native app configurations
 * Call this once when the app starts (e.g., in App.tsx useEffect)
 */
export async function initializeNativeApp() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Configure Status Bar - dark background with light icons
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#0F172A' });
        await StatusBar.setOverlaysWebView({ overlay: true });

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

        // Handle app URL open (deep links)
        App.addListener('appUrlOpen', (event) => {
            console.log('App opened with URL:', event.url);
            // Handle deep link navigation here
            const path = new URL(event.url).pathname;
            if (path) {
                window.location.href = path;
            }
        });

        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Is active:', isActive);
            // You can pause/resume activities here
        });

        console.log('Native app initialized successfully');
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
