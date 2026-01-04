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
            className="w-full bg-white dark:bg-[#1e2330] rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-5 active:scale-[0.98] transition-all hover:shadow-md text-left group"
        >
            {/* Icon Avatar */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E0F2FE] dark:bg-[#141820] flex-shrink-0 border border-transparent dark:border-sky-500/20">
                <CategoryIcon className="w-5 h-5 text-[#00B1FF] dark:text-sky-400" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2 text-[15px]">{title}</h3>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#2a3040] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00B1FF] rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-500 flex-shrink-0 group-hover:text-[#00B1FF] transition-colors" />
        </button>
    );
}
