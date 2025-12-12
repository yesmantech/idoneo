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
        return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-cyan"></div></div>;
    }

    return (
        <div className="space-y-12">
            {/* 1. Header Area */}
            <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-4xl font-bold text-text-primary">Scegli la modalità</h2>
                <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                    Simula l'esame ufficiale con i tempi e i pesi reali, oppure costruisci una prova personalizzata per rinforzare le tue lacune.
                </p>
            </div>

            {/* 2. Mode Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Official Card */}
                <button
                    onClick={handleOfficial}
                    className="group relative bg-white rounded-card p-8 text-left shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 ease-ios flex flex-col h-full"
                >
                    <div className="w-14 h-14 rounded-squircle bg-brand-cyan/10 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🏆
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3">Simulazione Ufficiale</h3>
                    <p className="text-text-secondary mb-6 leading-relaxed">
                        Replica fedelmente la prova d'esame. Algoritmo di estrazione ufficiale, timer reale e calcolo del punteggio ministeriale.
                    </p>
                    <div className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-white font-semibold text-sm rounded-pill hover:bg-brand-cyan/90 transition-colors">
                        Avvia Simulazione →
                    </div>
                </button>

                {/* Custom Card */}
                <button
                    onClick={handleCustom}
                    className="group relative bg-white rounded-card p-8 text-left shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 ease-ios flex flex-col h-full"
                >
                    <div className="w-14 h-14 rounded-squircle bg-brand-blue/10 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🧩
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-3">Prova Personalizzata</h3>
                    <p className="text-text-secondary mb-6 leading-relaxed">
                        Configura la tua esercitazione. Scegli le materie, il numero di domande e il tempo a disposizione per un allenamento mirato.
                    </p>
                    <div className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 bg-canvas-light text-text-primary font-semibold text-sm rounded-pill hover:bg-text-tertiary/20 transition-colors">
                        Configura Prova →
                    </div>
                </button>
            </div>

            {/* 3. Subject Progress Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-text-primary">I tuoi progressi per materia</h3>
                    <span className="text-text-secondary text-sm font-medium hidden sm:block">Aggiornato in tempo reale</span>
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
                    <div className="bg-white rounded-card shadow-soft p-8 text-center text-text-tertiary">
                        Nessuna materia configurata per questo concorso.
                    </div>
                )}
            </div>
        </div>
    );
}
