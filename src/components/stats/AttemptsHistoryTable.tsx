import React from 'react';
import { Link } from 'react-router-dom';

interface Attempt {
    id: string;
    created_at: string;
    score: number;
    total_questions: number;
    correct: number;
    // For now assuming all are Simulations, or we detect type
    isOfficial?: boolean;
}

interface AttemptsHistoryTableProps {
    attempts: Attempt[];
}

export default function AttemptsHistoryTable({ attempts }: AttemptsHistoryTableProps) {
    if (attempts.length === 0) return <div className="text-center py-8 text-slate-400">Nessuna attività recente.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-3 font-bold">Data</th>
                        <th className="py-3 font-bold">Tipo</th>
                        <th className="py-3 font-bold">Voto</th>
                        <th className="py-3 font-bold">Risultato</th>
                        <th className="py-3 font-bold text-right">Azioni</th>
                    </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                    {attempts.map(att => {
                        const accuracy = (att.correct / att.total_questions) * 100;
                        const isPass = accuracy >= 60; // Example threshold

                        return (
                            <tr key={att.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="py-4 font-medium">
                                    {new Date(att.created_at).toLocaleDateString()} <span className="text-slate-400 text-xs ml-1">{new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="py-4">
                                    <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold">Simulazione</span>
                                </td>
                                <td className="py-4 font-bold text-slate-900">
                                    {att.score.toFixed(2)}
                                </td>
                                <td className="py-4">
                                    <span className={`flex items-center gap-1.5 ${isPass ? 'text-emerald-600' : 'text-rose-600'} font-bold`}>
                                        <span className={`w-2 h-2 rounded-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                        {accuracy.toFixed(0)}%
                                    </span>
                                </td>
                                <td className="py-4 text-right">
                                    <Link
                                        to={`/quiz/results/${att.id}`}
                                        className="text-xs font-bold text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
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
