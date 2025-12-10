import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import SubjectProgressBar from "@/components/concorsi/SubjectProgressBar";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";

interface Subject {
    id: string;
    name: string;
}

interface RoleSimulationSectionProps {
    category: string;
    role: string;
    contestSlug: string;
    contestId?: string; // Optional optimization to avoid re-fetching ID if known
}

export default function RoleSimulationSection({ category, role, contestSlug, contestId }: RoleSimulationSectionProps) {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [resolvedContestId, setResolvedContestId] = useState<string | undefined>(contestId);

    // Use the stats hook
    const { progress, loading: statsLoading } = useSubjectProgress(resolvedContestId);

    const [metaLoading, setMetaLoading] = useState(true);

    useEffect(() => {
        const loadMetaData = async () => {
            let activeContestId = contestId;

            // 1. Fetch ID if not provided
            if (!activeContestId) {
                const { data: contest } = await supabase.from('quizzes').select('id').eq('slug', contestSlug).single();
                if (contest) {
                    activeContestId = contest.id;
                    setResolvedContestId(contest.id);
                }
            }

            if (activeContestId) {
                // 2. Fetch Subjects linked to this contest
                const { data: subs } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('quiz_id', activeContestId)
                    .eq('is_archived', false)
                    .order('name');

                if (subs) {
                    setSubjects(subs);
                }
            }
            setMetaLoading(false);
        };

        loadMetaData();
    }, [contestSlug, contestId]);

    const handleOfficial = () => {
        navigate(`/concorsi/${category}/${role}/${contestSlug}/simulazione/ufficiale/regole`);
    };

    const handleCustom = () => {
        navigate(`/concorsi/${category}/${role}/${contestSlug}/custom`);
    };

    if (metaLoading) {
        return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
    }

    return (
        <div className="space-y-12">
            {/* 1. Header Area */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-3xl font-bold text-slate-900">Scegli la modalità</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Simula l'esame ufficiale con i tempi e i pesi reali, oppure costruisci una prova personalizzata per rinforzare le tue lacune.
                </p>
            </div>

            {/* 2. Mode Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Official Card */}
                <button
                    onClick={handleOfficial}
                    className="group relative bg-white hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 active:shadow-none flex flex-col h-full"
                >
                    <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                        🏆
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Simulazione Ufficiale</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                        Replica fedelmente la prova d'esame. Algoritmo di estrazione ufficiale, timer reale e calcolo del punteggio ministeriale.
                    </p>
                    <div className="mt-auto flex items-center text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">
                        Avvia Simulazione →
                    </div>
                </button>

                {/* Custom Card */}
                <button
                    onClick={handleCustom}
                    className="group relative bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 active:shadow-none flex flex-col h-full"
                >
                    <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                        🧩
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Prova Personalizzata</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                        Configura la tua esercitazione. Scegli le materie, il numero di domande e il tempo a disposizione per un allenamento mirato.
                    </p>
                    <div className="mt-auto flex items-center text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
                        Configura Prova →
                    </div>
                </button>
            </div>

            {/* 3. Subject Progress Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">I tuoi progressi per materia</h3>
                    <span className="text-slate-500 text-sm font-medium hidden sm:block">Aggiornato in tempo reale</span>
                </div>

                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {subjects.map(subject => {
                            const stat = progress[subject.id] || { total: 0, completed: 0 };
                            // Hide subjects with 0 questions to avoid confusion, or show empty
                            if (stat.total === 0) return null;

                            return (
                                <SubjectProgressBar
                                    key={subject.id}
                                    subjectName={subject.name}
                                    totalQuestions={stat.total}
                                    completedQuestions={stat.completed}
                                    onClick={() => navigate(`/concorsi/${category}/${role}/${contestSlug}/custom?subject=${subject.id}`)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                        Nessuna materia configurata per questo concorso.
                    </div>
                )}
            </div>
        </div>
    );
}
