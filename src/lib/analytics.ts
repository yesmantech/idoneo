/**
 * Analytics Service - Lightweight event tracking
 * 
 * This service provides a simple interface for tracking user events.
 * It can be connected to any analytics provider (Mixpanel, Amplitude, PostHog, etc.)
 */

type EventName =
    | 'page_view'
    | 'quiz_started'
    | 'quiz_completed'
    | 'badge_earned'
    | 'profile_updated'
    | 'theme_changed'
    | 'search_used'
    | 'onboarding_started'
    | 'onboarding_completed'
    | 'onboarding_skipped'
    | 'error_occurred';

interface EventProperties {
    [key: string]: string | number | boolean | null | undefined;
}

interface UserProperties {
    user_id?: string;
    email?: string;
    nickname?: string;
    total_xp?: number;
    current_streak?: number;
}

class AnalyticsService {
    private initialized = false;
    private userId: string | null = null;
    private userProperties: UserProperties = {};

    /**
     * Initialize analytics with optional user data
     */
    init(userId?: string, properties?: UserProperties) {
        this.userId = userId || null;
        this.userProperties = properties || {};
        this.initialized = true;

        // Log initialization in development
        if (import.meta.env.DEV) {
            console.log('[Analytics] Initialized', { userId, properties });
        }

        // TODO: Initialize your analytics provider here
        // Example for Mixpanel:
        // mixpanel.identify(userId);
        // mixpanel.people.set(properties);
    }

    /**
     * Track an event with optional properties
     */
    track(event: EventName, properties?: EventProperties) {
        if (!this.initialized) {
            console.warn('[Analytics] Not initialized. Call init() first.');
            return;
        }

        const enrichedProperties = {
            ...properties,
            timestamp: new Date().toISOString(),
            user_id: this.userId,
            ...this.userProperties,
        };

        // Log events in development
        if (import.meta.env.DEV) {
            console.log('[Analytics] Track:', event, enrichedProperties);
        }

        // TODO: Send to your analytics provider
        // Example for Mixpanel:
        // mixpanel.track(event, enrichedProperties);

        // Example for custom backend:
        // fetch('/api/analytics', {
        //     method: 'POST',
        //     body: JSON.stringify({ event, properties: enrichedProperties })
        // });
    }

    /**
     * Track page view
     */
    pageView(pageName: string, properties?: EventProperties) {
        this.track('page_view', {
            page_name: pageName,
            url: window.location.pathname,
            referrer: document.referrer,
            ...properties,
        });
    }

    /**
     * Update user properties
     */
    identify(userId: string, properties?: UserProperties) {
        this.userId = userId;
        this.userProperties = { ...this.userProperties, ...properties };

        if (import.meta.env.DEV) {
            console.log('[Analytics] Identify:', userId, properties);
        }

        // TODO: Update user in analytics provider
        // mixpanel.identify(userId);
        // mixpanel.people.set(properties);
    }

    /**
     * Reset user (on logout)
     */
    reset() {
        this.userId = null;
        this.userProperties = {};

        if (import.meta.env.DEV) {
            console.log('[Analytics] Reset');
        }

        // TODO: Reset analytics provider
        // mixpanel.reset();
    }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Convenience hooks
export function usePageView(pageName: string) {
    if (typeof window !== 'undefined') {
        analytics.pageView(pageName);
    }
}
