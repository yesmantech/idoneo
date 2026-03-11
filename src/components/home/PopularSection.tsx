import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, ChevronLeft, Users, Shield, Building2, Heart, GraduationCap, Scale, Briefcase } from 'lucide-react';
import { PopularQuiz } from '@/lib/homeSectionsService';

interface PopularSectionProps {
    quizzes: PopularQuiz[];
}

export default function PopularSection({ quizzes }: PopularSectionProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -280 : 280;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!quizzes || quizzes.length === 0) return null;

    return (
        <div className="max-w-7xl lg:mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center px-4 lg:px-8 mb-4 lg:mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-[12px] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-[17px] lg:text-xl font-bold text-[var(--foreground)] leading-none">
                            I più popolari
                        </h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Scelti dalla community</p>
                    </div>
                </div>

                <div className="flex gap-2 lg:hidden">
                    <button
                        onClick={() => scroll('left')}
                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[var(--card)] border border-[var(--card-border)] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--foreground)] opacity-60" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[var(--card)] border border-[var(--card-border)] hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm"
                    >
                        <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--foreground)] opacity-60" />
                    </button>
                </div>
            </div>

            {/* Carousel (mobile) / Grid (desktop) */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x scroll-pl-4 scrollbar-hide py-6 -my-6 pl-4 gap-3 items-stretch lg:grid lg:grid-cols-3 xl:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-8 lg:py-0 lg:my-0"
            >
                {quizzes.map((quiz, idx) => (
                    <div key={quiz.quizId} className="snap-start flex-shrink-0 lg:flex-shrink lg:w-full [&>a]:lg:!w-full">
                        <PopularCard quiz={quiz} rank={idx + 1} />
                    </div>
                ))}

                {/* Right spacer — mobile only */}
                <div className="min-w-[4px] flex-shrink-0 lg:hidden" aria-hidden="true" />
            </div>
        </div>
    );
}

function PopularCard({ quiz, rank }: { key?: string; quiz: PopularQuiz; rank: number }) {
    const getStyle = (title: string, idx: number) => {
        const lower = title.toLowerCase();

        if (lower.includes('carabinieri')) {
            return { Icon: Shield, gradient: "from-[#4F8CFF] via-[#3B7BF7] to-[#2563EB]" };
        }
        if (lower.includes('polizia')) {
            return { Icon: Shield, gradient: "from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]" };
        }
        if (lower.includes('finanza') || lower.includes('guardia')) {
            return { Icon: Shield, gradient: "from-[#FCD34D] via-[#F59E0B] to-[#D97706]" };
        }
        if (lower.includes('inps') || lower.includes('entrate') || lower.includes('agenzia')) {
            return { Icon: Building2, gradient: "from-[#94A3B8] via-[#64748B] to-[#475569]" };
        }
        if (lower.includes('sanità') || lower.includes('infermier')) {
            return { Icon: Heart, gradient: "from-[#FDA4AF] via-[#F43F5E] to-[#E11D48]" };
        }
        if (lower.includes('scuola') || lower.includes('docent')) {
            return { Icon: GraduationCap, gradient: "from-[#C4B5FD] via-[#A78BFA] to-[#7C3AED]" };
        }
        if (lower.includes('giustizia')) {
            return { Icon: Scale, gradient: "from-[#A5B4FC] via-[#818CF8] to-[#6366F1]" };
        }

        const defaults = [
            { gradient: "from-[#67E8F9] via-[#22D3EE] to-[#06B6D4]" },
            { gradient: "from-[#86EFAC] via-[#4ADE80] to-[#22C55E]" },
            { gradient: "from-[#FDBA74] via-[#FB923C] to-[#F97316]" },
        ];
        return { Icon: Briefcase, ...defaults[idx % defaults.length] };
    };

    const { Icon, gradient } = getStyle(quiz.categoryTitle, rank);

    return (
        <Link
            to={`/concorsi/${quiz.categorySlug}/${quiz.quizSlug}`}
            className="group relative bg-[var(--card)] shadow-soft transition-all duration-500 lg:duration-700 hover:-translate-y-1.5 flex flex-col overflow-hidden rounded-[28px] lg:rounded-[32px] border border-[var(--card-border)] h-full min-h-[220px] lg:w-full"
            style={{
                width: 'clamp(180px, calc((100vw - 32px) * 0.48), 300px)',
            } as React.CSSProperties}
        >
            {/* 1. HERO AREA - 2:1 panoramic aspect ratio */}
            <div
                className="relative overflow-hidden flex items-center justify-center shrink-0"
                style={{ aspectRatio: '2 / 1', width: '100%' }}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 60%)' }}
                />
                <div
                    className="relative z-10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <Icon className="text-white w-8 h-8" strokeWidth={1.5} />
                </div>

                {/* Ranking Badge (Top Right to mimic "Nuovo") */}
                <div className="absolute top-3.5 left-3.5 z-10 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200/50 flex items-center justify-center">
                    <span className="text-[12px] lg:text-[14px] font-black text-amber-500">{rank}</span>
                </div>
            </div>

            {/* 2. TEXT AREA */}
            <div className="flex flex-col justify-between bg-[var(--card)] relative z-10 p-4 lg:p-5 flex-1">
                <div className="space-y-1.5">
                    <h3 className="font-extrabold text-[var(--foreground)] leading-[1.3] line-clamp-2 group-hover:text-[#00B1FF] transition-colors text-[14px] lg:text-[16px] tracking-tight">
                        {quiz.quizTitle}
                    </h3>
                    <p className="text-[var(--foreground)] opacity-60 line-clamp-1 text-[11px] lg:text-[13px] font-medium group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                        {quiz.categoryTitle}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4 md:mt-auto pt-2">
                    <div /> {/* Spacer for alignments */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 rounded-[10px] border border-slate-100 dark:border-slate-600 shadow-sm shadow-slate-900/5">
                        <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300 font-bold text-[10px] lg:text-[11px]">
                            {quiz.totalAttempts.toLocaleString()} tentativi
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
