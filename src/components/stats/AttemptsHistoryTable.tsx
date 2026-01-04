import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import AttemptCard, { AttemptProps } from './AttemptCard';

interface AttemptsHistoryTableProps {
    attempts: AttemptProps[]; // Updated to use shared interface
    quizId?: string;
    onRepeatTest?: (attempt: AttemptProps) => void;
}

type FilterType = 'all' | 'official' | 'custom';
type ResultFilter = 'all' | 'pass' | 'near' | 'fail';

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
                let status: ResultFilter = 'fail';
                if (accuracy >= 60) status = 'pass';
                else if (accuracy >= 50) status = 'near';

                if (resultFilter !== status) return false;
            }

            return true;
        });
    }, [attempts, typeFilter, resultFilter]);

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
                {filteredAttempts.map(att => (
                    <AttemptCard key={att.id} attempt={att} />
                ))}
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
