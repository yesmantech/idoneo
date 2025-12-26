import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

type TokenHandler = (token: string) => void;
type NotificationHandler = (notification: PushNotificationSchema) => void;
type ActionHandler = (action: ActionPerformed) => void;

/**
 * Initialize push notifications
 * @param onToken - Callback when device token is received (send to backend)
 * @param onNotification - Callback when notification is received while app is open
 * @param onAction - Callback when user taps on a notification
 */
export async function initPushNotifications(
    onToken?: TokenHandler,
    onNotification?: NotificationHandler,
    onAction?: ActionHandler
): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications not available on web');
        return false;
    }

    try {
        // Check current permission status
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            // Request permission
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.log('Push notification permission not granted');
            return false;
        }

        // Register for push notifications
        await PushNotifications.register();

        // Listen for registration success
        PushNotifications.addListener('registration', (token: Token) => {
            console.log('Push registration success, token:', token.value);
            onToken?.(token.value);
        });

        // Listen for registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Push registration error:', error);
        });

        // Listen for push notification received (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('Push notification received:', notification);
            onNotification?.(notification);
        });

        // Listen for tap on notification
        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            console.log('Push notification action performed:', action);
            onAction?.(action);
        });

        console.log('Push notifications initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing push notifications:', error);
        return false;
    }
}

/**
 * Get list of delivered notifications
 */
export async function getDeliveredNotifications() {
    if (!Capacitor.isNativePlatform()) return [];

    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
}

/**
 * Remove specific delivered notifications by their IDs
 */
export async function removeDeliveredNotifications(ids: string[]) {
    if (!Capacitor.isNativePlatform()) return;

    // Get current notifications and filter by ID
    const { notifications } = await PushNotifications.getDeliveredNotifications();
    const toRemove = notifications.filter(n => ids.includes(n.id));

    if (toRemove.length > 0) {
        await PushNotifications.removeDeliveredNotifications({
            notifications: toRemove,
        });
    }
}

/**
 * Remove all delivered notifications
 */
export async function removeAllDeliveredNotifications() {
    if (!Capacitor.isNativePlatform()) return;

    await PushNotifications.removeAllDeliveredNotifications();
}
