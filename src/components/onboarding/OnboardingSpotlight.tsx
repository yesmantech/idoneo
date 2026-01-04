"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingProvider';

// ============================================
// ONBOARDING SPOTLIGHT OVERLAY
// ============================================

export default function OnboardingSpotlight() {
    const {
        isActive,
        currentStep,
        currentStepIndex,
        steps,
        nextStep,
        previousStep,
        skipOnboarding
    } = useOnboarding();

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Find and measure target element
    useEffect(() => {
        if (!isActive || !currentStep) {
            setTargetRect(null);
            return;
        }

        const findTarget = () => {
            const target = document.querySelector(currentStep.targetSelector);
            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect(rect);

                // Calculate tooltip position
                const padding = 16;
                let x = rect.left + rect.width / 2;
                let y = rect.bottom + padding;

                // Adjust based on position preference
                if (currentStep.position === 'top') {
                    y = rect.top - padding;
                } else if (currentStep.position === 'left') {
                    x = rect.left - padding;
                    y = rect.top + rect.height / 2;
                } else if (currentStep.position === 'right') {
                    x = rect.right + padding;
                    y = rect.top + rect.height / 2;
                }

                setTooltipPosition({ x, y });
            } else {
                // Element not found, skip to next step
                console.warn(`Onboarding target not found: ${currentStep.targetSelector}`);
                setTargetRect(null);
            }
        };

        // Initial find
        findTarget();

        // Re-find on scroll/resize
        const handleUpdate = () => findTarget();
        window.addEventListener('scroll', handleUpdate, true);
        window.addEventListener('resize', handleUpdate);

        return () => {
            window.removeEventListener('scroll', handleUpdate, true);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [isActive, currentStep]);

    if (!isActive || !currentStep) return null;

    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] pointer-events-auto">
                {/* Dark overlay with spotlight hole */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    style={{
                        background: targetRect
                            ? `radial-gradient(
                                ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
                                transparent 0%,
                                transparent 70%,
                                rgba(0, 0, 0, 0.85) 100%
                            )`
                            : 'rgba(0, 0, 0, 0.85)'
                    }}
                    onClick={skipOnboarding}
                />

                {/* Highlight ring around target */}
                {targetRect && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute pointer-events-none"
                        style={{
                            left: targetRect.left - 8,
                            top: targetRect.top - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                            border: '3px solid #00B1FF',
                            borderRadius: 16,
                            boxShadow: '0 0 20px rgba(0, 177, 255, 0.5), 0 0 40px rgba(0, 177, 255, 0.3)'
                        }}
                    />
                )}

                {/* Tooltip */}
                <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-5 max-w-xs w-full pointer-events-auto"
                    style={{
                        left: Math.max(16, Math.min(tooltipPosition.x - 150, window.innerWidth - 316)),
                        top: currentStep.position === 'top'
                            ? Math.max(16, tooltipPosition.y - 200)
                            : tooltipPosition.y,
                        transform: currentStep.position === 'top' ? 'translateY(0)' : 'translateY(0)'
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={skipOnboarding}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 pr-8">
                        {currentStep.title}
                    </h3>
                    <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                        {currentStep.description}
                    </p>

                    {/* Progress bar */}
                    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[#00B1FF] rounded-full"
                        />
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-slate-400">
                            {currentStepIndex + 1} di {steps.length}
                        </span>

                        <div className="flex items-center gap-2">
                            {currentStepIndex > 0 && (
                                <button
                                    onClick={previousStep}
                                    className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Indietro
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className="px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-[#00B1FF] hover:bg-[#00A0E8] transition-colors flex items-center gap-1"
                            >
                                {currentStepIndex === steps.length - 1 ? 'Fine' : 'Avanti'}
                                {currentStepIndex < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
