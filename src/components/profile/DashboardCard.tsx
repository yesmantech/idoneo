import React from 'react';
import { ChevronRight, Shield, Stethoscope, Briefcase, Scale, Gavel, GraduationCap, Car } from 'lucide-react';

export interface DashboardCardProps {
    key?: React.Key;
    quizId: string;
    title: string;
    category?: string;
    progress: number; // 0-100
    lastPlayed?: Date;
    onClick: () => void;
}

export default function DashboardCard({ title, category, progress, onClick }: DashboardCardProps) {

    // Dynamic Icon Helper (Duplicated for now, consider moving to utils)
    const getCategoryIcon = (catTitle?: string) => {
        const lower = (catTitle || "").toLowerCase();
        if (lower.includes('sanità') || lower.includes('infermier') || lower.includes('medic')) return Stethoscope;
        if (lower.includes('finanza') || lower.includes('banca') || lower.includes('econom')) return Scale;
        if (lower.includes('amministra') || lower.includes('comun') || lower.includes('regione')) return Briefcase;
        if (lower.includes('giustizia') || lower.includes('magistrat')) return Gavel;
        if (lower.includes('scuola') || lower.includes('docent')) return GraduationCap;
        if (lower.includes('patente') || lower.includes('guida')) return Car;
        return Shield; // Default
    };

    // We use the category title if available, otherwise fallback to title for matching, or default Shield
    const CategoryIcon = getCategoryIcon(category || title);

    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-[#1C212B] rounded-[20px] p-[18px] flex items-center gap-[18px] active:scale-[0.98] transition-all text-left group"
        >
            {/* Icon Avatar */}
            <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center bg-[#E0F2FE] dark:bg-[#12161E] flex-shrink-0 border border-transparent dark:border-[#00B1FF]/[0.15]">
                <CategoryIcon className="w-[20px] h-[20px] text-[#00B1FF]" strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2 text-[15px] mb-[10px] leading-none tracking-wide">{title}</h3>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] bg-slate-100 dark:bg-[#28303F] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00B1FF] rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-[18px] h-[18px] text-slate-300 dark:text-slate-500 flex-shrink-0 group-hover:dark:text-white transition-colors" />
        </button>
    );
}
