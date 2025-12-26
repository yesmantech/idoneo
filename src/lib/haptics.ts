import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

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
