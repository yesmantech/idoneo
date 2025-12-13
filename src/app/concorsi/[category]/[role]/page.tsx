import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useRoleHubData } from "@/hooks/useRoleHubData";
import { ChevronLeft, Trophy, Puzzle, Clock, FileText, BookOpen, ExternalLink } from "lucide-react";

// =============================================================================
// ROLE DETAIL PAGE - Idoneo Redesign
// Structure: Top bar → Title/Description → Simulazione → Personalizzata → Log → Materials
// =============================================================================
export default function RolePage() {
  const { category, role } = useParams<{ category: string; role: string }>();
  const navigate = useNavigate();

  const { role: roleData, resources, history, latestQuizId, latestQuizSlug, loading, error } = useRoleHubData(category || "", role || "");

  const handleStartSimulation = () => {
    if (!latestQuizId) return alert("Nessun simulatore disponibile per questo ruolo.");
    navigate(`/quiz/${latestQuizId}/official`);
  };

  const handleCustomQuiz = () => {
    if (!latestQuizSlug) return alert("Nessun simulatore disponibile.");
    navigate(`/concorsi/${category}/${role}/${latestQuizSlug}/custom`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !roleData) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Ruolo non trovato</h1>
        <p className="text-slate-500 text-center mb-6">{error || "Questo ruolo non esiste."}</p>
        <Link to="/" className="text-[#00B1FF] font-semibold">← Torna alla Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* ============================================================= */}
      {/* TOP BAR */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
            {category?.replace(/-/g, ' ')}
          </span>
        </div>
      </header>

      <main className="px-5 py-6 max-w-lg mx-auto">
        {/* ============================================================= */}
        {/* ROLE HEADER */}
        {/* ============================================================= */}
        <section className="mb-8">
          <h1 className="text-[32px] font-bold text-slate-900 mb-4 leading-tight">
            {roleData.title}
          </h1>

          {/* Description Card */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            }}
          >
            <p className="text-[15px] text-slate-600 leading-[1.6]">
              {roleData.description || (
                <span className="text-slate-400 italic">Nessuna descrizione inserita.</span>
              )}
            </p>
          </div>
        </section>

        {/* ============================================================= */}
        {/* SIMULAZIONE UFFICIALE - Primary Action Card */}
        {/* ============================================================= */}
        <div
          className="bg-white rounded-2xl p-5 mb-4"
          style={{
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-[#00B1FF]/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-[#00B1FF]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-bold text-slate-900 mb-1">
                Simulazione Ufficiale
              </h3>
              <p className="text-[14px] text-slate-500 mb-4 leading-snug">
                Replica l'esame reale con timer e pesi ufficiali.
              </p>

              {/* Primary CTA */}
              <button
                onClick={handleStartSimulation}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00B1FF] text-white font-semibold text-[14px] hover:bg-[#0099e6] active:scale-[0.98] transition-all"
              >
                Avvia Simulazione
                <span className="text-white/80">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* PROVA PERSONALIZZATA - Secondary Action Card */}
        {/* ============================================================= */}
        <div
          className="bg-white rounded-2xl p-5 mb-10"
          style={{
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icon - Purple styled like the blue trophy */}
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Puzzle className="w-6 h-6 text-purple-500" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-bold text-slate-900 mb-1">
                Prova Personalizzata
              </h3>
              <p className="text-[14px] text-slate-500 mb-4 leading-snug">
                Allenati su argomenti specifici senza limiti di tempo.
              </p>

              {/* Purple CTA Button */}
              <button
                onClick={handleCustomQuiz}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500 text-white font-semibold text-[14px] hover:bg-purple-600 active:scale-[0.98] transition-all"
              >
                Configura Prova
                <span className="text-white/80">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* REGISTRO ESERCITAZIONI */}
        {/* ============================================================= */}
        <section className="mb-10">
          <h2 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Registro Esercitazioni
          </h2>

          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            }}
          >
            {history.length === 0 ? (
              /* Empty State */
              <div className="p-6 text-center">
                <div className="text-3xl mb-3">📋</div>
                <p className="text-[14px] text-slate-400">
                  Non hai ancora effettuato esercitazioni per questo ruolo.
                </p>
              </div>
            ) : (
              /* History List */
              <div className="divide-y divide-slate-100">
                {history.map((attempt) => (
                  <div key={attempt.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Score Indicator */}
                      <div
                        className={`w-1.5 h-10 rounded-full ${attempt.score >= 18 ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                      />
                      <div>
                        <p className="text-[14px] font-semibold text-slate-900">
                          {attempt.is_official_sim ? "Simulazione Ufficiale" : "Esercitazione"}
                        </p>
                        <p className="text-[12px] text-slate-400">
                          {new Date(attempt.created_at).toLocaleDateString('it-IT')} · {new Date(attempt.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-bold text-slate-900">
                        {attempt.score.toFixed(1)}
                      </div>
                      <Link
                        to={`/quiz/results/${attempt.id}`}
                        className="text-[12px] font-semibold text-[#00B1FF]"
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

        {/* ============================================================= */}
        {/* MATERIALI & STRUMENTI */}
        {/* ============================================================= */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            Materiali & Strumenti
          </h2>

          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            }}
          >
            {resources.length === 0 ? (
              /* Empty State */
              <div className="p-6 text-center">
                <div className="text-3xl mb-3">📚</div>
                <p className="text-[14px] text-slate-400">
                  Nessuna risorsa disponibile.
                </p>
              </div>
            ) : (
              /* Resources List */
              <div className="divide-y divide-slate-100">
                {resources.map(res => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {res.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ExternalLink className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 truncate">
                        {res.title}
                      </p>
                      <p className="text-[12px] text-slate-400">
                        Apri risorsa ↗
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Share Bank Link */}
          {roleData.share_bank_link && (
            <a
              href={roleData.share_bank_link}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block w-full text-center py-3.5 rounded-2xl bg-[#00B1FF] text-white font-semibold text-[14px] hover:bg-[#0099e6] transition-colors"
            >
              Condividi / Scarica Banca Dati
            </a>
          )}
        </section>
      </main>

      {/* ============================================================= */}
      {/* BOTTOM NAV BAR */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          <Link to="/" className="flex flex-col items-center gap-1 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link to="/search" className="flex flex-col items-center gap-1 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-medium">Cerca</span>
          </Link>

          <Link to="/quiz" className="flex flex-col items-center gap-1 text-[#00B1FF]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-semibold">Quiz</span>
          </Link>

          <Link to="/stats" className="flex flex-col items-center gap-1 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[10px] font-medium">Statistiche</span>
          </Link>

          <Link to="/profile" className="flex flex-col items-center gap-1 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium">Profilo</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
