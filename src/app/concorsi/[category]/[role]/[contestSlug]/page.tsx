import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getContestBySlug, type Contest } from "@/lib/data";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import ExamHeader from "@/components/concorsi/ExamHeader";
import RoleSimulationSection from "@/components/concorsi/RoleSimulationSection";

export default function ContestPage() {
  const { category, role, contestSlug } = useParams<{ category: string; role: string; contestSlug: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!contestSlug) return;

    async function loadData() {
      setLoading(true);
      const data = await getContestBySlug(contestSlug || '');
      setContest(data);

      if (data && user) {
        const { data: myAttempts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', data.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (myAttempts) {
          setAttempts(myAttempts);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [contestSlug, user]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  );

  if (!contest) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-2xl font-bold mb-4">Concorso non trovato</h1>
      <button onClick={() => navigate(-1)} className="text-emerald-600 font-medium hover:underline">
        ← Torna indietro
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 1. Header Section */}
      <ExamHeader
        title={contest.title}
        subtitle="Preparazione completa alla prova d'esame"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Concorsi', path: `/concorsi/${category}` }, // Go back to hub
          // We could add Role here if we had a dedicated role page, but accordion handles it usually
          { label: contest.year ? `${contest.year}` : 'Dettaglio' }
        ]}
        status="open" // Mock status
        deadline="30 GIU 2025" // Mock deadline
        positions="1.250" // Mock positions
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        <div className="space-y-8">
          {/* Main Content Column */}
          <div className="space-y-8">

            {/* 2. Simulation Section (Replaces Dark Hero) */}
            <RoleSimulationSection
              category={category || ""}
              role={role || ""}
              contestSlug={contestSlug || ""}
              contestId={contest.id}
            />

            {/* 3. Info & Description */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Informazioni sul Concorso</h3>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-slate-600 leading-relaxed">
                <p>
                  {contest.description || "Questo pacchetto di preparazione include l'accesso completo alla banca dati ufficiale per la preparazione alla prova scritta."}
                </p>
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="font-bold mb-1">Nota sulla Banca Dati</p>
                    <p>
                      Questa simulazione utilizza la <strong>Banca Dati Ufficiale 2024</strong>. Le domande sono estratte con le stesse regole dell'esame reale.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. History (Mock/Placeholder) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Registro Esercitazioni</h3>
                <Link to="#" className="text-sm text-emerald-600 font-medium hover:underline">Vedi tutto</Link>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                {attempts.length > 0 ? (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-medium text-slate-500">Data</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Punteggio</th>
                        <th className="px-6 py-3 font-medium text-slate-500">Esito</th>
                        <th className="px-6 py-3 font-medium text-slate-500 text-right">Azione</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {new Date(attempt.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attempt.score >= 18 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {attempt.score} / 30
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {attempt.is_idoneo === true && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                IDONEO
                              </span>
                            )}
                            {attempt.is_idoneo === false && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                NON IDONEO
                              </span>
                            )}
                            {attempt.is_idoneo === null && (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/quiz/results/${attempt.id}`} className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                              Vedi Esito →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 grayscale opacity-50">
                      📊
                    </div>
                    <p className="font-medium text-slate-900 mb-1">Nessuna esercitazione recente</p>
                    <p className="text-sm text-slate-500">I tuoi risultati appariranno qui dopo la prima simulazione.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Useful Tools & PRO (Moved from Sidebar) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tools */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Strumenti Utili</h3>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      📘
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Guida allo Studio</div>
                      <div className="text-xs text-slate-500">PDF Scaricabile</div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      📤
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Condividi Banca Dati</div>
                      <div className="text-xs text-slate-500">Link condivisibile</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* PRO Ad */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 opacity-0">Pro</h3>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg h-[168px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-lg mb-1">Accedi a Idoneo PRO</h4>
                    <p className="text-sm text-slate-300">Sblocca statistiche avanzate, simulazioni illimitate e tutor IA.</p>
                  </div>
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors">
                    Scopri di più
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
