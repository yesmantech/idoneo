import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// Stats Service
import {
    statsService,
    calculateTrends,
    analyzeSubjectPerformance,
    generateRecommendations,
    calculateReadinessLevel,
    type AttemptWithDetails,
    type Recommendation
} from "@/lib/statsService";

// Components
import StatsKPIGrid from "@/components/stats/StatsKPIGrid";
import SubjectRadarChart from "@/components/stats/SubjectRadarChart";
import AttemptsHistoryTable from "@/components/stats/AttemptsHistoryTable";
import ProgressLineChart from "@/components/stats/ProgressLineChart";
import CoachingBlock from "@/components/stats/CoachingBlock";
import GoalsBlock from "@/components/stats/GoalsBlock";
import SubjectDetailSheet from "@/components/stats/SubjectDetailSheet";
import GoalCreationModal from "@/components/stats/GoalCreationModal";
import { type SubjectPerformance } from "@/lib/statsService";

export default function QuizStatsPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);

    // Metrics
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        avgAccuracy: 0,
        bestScore: 0
    });

    // Trends
    const [scoreTrend, setScoreTrend] = useState<any>(null);
    const [accuracyTrend, setAccuracyTrend] = useState<any>(null);
    const [readiness, setReadiness] = useState<any>(null);

    // Recommendations
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

    // Goals
    const [goal, setGoal] = useState<any>(null);
    const [goalModalOpen, setGoalModalOpen] = useState(false);

    // Subject Drill-Down
    const [selectedSubject, setSelectedSubject] = useState<SubjectPerformance | null>(null);
    const [subjectPerformanceData, setSubjectPerformanceData] = useState<SubjectPerformance[]>([]);

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
            .select(`*, quiz:quizzes(title), mode`)
            .eq("user_id", user.id)
            .eq("quiz_id", quizId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
        } else if (data) {
            processData(data as AttemptWithDetails[]);
        }

        // Fetch Goal (if exists)
        const { data: goalData } = await supabase
            .from("test_goals")
            .select("*")
            .eq("user_id", user.id)
            .eq("quiz_id", quizId)
            .eq("status", "active")
            .single();

        if (goalData) setGoal(goalData);

        setLoading(false);
    };

    const processData = (data: AttemptWithDetails[]) => {
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

        const avgScore = totalTests ? totalScore / totalTests : 0;
        const avgAccuracy = validAccuracyCount ? (totalAccuracy / validAccuracyCount) * 100 : 0;

        setStats({
            totalTests,
            avgScore,
            avgAccuracy,
            bestScore: maxScore
        });

        // 2. Calculate Trends
        if (totalTests >= 3) {
            const trends = calculateTrends(data, 7);
            setScoreTrend(trends.scoreTrend);
            setAccuracyTrend(trends.accuracyTrend);
        }

        // 3. Calculate Readiness
        if (totalTests >= 5) {
            const readinessData = calculateReadinessLevel(avgScore, avgAccuracy, totalTests);
            setReadiness(readinessData);
        }

        // 4. Subject Analysis
        const subjPerf = analyzeSubjectPerformance(data);
        setSubjectPerformanceData(subjPerf);
        const radarData = subjPerf.map(s => ({
            subject: s.subjectName,
            accuracy: s.accuracy,
            total: s.totalQuestions
        }));
        setSubjectData(radarData);

        // 5. Generate Recommendations
        const recs = generateRecommendations(data, subjPerf, quizId || '');
        setRecommendations(recs);

        // 6. Trend Data (Reverse chronological for chart) - Enhanced format
        const trend = [...data].reverse().map(d => {
            const acc = d.total_questions > 0 ? (d.correct / d.total_questions) * 100 : 0;
            return {
                id: d.id,
                date: new Date(d.created_at).toLocaleDateString(),
                fullDate: new Date(d.created_at),
                score: d.score || 0,
                accuracy: acc
            };
        });
        setTrendData(trend);
    };

    const handleSetGoal = () => {
        setGoalModalOpen(true);
    };

    const handleCreateGoal = async (goalData: { goal_type: string; target_value: number; deadline: string | null }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('test_goals')
            .insert({
                user_id: user.id,
                quiz_id: quizId,
                goal_type: goalData.goal_type,
                target_value: goalData.target_value,
                deadline: goalData.deadline,
                status: 'active'
            })
            .select()
            .single();

        if (!error && data) {
            setGoal(data);
            setGoalModalOpen(false);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        const { error } = await supabase
            .from("test_goals")
            .delete()
            .eq("id", goalId);

        if (!error) {
            setGoal(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-canvas-light flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-cyan mx-auto mb-4"></div>
                <p className="text-text-tertiary font-bold">Caricamento statistiche...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-canvas-light text-text-primary pb-24 md:px-8 md:py-8">
            <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-0 pt-6 md:pt-0">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/profile")} className="p-3 bg-white rounded-squircle shadow-soft hover:shadow-card hover:scale-105 transition-all text-text-secondary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary leading-tight">{quizTitle}</h1>
                        <p className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Statistiche Dettagliate</p>
                    </div>
                </div>

                {/* 1. KPIs with Trends */}
                <StatsKPIGrid
                    totalTests={stats.totalTests}
                    bestScore={stats.bestScore}
                    avgScore={stats.avgScore}
                    accuracy={stats.avgAccuracy}
                    scoreTrend={scoreTrend}
                    accuracyTrend={accuracyTrend}
                    readiness={readiness}
                />

                {/* 2. Coaching Block */}
                {recommendations.length > 0 && (
                    <CoachingBlock
                        recommendations={recommendations}
                        onSetGoal={handleSetGoal}
                    />
                )}

                {/* 3. Main Performance Area (Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Radar Chart + Goals */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white p-6 rounded-card shadow-soft flex flex-col items-center">
                            <h3 className="text-lg font-bold text-text-primary mb-6 w-full">Performance per Materia</h3>
                            <SubjectRadarChart data={subjectData} />

                            <div className="mt-8 w-full">
                                <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Dettaglio Materie</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                                    {subjectData.map((s, idx) => {
                                        const status = s.accuracy >= 70 ? 'good' : s.accuracy >= 50 ? 'warning' : 'critical';
                                        const statusColor = status === 'good' ? 'bg-semantic-success' : status === 'warning' ? 'bg-brand-orange' : 'bg-semantic-error';
                                        const perfData = subjectPerformanceData[idx];

                                        return (
                                            <button
                                                key={s.subject}
                                                onClick={() => perfData && setSelectedSubject(perfData)}
                                                className="w-full flex justify-between items-center text-sm border-b border-canvas-light pb-2 group cursor-pointer hover:bg-canvas-light/50 -mx-2 px-2 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                                    <span className="font-bold text-text-secondary truncate max-w-[120px]" title={s.subject}>{s.subject}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-text-tertiary">({s.total})</span>
                                                    <span className={`font-black ${s.accuracy > 70 ? 'text-semantic-success' : s.accuracy > 50 ? 'text-brand-orange' : 'text-semantic-error'}`}>
                                                        {s.accuracy.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Goals Block */}
                        <GoalsBlock
                            goal={goal}
                            onCreateGoal={handleSetGoal}
                            onDeleteGoal={handleDeleteGoal}
                        />
                    </div>

                    {/* Right: Trend & History */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Trend Chart */}
                        <div className="bg-white p-6 rounded-card shadow-soft">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Andamento nel Tempo</h3>
                            <ProgressLineChart data={trendData} />
                        </div>

                        {/* History Table */}
                        <div className="bg-white p-6 rounded-card shadow-soft">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-text-primary">Cronologia Tentativi</h3>
                                <span className="text-[10px] font-bold bg-canvas-light text-text-tertiary px-3 py-1.5 rounded-pill uppercase tracking-wider">Ultimi 50</span>
                            </div>
                            <AttemptsHistoryTable attempts={attempts} quizId={quizId} />
                        </div>

                    </div>
                </div>

            </div>

            {/* Subject Detail Sheet */}
            <SubjectDetailSheet
                subject={selectedSubject}
                quizId={quizId || ''}
                onClose={() => setSelectedSubject(null)}
            />

            {/* Goal Creation Modal */}
            <GoalCreationModal
                isOpen={goalModalOpen}
                quizId={quizId || ''}
                onClose={() => setGoalModalOpen(false)}
                onSubmit={handleCreateGoal}
            />
        </div>
    );
}
