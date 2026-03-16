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
        headline: 'Il tuo coach\nAI personale',
        subtitle: 'Chiedi qualsiasi cosa, ti guida verso il risultato',
        image: '/images/welcome-ai.png',
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
            className="min-h-[100dvh] font-sans flex flex-col relative overflow-hidden"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', background: 'var(--background)', color: 'var(--foreground)' }}
        >
            {/* Inject blob animation */}
            <style>{`@keyframes blobFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(15px,-10px) scale(1.05)}66%{transform:translate(-10px,8px) scale(.97)}}`}</style>

            {/* ─── Gradient background (same as login) ─── */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute rounded-full"
                    style={{ width: 350, height: 350, top: '-8%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,120,255,0.10) 0%, transparent 60%)', animation: 'blobFloat 12s ease-in-out infinite' }}
                />
                <div
                    className="absolute rounded-full"
                    style={{ width: 300, height: 300, bottom: '-10%', left: '-10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,50,200,0.07) 0%, transparent 55%)', animation: 'blobFloat 16s ease-in-out infinite 4s' }}
                />
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
                                    opacity: current === i ? 1 : 0.2,
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
                    onClick={() => {
                        hapticLight();
                        if (current < SLIDES.length - 1) {
                            goTo(current + 1);
                        } else {
                            navigate('/profile/setup');
                        }
                    }}
                    className="w-full h-[54px] rounded-2xl flex items-center justify-center active:scale-[0.97] transition-transform"
                    style={{
                        background: '#0095FF',
                        boxShadow: '0 4px 16px rgba(0,60,200,0.3)',
                    }}
                >
                    <span className="text-[16px] font-bold text-white tracking-tight">
                        {current < SLIDES.length - 1 ? 'Continua' : 'Inizia'}
                    </span>
                </button>

                {/* Secondary */}
                <button
                    onClick={() => { hapticLight(); navigate('/profile/setup'); }}
                    className="w-full mt-3 py-3 text-center"
                >
                    <span className="text-[13px] font-medium text-[var(--foreground)] opacity-40">
                        Salta la preview
                    </span>
                </button>
            </div>
        </div>
    );
}
