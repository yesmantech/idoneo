import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, ChevronLeft, History } from 'lucide-react';
import { RecentlyUsedItem } from '@/lib/homeSectionsService';

// ============================================
// RECENTLY USED SECTION
// Shows last practiced roles for quick access
// ============================================

interface RecentlyUsedSectionProps {
    items: RecentlyUsedItem[];
}

export default function RecentlyUsedSection({ items }: RecentlyUsedSectionProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -280 : 280;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="max-w-7xl lg:mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center px-4 lg:px-8 mb-4 lg:mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-[12px] bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <History className="w-4 h-4 lg:w-5 lg:h-5 text-violet-600" />
                    </div>
                    <h2 className="text-[17px] lg:text-xl font-bold text-[var(--foreground)] leading-none">
                        Usate di recente
                    </h2>
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

            {/* Carousel - uses padding for alignment instead of spacer divs */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x scroll-pl-4 lg:scroll-pl-8 scrollbar-hide py-2 -my-2 pl-4 lg:pl-8 gap-3 lg:gap-4"
            >
                {items.map((item, idx) => (
                    <div key={item.roleId} className="snap-start flex-shrink-0">
                        <RecentlyUsedCard item={item} index={idx} />
                    </div>
                ))}

                {/* Right spacer for scroll end padding */}
                <div className="min-w-[4px] lg:min-w-[16px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}

function RecentlyUsedCard({ item, index }: { key?: string; item: RecentlyUsedItem; index: number }) {
    const getStyle = (title: string, idx: number) => {
        const lower = title.toLowerCase();

        if (lower.includes('carabinieri')) {
            return { gradient: "from-[#4F8CFF] via-[#3B7BF7] to-[#2563EB]", glow: "rgba(59, 130, 246, 0.4)" };
        }
        if (lower.includes('polizia')) {
            return { gradient: "from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]", glow: "rgba(14, 165, 233, 0.4)" };
        }
        if (lower.includes('finanza') || lower.includes('guardia')) {
            return { gradient: "from-[#FCD34D] via-[#F59E0B] to-[#D97706]", glow: "rgba(245, 158, 11, 0.4)" };
        }

        const defaults = [
            { gradient: "from-[#67E8F9] via-[#22D3EE] to-[#06B6D4]", glow: "rgba(34, 211, 238, 0.4)" },
            { gradient: "from-[#86EFAC] via-[#4ADE80] to-[#22C55E]", glow: "rgba(74, 222, 128, 0.4)" },
            { gradient: "from-[#FDBA74] via-[#FB923C] to-[#F97316]", glow: "rgba(251, 146, 60, 0.4)" },
            { gradient: "from-[#C4B5FD] via-[#A78BFA] to-[#7C3AED]", glow: "rgba(167, 139, 250, 0.4)" },
        ];
        return defaults[idx % defaults.length];
    };

    const { gradient } = getStyle(item.categoryTitle, index);

    // Format time ago
    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Ora';
        if (hours < 24) return `${hours}h fa`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}g fa`;
        return `${Math.floor(days / 7)}s fa`;
    };

    return (
        <Link
            to={`/concorsi/${item.categorySlug}/${item.roleSlug}`}
            className="group relative bg-[var(--card)] shadow-soft transition-all duration-500 hover:-translate-y-1.5 flex flex-col overflow-hidden rounded-[28px] border border-[var(--card-border)]"
            style={{
                width: 'clamp(180px, calc((100vw - 32px) * 0.48), 300px)',
                height: 'clamp(210px, 24vh, 280px)',
            }}
        >
            {/* HERO AREA - 2:1 panoramic aspect ratio */}
            <div
                className="relative overflow-hidden flex items-center justify-center"
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
                    <History className="text-white w-8 h-8" strokeWidth={1.5} />
                </div>

                {/* Attempt count badge */}
                <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm z-10 border border-slate-200/50">
                    {item.attemptCount}x
                </div>
            </div>

            {/* TEXT AREA */}
            <div className="flex flex-col justify-between bg-[var(--card)] relative z-10 p-4 flex-1">
                <div className="space-y-1.5">
                    <h3 className="font-extrabold text-[var(--foreground)] leading-[1.3] line-clamp-2 group-hover:text-brand-blue transition-colors text-[14px] tracking-tight">
                        {item.roleTitle}
                    </h3>
                    <p className="text-[var(--foreground)] opacity-60 line-clamp-1 text-[11px] font-medium">
                        {item.categoryTitle}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{timeAgo(item.lastAttemptAt)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

