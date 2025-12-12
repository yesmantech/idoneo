import React from 'react';
import { Link } from 'react-router-dom';

interface Attempt {
    id: string;
    created_at: string;
    score: number;
    total_questions: number;
    correct: number;
    mode?: 'custom' | 'official' | 'simulation' | null;
    isOfficial?: boolean;
}

interface AttemptsHistoryTableProps {
    attempts: Attempt[];
}

// Helper to get label and style based on mode
function getAttemptTypeDisplay(mode?: string | null) {
    switch (mode) {
        case 'custom':
            return {
                label: 'Prova Personalizzata',
                className: 'bg-brand-cyan/10 text-brand-cyan'
            };
        case 'official':
            return {
                label: 'Simulazione Esame',
                className: 'bg-brand-blue/10 text-brand-blue'
            };
        case 'simulation':
            return {
                label: 'Simulazione',
                className: 'bg-brand-purple/10 text-brand-purple'
            };
        default:
            return {
                label: 'Simulazione',
                className: 'bg-canvas-light text-text-secondary'
            };
    }
}

export default function AttemptsHistoryTable({ attempts }: AttemptsHistoryTableProps) {
    if (attempts.length === 0) return <div className="text-center py-8 text-slate-400">Nessuna attività recente.</div>;

    return (
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
                    {attempts.map(att => {
                        const accuracy = att.total_questions > 0 ? (att.correct / att.total_questions) * 100 : 0;
                        const isPass = accuracy >= 60;
                        const typeDisplay = getAttemptTypeDisplay(att.mode);

                        return (
                            <tr key={att.id} className="border-b border-canvas-light hover:bg-canvas-light/50 transition-colors group">
                                <td className="py-4 pl-4 font-medium text-text-primary">
                                    {new Date(att.created_at).toLocaleDateString()} <span className="text-text-tertiary text-xs ml-1">{new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide ${typeDisplay.className}`}>{typeDisplay.label}</span>
                                </td>
                                <td className="py-4 font-bold text-text-primary">
                                    {att.score?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-bold ${isPass ? 'bg-semantic-success/10 text-semantic-success' : 'bg-semantic-error/10 text-semantic-error'}`}>
                                        {accuracy.toFixed(0)}%
                                    </span>
                                </td>
                                <td className="py-4 text-right pr-4">
                                    <Link
                                        to={`/quiz/results/${att.id}`}
                                        className="inline-block text-xs font-bold text-text-secondary hover:text-brand-cyan hover:bg-brand-cyan/5 border border-transparent hover:border-brand-cyan/20 px-3 py-1.5 rounded-pill transition-all"
                                    >
                                        Vedi Dettagli
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

