import React from "react";
import { Link } from "react-router-dom";
import { Category } from "@/lib/data";
import { ChevronRight } from "lucide-react";

interface ConcorsoCardProps {
    contest: Category;
}

export function ConcorsoCard({ contest }: ConcorsoCardProps) {
    return (
        <Link
            to={`/concorsi/${contest.slug}`}
            className="group relative bg-white rounded-2xl shadow-md shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50 
                       hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col"
        >
            {/* Image */}
            {contest.home_banner_url ? (
                <div className="aspect-[4/3] w-full relative overflow-hidden">
                    <img
                        src={contest.home_banner_url}
                        alt={contest.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {contest.is_new && (
                        <div className="absolute top-2.5 right-2.5 bg-[#00B1FF] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-[#00B1FF]/30">
                            NUOVO
                        </div>
                    )}
                </div>
            ) : (
                <div className="aspect-[4/3] w-full bg-[#F5F5F5] relative overflow-hidden flex items-center justify-center">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl">
                        🏢
                    </div>
                    {contest.is_new && (
                        <div className="absolute top-2.5 right-2.5 bg-[#00B1FF] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-[#00B1FF]/30">
                            NUOVO
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-3.5 flex flex-col gap-2">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-[#00B1FF] tracking-wider">
                        Concorso
                    </p>
                    <h3 className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-2 group-hover:text-[#00B1FF] transition-colors">
                        {contest.title}
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B] line-clamp-1">
                        Ministero della Difesa
                    </p>
                </div>

                {contest.year && (
                    <span className="text-[10px] font-semibold text-[#6B6B6B] bg-[#F5F5F5] px-2.5 py-1 rounded-full inline-block self-start">
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
                <h2 className="text-lg md:text-xl font-bold text-slate-900">
                    {title}
                </h2>
                <Link
                    to="/concorsi/tutti"
                    className="text-sm font-semibold text-[#00B1FF] hover:text-[#0099e6] transition-colors flex items-center gap-1"
                >
                    Vedi tutti
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Grid: 2 columns on mobile, scrollable row on desktop */}
            <div className="grid grid-cols-2 md:flex md:overflow-x-auto md:gap-4 md:pb-2 md:scrollbar-hide gap-3">
                {contests.map((contest, idx) => (
                    <div key={idx} className="md:w-56 md:flex-shrink-0">
                        <ConcorsoCard contest={contest} />
                    </div>
                ))}
            </div>
        </div>
    );
}

