/**
 * @file analytics.ts
 * @description Google Analytics 4 (GA4) integration for user event tracking.
 *
 * This service provides a centralized interface for analytics tracking across
 * the application. It uses react-ga4 as the GA4 client library.
 *
 * ## Features
 * - **Event Tracking**: Custom events with properties
 * - **Page Views**: Automatic page view tracking
 * - **User Identification**: Persistent user ID tracking
 * - **Development Mode**: Console logging for debugging
 *
 * ## Tracked Events
 * | Event               | When                              |
 * |---------------------|-----------------------------------|
 * | page_view           | Navigation to any page            |
 * | quiz_started        | User begins a quiz attempt        |
 * | quiz_completed      | User finishes a quiz attempt      |
 * | badge_earned        | User unlocks an achievement       |
 * | streak_extended     | User's streak increases           |
 * | theme_changed       | User toggles dark/light mode      |
 * | onboarding_started  | User begins onboarding tour       |
 * | onboarding_completed| User finishes onboarding tour     |
 * | error_occurred      | Application error caught          |
 *
 * ## Configuration
 * Requires `VITE_GA_MEASUREMENT_ID` environment variable (e.g., G-XXXXXXXXXX).
 * If not set, analytics calls are silently ignored.
 *
 * @example
 * ```typescript
 * import { analytics } from '@/lib/analytics';
 *
 * // Initialize (called once on app start)
 * analytics.init(userId, { nickname, total_xp });
 *
 * // Track an event
 * analytics.track('quiz_completed', { quiz_id: 'abc', score: 85 });
 *
 * // Track a page view
 * analytics.pageView('Profile Page');
 * ```
 */

import ReactGA from 'react-ga4';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported event names for tracking.
 * Each event should have a corresponding handler in the application.
 */

type EventName =
    | 'page_view'
    | 'quiz_started'
    | 'quiz_completed'
    | 'badge_earned'
    | 'profile_updated'
    | 'theme_changed'
    | 'streak_extended'
    | 'search_used'
    | 'search_result_selected'
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
        // Prevent double init
        if (this.initialized) return;

        const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

        if (measurementId) {
            ReactGA.initialize(measurementId);
            this.initialized = true;

            if (import.meta.env.DEV) {
                console.log('[Analytics] GA4 Initialized', { measurementId });
            }
        } else {
            console.warn('[Analytics] VITE_GA_MEASUREMENT_ID not found. Analytics disabled.');
        }

        this.userId = userId || null;
        this.userProperties = properties || {};

        // If we have user data on init, identify immediately
        if (this.userId) {
            this.identify(this.userId, this.userProperties);
        }
    }

    /**
     * Track an event with optional properties
     */
    track(event: EventName, properties?: EventProperties) {
        if (!this.initialized) return;

        const enrichedProperties = {
            ...properties,
            user_id: this.userId,
            ...this.userProperties,
        };

        // Log events in development
        if (import.meta.env.DEV) {
            console.log('[Analytics] Track:', event, enrichedProperties);
        }

        // Send to GA4
        ReactGA.event({
            category: 'User Interaction', // Generic category, can be refined per event type
            action: event,
            label: properties?.label as string || undefined, // generic label mapping
            value: typeof properties?.value === 'number' ? properties.value : undefined, // generic value mapping
            ...enrichedProperties // Send rest as custom dimensions
        });
    }

    /**
     * Track page view
     */
    pageView(pageName: string, properties?: EventProperties) {
        if (!this.initialized) return;

        const path = window.location.pathname + window.location.search;

        if (import.meta.env.DEV) {
            console.log('[Analytics] Page View:', pageName, path);
        }

        // Send to GA4
        ReactGA.send({
            hitType: "pageview",
            page: path,
            title: pageName
        });
    }

    /**
     * Update user properties
     */
    identify(userId: string, properties?: UserProperties) {
        this.userId = userId;
        this.userProperties = { ...this.userProperties, ...properties };

        if (!this.initialized) return;

        if (import.meta.env.DEV) {
            console.log('[Analytics] Identify:', userId, properties);
        }

        // GA4 User ID
        ReactGA.set({ userId: userId });

        // GA4 User Properties
        // Note: These must be defined as Custom Dimensions in GA4 dashboard to be useful
        if (properties) {
            ReactGA.set(properties);
        }
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

        // Clear user ID in GA context is tricky, usually we just set it to null
        if (this.initialized) {
            ReactGA.set({ userId: null });
        }
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
