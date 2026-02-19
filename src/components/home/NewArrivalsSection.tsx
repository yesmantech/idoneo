import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, ChevronLeft, Plus, Calendar } from 'lucide-react';
import { NewArrivalQuiz } from '@/lib/homeSectionsService';

// ============================================
// NEW ARRIVALS SECTION
// Shows recently added quizzes
// ============================================

interface NewArrivalsSectionProps {
    quizzes: NewArrivalQuiz[];
}

export default function NewArrivalsSection({ quizzes }: NewArrivalsSectionProps) {
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
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-[12px] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" strokeWidth={3} />
                    </div>
                    <h2 className="text-[17px] lg:text-xl font-bold text-[var(--foreground)] leading-none">
                        Nuovi arrivi
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

            {/* Carousel */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x scroll-pl-4 lg:scroll-pl-8 scrollbar-hide py-2 -my-2 pl-4 lg:pl-8 gap-3 lg:gap-4"
            >
                {quizzes.map((quiz, idx) => (
                    <NewArrivalCard key={quiz.id} quiz={quiz} index={idx} />
                ))}

                {/* Right spacer for scroll end padding */}
                <div className="min-w-[4px] lg:min-w-[16px] flex-shrink-0" aria-hidden="true" />
            </div>
        </div>
    );
}

function NewArrivalCard({ quiz, index }: { key?: string; quiz: NewArrivalQuiz; index: number }) {
    const gradients = [
        'from-emerald-400 to-teal-500',
        'from-cyan-400 to-blue-500',
        'from-violet-400 to-purple-500',
        'from-pink-400 to-rose-500',
        'from-amber-400 to-orange-500'
    ];
    const gradient = gradients[index % gradients.length];

    // Days since added
    const daysAgo = Math.floor((Date.now() - new Date(quiz.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const isNew = daysAgo <= 7;

    return (
        <Link
            to={`/concorsi/${quiz.categorySlug}/${quiz.slug}`}
            className="snap-start flex-shrink-0 group"
        >
            <div
                className="bg-[var(--card)] rounded-[24px] border border-[var(--card-border)] shadow-soft overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative"
                style={{ width: '180px' }}
            >
                {/* NEW Badge */}
                {isNew && (
                    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        NEW
                    </div>
                )}

                {/* Gradient Header */}
                <div className={`h-14 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
                </div>

                {/* Content */}
                <div className="p-3">
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1 truncate">
                        {quiz.categoryTitle}
                    </p>
                    <h3 className="text-[13px] font-black text-[var(--foreground)] leading-tight line-clamp-2 mb-2 group-hover:text-brand-blue transition-colors">
                        {quiz.title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px] font-medium">{quiz.year}</span>
                        </div>
                        {daysAgo <= 3 && (
                            <span className="text-[9px] font-bold text-emerald-600">
                                {daysAgo === 0 ? 'Oggi' : daysAgo === 1 ? 'Ieri' : `${daysAgo}g fa`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
