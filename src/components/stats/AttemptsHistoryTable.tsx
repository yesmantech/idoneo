import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, Eye, ChevronDown, ChevronUp } from 'lucide-react';

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
            return { label: 'Personalizzata', className: 'bg-brand-cyan/10 text-brand-cyan' };
        case 'official':
            return { label: 'Esame', className: 'bg-brand-blue/10 text-brand-blue' };
        case 'simulation':
            return { label: 'Simulazione', className: 'bg-brand-purple/10 text-brand-purple' };
        default:
            return { label: 'Simulazione', className: 'bg-canvas-light text-text-secondary' };
    }
}

function getResultStatus(accuracy: number): { label: string; status: 'pass' | 'near' | 'fail'; className: string } {
    if (accuracy >= 60) {
        return { label: 'Idoneo', status: 'pass', className: 'bg-semantic-success/10 text-semantic-success' };
    } else if (accuracy >= 50) {
        return { label: 'Quasi', status: 'near', className: 'bg-brand-orange/10 text-brand-orange' };
    } else {
        return { label: 'Non idoneo', status: 'fail', className: 'bg-semantic-error/10 text-semantic-error' };
    }
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
            // Default: navigate to official mode
            navigate(`/quiz/${quizId}/official`);
        }
    };

    if (attempts.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
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
                className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
                Filtri
                {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Filter Chips */}
            {showFilters && (
                <div className="flex flex-wrap gap-4 pb-2">
                    <div className="flex gap-1">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase mr-2 self-center">Tipo:</span>
                        {[
                            { value: 'all', label: 'Tutti' },
                            { value: 'official', label: 'Esame' },
                            { value: 'custom', label: 'Personalizzata' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setTypeFilter(f.value as FilterType)}
                                className={`px-3 py-1 text-xs font-bold rounded-pill transition-all ${typeFilter === f.value ? 'bg-brand-cyan text-white' : 'bg-canvas-light text-text-secondary hover:bg-slate-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase mr-2 self-center">Risultato:</span>
                        {[
                            { value: 'all', label: 'Tutti' },
                            { value: 'pass', label: 'Idoneo' },
                            { value: 'near', label: 'Quasi' },
                            { value: 'fail', label: 'Non idoneo' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setResultFilter(f.value as ResultFilter)}
                                className={`px-3 py-1 text-xs font-bold rounded-pill transition-all ${resultFilter === f.value ? 'bg-text-primary text-white' : 'bg-canvas-light text-text-secondary hover:bg-slate-200'
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
                <p className="text-xs text-text-tertiary">
                    {filteredAttempts.length} risultat{filteredAttempts.length === 1 ? 'o' : 'i'} trovat{filteredAttempts.length === 1 ? 'o' : 'i'}
                </p>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest border-b border-canvas-light">
                            <th className="py-4 pl-4 text-left">Data</th>
                            <th className="py-4 text-left">Tipo</th>
                            <th className="py-4 text-left">Voto</th>
                            <th className="py-4 text-left">Risultato</th>
                            <th className="py-4 text-right pr-4">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-text-secondary">
                        {filteredAttempts.map(att => {
                            const accuracy = att.total_questions > 0 ? (att.correct / att.total_questions) * 100 : 0;
                            const resultStatus = getResultStatus(accuracy);
                            const typeDisplay = getAttemptTypeDisplay(att.mode);

                            return (
                                <tr key={att.id} className="border-b border-canvas-light hover:bg-canvas-light/50 transition-colors group">
                                    <td className="py-4 pl-4">
                                        <div className="font-medium text-text-primary">
                                            {new Date(att.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-text-tertiary text-xs">
                                            {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide ${typeDisplay.className}`}>
                                            {typeDisplay.label}
                                        </span>
                                    </td>
                                    <td className="py-4 font-bold text-text-primary">
                                        {att.score?.toFixed(1) || '0.0'}
                                    </td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-bold ${resultStatus.className}`}>
                                            {accuracy.toFixed(0)}% · {resultStatus.label}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Repeat Test Button */}
                                            <button
                                                onClick={() => handleRepeatTest(att)}
                                                className="p-2 rounded-lg hover:bg-canvas-light text-text-tertiary hover:text-brand-cyan transition-all opacity-0 group-hover:opacity-100"
                                                title="Ripeti questo test"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            {/* View Details */}
                                            <Link
                                                to={`/quiz/results/${att.id}`}
                                                className="p-2 rounded-lg hover:bg-brand-cyan/5 text-text-secondary hover:text-brand-cyan transition-all flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="text-xs font-bold hidden sm:inline">Dettagli</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredAttempts.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    Nessun tentativo corrisponde ai filtri selezionati.
                </div>
            )}
        </div>
    );
}
