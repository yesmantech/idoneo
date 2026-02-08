import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, ChevronLeft, Users, TrendingUp } from 'lucide-react';
import { PopularRole } from '@/lib/homeSectionsService';

// ============================================
// POPULAR SECTION
// Shows most attempted roles
// ============================================

interface PopularSectionProps {
    roles: PopularRole[];
}

export default function PopularSection({ roles }: PopularSectionProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -280 : 280;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!roles || roles.length === 0) return null;

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
                {roles.map((role, idx) => (
                    <PopularCard key={role.roleId} role={role} rank={idx + 1} />
                ))}

                {/* Right spacer for scroll end padding */}
                <div className="min-w-[4px] lg:min-w-[16px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}

function PopularCard({ role, rank }: { key?: string; role: PopularRole; rank: number }) {
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
            to={`/concorsi/${role.categorySlug}/${role.roleSlug}`}
            className="snap-start flex-shrink-0 group"
        >
            <div
                className="bg-[var(--card)] rounded-[24px] border border-[var(--card-border)] shadow-soft overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative"
                style={{ width: '180px' }}
            >
                {/* Rank Badge */}
                <div className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full ${rankStyle.bg} ${rankStyle.shadow} shadow-lg flex items-center justify-center`}>
                    <span className={`text-[14px] font-black ${rankStyle.text}`}>{rank}</span>
                </div>

                {/* Top Gradient */}
                <div className="h-16 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <TrendingUp className="absolute bottom-2 right-2 w-8 h-8 text-white/30" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <div className="p-3">
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1 truncate">
                        {role.categoryTitle}
                    </p>
                    <h3 className="text-[13px] font-black text-[var(--foreground)] leading-tight line-clamp-2 mb-2 group-hover:text-brand-blue transition-colors">
                        {role.roleTitle}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{role.totalAttempts.toLocaleString()} tentativi</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
