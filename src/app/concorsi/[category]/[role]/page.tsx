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
    return <div className="min-h-screen bg-canvas-light flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
    </div>;
  }

  if (error || !roleData) {
    return <div className="min-h-screen bg-canvas-light flex items-center justify-center">
      <div className="text-center p-8">
        <p className="text-semantic-error font-semibold mb-4">Errore: {error || "Ruolo non trovato"}</p>
        <Link to="/" className="text-brand-cyan font-semibold hover:text-brand-cyan/80 transition-colors">← Torna alla Home</Link>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-canvas-light pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white z-20 px-5 md:px-6 h-16 flex items-center shadow-soft">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-secondary hover:text-brand-cyan transition-colors duration-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="ml-2 flex flex-col leading-none min-w-0">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider truncate">{category?.replace('-', ' ')}</span>
          <span className="font-bold text-text-primary text-lg capitalize truncate">{roleData.title}</span>
        </div>
      </div>

      <main className="container mx-auto px-5 md:px-6 py-8 max-w-5xl">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (Header + Actions + History) */}
          <div className="lg:col-span-2 space-y-8">

            {/* 1. ROLE HEADER */}
            <section className="space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary">{roleData.title}</h1>
                {roleData.available_positions && (
                  <span className="inline-block mt-3 bg-brand-cyan/10 text-brand-cyan px-4 py-2 rounded-pill text-sm font-bold">
                    {roleData.available_positions}
                  </span>
                )}
              </div>
              <div className="prose prose-slate max-w-none text-text-secondary bg-white p-6 rounded-card shadow-soft">
                {roleData.description ? (
                  <p className="whitespace-pre-wrap">{roleData.description}</p>
                ) : (
                  <p className="italic text-text-tertiary">Nessuna descrizione inserita.</p>
                )}
              </div>
            </section>

            {/* 2. ACTIONS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Simulazione */}
              <button
                onClick={handleStartSimulation}
                className="group relative overflow-hidden bg-white p-6 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 ease-ios text-left"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl">🏆</span>
                </div>
                <div className="relative z-10 w-14 h-14 bg-brand-cyan/10 rounded-squircle flex items-center justify-center text-3xl mb-4">
                  🏆
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Simulazione Ufficiale</h3>
                <p className="text-sm text-text-secondary mb-4">Replica l'esame reale con timer e pesi ufficiali.</p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-cyan text-white font-semibold text-sm rounded-pill hover:bg-brand-cyan/90 transition-colors">
                  Avvia Simulazione →
                </div>
              </button>

              {/* Personalizzata */}
              <button
                onClick={handleCustomQuiz}
                className="group relative overflow-hidden bg-white p-6 rounded-card shadow-soft hover:shadow-card hover:scale-[1.02] transition-all duration-300 ease-ios text-left"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-8xl">🧩</span>
                </div>
                <div className="relative z-10 w-14 h-14 bg-brand-blue/10 rounded-squircle flex items-center justify-center text-3xl mb-4">
                  🧩
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Prova Personalizzata</h3>
                <p className="text-sm text-text-secondary mb-4">Allenati su argomenti specifici senza limiti di tempo.</p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-canvas-light text-text-primary font-semibold text-sm rounded-pill hover:bg-text-tertiary/20 transition-colors">
                  Configura Prova →
                </div>
              </button>
            </section>

            {/* 3. ATTEMPT HISTORY */}
            <section>
              <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                📜 Registro Esercitazioni
              </h3>
              <div className="bg-white rounded-card shadow-soft overflow-hidden">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary">
                    Non hai ancora effettuato esercitazioni per questo ruolo.
                  </div>
                ) : (
                  <div className="divide-y divide-canvas-light">
                    {history.map((attempt) => (
                      <div key={attempt.id} className="p-5 flex items-center justify-between hover:bg-canvas-light transition-colors duration-300">
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-12 rounded-pill ${attempt.score >= 18 ? 'bg-semantic-success' : 'bg-semantic-error'}`} />
                          <div>
                            <p className="font-bold text-text-primary">
                              {attempt.is_official_sim ? "Simulazione Ufficiale" : "Esercitazione"}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {new Date(attempt.created_at).toLocaleDateString()} alle {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-text-primary">{attempt.score.toFixed(1)}</div>
                          <Link
                            to={`/quiz/results/${attempt.id}`}
                            className="text-xs font-semibold text-brand-cyan hover:text-brand-cyan/80 transition-colors"
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
            <section className="bg-white rounded-card p-6 shadow-soft sticky top-24">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                📚 Materiali & Strumenti
              </h3>

              <div className="space-y-3">
                {resources.map(res => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-card bg-canvas-light hover:bg-brand-cyan/10 hover:shadow-soft transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-squircle bg-white group-hover:bg-brand-cyan/20 flex items-center justify-center text-xl shadow-soft">
                      {res.type === 'pdf' ? '📄' : '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-primary group-hover:text-brand-cyan truncate transition-colors">{res.title}</p>
                      <p className="text-xs text-text-secondary group-hover:text-brand-cyan transition-colors">Apri risorsa ↗</p>
                    </div>
                  </a>
                ))}

                {resources.length === 0 && (
                  <p className="text-sm text-text-tertiary italic text-center py-4">Nessuna risorsa disponibile.</p>
                )}
              </div>

              {/* Share Bank Link (Future Feature) */}
              {roleData.share_bank_link && (
                <div className="mt-8 pt-6 border-t border-canvas-light">
                  <h4 className="text-xs font-bold text-text-tertiary uppercase mb-3">Banca Dati</h4>
                  <a
                    href={roleData.share_bank_link}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-3.5 rounded-pill bg-brand-cyan text-white font-semibold text-sm hover:bg-brand-cyan/90 transition-colors shadow-md"
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
