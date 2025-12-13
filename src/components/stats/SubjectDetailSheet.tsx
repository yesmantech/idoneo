import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, BookOpen, Target, ChevronRight } from 'lucide-react';

interface SubjectStats {
    subjectId: string;
    subjectName: string;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
    trend: 'improving' | 'declining' | 'stable';
    status: 'good' | 'warning' | 'critical';
    recentAccuracy?: number;
    avgResponseTimeMs?: number;
}

interface SubjectDetailSheetProps {
    subject: SubjectStats | null;
    quizId: string;
    onClose: () => void;
    onPractice?: (subjectId: string) => void;
    onReviewErrors?: (subjectId: string) => void;
}

export default function SubjectDetailSheet({
    subject,
    quizId,
    onClose,
    onPractice,
    onReviewErrors
}: SubjectDetailSheetProps) {
    if (!subject) return null;

    const TrendIcon = subject.trend === 'improving' ? TrendingUp : subject.trend === 'declining' ? TrendingDown : Minus;
    const trendColor = subject.trend === 'improving'
        ? 'text-semantic-success'
        : subject.trend === 'declining'
            ? 'text-semantic-error'
            : 'text-text-tertiary';

    const statusConfig = {
        good: { label: 'Buono', color: 'bg-semantic-success', bgColor: 'bg-semantic-success/10', textColor: 'text-semantic-success' },
        warning: { label: 'Da migliorare', color: 'bg-brand-orange', bgColor: 'bg-brand-orange/10', textColor: 'text-brand-orange' },
        critical: { label: 'Critico', color: 'bg-semantic-error', bgColor: 'bg-semantic-error/10', textColor: 'text-semantic-error' }
    };

    const statusStyle = statusConfig[subject.status];
    const wrongAnswers = subject.totalQuestions - subject.correctAnswers;

    const handlePractice = () => {
        if (onPractice) {
            onPractice(subject.subjectId);
        } else {
            // Default navigation
            window.location.href = `/quiz/${quizId}/practice?subject=${subject.subjectId}`;
        }
    };

    const handleReviewErrors = () => {
        if (onReviewErrors) {
            onReviewErrors(subject.subjectId);
        } else {
            // Default navigation
            window.location.href = `/quiz/${quizId}/review?subject=${subject.subjectId}`;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-auto animate-in slide-in-from-bottom-4 duration-300">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2 sm:hidden">
                    <div className="w-10 h-1 bg-slate-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusStyle.color}`} />
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">{subject.subjectName}</h2>
                            <p className="text-xs text-text-tertiary">Analisi dettagliata</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-canvas-light rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-text-tertiary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-canvas-light rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Accuratezza</p>
                            <p className={`text-3xl font-black ${statusStyle.textColor}`}>
                                {subject.accuracy.toFixed(0)}%
                            </p>
                            <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${trendColor}`}>
                                <TrendIcon className="w-3 h-3" />
                                <span>
                                    {subject.trend === 'improving' ? 'In miglioramento' :
                                        subject.trend === 'declining' ? 'In calo' : 'Stabile'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-canvas-light rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Domande</p>
                            <p className="text-3xl font-black text-text-primary">
                                {subject.totalQuestions}
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">
                                {subject.correctAnswers} corrette · {wrongAnswers} sbagliate
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`${statusStyle.bgColor} rounded-2xl p-4 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-xl ${statusStyle.color} flex items-center justify-center`}>
                            <span className="text-white text-lg">
                                {subject.status === 'good' ? '✓' : subject.status === 'warning' ? '!' : '✗'}
                            </span>
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${statusStyle.textColor}`}>
                                Stato: {statusStyle.label}
                            </p>
                            <p className="text-xs text-text-tertiary">
                                {subject.status === 'good'
                                    ? 'Ottimo lavoro! Continua così.'
                                    : subject.status === 'warning'
                                        ? 'Qualche errore di troppo. Ripassa questa materia.'
                                        : 'Attenzione! Questa materia richiede studio intensivo.'}
                            </p>
                        </div>
                    </div>

                    {/* Average Response Time (if available) */}
                    {subject.avgResponseTimeMs && (
                        <div className="bg-canvas-light rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Tempo medio per risposta</p>
                            <p className="text-2xl font-black text-text-primary">
                                {(subject.avgResponseTimeMs / 1000).toFixed(1)}s
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Azioni consigliate</p>

                        {wrongAnswers > 0 && (
                            <button
                                onClick={handleReviewErrors}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-amber-100 bg-amber-50 hover:bg-amber-100/50 transition-all text-left group"
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-text-primary">Ripassa {wrongAnswers} errori</p>
                                    <p className="text-xs text-text-tertiary">Rivedi le domande sbagliate</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        )}

                        <button
                            onClick={handlePractice}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 hover:bg-brand-cyan/10 transition-all text-left group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-brand-cyan/20 text-brand-cyan flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-primary">Esercitati su questa materia</p>
                                <p className="text-xs text-text-tertiary">Quiz focalizzato solo su {subject.subjectName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
