import React, { useEffect, useState } from 'react';
import {
    AdminLayout,
    AdminPageHeader,
    AIInsightCard,
    LiveMetricsCard,
    PowerUsersCard,
    QuickActionsPanel
} from '@/components/admin';
import { adminAnalytics, GrowthStats, QuizPerformance } from '@/lib/adminAnalytics';
import { insightService, Insight } from '@/lib/insightService';
import {
    TrendingUp,
    Sparkles,
    ArrowRight,
    Search,
    AlertTriangle,
    RefreshCw,
    Clock,
    X,
    Command
} from 'lucide-react';

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<GrowthStats | null>(null);
    const [performance, setPerformance] = useState<QuizPerformance[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [pastedData, setPastedData] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [s, p, i] = await Promise.all([
                    adminAnalytics.getGrowthStats(),
                    adminAnalytics.getQuizPerformance(),
                    insightService.getActiveInsights()
                ]);
                setStats(s);
                setPerformance(p);
                setInsights(i);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleGenerateInsights = async () => {
        setInsightsLoading(true);
        try {
            console.log('AdminAnalyticsPage: Generating insights...');
            const newInsights = await insightService.generateInsights();
            console.log('AdminAnalyticsPage: Insights generated:', newInsights.length);
            setInsights(newInsights);
            if (newInsights.length === 0) {
                alert("Analisi completata, ma non sono stati rilevati nuovi insight significativi con i dati attuali.");
            }
        } catch (err: any) {
            console.error('Failed to generate insights:', err);
            alert(`Errore nella generazione degli insight: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setInsightsLoading(false);
        }
    };

    const handleDismissInsight = async (id: string) => {
        await insightService.dismissInsight(id);
        setInsights(prev => prev.filter(i => i.id !== id));
    };

    const handleAnalyze = async () => {
        if (!pastedData.trim()) return;
        setIsAnalyzing(true);
        try {
            console.log('AdminAnalyticsPage: Analyzing pasted data...');
            const newInsights = await insightService.generateInsights();
            setInsights(newInsights);
            alert("Analisi completata con successo!");
        } catch (err: any) {
            console.error('Failed to analyze:', err);
            alert(`Errore nell'analisi: ${err.message || 'Errore sconosciuto'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <AdminLayout>
            {/* Command Center Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Command className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Command Center
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Il tuo quartier generale AI-powered
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sistema Operativo</span>
                </div>
            </div>

            {/* LIVE METRICS - Full Width */}
            <LiveMetricsCard />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Performance Chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Performance per Quiz</h3>
                                    <p className="text-xs text-slate-500">Tasso di successo delle principali simulazioni</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {performance.map((p, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{p.quizTitle}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(p.successRate)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${p.successRate}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-3 mt-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                        <span>{p.attemptsCount} tentativi</span>
                                        <span>•</span>
                                        <span className={p.successRate >= 60 ? 'text-emerald-500' : p.successRate >= 40 ? 'text-amber-500' : 'text-rose-500'}>
                                            {p.successRate >= 60 ? 'Ottimo' : p.successRate >= 40 ? 'Nella Media' : 'Critico'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {performance.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Nessun dato di performance disponibile</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <QuickActionsPanel />

                    {/* GA4 Analyzer */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-[24px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Sparkles className="w-32 h-32 text-slate-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <Search className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">AI Data Analyzer</h3>
                                <p className="text-xs text-slate-500">Incolla dati GA4 o metriche per analisi AI</p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <textarea
                                className="w-full h-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-mono mb-3 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none"
                                placeholder='Incolla qui i dati JSON di GA4 o report tabulari...'
                                value={pastedData}
                                onChange={(e) => setPastedData(e.target.value)}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={!pastedData || isAnalyzing}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${!pastedData || isAnalyzing
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                                    }`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Analisi in corso...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Analizza con AI
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3 width) */}
                <div className="space-y-6">

                    {/* Power Users */}
                    <PowerUsersCard />

                    {/* AI Insights */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">AI Insights</h3>
                            </div>
                            <button
                                onClick={handleGenerateInsights}
                                disabled={insightsLoading}
                                className="text-xs font-bold text-cyan-500 flex items-center gap-1 hover:text-cyan-400 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                                Rigenera
                            </button>
                        </div>

                        {/* Dynamic Insights */}
                        {insights.length === 0 && !insightsLoading && (
                            <div className="text-center py-6 text-slate-400">
                                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Nessun insight attivo.</p>
                                <button
                                    onClick={handleGenerateInsights}
                                    className="mt-2 text-sm font-bold text-cyan-500 hover:underline"
                                >
                                    Genera insight
                                </button>
                            </div>
                        )}

                        {insightsLoading && (
                            <div className="text-center py-6">
                                <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs text-slate-400">Analizzando...</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {insights.slice(0, 3).map((insight) => (
                                <div key={insight.id} className="relative group">
                                    <AIInsightCard
                                        title={insight.title}
                                        description={insight.description}
                                        priority={insight.priority as 'high' | 'medium' | 'low'}
                                        trend={insight.trend as 'up' | 'down' | undefined}
                                        recommendation={insight.recommendation || undefined}
                                    />
                                    <button
                                        onClick={() => handleDismissInsight(insight.id)}
                                        className="absolute top-2 right-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-600"
                                        title="Nascondi"
                                    >
                                        <X className="w-3 h-3 text-slate-500" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Tip Box */}
                        <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Gli insight sono generati automaticamente dai dati del database.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}


