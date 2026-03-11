/**
 * @file StepWelcome.tsx  
 * @description Phase 1 — Welcome screen with mascot and value proposition.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface StepWelcomeProps {
    onNext: () => void;
    onSkip: () => void;
}

export default function StepWelcome({ onNext, onSkip }: StepWelcomeProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
            {/* Mascot / Visual */}
            <div className="relative mb-8 animate-in zoom-in-75 duration-700">
                <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#00B1FF] to-[#00D4FF] flex items-center justify-center shadow-xl shadow-[#00B1FF]/20">
                    <Sparkles className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
                {/* Floating dots */}
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="absolute -bottom-2 -left-4 w-4 h-4 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 -right-6 w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.8s' }} />
            </div>

            {/* Copy */}
            <h1 className="text-3xl font-bold tracking-tight mb-3 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                Rendiamo Idoneo tuo.
            </h1>
            <p className="text-[16px] text-[var(--foreground)] opacity-50 leading-relaxed max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                Rispondi a 5 domande veloci e creeremo un percorso su misura per te.
            </p>

            {/* Spacer */}
            <div className="flex-1 min-h-8" />

            {/* CTAs */}
            <div className="w-full max-w-sm space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                <button
                    onClick={onNext}
                    className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center"
                >
                    Iniziamo →
                </button>
                <button
                    onClick={onSkip}
                    className="w-full py-3 text-sm font-medium text-[var(--foreground)] opacity-40 hover:opacity-60 transition-opacity"
                >
                    Salta per ora
                </button>
            </div>

            {/* Safe area bottom */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
    );
}
