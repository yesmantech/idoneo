"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface OnboardingStep {
    id: string;
    targetSelector: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export type OnboardingContext = 'homepage' | 'rolepage' | 'quiz' | 'profile';

interface OnboardingContextType {
    isActive: boolean;
    currentStepIndex: number;
    currentStep: OnboardingStep | null;
    steps: OnboardingStep[];
    activeContext: OnboardingContext | null;
    startOnboarding: (context: OnboardingContext) => void;
    nextStep: () => void;
    previousStep: () => void;
    skipOnboarding: () => void;
    completeOnboarding: () => void;
    hasCompletedContext: (context: OnboardingContext) => boolean;
}

// ============================================
// STEP DEFINITIONS BY CONTEXT
// ============================================

const STEPS_BY_CONTEXT: Record<OnboardingContext, OnboardingStep[]> = {
    homepage: [
        {
            id: 'search',
            targetSelector: '[data-onboarding="search"]',
            title: '🔍 Cerca Concorsi',
            description: 'Usa la barra di ricerca per trovare velocemente il tuo concorso tra quelli disponibili.',
            position: 'bottom'
        },
        {
            id: 'concorsi',
            targetSelector: '[data-onboarding="concorsi"]',
            title: '📚 Esplora i Concorsi',
            description: 'Sfoglia le categorie (Polizia, Carabinieri, Forze Armate...) e scegli il ruolo che preferisci. Tocca una card per iniziare! 🚀',
            position: 'top'
        }
    ],
    rolepage: [
        {
            id: 'start-quiz',
            targetSelector: '[data-onboarding="start-quiz"]',
            title: '🚀 Inizia la Simulazione',
            description: 'Clicca qui per avviare una simulazione ufficiale con le domande reali del concorso.',
            position: 'bottom'
        },
        {
            id: 'readiness',
            targetSelector: '[data-onboarding="readiness"]',
            title: '📊 Livello di Preparazione',
            description: 'Monitora il tuo progresso e scopri quanto sei pronto per la prova ufficiale.',
            position: 'top'
        },
        {
            id: 'custom-quiz',
            targetSelector: '[data-onboarding="custom-quiz"]',
            title: '⚙️ Prova Personalizzata',
            description: 'Crea una prova su misura: scegli le materie, il numero di domande e il tempo disponibile.',
            position: 'top'
        },
        {
            id: 'history',
            targetSelector: '[data-onboarding="history"]',
            title: '📜 I Tuoi Tentativi',
            description: 'Qui trovi lo storico delle tue simulazioni con i risultati dettagliati.',
            position: 'top'
        }
    ],
    quiz: [
        {
            id: 'timer',
            targetSelector: '[data-onboarding="timer"]',
            title: '⏱️ Timer',
            description: 'Tieni d\'occhio il tempo rimasto. Quando scade, la prova si chiude automaticamente.',
            position: 'bottom'
        },
        {
            id: 'settings',
            targetSelector: '[data-onboarding="settings"]',
            title: '⚙️ Impostazioni',
            description: 'Attiva la "Verifica Istantanea" per vedere subito se la risposta è corretta.',
            position: 'left'
        },
        {
            id: 'navigation',
            targetSelector: '[data-onboarding="navigation"]',
            title: '🔢 Navigazione',
            description: 'Usa questi numeri per saltare direttamente a una domanda specifica.',
            position: 'top'
        }
    ],
    profile: [
        {
            id: 'stats',
            targetSelector: '[data-onboarding="stats"]',
            title: '📈 Le Tue Statistiche',
            description: 'Qui trovi un riepilogo delle tue performance: quiz completati, punteggio medio e altro.',
            position: 'bottom'
        },
        {
            id: 'profile-settings',
            targetSelector: '[data-onboarding="profile-settings"]',
            title: '👤 Modifica Profilo',
            description: 'Cambia la tua foto, nickname e altre impostazioni del tuo account.',
            position: 'left'
        }
    ]
};

const STORAGE_PREFIX = 'idoneo_onboarding_';

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
    const [isActive, setIsActive] = useState(false);
    const [activeContext, setActiveContext] = useState<OnboardingContext | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedContexts, setCompletedContexts] = useState<Set<OnboardingContext>>(new Set());

    // Load completed contexts from localStorage on mount
    useEffect(() => {
        const completed = new Set<OnboardingContext>();
        (['homepage', 'rolepage', 'quiz', 'profile'] as OnboardingContext[]).forEach(ctx => {
            if (localStorage.getItem(STORAGE_PREFIX + ctx) === 'true') {
                completed.add(ctx);
            }
        });
        setCompletedContexts(completed);
    }, []);

    const hasCompletedContext = useCallback((context: OnboardingContext) => {
        return completedContexts.has(context);
    }, [completedContexts]);

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
        }
        setIsActive(false);
        setActiveContext(null);
    }, [activeContext]);

    const completeOnboarding = useCallback(() => {
        if (activeContext) {
            localStorage.setItem(STORAGE_PREFIX + activeContext, 'true');
            setCompletedContexts(prev => new Set([...prev, activeContext]));
        }
        setIsActive(false);
        setActiveContext(null);
    }, [activeContext]);

    const currentStep = isActive && activeContext ? steps[currentStepIndex] : null;

    // Legacy compatibility - for homepage auto-start
    const hasCompletedOnboarding = hasCompletedContext('homepage');

    return (
        <OnboardingContextObj.Provider
            value={{
                isActive,
                currentStepIndex,
                currentStep,
                steps,
                activeContext,
                startOnboarding,
                nextStep,
                previousStep,
                skipOnboarding,
                completeOnboarding,
                hasCompletedContext,
                // Legacy
                hasCompletedOnboarding
            } as OnboardingContextType & { hasCompletedOnboarding: boolean }}
        >
            {children}
        </OnboardingContextObj.Provider>
    );
}
