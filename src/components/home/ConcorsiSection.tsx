import React from "react";
import { Link } from "react-router-dom";
import { Category } from "@/lib/data"; // Assuming Category type is exported from there or similar

interface ConcorsoCardProps {
    contest: Category;
}

export function ConcorsoCard({ contest, className }: ConcorsoCardProps & { className?: string }) {
    // Default desktop class if no className provided, but we are passing it now.
    // We'll merge defaults with passed class if needed, or just replace width/aspect.
    // The passed className handles width and aspect ratio switching.

    return (
        <Link
            to={`/concorsi/${contest.slug}`}
            className={`group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex ${className || 'w-48 sm:w-56 aspect-[3/4] flex-col'}`}
        >
            {/* Image / Gradient Placeholder */}
            {/* Image / Gradient Placeholder */}
            {contest.home_banner_url ? (
                <div className="h-1/2 w-full relative overflow-hidden">
                    <img
                        src={contest.home_banner_url}
                        alt={contest.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Top Badge */}
                    {contest.is_new && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            NUOVO
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-1/2 w-full bg-slate-100 relative overflow-hidden p-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200" />
                    {/* Icon Placeholder */}
                    <div className="relative z-10 w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl border border-slate-50">
                        🏢
                    </div>

                    {/* Top Badge */}
                    {contest.is_new && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            NUOVO
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col items-start justify-between bg-white relative">
                <div className="space-y-1 w-full">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-left">
                        Concorso
                    </p>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 text-left group-hover:text-emerald-600 transition-colors">
                        {contest.title}
                    </h3>
                    <p className="text-xs text-slate-500 text-left line-clamp-1">
                        Ministero della Difesa
                    </p>
                </div>

                <div className="w-full pt-3 mt-2 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">
                        1250 Posti
                    </span>
                </div>
            </div>
        </Link>
    );
}

interface ConcorsiSectionProps {
    title: string;
    contests: Category[];
}

export default function ConcorsiSection({ title, contests }: ConcorsiSectionProps) {
    if (!contests || contests.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-end px-1">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {title}
                    </h2>
                    {/* Optional line indicator */}
                    <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                </div>

                <div className="flex items-center gap-2">
                    <button className="hidden sm:flex w-8 h-8 rounded-full border border-slate-200 items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all">
                        ←
                    </button>
                    <button className="hidden sm:flex w-8 h-8 rounded-full border border-slate-200 items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all">
                        →
                    </button>
                    <Link to="/concorsi/tutti" className="text-sm font-medium text-slate-500 hover:text-slate-900 ml-2">
                        Vedi tutti
                    </Link>
                </div>
            </div>

            {/* Carousel Container (Mobile: Vertical Stack, Tablet+: Horizontal Scroll) */}
            <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex flex-col sm:flex-row gap-4 sm:overflow-x-auto sm:pb-6 sm:pt-2 sm:snap-x sm:scrollbar-hide">
                    {contests.map((contest, idx) => (
                        <div key={idx} className="w-full sm:w-auto flex-shrink-0 sm:snap-start">
                            {/* Passing fullWidth prop or handling sizing via class in Card */}
                            <ConcorsoCard contest={contest} className="w-full sm:w-56 aspect-[3/1] sm:aspect-[3/4] flex-row sm:flex-col" />
                        </div>
                    ))}

                    {/* Spacer for right padding on horizontal scroll */}
                    <div className="hidden sm:block w-4 flex-shrink-0" />
                </div>

                {/* Fade effect (Only on desktop/tablet scroll) */}
                <div className="hidden sm:block absolute top-0 right-0 bottom-6 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
