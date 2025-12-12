import React from "react";
import { Link } from "react-router-dom";
import { Category } from "@/lib/data";

interface ConcorsoCardProps {
    contest: Category;
}

export function ConcorsoCard({ contest }: ConcorsoCardProps) {
    return (
        <Link
            to={`/concorsi/${contest.slug}`}
            className="group relative bg-white rounded-2xl shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 ease-ios overflow-hidden flex flex-col"
        >
            {/* Image */}
            {contest.home_banner_url ? (
                <div className="aspect-[4/3] w-full relative overflow-hidden">
                    <img
                        src={contest.home_banner_url}
                        alt={contest.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {contest.is_new && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            NUOVO
                        </div>
                    )}
                </div>
            ) : (
                <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl border border-slate-100">
                        🏢
                    </div>
                    {contest.is_new && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            NUOVO
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-3 flex flex-col gap-2">
                <div className="space-y-0.5">
                    <p className="text-[10px] uppercase font-bold text-brand-cyan tracking-wider">
                        Concorso
                    </p>
                    <h3 className="font-bold text-text-primary text-sm leading-snug line-clamp-2 group-hover:text-brand-cyan transition-colors">
                        {contest.title}
                    </h3>
                    <p className="text-[11px] text-text-tertiary line-clamp-1">
                        Ministero della Difesa
                    </p>
                </div>

                {contest.year && (
                    <span className="text-[10px] font-medium text-text-tertiary bg-slate-100 px-2 py-1 rounded-md inline-block self-start">
                        {contest.year}
                    </span>
                )}
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
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    {title}
                </h2>
                <Link to="/concorsi/tutti" className="text-sm font-semibold text-brand-cyan hover:text-brand-cyan/80 transition-colors">
                    Vedi tutti
                </Link>
            </div>

            {/* Grid: 2 columns on mobile, scrollable row on desktop */}
            <div className="grid grid-cols-2 md:flex md:overflow-x-auto md:gap-4 md:pb-4 md:scrollbar-hide gap-3">
                {contests.map((contest, idx) => (
                    <div key={idx} className="md:w-52 md:flex-shrink-0">
                        <ConcorsoCard contest={contest} />
                    </div>
                ))}
            </div>
        </div>
    );
}
