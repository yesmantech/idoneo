import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getCategoryStyle } from '@/lib/categoryIcons';
import { useTheme } from '@/context/ThemeContext';

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
    const { Icon, color, bg, bgLight } = getCategoryStyle(category || title);
    const { resolvedTheme } = useTheme();
    const iconBg = resolvedTheme === 'light' ? bgLight : bg;

    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-[#1C1C1E] rounded-2xl p-[18px] flex items-center gap-[18px] active:scale-[0.98] active:opacity-80 transition-all text-left group"
        >
            {/* Icon Avatar — iOS flat colored square */}
            <div
                className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBg }}
            >
                <Icon className="w-[20px] h-[20px]" style={{ color }} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2 text-[15px] mb-[10px] leading-none tracking-wide">{title}</h3>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] bg-slate-100 dark:bg-[#28303F] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: color }}
                        />
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-[18px] h-[18px] text-slate-300 dark:text-slate-500 flex-shrink-0 group-hover:dark:text-white transition-colors" />
        </button>
    );
}
