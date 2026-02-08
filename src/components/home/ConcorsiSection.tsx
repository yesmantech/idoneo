import React from "react";
import { Link } from "react-router-dom";
import { Category } from "@/lib/data";
import { ChevronRight, ChevronLeft, CheckCircle2, Shield, Building2, Heart, Briefcase, GraduationCap, Scale, Sparkles } from "lucide-react";

interface ConcorsoCardProps {
    contest: Category;
    index?: number;
}

// =============================================================================
// CONCORSO CARD (Responsive)
// =============================================================================
export function ConcorsoCard({ contest, index = 0 }: ConcorsoCardProps) {
    const getStyle = (title: string, idx: number) => {
        const lower = title.toLowerCase();

        if (lower.includes('carabinieri')) {
            return { Icon: Shield, gradient: "from-[#4F8CFF] via-[#3B7BF7] to-[#2563EB]", glow: "rgba(59, 130, 246, 0.4)" };
        }
        if (lower.includes('polizia')) {
            return { Icon: Shield, gradient: "from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]", glow: "rgba(14, 165, 233, 0.4)" };
        }
        if (lower.includes('finanza') || lower.includes('guardia')) {
            return { Icon: Shield, gradient: "from-[#FCD34D] via-[#F59E0B] to-[#D97706]", glow: "rgba(245, 158, 11, 0.4)" };
        }
        if (lower.includes('inps') || lower.includes('entrate') || lower.includes('agenzia')) {
            return { Icon: Building2, gradient: "from-[#94A3B8] via-[#64748B] to-[#475569]", glow: "rgba(100, 116, 139, 0.35)" };
        }
        if (lower.includes('sanità') || lower.includes('infermier')) {
            return { Icon: Heart, gradient: "from-[#FDA4AF] via-[#F43F5E] to-[#E11D48]", glow: "rgba(244, 63, 94, 0.4)" };
        }
        if (lower.includes('scuola') || lower.includes('docent')) {
            return { Icon: GraduationCap, gradient: "from-[#C4B5FD] via-[#A78BFA] to-[#7C3AED]", glow: "rgba(167, 139, 250, 0.4)" };
        }
        if (lower.includes('giustizia')) {
            return { Icon: Scale, gradient: "from-[#A5B4FC] via-[#818CF8] to-[#6366F1]", glow: "rgba(129, 140, 248, 0.4)" };
        }

        const defaults = [
            { gradient: "from-[#67E8F9] via-[#22D3EE] to-[#06B6D4]", glow: "rgba(34, 211, 238, 0.4)" },
            { gradient: "from-[#86EFAC] via-[#4ADE80] to-[#22C55E]", glow: "rgba(74, 222, 128, 0.4)" },
            { gradient: "from-[#FDBA74] via-[#FB923C] to-[#F97316]", glow: "rgba(251, 146, 60, 0.4)" },
        ];
        return { Icon: Briefcase, ...defaults[idx % defaults.length] };
    };

    const { Icon, gradient, glow } = getStyle(contest.title, index);
    const postiDisponibili = contest.available_seats || null;

    return (
        <Link
            to={`/concorsi/${contest.slug}`}
            className="group relative bg-[var(--card)] shadow-soft transition-all duration-500 lg:duration-700 hover:-translate-y-1.5 flex flex-col overflow-hidden rounded-[28px] lg:rounded-[32px] border border-[var(--card-border)] h-full min-h-[220px]"
            style={{
                width: 'clamp(180px, calc((100vw - 32px) * 0.48), 300px)',
            }}
        >
            {/* 1. HERO AREA - 2:1 panoramic aspect ratio */}
            <div
                className="relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-700 shrink-0"
                style={{ aspectRatio: '2 / 1', width: '100%' }}
            >
                {contest.home_banner_url ? (
                    <img
                        src={contest.home_banner_url}
                        alt={contest.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <>
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
                    </>
                )}

                {contest.is_new && (
                    <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md text-[#00B1FF] text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm z-10 border border-[#00B1FF]/10 uppercase tracking-tight">
                        Nuovo
                    </div>
                )}
            </div>

            {/* 2. TEXT AREA */}
            <div className="flex flex-col justify-between bg-[var(--card)] relative z-10 p-4 lg:p-5 flex-1">
                <div className="space-y-1.5">
                    <h3 className="font-extrabold text-[var(--foreground)] leading-[1.3] line-clamp-2 group-hover:text-[#00B1FF] transition-colors text-[14px] lg:text-[16px] tracking-tight">
                        {contest.title}
                    </h3>
                    {contest.subtitle && (
                        <p className="text-[var(--foreground)] opacity-60 line-clamp-1 text-[11px] lg:text-[13px] font-medium group-hover:opacity-100 transition-opacity">
                            {contest.subtitle}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-4 md:mt-auto pt-2">
                    {contest.year ? (
                        <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                            <span className="text-[var(--foreground)] opacity-50 font-bold text-[10px] lg:text-[11px] uppercase tracking-wider">
                                {contest.year}
                            </span>
                        </div>
                    ) : <div />}

                    {postiDisponibili && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-[10px] border border-emerald-100 shadow-sm shadow-emerald-900/5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-700 font-black text-[10px] lg:text-[11px]">
                                {postiDisponibili} posti
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

// =============================================================================
// CAROUSEL SECTION (Desktop: Grid / Mobile: Carousel)
// =============================================================================
export default function ConcorsiSection({ title, contests }: { title: string; contests: Category[] }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!contests || contests.length === 0) return null;

    return (
        <div className="max-w-7xl lg:mx-auto" data-onboarding="concorsi">
            {/* Header Row */}
            <div className="flex justify-between items-center px-4 lg:px-8 mb-4 lg:mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-[12px] bg-[#E0F2FE] dark:bg-cyan-900/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-[#00B1FF]" fill="#00B1FF" />
                    </div>
                    <h2 className="text-[17px] lg:text-xl font-bold text-[var(--foreground)] leading-none">
                        {title}
                    </h2>
                </div>

                {/* Navigation Buttons */}
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

            {/* Carousel Container - uses padding for alignment instead of spacer divs */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x scroll-pl-4 lg:scroll-pl-8 scrollbar-hide py-2 -my-2 pl-4 lg:pl-8 gap-3 lg:gap-4 items-stretch"
            >
                {contests.map((contest, idx) => (
                    <div key={idx} className="snap-start flex-shrink-0">
                        <ConcorsoCard contest={contest} index={idx} />
                    </div>
                ))}

                {/* Right spacer for scroll end padding */}
                <div className="min-w-[4px] lg:min-w-[16px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}
