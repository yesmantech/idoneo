import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Info } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

// ============================================
// PREPARAZIONE PAGE - Full Page Readiness View
// ============================================

export default function PreparazionePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get stats from URL params (passed from ReadinessCard)
    const level = searchParams.get('level') || 'low';
    const score = Number(searchParams.get('score')) || 0;
    const accuracy = Number(searchParams.get('accuracy')) || 0;
    const volume = Number(searchParams.get('volume')) || 0;
    const coverage = Number(searchParams.get('coverage')) || 0;
    const reliability = Number(searchParams.get('reliability')) || 0;
    const hasData = searchParams.get('hasData') === 'true';

    const colorMap = {
        'high': {
            stroke: '#10B981',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            label: 'Pronto',
            gradient: 'from-emerald-500 to-green-600'
        },
        'medium': {
            stroke: '#F59E0B',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
            label: 'A buon punto',
            gradient: 'from-amber-500 to-orange-500'
        },
        'low': {
            stroke: '#EF4444',
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-600 dark:text-red-400',
            label: 'Da migliorare',
            gradient: 'from-red-500 to-rose-600'
        }
    };

    const currentTheme = colorMap[level as keyof typeof colorMap] || colorMap['low'];

    return (
        <div className="min-h-screen bg-[var(--background)] pb-24">
            <SEOHead
                title="Livello di Preparazione | Idoneo"
                description="Scopri il tuo livello di preparazione per il concorso basato sulle tue simulazioni."
                url="/preparazione"
            />

            {/* Header */}
            <div className="bg-[var(--card)] border-b border-[var(--card-border)] pt-safe">
                <div className="px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-[var(--foreground)]">Livello di Preparazione</h1>
                </div>
            </div>

            <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
                {/* Hero Section with Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--card)] rounded-[28px] p-6 border border-[var(--card-border)] shadow-sm relative overflow-hidden"
                >
                    {/* Background gradient */}
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${currentTheme.gradient} opacity-10 rounded-bl-[100px]`} />

                    <div className="relative z-10 flex items-center gap-6">
                        {/* Radial Gauge */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-slate-100 dark:text-slate-800"
                                />
                                <motion.circle
                                    initial={{ strokeDasharray: 250, strokeDashoffset: 250 }}
                                    animate={{ strokeDashoffset: 250 - (score / 100) * 250 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke={currentTheme.stroke}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    fill="transparent"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${currentTheme.text}`}>
                                    {hasData ? Math.round(score) : '—'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">/100</span>
                            </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <div className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentTheme.bg} ${currentTheme.text} mb-2`}>
                                {currentTheme.label}
                            </div>
                            <h2 className="text-xl font-black text-[var(--foreground)] mb-1 leading-tight">
                                {level === 'high' ? 'Sei pronto!' : level === 'medium' ? 'A buon punto' : 'Continua ad allenarti'}
                            </h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                                {level === 'high' ? 'Ottima preparazione. Sei pronto per la prova ufficiale.' :
                                    level === 'medium' ? 'Continua così, manca poco per l\'eccellenza.' :
                                        'Serve più allenamento. Non mollare!'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Explanation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[var(--card)] rounded-[24px] p-5 border border-[var(--card-border)] shadow-sm"
                >
                    <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Il nostro algoritmo analizza le tue ultime simulazioni per calcolare quanto sei pronto per l'esame ufficiale.
                    </p>
                </motion.div>

                {/* Levels */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <div className={`p-4 rounded-2xl flex items-center gap-4 border ${level === 'high' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-[var(--card)] border-[var(--card-border)]'}`}>
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-[var(--foreground)]">Pronto</h4>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">Media superiore a 90/100.</p>
                        </div>
                        {level === 'high' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                    </div>

                    <div className={`p-4 rounded-2xl flex items-center gap-4 border ${level === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-[var(--card)] border-[var(--card-border)]'}`}>
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-[var(--foreground)]">A buon punto</h4>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">Media tra 70/100 e 90/100.</p>
                        </div>
                        {level === 'medium' && <CheckCircle2 className="w-6 h-6 text-amber-500" />}
                    </div>

                    <div className={`p-4 rounded-2xl flex items-center gap-4 border ${level === 'low' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-[var(--card)] border-[var(--card-border)]'}`}>
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-[var(--foreground)]">Da migliorare</h4>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">Media inferiore a 70/100.</p>
                        </div>
                        {level === 'low' && <CheckCircle2 className="w-6 h-6 text-red-500" />}
                    </div>
                </motion.div>

                {/* Detailed Breakdown */}
                {hasData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[var(--card)] rounded-[24px] p-5 border border-[var(--card-border)] shadow-sm"
                    >
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Analisi Dettagliata</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Accuratezza', value: accuracy, color: 'bg-emerald-500' },
                                { label: 'Volume (Risposte Corrette)', value: volume, color: 'bg-blue-500' },
                                { label: 'Copertura Banca Dati', value: coverage, color: 'bg-purple-500' },
                                { label: 'Costanza (Reliability)', value: reliability, color: 'bg-amber-500' },
                            ].map((factor) => (
                                <div key={factor.label} className="space-y-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-slate-600 dark:text-slate-300">{factor.label}</span>
                                        <span className="text-[var(--foreground)]">{Math.round(factor.value)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${factor.value}%` }}
                                            transition={{ duration: 0.8, delay: 0.5 }}
                                            className={`h-full ${factor.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Link to Scoring Explanation */}
                <motion.a
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    href="/come-funziona/punteggi"
                    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#00B1FF]/10 to-emerald-500/10 hover:from-[#00B1FF]/20 hover:to-emerald-500/20 transition-colors group border border-[#00B1FF]/20"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00B1FF]/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-[#00B1FF]" />
                        </div>
                        <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                            Scopri come calcoliamo i punteggi
                        </span>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </motion.a>

                {/* Footer Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4"
                >
                    <p className="text-[12px] text-slate-400 text-center">
                        Il calcolo si attiva dopo almeno <span className="font-bold text-slate-600 dark:text-slate-300">3 simulazioni</span> completate.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
