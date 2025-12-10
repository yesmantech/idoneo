import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function StatsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState<any[]>([]);

    // Metrics
    const [globalStats, setGlobalStats] = useState({
        totalTests: 0,
        avgScore: 0,
        avgAccuracy: 0,
        totalTime: 0
    });

    const [subjectPerformance, setSubjectPerformance] = useState<{ name: string, accuracy: number, count: number }[]>([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // handle error or redirect
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("quiz_attempts")
            .select(`*, quiz:quizzes(title)`)
            .eq("user_id", user.id)
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

        // Global
        const totalTests = data.length;
        const totalScore = data.reduce((acc, curr) => acc + (curr.score || 0), 0);

        let validAccuracyCount = 0;
        const totalAccuracy = data.reduce((acc, curr) => {
            if (!curr.total_questions) return acc;
            validAccuracyCount++;
            return acc + ((curr.correct || 0) / curr.total_questions);
        }, 0);

        setGlobalStats({
            totalTests,
            avgScore: totalTests ? totalScore / totalTests : 0,
            avgAccuracy: validAccuracyCount ? (totalAccuracy / validAccuracyCount) * 100 : 0,
            totalTime: 0 // sum duration if needed
        });

        // Subject Analysis
        const subjMap: Record<string, { correct: number, total: number }> = {};
        data.forEach(att => {
            if (Array.isArray(att.answers)) {
                att.answers.forEach((ans: any) => {
                    const name = ans.subjectName || "Altro";
                    if (!subjMap[name]) subjMap[name] = { correct: 0, total: 0 };
                    subjMap[name].total++;
                    if (ans.isCorrect) subjMap[name].correct++;
                });
            }
        });

        const subjPerf = Object.entries(subjMap).map(([name, stats]) => ({
            name,
            count: stats.total,
            accuracy: (stats.correct / stats.total) * 100
        })).sort((a, b) => b.accuracy - a.accuracy); // Descending accuracy

        setSubjectPerformance(subjPerf);
    };

    if (loading) return <div className="p-8 text-center">Caricamento statistiche...</div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white px-6 py-6 rounded-b-3xl shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Le mie Statistiche</h1>
                    <button onClick={() => navigate("/")} className="text-sm font-bold text-slate-500">Chiudi</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Test Completati</p>
                        <p className="text-3xl font-black text-indigo-900">{globalStats.totalTests}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Accuratezza Media</p>
                        <p className="text-3xl font-black text-emerald-900">{globalStats.avgAccuracy.toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-8">

                {/* Subject Performance */}
                <section>
                    <h2 className="font-bold text-lg mb-4">Punti di Forza e Debolezza</h2>
                    <div className="space-y-3">
                        {subjectPerformance.slice(0, 5).map((subj, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">{subj.name}</p>
                                    <p className="text-[10px] text-slate-400">{subj.count} domande</p>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${subj.accuracy > 70 ? 'bg-emerald-100 text-emerald-700' : subj.accuracy < 50 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {subj.accuracy.toFixed(0)}%
                                </div>
                            </div>
                        ))}
                        {subjectPerformance.length === 0 && <p className="text-sm text-slate-400 italic">Completa dei test per vedere i dati.</p>}
                    </div>
                </section>

                {/* History */}
                <section>
                    <h2 className="font-bold text-lg mb-4">Cronologia</h2>
                    <div className="space-y-3">
                        {attempts.map((att) => (
                            <Link to={`/quiz/results/${att.id}`} key={att.id} className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-900 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-sm">{att.quiz?.title || "Test"}</h3>
                                    <span className="text-[10px] text-slate-400">{new Date(att.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-slate-500">
                                        Punteggio: <span className="text-slate-900 font-bold">{att.score.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {att.correct}/{att.total_questions}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {attempts.length === 0 && <p className="text-sm text-slate-400 italic">Nessun test completato.</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}
