import React from 'react';
import { Link } from 'react-router-dom';

interface SimulationCTAProps {
    simulationUrl: string;
    customTestUrl?: string; // Optional, can be same base URL with query params
    questionCount?: number;
    officialBank?: boolean;
}

export default function SimulationCTA({ simulationUrl, customTestUrl, questionCount, officialBank = false }: SimulationCTAProps) {
    return (
        <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl mb-8">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    <div className="space-y-4 max-w-xl">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
                                🚀
                            </span>
                            <h2 className="text-2xl font-bold">Pronto a metterti alla prova?</h2>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                            Accedi alla simulazione d'esame ufficiale o crea una prova personalizzata per allenarti sulle singole materie.
                            {questionCount && (
                                <span className="block mt-2 text-emerald-400 font-medium">
                                    • Accesso a {questionCount.toLocaleString()} domande {officialBank ? 'ufficiali' : 'esercitative'}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <Link
                            to={simulationUrl}
                            className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 text-center"
                        >
                            Simulazione d'Esame
                        </Link>
                        <Link
                            to={customTestUrl || simulationUrl} // Fallback to sim page if no separate URL yet
                            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all hover:bg-slate-700 text-center"
                        >
                            Prova Personalizzata
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
