"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';

// ============================================
// TYPES
// ============================================

export interface OnboardingStep {
    id: string;
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    icon?: string;
    tip?: string;
}

export type OnboardingContext = 'homepage' | 'rolepage' | 'quiz' | 'profile' | 'leaderboard';

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

    // Load completed contexts and check for new user
    useEffect(() => {
        const completed = new Set<OnboardingContext>();
        (['homepage', 'rolepage', 'quiz', 'profile', 'leaderboard'] as OnboardingContext[]).forEach(ctx => {
            if (localStorage.getItem(STORAGE_PREFIX + ctx) === 'true') {
                completed.add(ctx);
            }
        });
        setCompletedContexts(completed);

        // Check if welcome should be shown (new user)
        const checkNewUser = async () => {
            const welcomeShown = localStorage.getItem(WELCOME_KEY);
            if (welcomeShown === 'true') return;

            // Give a small delay for auth to settle
            setTimeout(async () => {
                try {
                    const { data } = await supabase.auth.getSession();
                    // Show welcome for authenticated users who haven't seen it
                    if (!localStorage.getItem(WELCOME_KEY) && data.session) {
                        // Only show on homepage (check URL)
                        if (window.location.pathname === '/') {
                            setShowWelcome(true);
                        }
                    }
                } catch {
                    // If no auth, still show welcome for any users on homepage
                    if (!localStorage.getItem(WELCOME_KEY) && window.location.pathname === '/') {
                        setShowWelcome(true);
                    }
                }
            }, 1000);
        };

        checkNewUser();
    }, []);

    const hasCompletedContext = useCallback((context: OnboardingContext) => {
        return completedContexts.has(context);
    }, [completedContexts]);

    const dismissWelcome = useCallback(() => {
        setShowWelcome(false);
        localStorage.setItem(WELCOME_KEY, 'true');
    }, []);

    const startTourFromWelcome = useCallback(() => {
        setShowWelcome(false);
        localStorage.setItem(WELCOME_KEY, 'true');
        // Track onboarding started
        analytics.track('onboarding_started', { context: 'homepage', source: 'welcome_screen' });
        // Start homepage tour
        setActiveContext('homepage');
        setCurrentStepIndex(0);
        setIsActive(true);
    }, []);

    const startOnboarding = useCallback((context: OnboardingContext) => {
        if (completedContexts.has(context)) return;
        setActiveContext(context);
        setCurrentStepIndex(0);
        setIsActive(true);
    }, [completedContexts]);

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
            // Track onboarding skipped
            analytics.track('onboarding_skipped', { context: activeContext, step: currentStepIndex });
        }
        setIsActive(false);
        setActiveContext(null);
    }, [activeContext, currentStepIndex]);

    const completeOnboarding = useCallback(() => {
        if (activeContext) {
            localStorage.setItem(STORAGE_PREFIX + activeContext, 'true');
            setCompletedContexts(prev => new Set([...prev, activeContext]));
            // Track onboarding completed
            analytics.track('onboarding_completed', { context: activeContext, steps_count: steps.length });
        }
        setIsActive(false);
        setActiveContext(null);
        // Show celebration!
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
    }, [activeContext, steps.length]);

    const dismissCelebration = useCallback(() => {
        setShowCelebration(false);
    }, []);

    const resetOnboarding = useCallback(() => {
        // Clear all onboarding state (for testing)
        (['homepage', 'rolepage', 'quiz', 'profile', 'leaderboard'] as OnboardingContext[]).forEach(ctx => {
            localStorage.removeItem(STORAGE_PREFIX + ctx);
        });
        localStorage.removeItem(WELCOME_KEY);
        setCompletedContexts(new Set());
        setShowWelcome(true);
    }, []);

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

