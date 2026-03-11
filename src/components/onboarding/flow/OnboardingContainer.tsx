/**
 * @file OnboardingContainer.tsx
 * @description Main container for the onboarding flow.
 * Manages step navigation, progress bar, slide animations, and data persistence.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveOnboarding, type OnboardingData, EMPTY_ONBOARDING } from '@/lib/onboardingService';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import StepWelcome from './StepWelcome';
import StepGoal from './StepGoal';
import StepProfile from './StepProfile';
import StepPreferences from './StepPreferences';
import StepConcorso from './StepConcorso';
import StepSummary from './StepSummary';

const TOTAL_STEPS = 6; // welcome, goal, profile, preferences, concorso, summary

export default function OnboardingContainer() {
    const navigate = useNavigate();
    const { refreshProfile } = useAuth();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>({ ...EMPTY_ONBOARDING });
    const [saving, setSaving] = useState(false);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');

    // Partial update helper
    const updateData = useCallback((partial: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...partial }));
    }, []);

    // Navigation
    const goNext = useCallback(() => {
        hapticLight();
        setDirection('forward');
        setStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
    }, []);

    const goBack = useCallback(() => {
        hapticLight();
        setDirection('back');
        setStep(prev => Math.max(prev - 1, 0));
    }, []);

    const skipOnboarding = useCallback(() => {
        analytics.track('onboarding_skipped', { step });
        navigate('/');
    }, [navigate, step]);

    // Final save
    const handleComplete = useCallback(async () => {
        try {
            setSaving(true);
            hapticSuccess();
            analytics.track('onboarding_completed', {
                goal: data.goal,
                experience: data.experience,
                categoriesCount: data.categories.length,
            });
            await saveOnboarding(data);
            await refreshProfile();
            navigate('/');
        } catch (err) {
            console.error('Onboarding save error:', err);
            navigate('/');
        } finally {
            setSaving(false);
        }
    }, [data, navigate, refreshProfile]);

    // Can advance? (validation per step)
    const canAdvance = (): boolean => {
        switch (step) {
            case 0: return true; // welcome
            case 1: return !!data.goal;
            case 2: return !!data.ageRange && !!data.experience;
            case 3: return data.preferences.length > 0 && !!data.dailyTime;
            case 4: return true; // categories optional
            case 5: return true; // summary
            default: return true;
        }
    };

    // Slide animation class
    const slideClass = direction === 'forward'
        ? 'animate-in slide-in-from-right-8 fade-in duration-300'
        : 'animate-in slide-in-from-left-8 fade-in duration-300';

    // Progress (skip welcome from progress)
    const progress = step === 0 ? 0 : ((step) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] flex flex-col relative overflow-hidden">
            {/* Header: Back + Skip + Progress */}
            {step > 0 && step < TOTAL_STEPS - 1 && (
                <div className="sticky top-0 z-50 bg-white/80 dark:bg-[var(--background)]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.08] px-4 pt-[env(safe-area-inset-top)] pb-3">
                    <div className="flex items-center justify-between mb-3 pt-3">
                        <button
                            onClick={goBack}
                            className="flex items-center gap-1 text-[var(--foreground)] opacity-60 hover:opacity-100 transition-opacity active:scale-[0.97]"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Indietro</span>
                        </button>
                        <button
                            onClick={skipOnboarding}
                            className="text-sm font-medium text-[var(--foreground)] opacity-40 hover:opacity-60 transition-opacity"
                        >
                            Salta
                        </button>
                    </div>
                    {/* Progress Bar — brand gradient */}
                    <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#00B1FF] to-[#0066FF] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="flex-1 flex flex-col" key={step}>
                <div className={`flex-1 flex flex-col ${step > 0 ? slideClass : ''}`}>
                    {step === 0 && (
                        <StepWelcome onNext={goNext} onSkip={skipOnboarding} />
                    )}
                    {step === 1 && (
                        <StepGoal
                            value={data.goal}
                            onChange={(goal) => updateData({ goal })}
                            onNext={goNext}
                            canAdvance={canAdvance()}
                        />
                    )}
                    {step === 2 && (
                        <StepProfile
                            data={data}
                            onChange={updateData}
                            onNext={goNext}
                            canAdvance={canAdvance()}
                        />
                    )}
                    {step === 3 && (
                        <StepPreferences
                            data={data}
                            onChange={updateData}
                            onNext={goNext}
                            canAdvance={canAdvance()}
                        />
                    )}
                    {step === 4 && (
                        <StepConcorso
                            selected={data.categories}
                            onChange={(categories) => updateData({ categories })}
                            onNext={goNext}
                            canAdvance={true}
                        />
                    )}
                    {step === 5 && (
                        <StepSummary
                            data={data}
                            onComplete={handleComplete}
                            saving={saving}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
