import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TierSLoader from "@/components/ui/TierSLoader";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { useOnboarding } from "@/context/OnboardingProvider";
import { useAuth } from "@/context/AuthContext";

// Info System
import InfoModal from '@/components/leaderboard/InfoModal';
import ScoreInfoPage from '@/components/leaderboard/ScoreInfoPage';

// Stats Service
import {
    statsService,
    calculateTrends,
    analyzeSubjectPerformance,
    generateRecommendations,
    calculateReadinessLevel,
    type AttemptWithDetails,
    type Recommendation,
    type SubjectPerformance
} from "@/lib/statsService";

import { useQuery } from "@tanstack/react-query";

// Components
import StatsKPIGrid from "@/components/stats/StatsKPIGrid";
import SubjectRadarChart from "@/components/stats/SubjectRadarChart";
import AttemptsHistoryTable from "@/components/stats/AttemptsHistoryTable";
import ProgressLineChart from "@/components/stats/ProgressLineChart";
import CoachingBlock from "@/components/stats/CoachingBlock";
import GoalsBlock from "@/components/stats/GoalsBlock";
import SubjectDetailSheet from "@/components/stats/SubjectDetailSheet";
import GoalCreationModal from "@/components/stats/GoalCreationModal";

export default function QuizStatsPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // React Query for Data Fetching
    const { data: fetchedData, isLoading: loading } = useQuery({
        queryKey: ['quiz-stats', quizId, user?.id],
        queryFn: async () => {
            if (!user || !quizId) return null;
            const [quizRes, attemptsRes, goalRes, leaderboardRes] = await Promise.all([
                supabase
                    .from('quizzes')
                    .select('title, total_questions, points_correct, rule_id, simulation_rule:simulation_rules(total_questions, points_correct)')
                    .eq('id', quizId)
                    .single(),
                supabase
                    .from("quiz_attempts")
                    .select(`*, quiz:quizzes(title), mode`)
                    .eq("user_id", user.id)
                    .eq("quiz_id", quizId)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("test_goals")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("quiz_id", quizId)
                    .eq("status", "active")
                    .maybeSingle(),
                supabase
                    .from('concorso_leaderboard')
                    .select('score, volume_factor, accuracy_weighted, recency_score, coverage_score, reliability')
                    .eq('user_id', user.id)
                    .eq('quiz_id', quizId)
                    .maybeSingle()
            ]);
            return {
                quiz: quizRes.data,
                attempts: attemptsRes.data,
                goal: goalRes.data,
                leaderboard: leaderboardRes.data,
                error: Object.values({ quizRes, attemptsRes, goalRes, leaderboardRes }).find(r => r.error)?.error
            };
        },
        enabled: !!user && !!quizId,
        staleTime: 1000 * 60 * 5 // 5 minutes cache
    });

    const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);

    // Info System State
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showInfoPage, setShowInfoPage] = useState(false);

    // Trends & Readiness
    const [scoreTrend, setScoreTrend] = useState<any>(null);
    const [accuracyTrend, setAccuracyTrend] = useState<any>(null);
    const [readiness, setReadiness] = useState<any>(null);

    // Metrics
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        avgAccuracy: 0,
        bestScore: 0,
        maxPossibleScore: 100 // Default fallback
    });

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

    // Onboarding Tour
    const { startOnboarding, hasCompletedContext } = useOnboarding();
    const { isModalDismissed, dismissModal } = useAuth();

    // Effect: Process data after fetching
    useEffect(() => {
        if (!fetchedData || !quizId) return;

        const { quiz: quizData, attempts: data, goal: goalData, leaderboard: leaderboardData, error } = fetchedData;

        let maxCalc = 0;

        if (quizData) {
            setQuizTitle(quizData.title);

            // 1. Check if there are specific subject rules (highest priority)
            const checkRules = async () => {
                const { data: rules } = await supabase
                    .from('quiz_subject_rules')
                    .select('question_count')
                    .eq('quiz_id', quizId);

                if (rules && rules.length > 0) {
                    const totalFromRules = rules.reduce((acc, r) => acc + (r.question_count || 0), 0);
                    if (totalFromRules > 0) {
                        maxCalc = totalFromRules * (quizData.points_correct || 1);
                    }
                }
            };
            checkRules();

            // 2. Fallback to simulation_rule join (legacy)
            if (maxCalc === 0) {
                const rule = quizData.simulation_rule as { total_questions?: number; points_correct?: number } | null;
                if (rule && rule.total_questions && rule.points_correct) {
                    maxCalc = rule.total_questions * rule.points_correct;
                }
            }

            // 3. Fallback to total_questions column
            if (maxCalc === 0 && quizData.total_questions && quizData.points_correct) {
                maxCalc = quizData.total_questions * quizData.points_correct;
            }
        }

        // 4. Fallback to max questions in attempts (if still 0)
        if (maxCalc === 0 && data && data.length > 0) {
            const maxQuestionsInAttempts = Math.max(...data.map(d => d.total_questions || 0));
            if (maxQuestionsInAttempts > 0) {
                const pointsPerQuestion = quizData?.points_correct || 1;
                maxCalc = maxQuestionsInAttempts * pointsPerQuestion;
            }
        }

        if (maxCalc === 0) maxCalc = 100;

        if (error) {
            console.error(error);
        } else if (data) {
            processData(data as AttemptWithDetails[], maxCalc, leaderboardData);
        }

        if (goalData) setGoal(goalData);

    }, [fetchedData, quizId]);

    const processData = (data: AttemptWithDetails[], maxPossible: number, leaderboardData?: any) => {
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

        const avgScoreRaw = totalTests ? totalScore / totalTests : 0;
        const avgScoreNormalized = maxPossible > 0 ? (avgScoreRaw / maxPossible) * 100 : avgScoreRaw;
        const avgAccuracy = validAccuracyCount ? (totalAccuracy / validAccuracyCount) * 100 : 0;

        setStats({
            totalTests,
            avgScore: avgScoreNormalized,
            avgAccuracy,
            bestScore: maxScore,
            maxPossibleScore: maxPossible
        });

        // 2. Calculate Trends
        if (totalTests >= 3) {
            const trends = calculateTrends(data, 7);
            setScoreTrend(trends.scoreTrend);
            setAccuracyTrend(trends.accuracyTrend);
        }

        // 3. Calculate Readiness (Prioritize official leaderboard score if available)
        if (totalTests >= 1) { // Show it even with 1 test if we have leaderboard data
            const readinessData = calculateReadinessLevel(avgScoreNormalized, avgAccuracy, totalTests, leaderboardData);
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
        <TierSLoader message="Analisi performance in corso..." />
    );

    return (
        <div className="min-h-screen bg-[var(--background)] text-text-primary pb-24 relative overflow-hidden transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-8 pt-safe">


                {/* Header */}
                <div className="flex items-center justify-between gap-4 py-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-[48px] w-[48px] p-0 rounded-full"
                        onClick={() => navigate("/profile")}
                        icon={<ChevronLeft className="w-6 h-6" />}
                    />
                    <div className="flex-1 text-center">
                        <h1 className="text-xl font-black text-text-primary leading-tight line-clamp-1">{quizTitle}</h1>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-0.5">Statistiche Dettagliate</p>
                    </div>
                    <div className="w-12" /> {/* Layout balancer */}
                </div>

                {/* 1. KPIs with Trends */}
                <StatsKPIGrid
                    totalTests={stats.totalTests}
                    bestScore={stats.bestScore}
                    avgScore={stats.avgScore}
                    accuracy={stats.avgAccuracy}
                    maxPossibleScore={stats.maxPossibleScore}
                    scoreTrend={scoreTrend}
                    accuracyTrend={accuracyTrend}
                    readiness={readiness}
                    onOpenInfo={() => setShowInfoModal(true)}
                />

                {/* Score Info Overlay */}
                <InfoModal
                    isOpen={showInfoModal}
                    onClose={() => {
                        setShowInfoModal(false);
                        dismissModal('prep_info');
                    }}
                    type="prep"
                    onMoreInfo={() => {
                        setShowInfoModal(false);
                        setShowInfoPage(true);
                        dismissModal('prep_info');
                    }}
                />

                {showInfoPage && (
                    <ScoreInfoPage
                        onBack={() => setShowInfoPage(false)}
                        initialTab="prep"
                    />
                )}

                {/* 2. Coaching Block */}
                {recommendations.length > 0 && (
                    <div data-onboarding="stats-coaching">
                        <CoachingBlock
                            recommendations={recommendations}
                            onSetGoal={handleSetGoal}
                        />
                    </div>
                )}

                {/* 3. Main Performance Area (Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Radar Chart + Goals */}
                    <div className="lg:col-span-5 space-y-6">
                        <div data-onboarding="stats-subjects" className="bg-white dark:bg-[var(--card)] p-6 rounded-card shadow-soft flex flex-col items-center">
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
                                                className="w-full flex justify-between items-center text-sm border-b border-canvas-light dark:border-slate-800 pb-2 group cursor-pointer hover:bg-canvas-light/50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                                    <span className="font-bold text-text-secondary dark:text-slate-400 truncate max-w-[120px]" title={s.subject}>{s.subject}</span>
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
                        <div className="bg-white dark:bg-[var(--card)] p-6 rounded-card shadow-soft">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Andamento nel Tempo</h3>
                            <ProgressLineChart data={trendData} />
                        </div>

                        {/* History Table */}
                        <div className="bg-white dark:bg-[var(--card)] p-6 rounded-card shadow-soft">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-text-primary">Cronologia Tentativi</h3>
                                <span className="text-[10px] font-bold bg-canvas-light dark:bg-slate-800 text-text-tertiary px-3 py-1.5 rounded-pill uppercase tracking-wider">Ultimi 50</span>
                            </div>
                            <AttemptsHistoryTable attempts={attempts as any} quizId={quizId} />
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
