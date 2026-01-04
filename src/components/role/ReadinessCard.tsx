
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, AlertTriangle, X, Info, CheckCircle2 } from 'lucide-react';
import { calculateReadinessLevel } from '@/lib/statsService';

interface ReadinessCardProps {
    history: any[];
    theme: any;
}

export default function ReadinessCard({ history, theme }: ReadinessCardProps) {
    const [showModal, setShowModal] = useState(false);

    const stats = useMemo(() => {
        if (!history || history.length < 3) return null;

        const totalTests = history.length;
        const totalScore = history.reduce((acc, curr) => acc + (curr.score || 0), 0);

        const avgScore = totalTests ? totalScore / totalTests : 0;

        // Mock accuracy if missing (history from role hub is simplified)
        const normalizedAvg = (avgScore / 30) * 100;

        return calculateReadinessLevel(normalizedAvg, normalizedAvg, totalTests);
    }, [history]);

    if (!stats) {
        // Empty State (Tier S) - Also Clickable now to explain what to do
        return (
            <>
                <div
                    onClick={() => setShowModal(true)}
                    className="group relative bg-white dark:bg-[var(--card)] p-6 rounded-[32px] shadow-soft border border-[var(--card-border)] overflow-hidden min-h-[140px] flex items-center cursor-pointer hover:scale-[1.01] transition-transform active:scale-[0.99]"
                >
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${theme.gradient} opacity-[0.05] rounded-bl-[100px] pointer-events-none`} />

                    <div className="flex items-center justify-between relative z-10 w-full">
                        <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    Da iniziare
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-[var(--foreground)] mb-1 leading-tight">
                                Analisi in attesa...
                            </h3>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-snug">
                                Completa almeno 3 simulazioni per sbloccare il calcolo del livello di preparazione.
                            </p>
                        </div>
                        <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                            <Trophy className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                    </div>
                </div>

                <ReadinessInfoModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    theme={theme}
                    stats={null}
                />
            </>
        );
    }

    const { level, label, color } = stats;

    const colorMap = {
        'semantic-success': { stroke: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        'brand-orange': { stroke: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
        'semantic-error': { stroke: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
    };

    const currentTheme = colorMap[color as keyof typeof colorMap] || colorMap['brand-orange'];

    // Determine score for circle (0-100)
    const percentage = level === 'high' ? 92 : level === 'medium' ? 65 : 35;

    return (
        <>
            <div
                onClick={() => setShowModal(true)}
                className="group relative bg-white dark:bg-[var(--card)] p-6 rounded-[32px] shadow-soft border border-[var(--card-border)] overflow-hidden cursor-pointer hover:border-[#00B1FF]/30 transition-colors"
            >
                {/* Background Decorator */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${theme.gradient} opacity-[0.05] rounded-bl-[100px] pointer-events-none`} />

                <div className="flex items-center justify-between relative z-10">

                    {/* Text Content */}
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentTheme.bg} ${currentTheme.text}`}>
                                {label}
                            </div>
                            <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Info className="w-2.5 h-2.5" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-[var(--foreground)] mb-1 leading-tight">
                            Sei {level === 'high' ? 'pronto!' : level === 'medium' ? 'buon punto' : 'all\'inizio'}
                        </h3>
                        <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-snug">
                            {level === 'high' ? 'Ottima costanza. Sei pronto per la prova ufficiale.' :
                                level === 'medium' ? 'Continua così, manca poco per l\'eccellenza.' :
                                    'Serve più allenamento. Non mollare!'}
                        </p>
                    </div>

                    {/* Radial Gauge */}
                    <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                        {/* SVG Circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="32"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                className="text-slate-100 dark:text-slate-800"
                            />
                            <motion.circle
                                initial={{ strokeDasharray: 200, strokeDashoffset: 200 }}
                                animate={{ strokeDashoffset: 200 - (percentage / 100) * 200 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="40"
                                cy="40"
                                r="32"
                                stroke={currentTheme.stroke}
                                strokeWidth="6"
                                strokeLinecap="round"
                                fill="transparent"
                            />
                        </svg>

                        {/* Icon in Center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {level === 'high' ? <Trophy className={`w-6 h-6 ${currentTheme.text}`} /> :
                                level === 'medium' ? <TrendingUp className={`w-6 h-6 ${currentTheme.text}`} /> :
                                    <AlertTriangle className={`w-6 h-6 ${currentTheme.text}`} />}
                        </div>
                    </div>
                </div>
            </div>

            <ReadinessInfoModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                theme={theme}
                stats={stats}
            />
        </>
    );
}

function ReadinessInfoModal({ isOpen, onClose, theme, stats }: { isOpen: boolean, onClose: () => void, theme: any, stats: any }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white dark:bg-[var(--card)] border border-transparent dark:border-[var(--card-border)] rounded-[32px] p-6 max-w-sm w-full shadow-2xl overflow-hidden"
                    >
                        {/* Decorator */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.gradient} opacity-[0.1] rounded-bl-[100px] pointer-events-none`} />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-slate-900 dark:text-[var(--foreground)] mb-2">
                                Livello di Preparazione
                            </h3>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                Il nostro algoritmo analizza le tue ultime simulazioni per calcolare quanto sei pronto per l'esame ufficiale.
                            </p>

                            <div className="space-y-4">
                                {/* Levels */}
                                <div className={`p-3 rounded-2xl flex items-center gap-3 border ${stats?.level === 'high' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                                        <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-200">Pronto</h4>
                                        <p className="text-[12px] text-slate-500 dark:text-slate-400">Media superiore a 27/30.</p>
                                    </div>
                                    {stats?.level === 'high' && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                                </div>

                                <div className={`p-3 rounded-2xl flex items-center gap-3 border ${stats?.level === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-200">A buon punto</h4>
                                        <p className="text-[12px] text-slate-500 dark:text-slate-400">Media tra 21/30 e 27/30.</p>
                                    </div>
                                    {stats?.level === 'medium' && <CheckCircle2 className="w-5 h-5 text-amber-500 ml-auto" />}
                                </div>

                                <div className={`p-3 rounded-2xl flex items-center gap-3 border ${stats?.level === 'low' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-bold text-slate-900 dark:text-slate-200">Da migliorare</h4>
                                        <p className="text-[12px] text-slate-500 dark:text-slate-400">Media inferiore a 21/30.</p>
                                    </div>
                                    {stats?.level === 'low' && <CheckCircle2 className="w-5 h-5 text-red-500 ml-auto" />}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[12px] text-slate-400 text-center">
                                    Il calcolo si attiva dopo almeno <span className="font-bold text-slate-600 dark:text-slate-300">3 simulazioni</span> completate.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full mt-4 py-3 bg-slate-900 dark:bg-[var(--foreground)] text-white dark:text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-opacity"
                            >
                                Chiaro!
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
