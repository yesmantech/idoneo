import React, { useState } from 'react';
import { X, Target, TrendingUp, Flag, Calendar } from 'lucide-react';

type GoalType = 'score' | 'accuracy' | 'attempts';

interface GoalCreationModalProps {
    isOpen: boolean;
    quizId: string;
    onClose: () => void;
    onSubmit: (goal: { goal_type: GoalType; target_value: number; deadline: string | null }) => Promise<void>;
}

const goalTypeOptions = [
    {
        value: 'score' as GoalType,
        label: 'Punteggio',
        description: 'Raggiungi un punteggio target',
        icon: Target,
        unit: 'punti',
        placeholder: '75',
        min: 0,
        max: 100
    },
    {
        value: 'accuracy' as GoalType,
        label: 'Accuratezza',
        description: 'Mantieni una percentuale di risposte corrette',
        icon: TrendingUp,
        unit: '%',
        placeholder: '80',
        min: 0,
        max: 100
    },
    {
        value: 'attempts' as GoalType,
        label: 'Simulazioni',
        description: 'Completa un numero di simulazioni',
        icon: Flag,
        unit: 'test',
        placeholder: '10',
        min: 1,
        max: 100
    }
];

export default function GoalCreationModal({ isOpen, quizId, onClose, onSubmit }: GoalCreationModalProps) {
    const [goalType, setGoalType] = useState<GoalType>('score');
    const [targetValue, setTargetValue] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedOption = goalTypeOptions.find(o => o.value === goalType)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const value = parseFloat(targetValue);
        if (isNaN(value) || value < selectedOption.min || value > selectedOption.max) {
            setError(`Inserisci un valore tra ${selectedOption.min} e ${selectedOption.max}`);
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                goal_type: goalType,
                target_value: value,
                deadline: deadline || null
            });
            onClose();
        } catch (err) {
            setError('Errore nel salvare l\'obiettivo. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[var(--card)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--card-border)]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[var(--card-border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--foreground)]">Nuovo obiettivo</h2>
                        <p className="text-xs text-[var(--foreground)] opacity-50 mt-0.5">Imposta un traguardo per restare motivato</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--foreground)] opacity-40" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Goal Type Selection */}
                    <div>
                        <label className="text-[10px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest block mb-3">
                            Tipo di obiettivo
                        </label>
                        <div className="space-y-2">
                            {goalTypeOptions.map(option => {
                                const Icon = option.icon;
                                const isSelected = goalType === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setGoalType(option.value);
                                            setTargetValue('');
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isSelected
                                            ? 'border-brand-cyan bg-brand-cyan/5 dark:bg-brand-cyan/10'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-[var(--card)]'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-brand-cyan text-white' : 'bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] opacity-40'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-sm font-bold ${isSelected ? 'text-brand-cyan' : 'text-[var(--foreground)]'}`}>
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-[var(--foreground)] opacity-50">{option.description}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-brand-cyan' : 'border-slate-200 dark:border-slate-700'
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Target Value */}
                    <div>
                        <label className="text-[10px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest block mb-2">
                            Valore target
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder={selectedOption.placeholder}
                                min={selectedOption.min}
                                max={selectedOption.max}
                                className="w-full px-4 py-3 pr-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:border-brand-cyan dark:focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none text-[var(--foreground)] font-bold text-lg transition-all"
                                required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground)] opacity-40 font-bold">
                                {selectedOption.unit}
                            </span>
                        </div>
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="text-[10px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest block mb-2">
                            Scadenza (opzionale)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground)] opacity-40" />
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:border-brand-cyan dark:focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none text-[var(--foreground)] font-medium transition-all"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-semantic-error bg-semantic-error/10 px-4 py-2 rounded-xl">
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-[var(--foreground)] opacity-60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !targetValue}
                            className="flex-1 py-3 px-4 rounded-xl bg-brand-cyan text-white font-bold hover:bg-brand-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Salvataggio...' : 'Salva obiettivo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
