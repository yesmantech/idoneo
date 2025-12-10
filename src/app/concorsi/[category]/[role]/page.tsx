import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useRoleHubData } from "@/hooks/useRoleHubData";

export default function RolePage() {
  const { category, role } = useParams<{ category: string; role: string }>();
  const navigate = useNavigate();

  const { role: roleData, resources, history, latestQuizId, loading, error } = useRoleHubData(category || "", role || "");

  const handleStartSimulation = () => {
    if (!latestQuizId) return alert("Nessun simulatore disponibile per questo ruolo.");
    navigate(`/quiz/${latestQuizId}/official`);
  };

  const handleCustomQuiz = () => {
    if (!latestQuizId) return alert("Nessun simulatore disponibile.");
    // TODO: Implement Custom Quiz Configuration Page
    // For now, alerting or redirecting to a placeholder
    alert("Configurazione Prova Personalizzata: In arrivo!");
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>;
  }

  if (error || !roleData) {
    return <div className="p-8 text-center text-red-500">Errore: {error || "Ruolo non trovato"}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 px-4 h-16 flex items-center border-b border-slate-200 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="ml-2 flex flex-col leading-none">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{category?.replace('-', ' ')}</span>
          <span className="font-bold text-slate-900 text-lg capitalize">{roleData.title}</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-5xl">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (Header + Actions + History) */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. ROLE HEADER */}
            <section className="space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">{roleData.title}</h1>
                {roleData.available_positions && (
                  <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200">
                    {roleData.available_positions}
                  </span>
                )}
              </div>
              <div className="prose prose-slate max-w-none text-slate-600 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                {roleData.description ? (
                  <p className="whitespace-pre-wrap">{roleData.description}</p>
                ) : (
                  <p className="italic text-slate-400">Nessuna descrizione inserita.</p>
                )}
              </div>
            </section>

            {/* 2. ACTIONS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Simulazione */}
              <button
                onClick={handleStartSimulation}
                className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl">🏆</span>
                </div>
                <div className="relative z-10 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl mb-4 text-amber-600">
                  🏆
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Simulazione Ufficiale</h3>
                <p className="text-sm text-slate-500">Replica l'esame reale con timer e pesi ufficiali.</p>
                <div className="mt-4 flex items-center text-emerald-600 font-bold text-sm">
                  Avvia Simulazione →
                </div>
              </button>

              {/* Personalizzata */}
              <button
                onClick={handleCustomQuiz}
                className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl">🧩</span>
                </div>
                <div className="relative z-10 w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-2xl mb-4 text-sky-600">
                  🧩
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Prova Personalizzata</h3>
                <p className="text-sm text-slate-500">Allenati su argomenti specifici senza limiti di tempo.</p>
                <div className="mt-4 flex items-center text-sky-600 font-bold text-sm">
                  Configura Prova →
                </div>
              </button>
            </section>

            {/* 3. ATTEMPT HISTORY */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                📜 Registro Esercitazioni
              </h3>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Non hai ancora effettuato esercitazioni per questo ruolo.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {history.map((attempt) => (
                      <div key={attempt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${attempt.score >= 18 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div>
                            <p className="font-bold text-slate-900">
                              {attempt.is_official_sim ? "Simulazione Ufficiale" : "Esercitazione"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(attempt.created_at).toLocaleDateString()} alle {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">{attempt.score.toFixed(1)}</div>
                          <Link
                            to={`/quiz/results/${attempt.id}`}
                            className="text-xs font-bold text-sky-600 hover:underline"
                          >
                            Rivedi →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN (Tools & Sidebar) */}
          <div className="space-y-8">

            {/* 4. USEFUL RESOURCES */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                📚 Materiali & Strumenti
              </h3>

              <div className="space-y-3">
                {resources.map(res => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center text-xl shadow-sm">
                      {res.type === 'pdf' ? '📄' : '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 truncate">{res.title}</p>
                      <p className="text-xs text-slate-400 group-hover:text-emerald-600">Apri risorsa ↗</p>
                    </div>
                  </a>
                ))}

                {resources.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-4">Nessuna risorsa disponibile.</p>
                )}
              </div>

              {/* Share Bank Link (Future Feature) */}
              {roleData.share_bank_link && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Banca Dati</h4>
                  <a
                    href={roleData.share_bank_link}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                  >
                    Condividi / Scarica
                  </a>
                </div>
              )}

            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
