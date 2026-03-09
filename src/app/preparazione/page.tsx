
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trophy, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Info, X, Sparkles } from 'lucide-react';
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
    const [showInfoModal, setShowInfoModal] = useState(false);

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
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-[#111]/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-[var(--foreground)]">Livello di Preparazione</h1>
                </div>
            </div>

            <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
                {/* Hero Section — Speedometer Gauge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--card)] rounded-[28px] p-6 pt-8 pb-6 border border-[var(--card-border)] shadow-soft relative overflow-hidden"
                >
                    {/* Subtle ambient glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20"
                        style={{ background: currentTheme.stroke }}
                    />

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Label */}
                        <div className="flex items-center gap-1.5 mb-6">
                            <span className="text-[11px] font-black text-[var(--foreground)] opacity-40 uppercase tracking-[0.2em]">
                                Preparazione
                            </span>
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#111] flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Info className="w-3 h-3 text-slate-400" />
                            </button>
                        </div>

                        {/* Speedometer Gauge */}
                        <div className="relative w-[220px] h-[130px] mb-2">
                            <svg viewBox="0 0 220 130" className="w-full h-full overflow-visible">
                                <defs>
                                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#EF4444" />
                                        <stop offset="35%" stopColor="#F59E0B" />
                                        <stop offset="65%" stopColor="#F59E0B" />
                                        <stop offset="100%" stopColor="#10B981" />
                                    </linearGradient>
                                </defs>

                                {/* Background track */}
                                <path
                                    d="M 20 120 A 90 90 0 0 1 200 120"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                    className="text-slate-100 dark:text-[#111]"
                                />

                                {/* Gradient arc */}
                                <motion.path
                                    d="M 20 120 A 90 90 0 0 1 200 120"
                                    fill="none"
                                    stroke="url(#gaugeGradient)"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: Math.max(score / 100, 0.02) }}
                                    transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{ filter: `drop-shadow(0 0 6px ${currentTheme.stroke}40)` }}
                                />

                                {/* Needle indicator */}
                                <motion.g
                                    initial={{ rotate: -180 }}
                                    animate={{ rotate: -180 + (score / 100) * 180 }}
                                    transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    style={{ transformOrigin: '110px 120px' }}
                                >
                                    <circle cx="110" cy="30" r="6" fill={currentTheme.stroke} />
                                    <circle cx="110" cy="30" r="3" fill="var(--card)" />
                                </motion.g>
                            </svg>

                            {/* Score in center */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                    className="text-[52px] font-black text-[var(--foreground)] leading-none tracking-tight"
                                >
                                    {hasData ? Math.round(score) : '0'}%
                                </motion.span>
                            </div>
                        </div>

                        {/* Level badge + subtitle */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex flex-col items-center gap-2 mt-2"
                        >
                            <div className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${currentTheme.bg} ${currentTheme.text}`}>
                                {currentTheme.label}
                            </div>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center max-w-[240px] leading-snug">
                                {level === 'high' ? 'Sei pronto per la prova ufficiale.' :
                                    level === 'medium' ? 'Manca poco per l\'eccellenza.' :
                                        'Serve più allenamento. Non mollare!'}
                            </p>
                        </motion.div>

                        {/* Divider + Description */}
                        <div className="w-full mt-5 pt-5 border-t border-[var(--card-border)]">
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                                Il nostro algoritmo analizza le tue ultime simulazioni per calcolare quanto sei pronto per l'esame ufficiale.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Levels */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    {[
                        { key: 'high', label: 'Pronto', desc: 'Media superiore al 90%.', icon: Trophy, iconColor: 'text-emerald-500 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', activeBorder: 'border-emerald-400 dark:border-emerald-500/40', activeBg: 'bg-emerald-50/50 dark:bg-emerald-900/10' },
                        { key: 'medium', label: 'A buon punto', desc: 'Media tra 70% e 90%.', icon: TrendingUp, iconColor: 'text-amber-500 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-500/10', activeBorder: 'border-amber-400 dark:border-amber-500/40', activeBg: 'bg-amber-50/50 dark:bg-amber-900/10' },
                        { key: 'low', label: 'Da migliorare', desc: 'Media inferiore al 70%.', icon: AlertTriangle, iconColor: 'text-red-500 dark:text-red-400', iconBg: 'bg-red-50 dark:bg-red-500/10', activeBorder: 'border-red-400 dark:border-red-500/40', activeBg: 'bg-red-50/50 dark:bg-red-900/10' },
                    ].map((item) => {
                        const isActive = level === item.key;
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className={`rounded-[20px] p-4 flex items-center gap-4 border transition-all
                                    ${isActive
                                        ? `${item.activeBg} ${item.activeBorder} shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none`
                                        : 'bg-white dark:bg-[#1C1C1E] border-slate-100/50 dark:border-white/[0.04] opacity-50'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-6 h-6 ${item.iconColor}`} strokeWidth={1.8} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white">{item.label}</h4>
                                    <p className="text-[13px] text-slate-500 dark:text-white/40">{item.desc}</p>
                                </div>
                                {isActive && <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${item.iconColor}`} />}
                            </div>
                        );
                    })}
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
                                { label: 'Volume (Domande Totali)', value: volume, color: 'bg-blue-500' },
                                { label: 'Copertura Banca Dati', value: coverage, color: 'bg-purple-500' },
                                { label: 'Costanza (Reliability)', value: reliability, color: 'bg-amber-500' },
                            ].map((factor) => (
                                <div key={factor.label} className="space-y-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-slate-600 dark:text-slate-300">{factor.label}</span>
                                        <span className="text-[var(--foreground)]">{Math.round(factor.value)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-[#111] rounded-full overflow-hidden">
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

            {/* Algorithm Info Modal */}
            <AnimatePresence>
                {showInfoModal && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInfoModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-[var(--background)] rounded-[32px] shadow-2xl overflow-hidden border border-[var(--card-border)]"
                        >
                            <div className="p-6 pb-8">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-brand-blue" />
                                        </div>
                                        <h3 className="text-[18px] font-black text-[var(--foreground)] tracking-tight">
                                            Come calcoliamo il punteggio
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setShowInfoModal(false)}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#111] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                                    Il punteggio è calcolato con <span className="font-bold text-[var(--foreground)]">3 fattori</span> (33.33% ciascuno), tutti moltiplicati per la tua <span className="font-bold text-[var(--foreground)]">Accuratezza</span> (da 0 a 1).
                                </p>

                                {/* Factors */}
                                <div className="space-y-3">
                                    {[
                                        { label: 'Volume', desc: 'Domande totali risposte rispetto alla banca dati. Più ti alleni, più sale.', color: 'blue', weight: '33.33%' },
                                        { label: 'Copertura', desc: 'Domande uniche risposte correttamente. Ripetere le stesse o sbagliare non aumenta la copertura.', color: 'purple', weight: '33.33%' },
                                        { label: 'Costanza', desc: 'Stabilità dei risultati nelle ultime 10 simulazioni. Decade dopo 30 giorni di inattività.', color: 'amber', weight: '33.33%' },
                                    ].map((factor) => (
                                        <div key={factor.label} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111]/50 border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2.5 h-2.5 rounded-full bg-${factor.color}-500`} />
                                                <h4 className="text-[13px] font-black text-[var(--foreground)] flex-1">{factor.label}</h4>
                                                <span className="text-[11px] font-bold text-slate-400">{factor.weight}</span>
                                            </div>
                                            <p className="text-[12px] text-slate-400 mt-1 pl-5 leading-snug">{factor.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-4 border-t border-[var(--card-border)]">
                                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                                        Formula: <span className="font-bold text-slate-600 dark:text-slate-300">(V×0.33 + C×0.33 + R×0.33) × Accuratezza</span>. L'accuratezza è una <span className="font-bold text-slate-600 dark:text-slate-300">media pesata</span> — le ultime simulazioni contano di più.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowInfoModal(false)}
                                    className="w-full mt-4 py-3.5 bg-brand-blue text-white rounded-2xl font-black text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
                                >
                                    Ho capito
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
