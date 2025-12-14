import React from "react";
import { Link } from "react-router-dom";
import { Category } from "@/lib/data";
import { ChevronRight, CheckCircle2, Shield, Building2, Heart, Briefcase, GraduationCap, Scale, Sparkles } from "lucide-react";

interface ConcorsoCardProps {
    contest: Category;
    index?: number;
}

// =============================================================================
// CONCORSO CARD (Rich Aesthetics)
// =============================================================================
export function ConcorsoCard({ contest, index = 0 }: ConcorsoCardProps) {
    // -------------------------------------------------------------------------
    // DYNAMIC STYLING LOGIC (Restored)
    // -------------------------------------------------------------------------
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

    // Use real available_seats from database, fallback to generated for demo
    const postiDisponibili = contest.available_seats || null;

    return (
        <Link
            to={`/concorsi/${contest.slug}`}
            className="group relative bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col overflow-hidden"
            style={{
                width: 'calc((100vw - 32px) * 0.48)', // ~170px on 390 (Narrower as requested)
                height: '190px',
                borderRadius: '20px',
            }}
        >
            {/* 1. HERO AREA - 2:1 panoramic aspect ratio */}
            <div
                className="relative overflow-hidden flex items-center justify-center"
                style={{ aspectRatio: '2 / 1', width: '100%' }}
            >
                {/* Show uploaded banner image if available */}
                {contest.home_banner_url ? (
                    <img
                        src={contest.home_banner_url}
                        alt={contest.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <>
                        {/* Fallback: Gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

                        {/* Light reflection top-down */}
                        <div
                            className="absolute inset-0"
                            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
                        />

                        {/* Inner Glow behind icon */}
                        <div
                            className="absolute"
                            style={{
                                width: '80px', height: '80px',
                                background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
                                filter: 'blur(12px)',
                            }}
                        />

                        {/* Glassmorphic Icon Container */}
                        <div
                            className="relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.25)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            <Icon className="text-white w-7 h-7" strokeWidth={1.5} />
                        </div>
                    </>
                )}

                {/* Badge if new */}
                {contest.is_new && (
                    <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur text-[#00B1FF] text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm z-10">
                        NUOVO
                    </div>
                )}
            </div>

            {/* 2. TEXT AREA */}
            <div
                className="flex flex-col justify-between bg-white relative z-10"
                style={{ padding: '12px', flex: 1 }}
            >
                <div>
                    <h3
                        className="font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#00B1FF] transition-colors"
                        style={{ fontSize: '13px' }}
                    >
                        {contest.title}
                    </h3>
                    {contest.subtitle && (
                        <p
                            className="text-slate-500 line-clamp-1 mt-0.5"
                            style={{ fontSize: '10px' }}
                        >
                            {contest.subtitle}
                        </p>
                    )}
                </div>

                {/* Footer: Year & Seats - only show if we have data */}
                {(contest.year || postiDisponibili) && (
                    <div className="flex items-center justify-between">
                        {contest.year && (
                            <span
                                className="text-slate-400 font-semibold"
                                style={{ fontSize: '10px' }}
                            >
                                {contest.year}
                            </span>
                        )}

                        {/* Show seats badge only if available_seats is set */}
                        {postiDisponibili && (
                            <div className="flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                <span className="text-emerald-600 font-bold" style={{ fontSize: '9px' }}>
                                    {postiDisponibili} posti
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

// =============================================================================
// CAROUSEL SECTION
// =============================================================================
export default function ConcorsiSection({ title, contests }: { title: string; contests: Category[] }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -200 : 200;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!contests || contests.length === 0) return null;

    return (
        <div>
            {/* Header Row - Aligned with search bar (px-4 = 16px) */}
            <div
                className="flex justify-between items-center px-4"
                style={{
                    minHeight: '40px',
                    marginBottom: '12px'
                }}
            >
                <div className="flex items-center gap-2.5 h-full">
                    {/* Compact Icon */}
                    <div className="w-9 h-9 rounded-[12px] bg-[#E0F2FE] flex items-center justify-center">
                        <Sparkles className="w-4.5 h-4.5 text-[#00B1FF]" fill="#00B1FF" />
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-900 leading-none">
                        {title}
                    </h2>
                </div>

                {/* Navigation Buttons - Compact */}
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="w-9 h-9 rounded-full bg-white/80 border border-slate-200 hover:bg-white flex items-center justify-center transition-all"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-9 h-9 rounded-full bg-white/80 border border-slate-200 hover:bg-white flex items-center justify-center transition-all"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Carousel Container - Aligned with search bar */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 -my-2"
                style={{
                    height: '220px',
                    gap: '12px',
                    alignItems: 'flex-start'
                }}
            >
                {/* Left spacer to align with search bar px-4 */}
                <div className="w-4 flex-shrink-0" style={{ minWidth: '16px' }} />
                {contests.map((contest, idx) => (
                    <div key={idx} className="snap-start flex-shrink-0">
                        <ConcorsoCard contest={contest} index={idx} />
                    </div>
                ))}
                {/* Spacer for end padding */}
                <div className="w-4 flex-shrink-0" />
            </div>
        </div>
    );
}
