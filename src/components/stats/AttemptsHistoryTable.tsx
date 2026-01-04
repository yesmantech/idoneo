import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, Eye, ChevronDown, ChevronUp, Check, X, AlertTriangle, ChevronRight } from 'lucide-react';

interface Attempt {
    id: string;
    created_at: string;
    score: number;
    total_questions: number;
    correct: number;
    mode?: 'custom' | 'official' | 'simulation' | null;
    isOfficial?: boolean;
    config_snapshot?: any;
    quiz_id?: string;
}

interface AttemptsHistoryTableProps {
    attempts: Attempt[];
    quizId?: string;
    onRepeatTest?: (attempt: Attempt) => void;
}

type FilterType = 'all' | 'official' | 'custom';
type ResultFilter = 'all' | 'pass' | 'near' | 'fail';

// Helper to get label and style based on mode
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

// Circular progress component
function CircularProgress({ percentage, color, size = 44 }: { percentage: number; color: string; size?: number }) {
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-100 dark:text-slate-800"
                />
                {/* Progress circle */}
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

export default function AttemptsHistoryTable({ attempts, quizId, onRepeatTest }: AttemptsHistoryTableProps) {
    const navigate = useNavigate();
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');
    const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Filter attempts
    const filteredAttempts = useMemo(() => {
        return attempts.filter(att => {
            // Type filter
            if (typeFilter !== 'all') {
                if (typeFilter === 'official' && att.mode !== 'official') return false;
                if (typeFilter === 'custom' && att.mode !== 'custom') return false;
            }

            // Result filter
            if (resultFilter !== 'all') {
                const accuracy = att.total_questions > 0 ? (att.correct / att.total_questions) * 100 : 0;
                const status = getResultStatus(accuracy).status;
                if (resultFilter !== status) return false;
            }

            return true;
        });
    }, [attempts, typeFilter, resultFilter]);

    const handleRepeatTest = (attempt: Attempt) => {
        if (onRepeatTest) {
            onRepeatTest(attempt);
        } else if (quizId) {
            navigate(`/quiz/${quizId}/official`);
        }
    };

    if (attempts.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--foreground)] opacity-40">
                <div className="text-4xl mb-3">📝</div>
                Nessuna attività recente.
            </div>
        );
    }

    const hasActiveFilters = typeFilter !== 'all' || resultFilter !== 'all';

    return (
        <div className="space-y-4">
            {/* Filter Toggle */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)] opacity-50 hover:opacity-100 transition-opacity"
            >
                Filtri
                {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[#00B1FF]"></span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Filter Chips */}
            {showFilters && (
                <div className="flex flex-wrap gap-4 pb-2 p-4 bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-sm">
                    <div className="flex gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 self-center">Tipo:</span>
                        {[
                            { value: 'all', label: 'Tutti' },
                            { value: 'official', label: 'Esame' },
                            { value: 'custom', label: 'Personalizzata' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setTypeFilter(f.value as FilterType)}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${typeFilter === f.value ? 'bg-[#00B1FF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 self-center">Risultato:</span>
                        {[
                            { value: 'all', label: 'Tutti' },
                            { value: 'pass', label: 'Idoneo' },
                            { value: 'near', label: 'Quasi' },
                            { value: 'fail', label: 'Non idoneo' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setResultFilter(f.value as ResultFilter)}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${resultFilter === f.value ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Count */}
            {hasActiveFilters && (
                <p className="text-xs text-[var(--foreground)] opacity-40">
                    {filteredAttempts.length} risultat{filteredAttempts.length === 1 ? 'o' : 'i'} trovat{filteredAttempts.length === 1 ? 'o' : 'i'}
                </p>
            )}

            {/* Card-based List */}
            <div className="space-y-3">
                {filteredAttempts.map(att => {
                    const accuracy = att.total_questions > 0 ? (att.correct / att.total_questions) * 100 : 0;
                    const resultStatus = getResultStatus(accuracy);
                    const typeDisplay = getAttemptTypeDisplay(att.mode);
                    const ResultIcon = resultStatus.icon;

                    return (
                        <Link
                            key={att.id}
                            to={`/quiz/results/${att.id}`}
                            className="block bg-[var(--card)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-[var(--card-border)] group"
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
                                        <span className="text-sm font-bold text-[var(--foreground)]">
                                            {new Date(att.created_at).toLocaleDateString('it-IT', {
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
                                        <span className="text-[11px] text-[var(--foreground)] opacity-40">
                                            {att.correct}/{att.total_questions} • Voto: {att.score?.toFixed(1) || '0.0'}
                                        </span>
                                    </div>
                                </div>

                                {/* Chevron */}
                                <ChevronRight className="w-5 h-5 text-[var(--foreground)] opacity-20 group-hover:opacity-100 group-hover:text-[#00B1FF] transition-all flex-shrink-0" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filteredAttempts.length === 0 && (
                <div className="text-center py-12 text-[var(--foreground)] opacity-40">
                    <div className="text-4xl mb-3">🔍</div>
                    Nessun tentativo corrisponde ai filtri selezionati.
                </div>
            )}
        </div>
    );
}
