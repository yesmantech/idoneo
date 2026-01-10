import React, { useEffect, useState } from 'react';
import { AdminLayout, AdminPageHeader, AIInsightCard } from '@/components/admin';
import { adminAnalytics, GrowthStats, QuizPerformance } from '@/lib/adminAnalytics';
import {
    Users,
    Play,
    CheckCircle2,
    TrendingUp,
    Sparkles,
    ClipboardList,
    BarChart3,
    ArrowRight,
    Search,
    AlertTriangle
} from 'lucide-react';

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<GrowthStats | null>(null);
    const [performance, setPerformance] = useState<QuizPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [pastedData, setPastedData] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [s, p] = await Promise.all([
                    adminAnalytics.getGrowthStats(),
                    adminAnalytics.getQuizPerformance()
                ]);
                setStats(s);
                setPerformance(p);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        // Simulate AI analysis delay
        setTimeout(() => {
            setIsAnalyzing(false);
            alert("Analisi completata! Ho aggiunto nuovi suggerimenti basati sui tuoi dati.");
        }, 1500);
    };

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Analisi & AI Insights"
                subtitle="Dati in tempo reale e suggerimenti strategici"
            />

            {/* HIGH LEVEL KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 opacity-60 text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span className="text-[13px] font-semibold uppercase tracking-wider">Utenti Totali</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalUsers || 0}</span>
                        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full">+12%</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 opacity-60 text-slate-600 dark:text-slate-400">
                        <Play className="w-4 h-4" />
                        <span className="text-[13px] font-semibold uppercase tracking-wider">Simulazioni</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalAttempts || 0}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 opacity-60 text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[13px] font-semibold uppercase tracking-wider">Completamento</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(stats?.completionRate || 0)}%</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-3 mb-2 opacity-60 text-slate-600 dark:text-slate-400">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[13px] font-semibold uppercase tracking-wider">Conversione</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">18.4%</span>
                        <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold px-2 py-0.5 rounded-full">-2.4%</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: PERFORMANCE & ANALYZER */}
                <div className="lg:col-span-2 space-y-8">
                    {/* PERFORMANCE CHART SIMULATION */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Performance per Concorso
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tasso di superamento per le principali categorie</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {performance.map((p, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{p.quizTitle}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(p.successRate)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                            style={{ width: `${p.successRate}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                                        <span>{p.attemptsCount} tentativi questo mese</span>
                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                        <span>Target: 60%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GA4 IMPORTER */}
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border-2 border-dashed border-emerald-500/20 p-8 rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24 text-emerald-500" />
                        </div>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Google Analytics Analyzer</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Incolla i dati raw di GA4 per generare insight intelligenti</p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <textarea
                                className="w-full h-40 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs font-mono mb-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 shadow-inner"
                                placeholder='Esempio: Incolla qui il JSON degli eventi o i report tabulari...'
                                value={pastedData}
                                onChange={(e) => setPastedData(e.target.value)}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={!pastedData || isAnalyzing}
                                className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${!pastedData || isAnalyzing
                                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                    }`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analisi in corso...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Genera Insight con AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: AI INSIGHTS SIDEBAR */}
                <div className="space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 px-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        AI Insights
                    </h3>

                    <AIInsightCard
                        title="Gap di Conversione"
                        description="Molte persone cercano 'Maresciallo' ma solo il 5% avvia effettivamente la simulazione ufficiale."
                        priority="high"
                        trend="down"
                        recommendation="Il pulsante 'Avvia Prova' è troppo basso nella pagina. Spostalo sopra l'elenco delle materie."
                    />

                    <AIInsightCard
                        title="Banca Dati Incompleta"
                        description="Gli utenti cercano spesso 'Inglese' nel concorso Polizia, ma abbiamo poche domande su questo tema."
                        priority="medium"
                        recommendation="Carica almeno altre 50 domande di Inglese per il ruolo Agente per migliorare la ritenzione."
                    />

                    <AIInsightCard
                        title="Picco di Accessi"
                        description="C'è stato un aumento del 15% di nuovi iscritti dopo l'ultimo post sul blog."
                        priority="low"
                        trend="up"
                        recommendation="Crea una notifica push o un banner che punta all'articolo per massimizzare l'engagement."
                    />

                    <div className="p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-[24px]">
                        <h4 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Tip per te
                        </h4>
                        <p className="text-xs opacity-70 leading-relaxed mb-4">
                            I dati vengono aggiornati ogni ora. Scarica periodicamente i report da GA4 per avere analisi più precise.
                        </p>
                        <button className="text-xs font-bold text-cyan-400 flex items-center gap-1 hover:underline">
                            Scopri come esportare <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
