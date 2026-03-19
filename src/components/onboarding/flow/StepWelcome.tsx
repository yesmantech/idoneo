/**
 * @file StepWelcome.tsx  
 * @description Phase 1 — Welcome screen matching login page design language.
 * Uses floating decorative icons, brand gradient CTA, and Tier S aesthetics.
 */

import React from 'react';
import { Sparkles, Star, Cloud, Zap, Heart, Shield, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StepWelcomeProps {
    onNext: () => void;
    onSkip: () => void;
}

// Floating icons — same pattern as LoginPage
const decorativeIcons = [
    { Icon: Star, color: 'text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20', top: '12%', left: '8%', size: 'w-12 h-12', delay: '0s' },
    { Icon: Cloud, color: 'text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/20', top: '10%', right: '12%', size: 'w-14 h-14', delay: '0.4s' },
    { Icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20', bottom: '25%', left: '6%', size: 'w-11 h-11', delay: '0.8s' },
    { Icon: Heart, color: 'text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/20', bottom: '20%', right: '8%', size: 'w-12 h-12', delay: '1.2s' },
    { Icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/20', top: '42%', left: '4%', size: 'w-10 h-10', delay: '1.6s' },
    { Icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20', top: '38%', right: '5%', size: 'w-13 h-13', delay: '2s' },
];

export default function StepWelcome({ onNext, onSkip }: StepWelcomeProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Floating Decorative Icons — matches login page */}
            <div className="absolute inset-0 pointer-events-none">
                {decorativeIcons.map((item, idx) => (
                    <div
                        key={idx}
                        className={`absolute rounded-full flex items-center justify-center ${item.bg} ${item.size} animate-in fade-in zoom-in duration-1000 opacity-60 dark:opacity-40`}
                        style={{
                            top: item.top,
                            left: item.left,
                            right: item.right,
                            bottom: item.bottom,
                            animationDelay: item.delay,
                            animationFillMode: 'both',
                        }}
                    >
                        <item.Icon className={`w-1/2 h-1/2 ${item.color}`} strokeWidth={2.5} />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="w-full max-w-md mx-auto px-6 flex flex-col items-center justify-center space-y-8 relative z-10">
                {/* Icon */}
                <div className="relative animate-in zoom-in-75 duration-700">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#00B1FF] to-[#0066FF] flex items-center justify-center shadow-xl shadow-[#00B1FF]/25">
                        <Sparkles className="w-12 h-12 text-white" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Copy — matching login h1/h2 styling */}
                <div className="space-y-3 text-center w-full">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1] animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                        Rendiamo Idoneo tuo.
                    </h1>
                    <h2 className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-50 leading-relaxed max-w-xs mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                        Rispondi a 5 domande veloci e creeremo un percorso su misura per te.
                    </h2>
                </div>

                {/* CTAs — using shared Button component for consistency */}
                <div className="w-full space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={onNext}
                    >
                        Iniziamo →
                    </Button>
                    <button
                        onClick={onSkip}
                        className="w-full py-3 text-sm font-medium text-[var(--foreground)] opacity-40 hover:opacity-60 transition-opacity"
                    >
                        Salta per ora
                    </button>
                </div>
            </div>

            {/* Safe area bottom */}
            <div className="h-[var(--safe-area-bottom)]" />
        </div>
    );
}
