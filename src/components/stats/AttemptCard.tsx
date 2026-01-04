import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, AlertTriangle, ChevronRight } from 'lucide-react';

export interface AttemptProps {
    id: string;
    created_at: string;
    score: number;
    total_questions: number;
    correct: number;
    mode?: 'custom' | 'official' | 'simulation' | null;
    quizTitle?: string; // Optional override for display
}

// Helpers
function getAttemptTypeDisplay(mode?: string | null) {
    switch (mode) {
        case 'custom':
            return { label: 'Personalizzata', className: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' };
        case 'official':
            return { label: 'Esame', className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' };
        case 'simulation':
            return { label: 'Simulazione', className: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' };
        default:
            return { label: 'Simulazione', className: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' };
    }
}

function getResultStatus(accuracy: number): {
    label: string;
    status: 'pass' | 'near' | 'fail';
    icon: typeof Check;
    bgColor: string;
    textColor: string;
    progressColor: string;
} {
    if (accuracy >= 60) {
        return {
            label: 'Idoneo',
            status: 'pass',
            icon: Check,
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            progressColor: '#10B981'
        };
    } else if (accuracy >= 50) {
        return {
            label: 'Quasi',
            status: 'near',
            icon: AlertTriangle,
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            textColor: 'text-amber-600 dark:text-amber-400',
            progressColor: '#F59E0B'
        };
    } else {
        return {
            label: 'Non idoneo',
            status: 'fail',
            icon: X,
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400',
            progressColor: '#EF4444'
        };
    }
}

function CircularProgress({ percentage, color, size = 44 }: { percentage: number; color: string; size?: number }) {
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100 dark:text-slate-800"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-[var(--foreground)] opacity-70">{percentage.toFixed(0)}%</span>
            </div>
        </div>
    );
}

const AttemptCard: React.FC<{ attempt: AttemptProps }> = ({ attempt }) => {
    const accuracy = attempt.total_questions > 0 ? (attempt.correct / attempt.total_questions) * 100 : 0;
    const resultStatus = getResultStatus(accuracy);
    const typeDisplay = getAttemptTypeDisplay(attempt.mode);
    const ResultIcon = resultStatus.icon;

    return (
        <Link
            to={`/quiz/results/${attempt.id}`}
            className="block bg-white dark:bg-[var(--card)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-[var(--card-border)] group"
        >
            <div className="flex items-center gap-4">
                {/* Circular Progress */}
                <CircularProgress
                    percentage={accuracy}
                    color={resultStatus.progressColor}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Date & Type */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-[var(--foreground)]">
                            {new Date(attempt.created_at).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${typeDisplay.className}`}>
                            {typeDisplay.label}
                        </span>
                    </div>

                    {/* Result Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${resultStatus.bgColor}`}>
                            <ResultIcon className={`w-3.5 h-3.5 ${resultStatus.textColor}`} />
                            <span className={`text-xs font-bold ${resultStatus.textColor}`}>
                                {resultStatus.label}
                            </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 opacity-80">
                            {attempt.correct}/{attempt.total_questions} • Voto: {attempt.score?.toFixed(1) || '0.0'}
                        </span>
                    </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 opacity-50 group-hover:opacity-100 group-hover:text-[#00B1FF] transition-all flex-shrink-0" />
            </div>
        </Link>
    );
}

export default AttemptCard;
