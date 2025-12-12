
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CloudMascot } from '@/components/ui/CloudMascot';

export default function WaitlistSuccessPage() {
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
            className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans cursor-pointer active:scale-[0.99] transition-transform duration-100"
        >

            {/* Top Text Content */}
            <div className="w-full max-w-sm mx-auto z-10 space-y-4 pt-10">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight animate-in slide-in-from-bottom-5 fade-in duration-700">
                    Grazie! Sei nella<br /> nostra lista d’attesa.
                </h1>

                <h2 className="text-[17px] md:text-lg text-[#6B6B6B] font-medium leading-relaxed animate-in slide-in-from-bottom-5 fade-in duration-1000 delay-200">
                    Ti avviseremo non appena il progetto sarà online, così potrai accedere subito alla piattaforma e iniziare a preparare il tuo prossimo concorso.
                </h2>
            </div>

            {/* Main Visual: Large Cloud Mascot */}
            <div className="flex-1 flex items-center justify-center w-full z-10 pb-[20vh] animate-in zoom-in fade-in duration-1000 delay-300">
                <div className="transform scale-[1.5] md:scale-[1.8] drop-shadow-2xl">
                    <CloudMascot />
                </div>
            </div>

            {/* Background elements (optional subtle touches) */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />

        </div>
    );
}
