/**
 * @file standalone.ts
 * @description Detects if the app is running in a standalone context:
 * - Capacitor native app (iOS/Android)
 * - iOS PWA (added to Home Screen via Safari)
 * - Android PWA (installed via Chrome)
 * - Desktop PWA
 *
 * This is critical for applying safe-area insets on notched devices
 * when running as a PWA, since Capacitor.isNativePlatform() only
 * detects native app builds, not web-based PWAs.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Returns true if the app is running in a standalone context
 * (native app OR installed PWA), NOT in a regular browser tab.
 */
export function isStandaloneApp(): boolean {
    // 1. Capacitor native app
    if (Capacitor.isNativePlatform()) return true;

    // 2. iOS Safari PWA (navigator.standalone is iOS-only)
    if ('standalone' in navigator && (navigator as any).standalone === true) return true;

    // 3. Android/Desktop PWA via display-mode media query
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;

    return false;
}

/**
 * Returns true if running on an iOS device (native or web).
 */
export function isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Returns true if we should apply safe area insets.
 * This is true for standalone apps on iOS (notched devices).
 */
export function shouldApplySafeArea(): boolean {
    return isStandaloneApp();
}
