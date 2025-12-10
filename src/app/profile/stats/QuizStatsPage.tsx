import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// New Components
import StatsKPIGrid from "@/components/stats/StatsKPIGrid";
import SubjectRadarChart from "@/components/stats/SubjectRadarChart";
import AttemptsHistoryTable from "@/components/stats/AttemptsHistoryTable";
import ProgressLineChart from "@/components/stats/ProgressLineChart";

export default function QuizStatsPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState<any[]>([]);

    // Metrics
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        avgAccuracy: 0,
        bestScore: 0
    });

    const [subjectData, setSubjectData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [quizTitle, setQuizTitle] = useState("Statistiche Corso");

    useEffect(() => {
        if (quizId) loadStats();
    }, [quizId]);

    const loadStats = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch Quiz Title
        const { data: quizData } = await supabase.from('quizzes').select('title').eq('id', quizId).single();
        if (quizData) setQuizTitle(quizData.title);

        // Fetch Attempts
        const { data, error } = await supabase
            .from("quiz_attempts")
            .select(`*, quiz:quizzes(title)`)
            .eq("user_id", user.id)
            .eq("quiz_id", quizId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
        } else if (data) {
            processData(data);
        }
        setLoading(false);
    };

    const processData = (data: any[]) => {
        setAttempts(data);

        // 1. KPIs
        const totalTests = data.length;
        const totalScore = data.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const maxScore = data.reduce((max, curr) => Math.max(max, curr.score || 0), 0);

        let validAccuracyCount = 0;
        const totalAccuracy = data.reduce((acc, curr) => {
            if (!curr.total_questions) return acc;
            validAccuracyCount++;
            return acc + ((curr.correct || 0) / curr.total_questions);
        }, 0);

        setStats({
            totalTests,
            avgScore: totalTests ? totalScore / totalTests : 0,
            avgAccuracy: validAccuracyCount ? (totalAccuracy / validAccuracyCount) * 100 : 0,
            bestScore: maxScore
        });

        // 2. Trend Data (Reverse chronological for chart)
        const trend = [...data].reverse().map(d => ({
            date: new Date(d.created_at).toLocaleDateString(),
            score: d.score || 0
        }));
        setTrendData(trend);

        // 3. Subject Analysis
        const subjMap: Record<string, { correct: number, total: number }> = {};
        data.forEach(att => {
            if (Array.isArray(att.answers)) {
                att.answers.forEach((ans: any) => {
                    const name = ans.subjectName || "Generale";
                    if (!subjMap[name]) subjMap[name] = { correct: 0, total: 0 };
                    subjMap[name].total++;
                    if (ans.isCorrect) subjMap[name].correct++;
                });
            }
        });

        const subjPerf = Object.entries(subjMap).map(([name, s]) => ({
            subject: name,
            accuracy: (s.correct / s.total) * 100,
            total: s.total
        })).sort((a, b) => b.accuracy - a.accuracy); // Descending

        setSubjectData(subjPerf);
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Caricamento statistiche...</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:px-8 md:py-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/profile")} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-100 border border-slate-200 transition-colors">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">{quizTitle}</h1>
                        <p className="text-sm font-medium text-slate-500">Statistiche Dettagliate</p>
                    </div>
                </div>

                {/* 1. KPIs */}
                <StatsKPIGrid
                    totalTests={stats.totalTests}
                    bestScore={stats.bestScore}
                    avgScore={stats.avgScore}
                    accuracy={stats.avgAccuracy}
                />

                {/* 2. Main Performance Area (Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Radar Chart */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 w-full">Performance per Materia</h3>
                        <SubjectRadarChart data={subjectData} />

                        <div className="mt-8 w-full">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Dettaglio Materie</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                                {subjectData.map(s => (
                                    <div key={s.subject} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                        <span className="font-medium text-slate-700 truncate max-w-[150px]" title={s.subject}>{s.subject}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">({s.total} quiz)</span>
                                            <span className={`font-bold ${s.accuracy > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {s.accuracy.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Trend & History */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Trend Chart */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Andamento nel Tempo</h3>
                            <ProgressLineChart data={trendData} />
                        </div>

                        {/* History Table */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Cronologia Tentativi</h3>
                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">Ultimi 50</span>
                            </div>
                            <AttemptsHistoryTable attempts={attempts} />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
