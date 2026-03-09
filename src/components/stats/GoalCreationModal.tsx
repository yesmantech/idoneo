import React, { useState } from 'react';
import { X, Trophy, Crosshair, Repeat, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        icon: Trophy,
        unit: 'punti',
        placeholder: '75',
        min: 0,
        max: 100,
        gradient: 'from-[#00B1FF] to-[#0066FF]',
        iconColor: 'text-[#00B1FF]',
        iconBg: 'bg-[#00B1FF]/10 dark:bg-[#00B1FF]/15',
        ringColor: 'ring-[#00B1FF]/30',
        borderActive: 'border-[#00B1FF]/40'
    },
    {
        value: 'accuracy' as GoalType,
        label: 'Accuratezza',
        description: 'Percentuale risposte corrette',
        icon: Crosshair,
        unit: '%',
        placeholder: '80',
        min: 0,
        max: 100,
        gradient: 'from-emerald-500 to-green-600',
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        ringColor: 'ring-emerald-500/30',
        borderActive: 'border-emerald-500/40'
    },
    {
        value: 'attempts' as GoalType,
        label: 'Simulazioni',
        description: 'Numero di test da completare',
        icon: Repeat,
        unit: 'test',
        placeholder: '10',
        min: 1,
        max: 100,
        gradient: 'from-violet-500 to-purple-600',
        iconColor: 'text-violet-500',
        iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
        ringColor: 'ring-violet-500/30',
        borderActive: 'border-violet-500/40'
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

        // Custom date validation
        if (deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(deadline);
            if (selected < today) {
                setError('La scadenza deve essere una data futura.');
                return;
            }
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60"
                        onClick={onClose}
                    />

                    {/* Modal Surface — Tier S Glassmorphism */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="relative w-full max-w-md bg-white/95 dark:bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/40 dark:border-white/[0.08] rounded-[28px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] overflow-hidden"
                    >
                        {/* Ambient Glow */}
                        <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full blur-[100px] pointer-events-none opacity-15 bg-gradient-to-br ${selectedOption.gradient}`} />

                        {/* Header */}
                        <div className="relative z-10 px-6 pt-6 pb-4 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B1FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[#00B1FF]/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-extrabold text-[var(--foreground)] tracking-tight">Nuovo obiettivo</h2>
                                    <p className="text-[12px] text-[var(--foreground)] opacity-40 mt-0.5">Imposta il tuo traguardo</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.15] transition-colors"
                            >
                                <X className="w-4 h-4 text-[var(--foreground)] opacity-40" />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[var(--card-border)] to-transparent" />

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-5">
                            {/* Goal Type Selection */}
                            <div>
                                <label className="text-[10px] font-black text-[var(--foreground)] opacity-30 uppercase tracking-[0.15em] block mb-3">
                                    Tipo di obiettivo
                                </label>
                                <div className="space-y-2">
                                    {goalTypeOptions.map(option => {
                                        const Icon = option.icon;
                                        const isSelected = goalType === option.value;

                                        return (
                                            <motion.button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setGoalType(option.value);
                                                    setTargetValue('');
                                                }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-[1.5px] transition-all duration-200 ${isSelected
                                                    ? `${option.borderActive} bg-gradient-to-r ${option.gradient} bg-opacity-[0.04] shadow-sm`
                                                    : 'border-slate-100 dark:border-white/[0.06] hover:border-slate-200 dark:hover:border-white/[0.1] bg-white/50 dark:bg-white/[0.02]'
                                                    }`}
                                                style={isSelected ? {
                                                    background: `linear-gradient(135deg, ${option.value === 'score' ? 'rgba(0,177,255,0.06)' : option.value === 'accuracy' ? 'rgba(16,185,129,0.06)' : 'rgba(139,92,246,0.06)'}, transparent)`
                                                } : undefined}
                                            >
                                                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-200 ${isSelected
                                                    ? `bg-gradient-to-br ${option.gradient} shadow-md`
                                                    : option.iconBg
                                                    }`}>
                                                    <Icon className={`w-[18px] h-[18px] ${isSelected ? 'text-white' : option.iconColor}`} strokeWidth={2} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className={`text-[14px] font-bold tracking-tight ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] opacity-80'}`}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--foreground)] opacity-40 leading-tight">{option.description}</p>
                                                </div>
                                                {/* Radio indicator */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                                    ? 'border-transparent'
                                                    : 'border-slate-200 dark:border-white/[0.1]'
                                                    }`}
                                                    style={isSelected ? { background: `linear-gradient(135deg, ${option.value === 'score' ? '#00B1FF' : option.value === 'accuracy' ? '#10B981' : '#8B5CF6'}, ${option.value === 'score' ? '#0066FF' : option.value === 'accuracy' ? '#059669' : '#7C3AED'})` } : undefined}
                                                >
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Target Value */}
                            <div>
                                <label className="text-[10px] font-black text-[var(--foreground)] opacity-30 uppercase tracking-[0.15em] block mb-2">
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
                                        className="w-full px-4 py-3.5 pr-16 rounded-2xl border-[1.5px] border-slate-100 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] focus:border-[#00B1FF]/40 dark:focus:border-[#00B1FF]/40 focus:ring-2 focus:ring-[#00B1FF]/10 outline-none text-[var(--foreground)] font-bold text-lg transition-all placeholder:text-slate-300 dark:placeholder:text-white/10"
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[var(--foreground)] opacity-25 uppercase tracking-wider">
                                        {selectedOption.unit}
                                    </span>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="text-[10px] font-black text-[var(--foreground)] opacity-30 uppercase tracking-[0.15em] block mb-2">
                                    Scadenza (opzionale)
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)] opacity-25" />
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => {
                                            setDeadline(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-[1.5px] border-slate-100 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] focus:border-[#00B1FF]/40 dark:focus:border-[#00B1FF]/40 focus:ring-2 focus:ring-[#00B1FF]/10 outline-none text-[var(--foreground)] font-medium text-[14px] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="text-[13px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-2xl border border-red-100 dark:border-red-500/10"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3.5 px-4 rounded-2xl border-[1.5px] border-slate-100 dark:border-white/[0.06] font-bold text-[14px] text-[var(--foreground)] opacity-50 hover:opacity-70 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-all active:scale-[0.98]"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !targetValue}
                                    className="flex-1 py-3.5 px-4 rounded-2xl bg-[#00B1FF] text-white font-bold text-[14px] hover:bg-[#009de6] hover:shadow-lg hover:shadow-[#00B1FF]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Salvataggio...
                                        </span>
                                    ) : 'Salva obiettivo'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
