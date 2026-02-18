import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

/**
 * Custom Storage Adapter for Supabase Auth
 * 
 * Uses 'capacitor-secure-storage-plugin' on native devices (iOS/Android)
 * to store session tokens in Keychain/Keystore.
 * Falls back to 'localStorage' on Web.
 */
export const SupabaseNativeStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Capacitor.isNativePlatform()) {
            try {
                const { value } = await SecureStoragePlugin.get({ key });
                return value;
            } catch (error) {
                // SecureStorage throws if key not found, return null as expected by Supabase
                return null;
            }
        } else {
            // Web Fallback
            return localStorage.getItem(key);
        }
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            try {
                await SecureStoragePlugin.set({ key, value });
            } catch (error) {
                console.error('Error setting secure storage item:', error);
            }
        } else {
            // Web Fallback
            localStorage.setItem(key, value);
        }
    },

    removeItem: async (key: string): Promise<void> => {
        if (Capacitor.isNativePlatform()) {
            try {
                await SecureStoragePlugin.remove({ key });
            } catch (error) {
                console.warn('Error removing secure storage item (might not exist):', error);
            }
        } else {
            // Web Fallback
            localStorage.removeItem(key);
        }
    }
};
