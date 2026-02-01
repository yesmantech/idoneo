/**
 * @file useSafeArea.ts
 * @description Safe area inset hooks for notched iOS devices.
 *
 * Modern iPhones (X and later) have notches and home indicators that
 * require content to avoid certain screen edges. This hook reads the
 * CSS environment variables set by iOS Safari/WKWebView.
 *
 * ## Safe Area Variables
 *
 * | Variable   | CSS Property       | Edge    |
 * |------------|--------------------|---------|
 * | `--sat`    | safe-area-inset-top| Notch   |
 * | `--sab`    | safe-area-inset-bottom| Home bar |
 * | `--sal`    | safe-area-inset-left| Side (landscape) |
 * | `--sar`    | safe-area-inset-right| Side (landscape) |
 *
 * ## CSS Setup Required
 *
 * Add these to your `index.css`:
 * ```css
 * :root {
 *   --sat: env(safe-area-inset-top);
 *   --sab: env(safe-area-inset-bottom);
 *   --sal: env(safe-area-inset-left);
 *   --sar: env(safe-area-inset-right);
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { useSafeArea, useHasNotch } from '@/hooks/useSafeArea';
 *
 * function BottomNav() {
 *   const { bottom } = useSafeArea();
 *   const hasNotch = useHasNotch();
 *
 *   return (
 *     <nav style={{ paddingBottom: bottom }}>
 *       {/* Navigation items *\/}
 *     </nav>
 *   );
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SafeAreaInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/**
 * Hook to get safe area insets for notched devices (iPhone X and later)
 * Returns pixel values for each edge that should be avoided
 */
export function useSafeArea(): SafeAreaInsets {
    const [safeArea, setSafeArea] = useState<SafeAreaInsets>({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    });

    useEffect(() => {
        const updateSafeArea = () => {
            const style = getComputedStyle(document.documentElement);

            // Parse CSS env() values for safe area insets
            const getValue = (property: string): number => {
                const value = style.getPropertyValue(property);
                return parseInt(value) || 0;
            };

            setSafeArea({
                top: getValue('--sat'),
                bottom: getValue('--sab'),
                left: getValue('--sal'),
                right: getValue('--sar'),
            });
        };

        // Only calculate on native platforms
        if (Capacitor.isNativePlatform()) {
            // Initial calculation
            updateSafeArea();

            // Recalculate on orientation change
            window.addEventListener('orientationchange', updateSafeArea);
            window.addEventListener('resize', updateSafeArea);

            return () => {
                window.removeEventListener('orientationchange', updateSafeArea);
                window.removeEventListener('resize', updateSafeArea);
            };
        }
    }, []);

    return safeArea;
}

/**
 * Check if the device likely has a notch (iPhone X and later)
 */
export function useHasNotch(): boolean {
    const safeArea = useSafeArea();
    // iPhones with notch typically have a top safe area of 44px or more
    return safeArea.top >= 44;
}
