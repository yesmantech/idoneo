import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, ChevronLeft, Users, TrendingUp } from 'lucide-react';
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
                        <Trophy className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600" fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="text-[17px] lg:text-xl font-bold text-[var(--foreground)] leading-none">
                            I più popolari
                        </h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Scelti dalla community</p>
                    </div>
                </div>

                <div className="flex gap-2">
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

            {/* Carousel */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x scroll-pl-4 lg:scroll-pl-8 scrollbar-hide py-2 -my-2 pl-4 lg:pl-8 gap-3 lg:gap-4"
            >
                {quizzes.map((quiz, idx) => (
                    <PopularCard key={quiz.quizId} quiz={quiz} rank={idx + 1} />
                ))}

                {/* Right spacer for scroll end padding */}
                <div className="min-w-[4px] lg:min-w-[16px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}

function PopularCard({ quiz, rank }: { key?: string; quiz: PopularQuiz; rank: number }) {
    const getRankStyle = () => {
        switch (rank) {
            case 1: return { bg: 'bg-gradient-to-br from-amber-400 to-yellow-500', text: 'text-amber-900', shadow: 'shadow-amber-400/40' };
            case 2: return { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-slate-700', shadow: 'shadow-slate-400/40' };
            case 3: return { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', text: 'text-amber-100', shadow: 'shadow-orange-600/40' };
            default: return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', shadow: '' };
        }
    };

    const rankStyle = getRankStyle();

    return (
        <Link
            to={`/concorsi/${quiz.categorySlug}/${quiz.quizSlug}`}
            className="snap-start flex-shrink-0 group"
        >
            <div
                className="bg-[var(--card)] rounded-[28px] lg:rounded-[32px] border border-[var(--card-border)] shadow-soft overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg relative flex flex-col"
                style={{
                    width: 'clamp(180px, calc((100vw - 32px) * 0.48), 300px)',
                    height: 'clamp(210px, 24vh, 280px)',
                }}
            >
                {/* Rank Badge */}
                <div className={`absolute top-3.5 left-3.5 z-10 w-9 h-9 rounded-full ${rankStyle.bg} ${rankStyle.shadow} shadow-lg flex items-center justify-center`}>
                    <span className={`text-[16px] font-black ${rankStyle.text}`}>{rank}</span>
                </div>

                {/* Top Gradient - 2:1 aspect ratio like ConcorsoCard */}
                <div
                    className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shrink-0"
                    style={{ aspectRatio: '2 / 1', width: '100%' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, transparent 60%)' }}
                    />
                    <TrendingUp className="absolute bottom-3 right-3 w-10 h-10 text-white/30" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between p-4 lg:p-5 flex-1">
                    <div className="space-y-1.5">
                        <p className="text-[10px] lg:text-[11px] font-bold text-brand-blue uppercase tracking-wider truncate">
                            {quiz.categoryTitle}
                        </p>
                        <h3 className="text-[14px] lg:text-[16px] font-extrabold text-[var(--foreground)] leading-[1.3] line-clamp-2 group-hover:text-brand-blue transition-colors tracking-tight">
                            {quiz.quizTitle}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-4">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">{quiz.totalAttempts.toLocaleString()} tentativi</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
