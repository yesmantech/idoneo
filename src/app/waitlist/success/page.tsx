
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CloudMascot } from '@/components/ui/CloudMascot';
import { Gift } from 'lucide-react';
import ReferralModal from '@/components/referral/ReferralModal';

export default function WaitlistSuccessPage() {
    const [showReferralModal, setShowReferralModal] = useState(false);

    useEffect(() => {
        // Confetti celebration on mount
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Scatter from top corners
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: -0.1 }, // Top Left
                colors: ['#22C55E', '#00B1FF', '#FBBF24', '#F472B6', '#1E293B']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: -0.1 }, // Top Right
                colors: ['#22C55E', '#00B1FF', '#FBBF24', '#F472B6', '#1E293B']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't trigger confetti if clicking on interactive elements
        if ((e.target as HTMLElement).closest('button')) return;

        // Calculate click position relative to viewport (0-1 range)
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        confetti({
            particleCount: 40,
            spread: 70,
            origin: { x, y },
            colors: ['#22C55E', '#00B1FF', '#FBBF24', '#F472B6', '#1E293B'],
            zIndex: 50,
            disableForReducedMotion: true
        });
    };

    return (
        <div
            onClick={handleScreenClick}
            className="min-h-screen bg-white flex flex-col items-center justify-between p-6 text-center relative overflow-hidden font-sans"
        >

            {/* Top Text Content */}
            <div className="w-full max-w-sm mx-auto z-10 space-y-4 pt-10 flex-shrink-0">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight animate-in slide-in-from-bottom-5 fade-in duration-700">
                    Grazie! Sei nella<br /> nostra lista d'attesa.
                </h1>

                <h2 className="text-[17px] md:text-lg text-[#6B6B6B] font-medium leading-relaxed animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-200">
                    Ti avviseremo appena saremo online. Vuoi saltare la coda? Invita i tuoi amici e ottieni accesso prioritario.
                </h2>
            </div>

            {/* Main Visual: Large Cloud Mascot */}
            <div className="flex-1 flex items-center justify-center w-full z-10 animate-in zoom-in fade-in duration-1000 delay-300 min-h-[200px]">
                <div className="transform scale-[1.3] md:scale-[1.6] drop-shadow-2xl">
                    <CloudMascot />
                </div>
            </div>

            {/* Bottom Section: CTA */}
            <div className="w-full max-w-sm mx-auto z-10 space-y-3 pb-8 flex-shrink-0 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500">
                <button
                    onClick={() => setShowReferralModal(true)}
                    className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center gap-2"
                >
                    <Gift className="w-5 h-5" />
                    Invita amici
                </button>

                <p className="text-xs text-slate-400 font-medium">
                    Più amici inviti, più in alto vai in lista.
                </p>
            </div>

            {/* Background elements (optional subtle touches) */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />

            {/* Referral Modal */}
            <ReferralModal
                isOpen={showReferralModal}
                onClose={() => setShowReferralModal(false)}
            />
        </div>
    );
}
