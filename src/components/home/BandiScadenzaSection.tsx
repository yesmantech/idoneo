import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ChevronRight, ChevronLeft, Flame } from 'lucide-react';
import { Bando } from '@/lib/bandiService';

// ============================================
// BANDI IN SCADENZA SECTION
// Shows bandi with upcoming deadlines
// ============================================

interface BandiScadenzaSectionProps {
    bandi: Bando[];
}

export default function BandiScadenzaSection({ bandi }: BandiScadenzaSectionProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    if (!bandi || bandi.length === 0) return null;

    return (
        <div className="max-w-7xl lg:mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center px-4 lg:px-8 mb-4 lg:mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-[12px] bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Flame className="w-4 h-4 lg:w-5 lg:h-5 text-rose-600" fill="currentColor" />
                    </div>
                    <div>
                        <h2 className="text-[17px] lg:text-xl font-bold text-[var(--foreground)] leading-none">
                            Bandi in scadenza
                        </h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Non perdere l'occasione!</p>
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
                {bandi.map((bando) => (
                    <BandoScadenzaCard key={bando.id} bando={bando} />
                ))}

                {/* Right spacer for scroll end padding */}
                <div className="min-w-[4px] lg:min-w-[16px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}

function BandoScadenzaCard({ bando }: { key?: string; bando: Bando }) {
    const daysRemaining = bando.days_remaining || 0;
    const isUrgent = daysRemaining <= 3;
    const isWarning = daysRemaining <= 7 && daysRemaining > 3;

    const getUrgencyStyle = () => {
        if (isUrgent) return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-400', glow: 'shadow-rose-500/30' };
        if (isWarning) return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-400', glow: 'shadow-amber-500/30' };
        return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', glow: '' };
    };

    const style = getUrgencyStyle();

    return (
        <Link
            to={`/bandi/${bando.slug}`}
            className="snap-start flex-shrink-0 group"
        >
            <div
                className={`bg-[var(--card)] rounded-[24px] border ${isUrgent ? 'border-rose-200 dark:border-rose-800' : 'border-[var(--card-border)]'} shadow-soft overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative`}
                style={{ width: '200px' }}
            >
                {/* Urgency indicator */}
                {isUrgent && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
                )}

                <div className="p-4">
                    {/* Days Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.bg} ${style.text} ${style.glow} shadow-lg mb-3`}>
                        {isUrgent ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span className="text-[11px] font-black">
                            {daysRemaining === 0 ? 'OGGI!' : daysRemaining === 1 ? 'DOMANI!' : `${daysRemaining} giorni`}
                        </span>
                    </div>

                    {/* Category */}
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1 truncate">
                        {bando.category?.name || 'Concorso'}
                    </p>

                    {/* Title */}
                    <h3 className="text-[14px] font-black text-[var(--foreground)] leading-tight line-clamp-2 mb-3 group-hover:text-brand-blue transition-colors">
                        {bando.title}
                    </h3>

                    {/* Seats */}
                    {bando.seats_total && (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <span className="text-[11px] font-bold">{bando.seats_total} posti</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
