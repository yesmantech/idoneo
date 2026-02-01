/**
 * @file haptics.ts
 * @description Haptic feedback utilities for native iOS/Android experience.
 *
 * Provides tactile feedback for user interactions, enhancing the mobile
 * app experience. Haptics are only triggered on native platforms (iOS/Android),
 * silently ignored on web.
 *
 * ## Feedback Types
 *
 * | Function          | Use Case                              |
 * |-------------------|---------------------------------------|
 * | `hapticLight`     | Button taps, minor UI interactions    |
 * | `hapticMedium`    | Toggle switches, selections           |
 * | `hapticHeavy`     | Significant actions, confirmations    |
 * | `hapticSuccess`   | Quiz correct, badge earned            |
 * | `hapticWarning`   | Form validation, streak broken        |
 * | `hapticError`     | Failed actions, errors                |
 * | `hapticSelection` | Picker scrolling, slider movement     |
 *
 * @example
 * ```typescript
 * import { hapticSuccess, hapticLight } from '@/lib/haptics';
 *
 * // On correct answer
 * hapticSuccess();
 *
 * // On button tap
 * onClick={() => {
 *   hapticLight();
 *   handleAction();
 * }}
 * ```
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Check if running as a native app
 */
export const isNative = () => Capacitor.isNativePlatform();

/**
 * Check if running on iOS
 */
export const isIOS = () => Capacitor.getPlatform() === 'ios';

/**
 * Light haptic feedback - for subtle interactions
 */
export async function hapticLight() {
    if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Light });
    }
}

/**
 * Medium haptic feedback - for standard interactions
 */
export async function hapticMedium() {
    if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
    }
}

/**
 * Heavy haptic feedback - for significant actions
 */
export async function hapticHeavy() {
    if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    }
}

/**
 * Success notification haptic - for successful actions
 */
export async function hapticSuccess() {
    if (isNative()) {
        await Haptics.notification({ type: NotificationType.Success });
    }
}

/**
 * Warning notification haptic - for warnings
 */
export async function hapticWarning() {
    if (isNative()) {
        await Haptics.notification({ type: NotificationType.Warning });
    }
}

/**
 * Error notification haptic - for errors
 */
export async function hapticError() {
    if (isNative()) {
        await Haptics.notification({ type: NotificationType.Error });
    }
}

/**
 * Selection changed haptic - for picker/selection changes
 */
export async function hapticSelection() {
    if (isNative()) {
        await Haptics.selectionChanged();
    }
}
