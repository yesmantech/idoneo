/**
 * @file OnboardingProvider.tsx
 * @description Context-aware onboarding tour system.
 *
 * This provider manages a multi-step guided tour that teaches users
 * how to use different sections of the app. Features include:
 *
 * - Context-specific tour steps (homepage, quiz, profile, etc.)
 * - Welcome screen for first-time users
 * - Completion celebration
 * - Persistence via localStorage
 * - Analytics tracking
 *
 * ## Onboarding Contexts
 *
 * | Context      | Purpose                              | Steps |
 * |--------------|--------------------------------------|-------|
 * | `homepage`   | Search bar, category navigation     | 2     |
 * | `rolepage`   | Start quiz, readiness, history       | 4     |
 * | `quiz`       | Timer, settings, navigation          | 3     |
 * | `profile`    | Stats, settings                       | 2     |
 * | `leaderboard`| Ranking, league timer                 | 3     |
 *
 * ## How It Works
 *
 * 1. On first visit, show welcome modal
 * 2. User starts tour or dismisses
 * 3. Each step highlights an element via `targetSelector`
 * 4. Steps are shown as tooltips near the target element
 * 5. Completion triggers celebration and localStorage save
 *
 * ## Target Elements
 *
 * Components should add `data-onboarding="id"` attribute:
 * ```tsx
 * <button data-onboarding="start-quiz">Start Quiz</button>
 * ```
 *
 * ## Analytics Events
 *
 * - `onboarding_started` - User begins tour
 * - `onboarding_skipped` - User skips mid-tour
 * - `onboarding_completed` - User finishes all steps
 *
 * @example
 * ```tsx
 * import { useOnboarding } from '@/context/OnboardingProvider';
 *
 * function MyPage() {
 *   const { startOnboarding, hasCompletedContext } = useOnboarding();
 *
 *   useEffect(() => {
 *     if (!hasCompletedContext('homepage')) {
 *       startOnboarding('homepage');
 *     }
 *   }, []);
 * }
 * ```
 */

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingStep {
    id: string;
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    icon?: string;
    tip?: string;
}

export type OnboardingContext = 'homepage' | 'rolepage' | 'quiz' | 'profile' | 'leaderboard' | 'quizstats';

interface OnboardingContextType {
    // Welcome Screen
    showWelcome: boolean;
    dismissWelcome: () => void;
    startTourFromWelcome: () => void;

    // Tour State
    isActive: boolean;
    currentStepIndex: number;
    currentStep: OnboardingStep | null;
    steps: OnboardingStep[];
    activeContext: OnboardingContext | null;

    // Celebration
    showCelebration: boolean;
    dismissCelebration: () => void;

    // Actions
    startOnboarding: (context: OnboardingContext) => void;
    nextStep: () => void;
    previousStep: () => void;
    skipOnboarding: () => void;
    completeOnboarding: () => void;
    hasCompletedContext: (context: OnboardingContext) => boolean;
    resetOnboarding: () => void;
}

// ============================================
// STEP DEFINITIONS BY CONTEXT - ENHANCED
// ============================================

const STEPS_BY_CONTEXT: Record<OnboardingContext, OnboardingStep[]> = {
    homepage: [
        {
            id: 'search',
            targetSelector: '[data-onboarding="search"]',
            title: '🔍 Cerca Concorsi',
            description: 'Usa la barra di ricerca per trovare velocemente il tuo concorso. Premi ⌘K per aprirla da qualsiasi pagina!',
            position: 'bottom',
            icon: '🔍',
            tip: 'Pro tip: ⌘K apre la ricerca globale!'
        },
        {
            id: 'concorsi',
            targetSelector: '[data-onboarding="concorsi"]',
            title: '📚 Esplora i Concorsi',
            description: 'Sfoglia le categorie (Polizia, Carabinieri, Forze Armate...) e scegli il ruolo che preferisci. Tocca una card per iniziare! 🚀',
            position: 'top',
            icon: '📚'
        }
    ],
    rolepage: [
        {
            id: 'start-quiz',
            targetSelector: '[data-onboarding="start-quiz"]',
            title: '🚀 Inizia la Simulazione',
            description: 'Clicca qui per avviare una simulazione ufficiale con le domande reali del concorso.',
            position: 'bottom',
            icon: '🚀'
        },
        {
            id: 'readiness',
            targetSelector: '[data-onboarding="readiness"]',
            title: '📊 Livello di Preparazione',
            description: 'Monitora il tuo progresso e scopri quanto sei pronto per la prova ufficiale.',
            position: 'top',
            icon: '📊',
            tip: 'Questo punteggio migliora ogni volta che completi una simulazione!'
        },
        {
            id: 'custom-quiz',
            targetSelector: '[data-onboarding="custom-quiz"]',
            title: '⚙️ Prova Personalizzata',
            description: 'Crea una prova su misura: scegli le materie, il numero di domande e il tempo.',
            position: 'top',
            icon: '⚙️'
        },
        {
            id: 'history',
            targetSelector: '[data-onboarding="history"]',
            title: '📜 I Tuoi Tentativi',
            description: 'Qui trovi lo storico delle tue simulazioni con i risultati dettagliati.',
            position: 'top',
            icon: '📜'
        }
    ],
    quiz: [
        {
            id: 'timer',
            targetSelector: '[data-onboarding="timer"]',
            title: '⏱️ Timer',
            description: 'Tieni d\'occhio il tempo rimasto. Quando scade, la prova si chiude automaticamente.',
            position: 'bottom',
            icon: '⏱️'
        },
        {
            id: 'settings',
            targetSelector: '[data-onboarding="settings"]',
            title: '💡 Verifica Istantanea',
            description: 'Attiva questa opzione per vedere subito se la risposta è corretta.',
            position: 'left',
            icon: '💡',
            tip: 'Utile per studiare, ma disattivalo per simulare l\'esame reale!'
        },
        {
            id: 'navigation',
            targetSelector: '[data-onboarding="navigation"]',
            title: '🔢 Navigazione',
            description: 'Usa questi numeri per saltare direttamente a una domanda specifica.',
            position: 'top',
            icon: '🔢'
        }
    ],
    profile: [
        {
            id: 'stats',
            targetSelector: '[data-onboarding="stats"]',
            title: '📈 Le Tue Statistiche',
            description: 'Qui trovi un riepilogo delle tue performance: quiz completati, punteggio medio e altro.',
            position: 'bottom',
            icon: '📈'
        },
        {
            id: 'profile-settings',
            targetSelector: '[data-onboarding="profile-settings"]',
            title: '👤 Modifica Profilo',
            description: 'Cambia la tua foto, nickname e altre impostazioni del tuo account.',
            position: 'left',
            icon: '👤'
        }
    ],
    leaderboard: [
        {
            id: 'selector',
            targetSelector: '[data-onboarding="lb-selector"]',
            title: '🏆 Cambia Classifica',
            description: 'Passa dalla classifica XP settimanale a quella dei singoli concorsi.',
            position: 'bottom',
            icon: '🏆',
            tip: 'La classifica XP si resetta ogni lunedì!'
        },
        {
            id: 'ranking',
            targetSelector: '[data-onboarding="lb-ranking"]',
            title: '📊 La Tua Posizione',
            description: 'Vedi la tua posizione rispetto agli altri candidati. Più quiz fai, più sali!',
            position: 'top',
            icon: '📊'
        },
        {
            id: 'timer',
            targetSelector: '[data-onboarding="lb-timer"]',
            title: '⏱️ Timer Lega',
            description: 'Tempo rimasto prima del reset settimanale della classifica XP.',
            position: 'bottom',
            icon: '⏱️'
        }
    ],
    quizstats: [
        {
            id: 'kpi-grid',
            targetSelector: '[data-onboarding="stats-kpi"]',
            title: '📊 I Tuoi Numeri',
            description: 'Qui trovi le statistiche chiave: simulazioni fatte, miglior risultato, media voti e percentuale di risposte corrette.',
            position: 'bottom',
            icon: '📊',
            tip: 'Tocca ogni card per scoprire cosa significa!'
        },
        {
            id: 'readiness',
            targetSelector: '[data-onboarding="stats-readiness"]',
            title: '🎯 Livello Preparazione',
            description: 'Il tuo livello di preparazione calcolato in base a volume, precisione e costanza. Tocca per i dettagli!',
            position: 'top',
            icon: '🎯'
        },
        {
            id: 'coaching',
            targetSelector: '[data-onboarding="stats-coaching"]',
            title: '💡 Suggerimenti Personalizzati',
            description: 'Consigli su misura per migliorare le tue performance basati sui tuoi risultati.',
            position: 'top',
            icon: '💡'
        },
        {
            id: 'subjects',
            targetSelector: '[data-onboarding="stats-subjects"]',
            title: '📚 Analisi Materie',
            description: 'Vedi come vai in ogni materia. Le aree rosse sono quelle da ripassare!',
            position: 'top',
            icon: '📚',
            tip: 'Tocca una materia per vedere gli errori frequenti'
        }
    ]
};

const STORAGE_PREFIX = 'idoneo_onboarding_';
const WELCOME_KEY = 'idoneo_welcome_shown';

// ============================================
// CONTEXT
// ============================================

const OnboardingContextObj = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
    const context = useContext(OnboardingContextObj);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [showWelcome, setShowWelcome] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [activeContext, setActiveContext] = useState<OnboardingContext | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedContexts, setCompletedContexts] = useState<Set<OnboardingContext>>(new Set());
    const [showCelebration, setShowCelebration] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [dismissedModals, setDismissedModals] = useState<string[]>([]);

    // Helper to update onboarding_completed in DB
    const markOnboardingCompleted = useCallback(async (uid: string) => {
        try {
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', uid);
        } catch (error) {
            console.warn('Failed to update onboarding_completed in DB:', error);
        }
    }, []);

    // Helper: persist a tour context completion to DB via dismissed_modals
    const persistTourToDb = useCallback(async (uid: string, context: OnboardingContext, currentDismissed: string[]) => {
        const key = `tour_${context}`;
        if (currentDismissed.includes(key)) return currentDismissed;
        const updated = [...currentDismissed, key];
        try {
            await supabase
                .from('profiles')
                .update({ dismissed_modals: updated })
                .eq('id', uid);
        } catch (error) {
            console.warn('Failed to persist tour completion to DB:', error);
        }
        return updated;
    }, []);

    // Load completed contexts from DB + localStorage
    useEffect(() => {
        const completed = new Set<OnboardingContext>();
        // Start with localStorage
        (['homepage', 'rolepage', 'quiz', 'profile', 'leaderboard', 'quizstats'] as OnboardingContext[]).forEach(ctx => {
            if (localStorage.getItem(STORAGE_PREFIX + ctx) === 'true') {
                completed.add(ctx);
            }
        });

        // Check if welcome should be shown (new user)
        const checkNewUser = async () => {
            // Give a small delay for auth to settle
            setTimeout(async () => {
                try {
                    const { data } = await supabase.auth.getSession();

                    if (data.session?.user) {
                        const uid = data.session.user.id;
                        setUserId(uid);

                        // Fetch profile with both onboarding_completed and dismissed_modals
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('onboarding_completed, dismissed_modals')
                            .eq('id', uid)
                            .single();

                        // Sync dismissed_modals from DB → load tour completions
                        const dbDismissed: string[] = profile?.dismissed_modals || [];
                        setDismissedModals(dbDismissed);

                        // Merge DB tour completions into completedContexts
                        (['homepage', 'rolepage', 'quiz', 'profile', 'leaderboard', 'quizstats'] as OnboardingContext[]).forEach(ctx => {
                            if (dbDismissed.includes(`tour_${ctx}`)) {
                                completed.add(ctx);
                                // Sync to localStorage for consistency
                                localStorage.setItem(STORAGE_PREFIX + ctx, 'true');
                            }
                        });
                        setCompletedContexts(completed);

                        // If already completed in DB, sync to localStorage and don't show
                        if (profile?.onboarding_completed) {
                            localStorage.setItem(WELCOME_KEY, 'true');
                            return;
                        }

                        // Also check localStorage as fallback
                        if (localStorage.getItem(WELCOME_KEY) === 'true') {
                            // Sync to DB if localStorage says completed but DB doesn't
                            markOnboardingCompleted(uid);
                            return;
                        }

                        // Show welcome on homepage for users who haven't completed
                        if (window.location.pathname === '/') {
                            setShowWelcome(true);
                        }
                    } else {
                        // Non-authenticated user: use localStorage only
                        setCompletedContexts(completed);
                        if (!localStorage.getItem(WELCOME_KEY) && window.location.pathname === '/') {
                            setShowWelcome(true);
                        }
                    }
                } catch {
                    // Fallback to localStorage on error
                    setCompletedContexts(completed);
                    if (!localStorage.getItem(WELCOME_KEY) && window.location.pathname === '/') {
                        setShowWelcome(true);
                    }
                }
            }, 1000);
        };

        checkNewUser();
    }, [markOnboardingCompleted]);

    const hasCompletedContext = useCallback((context: OnboardingContext) => {
        return completedContexts.has(context);
    }, [completedContexts]);

    const dismissWelcome = useCallback(() => {
        setShowWelcome(false);
        localStorage.setItem(WELCOME_KEY, 'true');
        // Save to DB if authenticated
        if (userId) {
            markOnboardingCompleted(userId);
        }
    }, [userId, markOnboardingCompleted]);

    const startTourFromWelcome = useCallback(() => {
        setShowWelcome(false);
        localStorage.setItem(WELCOME_KEY, 'true');
        // Save to DB if authenticated
        if (userId) {
            markOnboardingCompleted(userId);
        }
        // Track onboarding started
        analytics.track('onboarding_started', { context: 'homepage', source: 'welcome_screen' });
        // Start homepage tour
        setActiveContext('homepage');
        setCurrentStepIndex(0);
        setIsActive(true);
    }, [userId, markOnboardingCompleted]);

    const startOnboarding = useCallback((context: OnboardingContext) => {
        // Guard 1: React state (may be empty if DB hasn't loaded yet)
        if (completedContexts.has(context)) return;
        // Guard 2: Synchronous localStorage check (always up-to-date, no race condition)
        if (localStorage.getItem(STORAGE_PREFIX + context) === 'true') return;
        // Guard 3: Don't start a new tour if one is already active
        if (isActive) return;
        setActiveContext(context);
        setCurrentStepIndex(0);
        setIsActive(true);
    }, [completedContexts, isActive]);

    const steps = activeContext ? STEPS_BY_CONTEXT[activeContext] : [];

    const nextStep = useCallback(() => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    }, [currentStepIndex, steps.length]);

    const previousStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    }, [currentStepIndex]);

    const skipOnboarding = useCallback(() => {
        if (activeContext) {
            localStorage.setItem(STORAGE_PREFIX + activeContext, 'true');
            setCompletedContexts(prev => new Set([...prev, activeContext]));
            // Persist to DB
            if (userId) {
                persistTourToDb(userId, activeContext, dismissedModals).then(updated => setDismissedModals(updated));
            }
            // Track onboarding skipped
            analytics.track('onboarding_skipped', { context: activeContext, step: currentStepIndex });
        }
        setIsActive(false);
        setActiveContext(null);
    }, [activeContext, currentStepIndex, userId, dismissedModals, persistTourToDb]);

    const completeOnboarding = useCallback(() => {
        if (activeContext) {
            localStorage.setItem(STORAGE_PREFIX + activeContext, 'true');
            setCompletedContexts(prev => new Set([...prev, activeContext]));
            // Persist to DB
            if (userId) {
                persistTourToDb(userId, activeContext, dismissedModals).then(updated => setDismissedModals(updated));
            }
            // Track onboarding completed
            analytics.track('onboarding_completed', { context: activeContext, steps_count: steps.length });
        }
        setIsActive(false);
        setActiveContext(null);

        // Show celebration only when all 3 core tours are completed (homepage, rolepage, quiz)
        // Check if this was the last core tour to complete
        const CORE_TOURS: OnboardingContext[] = ['homepage', 'rolepage', 'quiz'];
        const isCoreTour = activeContext && CORE_TOURS.includes(activeContext);

        if (isCoreTour) {
            // Check if all core tours are now complete (including the one we just finished)
            const updatedCompleted = new Set([...completedContexts, activeContext]);
            const allCoreComplete = CORE_TOURS.every(tour =>
                updatedCompleted.has(tour) || localStorage.getItem(STORAGE_PREFIX + tour) === 'true'
            );

            if (allCoreComplete) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 3000);
            }
        }
    }, [activeContext, steps.length, completedContexts, userId, dismissedModals, persistTourToDb]);

    const dismissCelebration = useCallback(() => {
        setShowCelebration(false);
    }, []);

    const resetOnboarding = useCallback(async () => {
        // Clear all onboarding state (for testing / re-showing tours)
        (['homepage', 'rolepage', 'quiz', 'profile', 'leaderboard', 'quizstats'] as OnboardingContext[]).forEach(ctx => {
            localStorage.removeItem(STORAGE_PREFIX + ctx);
        });
        localStorage.removeItem(WELCOME_KEY);
        setCompletedContexts(new Set());
        setShowWelcome(true);
        // Also clear from DB
        if (userId) {
            const tourKeys = ['tour_homepage', 'tour_rolepage', 'tour_quiz', 'tour_profile', 'tour_leaderboard', 'tour_quizstats'];
            const cleaned = dismissedModals.filter(k => !tourKeys.includes(k));
            setDismissedModals(cleaned);
            try {
                await supabase
                    .from('profiles')
                    .update({ dismissed_modals: cleaned, onboarding_completed: false })
                    .eq('id', userId);
            } catch (error) {
                console.warn('Failed to reset onboarding in DB:', error);
            }
        }
    }, [userId, dismissedModals]);

    const currentStep = isActive && activeContext ? steps[currentStepIndex] : null;

    return (
        <OnboardingContextObj.Provider
            value={{
                // Welcome
                showWelcome,
                dismissWelcome,
                startTourFromWelcome,

                // Tour
                isActive,
                currentStepIndex,
                currentStep,
                steps,
                activeContext,

                // Celebration
                showCelebration,
                dismissCelebration,

                // Actions
                startOnboarding,
                nextStep,
                previousStep,
                skipOnboarding,
                completeOnboarding,
                hasCompletedContext,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContextObj.Provider>
    );
}

