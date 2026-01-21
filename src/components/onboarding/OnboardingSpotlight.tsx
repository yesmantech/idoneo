"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Lightbulb, PartyPopper } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingProvider';
import OnboardingWelcome from './OnboardingWelcome';
import { hapticLight, hapticSuccess, hapticSelection } from '@/lib/haptics';

// ============================================
// ONBOARDING SPOTLIGHT OVERLAY - TIER S
// Premium tour experience with animations
// ============================================

// Confetti particle component
function Confetti() {
    const colors = ['#00B1FF', '#00D4AA', '#FFD93D', '#FF6B6B', '#C084FC'];
    return (
        <div className="fixed inset-0 pointer-events-none z-[10001] overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{
                        backgroundColor: colors[i % colors.length],
                        left: `${Math.random() * 100}%`,
                        top: -20,
                    }}
                    initial={{ y: 0, rotate: 0, opacity: 1 }}
                    animate={{
                        y: window.innerHeight + 100,
                        rotate: Math.random() * 720 - 360,
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 0.5,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </div>
    );
}

// Celebration overlay
function CelebrationOverlay({ onDismiss }: { onDismiss: () => void }) {
    useEffect(() => {
        hapticSuccess();
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
            onClick={onDismiss}
        >
            <Confetti />
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="text-center"
            >
                <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-7xl mb-4"
                >
                    🎉
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Ben fatto!</h2>
                <p className="text-white/70 font-medium">Ora sei pronto per iniziare</p>
            </motion.div>
        </motion.div>
    );
}

export default function OnboardingSpotlight() {
    const {
        // Welcome
        showWelcome,
        dismissWelcome,
        startTourFromWelcome,
        // Tour
        isActive,
        currentStep,
        currentStepIndex,
        steps,
        nextStep,
        previousStep,
        skipOnboarding,
        // Celebration
        showCelebration,
        dismissCelebration
    } = useOnboarding();

    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, arrowDirection: 'down' as 'up' | 'down' | 'left' | 'right' });
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Find and measure target element
    useEffect(() => {
        if (!isActive || !currentStep) {
            setTargetRect(null);
            return;
        }

        const findTarget = (shouldScroll = false) => {
            const target = document.querySelector(currentStep.targetSelector);
            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect(rect);

                // Auto-scroll to target if it's not well-positioned
                // Only scroll if explicitly requested (e.g. new step)
                if (shouldScroll) {
                    const isOutOfView = rect.top < 100 || rect.bottom > window.innerHeight - 100;
                    if (isOutOfView) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }

                // Calculate tooltip position
                const padding = 24;
                const tooltipHeight = 220; // Estimated height for flip logic (generous)
                let x = rect.left + rect.width / 2;
                let y = rect.bottom + padding;
                let arrowDirection: 'up' | 'down' | 'left' | 'right' = 'up';

                // Initial request
                let requestedPos = currentStep.position || 'bottom';

                // Smart Flip: Bidirectional collision detection
                // 1. If bottom is requested but doesn't fit, try top
                if (requestedPos === 'bottom' && y + tooltipHeight > window.innerHeight) {
                    requestedPos = 'top';
                }
                // 2. If top is requested but doesn't fit (e.g. element near navbar), force bottom
                // Use a safe margin (e.g. 200px) to ensure tooltip fits
                else if (requestedPos === 'top' && rect.top < 220) {
                    requestedPos = 'bottom';
                }

                // Adjust based on final position
                if (requestedPos === 'top') {
                    y = rect.top - padding;
                    arrowDirection = 'down';
                } else if (requestedPos === 'left') {
                    x = rect.left - padding;
                    y = rect.top + rect.height / 2;
                    arrowDirection = 'right';
                } else if (requestedPos === 'right') {
                    x = rect.right + padding;
                    y = rect.top + rect.height / 2;
                    arrowDirection = 'left';
                }

                setTooltipPosition({ x, y, arrowDirection });
            } else {
                // Element not found - auto-skip after brief delay
                console.warn(`Onboarding target not found: ${currentStep.targetSelector}`);
                setTargetRect(null);
            }
        };

        // Throttled update function to prevent layout thrashing
        let throttleTimeout: NodeJS.Timeout | null = null;

        const handleUpdate = () => {
            if (throttleTimeout === null) {
                throttleTimeout = setTimeout(() => {
                    findTarget(false); // Do not auto-scroll on updates
                    throttleTimeout = null;
                }, 50); // Limit updates to ~20fps
            }
        };

        // Initial find with small delay for DOM to settle - Auto-scroll allowed here
        const timer = setTimeout(() => findTarget(true), 100);

        // Re-find on scroll/resize
        const root = document.getElementById('root');
        root?.addEventListener('scroll', handleUpdate, true);
        window.addEventListener('resize', handleUpdate);

        return () => {
            if (throttleTimeout) clearTimeout(throttleTimeout);
            clearTimeout(timer);
            root?.removeEventListener('scroll', handleUpdate, true);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [isActive, currentStep]);

    const handleNext = () => {
        hapticSelection();
        nextStep();
    };

    const handlePrevious = () => {
        hapticLight();
        previousStep();
    };

    const handleSkip = () => {
        hapticLight();
        skipOnboarding();
    };

    const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

    // Calculate tooltip final position with Viewport Clamping
    const getTooltipStyle = () => {
        const isTop = tooltipPosition.arrowDirection === 'down';
        const horizontalOffset = Math.max(16, Math.min(tooltipPosition.x - 160, window.innerWidth - 336));

        // Get actual height or use estimate
        const currentHeight = tooltipRef.current?.offsetHeight || 220;
        const safeMargin = 16;
        const maxTop = window.innerHeight - currentHeight - safeMargin;
        const minTop = safeMargin;

        let finalTop = 0;

        if (isTop) {
            // Position above target
            // Anchor is at bottom of tooltip
            finalTop = tooltipPosition.y - currentHeight - 12;

            // Note: We use 'top' for everything now to make clamping easier
        } else {
            // Position below target
            // Anchor is at top of tooltip
            finalTop = tooltipPosition.y + 12;
        }

        // CLAMPING: Force tooltip to stay within vertical safe area
        // This overrides placement to ensure text is ALWAYS visible
        finalTop = Math.max(minTop, Math.min(finalTop, maxTop));

        return {
            left: horizontalOffset,
            top: finalTop,
        };
    };

    return (
        <>
            {/* Welcome Screen */}
            <AnimatePresence>
                {showWelcome && (
                    <OnboardingWelcome
                        onStartTour={startTourFromWelcome}
                        onSkip={dismissWelcome}
                    />
                )}
            </AnimatePresence>

            {/* Celebration */}
            <AnimatePresence>
                {showCelebration && (
                    <CelebrationOverlay onDismiss={dismissCelebration} />
                )}
            </AnimatePresence>

            {/* Tour Spotlight */}
            <AnimatePresence>
                {isActive && currentStep && (
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
                                        ellipse ${targetRect.width + 60}px ${targetRect.height + 60}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
                                        transparent 0%,
                                        transparent 65%,
                                        rgba(15, 23, 42, 0.92) 100%
                                    )`
                                    : 'rgba(15, 23, 42, 0.92)'
                            }}
                            onClick={handleSkip}
                        />

                        {/* Pulsing highlight ring around target */}
                        {targetRect && (
                            <>
                                {/* Outer pulse ring */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.5, 0.2, 0.5]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: targetRect.left - 16,
                                        top: targetRect.top - 16,
                                        width: targetRect.width + 32,
                                        height: targetRect.height + 32,
                                        border: '4px solid #00B1FF',
                                        borderRadius: 20,
                                    }}
                                />
                                {/* Inner solid ring */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: targetRect.left - 8,
                                        top: targetRect.top - 8,
                                        width: targetRect.width + 16,
                                        height: targetRect.height + 16,
                                        border: '3px solid #00B1FF',
                                        borderRadius: 16,
                                        boxShadow: '0 0 30px rgba(0, 177, 255, 0.5), 0 0 60px rgba(0, 177, 255, 0.25), inset 0 0 20px rgba(0, 177, 255, 0.1)'
                                    }}
                                />
                            </>
                        )}

                        {/* Pointer Arrow */}
                        {targetRect && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute pointer-events-none z-10"
                                style={{
                                    left: tooltipPosition.x - 12,
                                    top: tooltipPosition.arrowDirection === 'up' ? tooltipPosition.y : tooltipPosition.y - 12,
                                }}
                            >
                                <svg
                                    width="24"
                                    height="12"
                                    viewBox="0 0 24 12"
                                    fill="none"
                                    className={tooltipPosition.arrowDirection === 'down' ? 'rotate-180' : ''}
                                >
                                    <path d="M12 0L24 12H0L12 0Z" fill="white" className="dark:fill-slate-900" />
                                </svg>
                            </motion.div>
                        )}

                        {/* Tooltip */}
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0, y: currentStep.position === 'top' ? -20 : 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="absolute bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] p-6 max-w-xs w-[320px] pointer-events-auto border border-slate-100 dark:border-slate-800"
                            style={getTooltipStyle()}
                        >
                            {/* Close button */}
                            <button
                                onClick={handleSkip}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Step indicator badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00B1FF]/10 rounded-full mb-3">
                                <span className="text-[11px] font-black text-[#00B1FF] uppercase tracking-wider">
                                    Step {currentStepIndex + 1}/{steps.length}
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 pr-8">
                                {currentStep.title}
                            </h3>
                            <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                {currentStep.description}
                            </p>

                            {/* Pro Tip (if available) */}
                            {currentStep.tip && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4">
                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[12px] font-medium text-amber-700 dark:text-amber-400">
                                        {currentStep.tip}
                                    </p>
                                </div>
                            )}

                            {/* Progress bar */}
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', damping: 20 }}
                                    className="h-full bg-gradient-to-r from-[#00B1FF] to-[#00D4AA] rounded-full"
                                />
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleSkip}
                                    className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    Salta tour
                                </button>

                                <div className="flex items-center gap-2">
                                    {currentStepIndex > 0 && currentStepIndex < steps.length - 1 && (
                                        <button
                                            onClick={handlePrevious}
                                            className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#00B1FF] to-[#00B1FF] hover:from-[#00A0E8] hover:to-[#00A0E8] transition-all shadow-lg shadow-[#00B1FF]/25 flex items-center gap-1"
                                    >
                                        {currentStepIndex === steps.length - 1 ? (
                                            <>
                                                <PartyPopper className="w-4 h-4" />
                                                Fine
                                            </>
                                        ) : (
                                            <>
                                                Avanti
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

