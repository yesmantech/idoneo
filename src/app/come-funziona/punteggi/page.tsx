"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Trophy,
    Target,
    TrendingUp,
    AlertTriangle,
    Calculator,
    BarChart3,
    Users,
    Zap,
    CheckCircle2,
    XCircle,
    Minus
} from 'lucide-react';

// =============================================================================
// COME FUNZIONA - PUNTEGGI PAGE
// Tier S Informational Page
// =============================================================================
export default function PunteggiPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--card-border)] pt-safe">
                <div className="h-14 px-4 flex items-center gap-4 max-w-3xl mx-auto">
                    <Link
                        to="/"
                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold">Come Funziona</h1>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-[24px] bg-gradient-to-br from-[#00B1FF] to-emerald-500 flex items-center justify-center shadow-lg">
                        <Calculator className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black mb-3">Come Calcoliamo i Punteggi</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
                        Scopri come funziona il sistema di valutazione di Idoneo
                    </p>
                </motion.div>

                {/* Section 1: Quiz Scoring */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--card)] rounded-[32px] p-6 border border-[var(--card-border)] shadow-soft"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Punteggio Quiz</h2>
                            <p className="text-sm text-slate-500">Come viene calcolato il voto</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        Ogni quiz utilizza le regole ufficiali del concorso specifico. Ecco come funziona tipicamente:
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <div>
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">Risposta Corretta</span>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">+1 punto (o secondo regole concorso)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                                <span className="font-bold text-red-700 dark:text-red-300">Risposta Errata</span>
                                <p className="text-sm text-red-600 dark:text-red-400">-0.25 (penalità variabile)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <Minus className="w-6 h-6 text-slate-500 flex-shrink-0" />
                            <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Non Risposta</span>
                                <p className="text-sm text-slate-500">0 punti (nessuna penalità)</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-[#00B1FF]/10 border border-[#00B1FF]/20">
                        <p className="text-sm text-[#00B1FF] font-medium">
                            💡 <strong>Consiglio:</strong> Se non sei sicuro, lascia la risposta in bianco per evitare penalità!
                        </p>
                    </div>
                </motion.section>

                {/* Section 2: Readiness Level */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--card)] rounded-[32px] p-6 border border-[var(--card-border)] shadow-soft"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Livello di Preparazione</h2>
                            <p className="text-sm text-slate-500">L'algoritmo che valuta il tuo progresso</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        Il livello di preparazione viene calcolato analizzando le tue ultime simulazioni.
                        Si attiva dopo almeno <strong>3 quiz completati</strong>.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="font-bold text-emerald-700 dark:text-emerald-300">Pronto</h3>
                            </div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Media superiore a <strong>90/100</strong>. Sei preparato per l'esame ufficiale!
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                <h3 className="font-bold text-amber-700 dark:text-amber-300">A Buon Punto</h3>
                            </div>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Media tra <strong>70/100</strong> e <strong>90/100</strong>. Continua così, manca poco!
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <h3 className="font-bold text-red-700 dark:text-red-300">Da Migliorare</h3>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Media inferiore a <strong>70/100</strong>. Serve più allenamento, non mollare!
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Section 3: Leaderboard */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[var(--card)] rounded-[32px] p-6 border border-[var(--card-border)] shadow-soft"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#00B1FF]/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-[#00B1FF]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Classifica</h2>
                            <p className="text-sm text-slate-500">Come funziona il ranking</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        La classifica ti mostra la tua posizione rispetto agli altri candidati dello stesso concorso.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Accuratezza</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Media delle risposte corrette su tutte le simulazioni. Più alta è, meglio sei posizionato.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Volume</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Numero totale di risposte corrette. Più ti alleni, più punti accumuli.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Consistenza</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Frequenza di allenamento. Chi si allena regolarmente ha un vantaggio.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#00B1FF]/10 to-emerald-500/10 border border-[#00B1FF]/20">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            🏆 <strong>Score Finale:</strong> Una combinazione ponderata di accuratezza, volume e consistenza determina la tua posizione in classifica.
                        </p>
                    </div>
                </motion.section>

                {/* Section 4: XP System */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[var(--card)] rounded-[32px] p-6 border border-[var(--card-border)] shadow-soft"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Sistema XP</h2>
                            <p className="text-sm text-slate-500">Punti esperienza e classifiche</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        Gli XP misurano quanto ti alleni su Idoneo. Servono per scalare le classifiche globali e tracciare il tuo impegno.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">+1</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-700 dark:text-emerald-300">XP per risposta corretta</h4>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">Ogni risposta giusta ti dà 1 XP</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-700 dark:text-amber-300">Classifica Settimanale</h4>
                                <p className="text-sm text-amber-600 dark:text-amber-400">La classifica XP si azzera ogni settimana</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-700 dark:text-purple-300">XP Totali</h4>
                                <p className="text-sm text-purple-600 dark:text-purple-400">I tuoi XP totali restano sempre nel profilo</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-[#00B1FF]/10 border border-[#00B1FF]/20">
                        <p className="text-sm text-[#00B1FF] font-medium">
                            💡 <strong>Nota:</strong> Gli XP misurano l'impegno, non la preparazione. Usa il "Livello di Preparazione" per valutare quanto sei pronto per l'esame!
                        </p>
                    </div>
                </motion.section>


                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center pt-4"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00B1FF] to-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-opacity"
                    >
                        <Target className="w-5 h-5" />
                        Inizia ad allenarti
                    </Link>
                </motion.div>

            </div>
        </div>
    );
}
