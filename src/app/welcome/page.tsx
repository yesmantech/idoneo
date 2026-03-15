/**
 * @file WelcomePage.tsx
 * @description Tier S Docsity-style welcome carousel landing page.
 *
 * Shows swipeable feature previews with generated 3D illustrations.
 * Features:
 * - Touch-swipeable carousel with CSS transitions
 * - Premium 3D illustrations per slide
 * - Dot indicators with animated active state
 * - Auto-advance every 4s (pauses on touch)
 * - Gradient background matching brand
 * - Fixed bottom CTA buttons
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hapticLight } from '@/lib/haptics';

// ─── Slide data ───
const SLIDES = [
    {
        headline: 'Quiz su misura\nper ogni concorso',
        subtitle: 'Scegli il bando e allenati con domande mirate',
        image: '/images/welcome-quiz.png',
    },
    {
        headline: 'Monitora i tuoi\nprogressi',
        subtitle: 'Statistiche dettagliate per migliorare ogni giorno',
        image: '/images/welcome-stats.png',
    },
    {
        headline: 'Sfida gli altri\ncandidati',
        subtitle: 'Classifiche settimanali e badge esclusivi',
        image: '/images/welcome-leaderboard.png',
    },
    {
        headline: 'Il tuo coach\nAI personale',
        subtitle: 'Chiedi qualsiasi cosa, ti guida verso il risultato',
        image: '/images/welcome-ai.png',
    },
];

export default function WelcomePage() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [show, setShow] = useState(false);
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        requestAnimationFrame(() => setShow(true));
    }, []);

    // Auto-advance
    const startAuto = useCallback(() => {
        if (autoRef.current) clearInterval(autoRef.current);
        autoRef.current = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 4000);
    }, []);

    useEffect(() => {
        startAuto();
        return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }, [startAuto]);

    const goTo = (idx: number) => {
        setCurrent(idx);
        startAuto();
    };

    // Touch handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        if (autoRef.current) clearInterval(autoRef.current);
    };
    const onTouchMove = (e: React.TouchEvent) => {
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };
    const onTouchEnd = () => {
        const delta = touchDeltaX.current;
        if (Math.abs(delta) > 50) {
            if (delta < 0 && current < SLIDES.length - 1) {
                hapticLight();
                goTo(current + 1);
            } else if (delta > 0 && current > 0) {
                hapticLight();
                goTo(current - 1);
            }
        }
        touchDeltaX.current = 0;
        startAuto();
    };

    return (
        <div
            className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col relative overflow-hidden"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            {/* ─── Ambient gradient background ─── */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute rounded-full blur-[120px] opacity-[0.07]"
                    style={{ width: 400, height: 400, top: '-5%', left: '-20%', background: 'linear-gradient(135deg, #00B1FF, #0066FF)' }}
                />
                <div
                    className="absolute rounded-full blur-[120px] opacity-[0.05]"
                    style={{ width: 350, height: 350, bottom: '10%', right: '-15%', background: 'linear-gradient(135deg, #0066FF, #00B1FF)' }}
                />
            </div>

            {/* ─── Logo ─── */}
            <div
                className={`flex justify-center pt-14 pb-2 relative z-10 transition-all duration-700 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
                <img src="/icon.svg" alt="Idoneo" className="w-11 h-11 rounded-[13px]" />
            </div>

            {/* ─── Carousel ─── */}
            <div
                className="flex-1 flex flex-col items-center justify-center relative z-10"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Slides */}
                <div className="w-full overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {SLIDES.map((slide, i) => (
                            <div
                                key={i}
                                className="w-full flex-shrink-0 flex flex-col items-center px-8"
                            >
                                {/* 3D Illustration */}
                                <div
                                    className={`mb-6 transition-all duration-600 ${current === i ? 'opacity-100 scale-100' : 'opacity-30 scale-[0.85]'}`}
                                    style={{ transition: 'opacity 0.5s ease, transform 0.5s ease' }}
                                >
                                    <img
                                        src={slide.image}
                                        alt=""
                                        className="w-[280px] h-[280px] object-contain drop-shadow-2xl"
                                        draggable={false}
                                    />
                                </div>

                                {/* Headline */}
                                <h2 className="text-[28px] font-extrabold tracking-tight leading-[1.15] text-center whitespace-pre-line mb-3">
                                    {slide.headline}
                                </h2>

                                {/* Subtitle */}
                                <p className="text-[14px] font-medium text-[var(--foreground)] opacity-40 text-center max-w-[260px]">
                                    {slide.subtitle}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center gap-2.5 mt-6">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { hapticLight(); goTo(i); }}
                            className="p-1"
                        >
                            <div
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: current === i ? 24 : 7,
                                    height: 7,
                                    backgroundColor: current === i ? '#00B1FF' : 'var(--foreground)',
                                    opacity: current === i ? 1 : 0.15,
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Bottom CTA area ─── */}
            <div
                className={`relative z-10 px-6 pb-4 pt-4 transition-all duration-700 delay-300 ease-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
            >
                {/* Primary CTA */}
                <button
                    onClick={() => { hapticLight(); navigate('/login'); }}
                    className="w-full h-[54px] rounded-2xl flex items-center justify-center active:scale-[0.97] transition-transform"
                    style={{
                        background: 'linear-gradient(135deg, #00B1FF, #0066FF)',
                        boxShadow: '0 8px 32px rgba(0,102,255,0.25)',
                    }}
                >
                    <span className="text-[16px] font-bold text-white tracking-tight">
                        Inizia Gratis
                    </span>
                </button>

                {/* Secondary */}
                <button
                    onClick={() => { hapticLight(); navigate('/login'); }}
                    className="w-full mt-3 py-3 text-center"
                >
                    <span className="text-[13px] font-medium text-[var(--foreground)] opacity-40">
                        Ho già un account? <span className="text-[#00B1FF] font-semibold opacity-100">Accedi</span>
                    </span>
                </button>
            </div>
        </div>
    );
}
