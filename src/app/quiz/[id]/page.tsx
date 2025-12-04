
"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type QuizSubjectRuleRow = Database["public"]["Tables"]["quiz_subject_rules"]["Row"];

type CustomMode = "standard" | "errors_recent" | "most_wrong";

type TrainingPreset = {
  id: string;
  name: string;
  mode: CustomMode;
  minutes: number | null;
  subjects: string[];
  dist?: Record<string, number>;
};

function getPresetsStorageKey(quizId: string) {
  return `quiz_presets_${quizId}`;
}

export default function QuizLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [rules, setRules] = useState<QuizSubjectRuleRow[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom Quiz State
  const [customMode, setCustomMode] = useState<CustomMode>("standard");
  const [customMinutes, setCustomMinutes] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectCustomCounts, setSubjectCustomCounts] = useState<Record<string, number>>({});

  // Presets
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError || !quizData) throw new Error("Concorso non trovato.");
        setQuiz(quizData as QuizRow);

        // 2. Parallel fetch
        const [
          { data: subjectsData, error: subjError },
          { data: rulesData, error: rulesError },
          { data: questionsData, error: qError },
        ] = await Promise.all([
          supabase.from("subjects").select("*").eq("quiz_id", quizId),
          supabase.from("quiz_subject_rules").select("*").eq("quiz_id", quizId),
          supabase.from("questions").select("subject_id, is_archived").eq("quiz_id", quizId),
        ]);

        if (subjError) console.warn(subjError);
        if (rulesError) console.warn(rulesError);
        
        setSubjects((subjectsData || []) as SubjectRow[]);
        setRules((rulesData || []) as QuizSubjectRuleRow[]);

        // Count active questions per subject
        const counts: Record<string, number> = {};
        (questionsData || []).forEach((q: any) => {
          if (!q.is_archived && q.subject_id) {
            counts[q.subject_id] = (counts[q.subject_id] || 0) + 1;
          }
        });
        setQuestionCounts(counts);

        // Default selection: all active subjects
        const activeSubj = (subjectsData || []).filter((s: any) => !s.is_archived) as SubjectRow[];
        if (selectedSubjectIds.length === 0) {
          setSelectedSubjectIds(activeSubj.map(s => s.id));
        }

        // Default counts: 0
        const initialCounts: Record<string, number> = {};
        activeSubj.forEach(s => { initialCounts[s.id] = 0; });
        setSubjectCustomCounts(prev => ({ ...initialCounts, ...prev }));

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Errore imprevisto.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [quizId]); // Removed selectedSubjectIds dependency loop

  // Presets Loader
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(getPresetsStorageKey(quizId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPresets(parsed);
      }
    } catch (e) {
      console.error("Presets parse error", e);
    }
  }, [quizId]);

  const savePresets = (newPresets: TrainingPreset[]) => {
    setPresets(newPresets);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getPresetsStorageKey(quizId), JSON.stringify(newPresets));
    }
  };

  const activeSubjects = useMemo(() => subjects.filter(s => !s.is_archived), [subjects]);
  const subjectsMap = useMemo(() => {
    const map: Record<string, SubjectRow> = {};
    subjects.forEach(s => map[s.id] = s);
    return map;
  }, [subjects]);

  const rulesWithNames = useMemo(() => {
    return rules.map(r => ({
      ...r,
      name: subjectsMap[r.subject_id]?.name || "Sconosciuta"
    }));
  }, [rules, subjectsMap]);

  // Handlers
  const handleToggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedSubjectIds.length === activeSubjects.length) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(activeSubjects.map(s => s.id));
    }
  };

  const handleCountChange = (id: string, delta: number) => {
    if (customMode !== "standard") return;
    setSubjectCustomCounts(prev => {
      const current = prev[id] || 0;
      const max = questionCounts[id] || 0;
      let next = current + delta;
      if (next < 0) next = 0;
      if (next > max) next = max;
      return { ...prev, [id]: next };
    });
  };

  const handleStartCustom = () => {
    if (!quiz) return;
    const subjectsToUse = selectedSubjectIds.length > 0 ? selectedSubjectIds : activeSubjects.map(s => s.id);
    
    if (subjectsToUse.length === 0) {
      alert("Seleziona almeno una materia.");
      return;
    }

    const params = new URLSearchParams();
    params.set("mode", customMode);

    if (customMode === "standard") {
      const activeCounts = subjectsToUse
        .map(id => ({ id, count: subjectCustomCounts[id] || 0 }))
        .filter(x => x.count > 0);
      
      if (activeCounts.length === 0) {
        alert("Aumenta il numero di domande per almeno una materia.");
        return;
      }
      
      params.set("dist", activeCounts.map(x => `${x.id}:${x.count}`).join(","));
      params.set("subjects", activeCounts.map(x => x.id).join(","));
    } else {
      params.set("subjects", subjectsToUse.join(","));
      if (customMode === "errors_recent") params.set("attempts", "10");
      if (customMode === "most_wrong") params.set("limit", "50");
    }

    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0) params.set("minutes", mins.toString());

    router.push(`/quiz/${quizId}/custom?${params.toString()}`);
  };

  const handleSavePreset = () => {
    const name = prompt("Nome del preset:");
    if (!name) return;
    
    const newPreset: TrainingPreset = {
      id: Date.now().toString(),
      name,
      mode: customMode,
      minutes: parseInt(customMinutes) || null,
      subjects: selectedSubjectIds,
      dist: customMode === "standard" ? subjectCustomCounts : undefined
    };
    
    const next = [...presets, newPreset];
    savePresets(next);
    setSelectedPresetId(newPreset.id);
  };

  const handleApplyPreset = () => {
    const p = presets.find(x => x.id === selectedPresetId);
    if (!p) return;
    
    setCustomMode(p.mode);
    setCustomMinutes(p.minutes ? p.minutes.toString() : "");
    setSelectedSubjectIds(p.subjects);
    if (p.mode === "standard" && p.dist) {
      setSubjectCustomCounts(prev => ({ ...prev, ...p.dist }));
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Caricamento...</div>;
  if (!quiz) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Errore caricamento.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => router.push("/")} className="text-xs text-slate-400 hover:text-white mb-4">← Torna alla Home</button>
        
        {/* Header */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6 md:items-start md:justify-between shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">{quiz.title}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
              {quiz.year && <span className="bg-slate-800 px-2 py-1 rounded">Anno {quiz.year}</span>}
              <span className="bg-slate-800 px-2 py-1 rounded">{quiz.total_questions || "?"} Quesiti</span>
              <span className="bg-slate-800 px-2 py-1 rounded">{quiz.time_limit || "?"} Minuti</span>
            </div>
            {quiz.description && <p className="text-sm text-slate-300 max-w-2xl">{quiz.description}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => router.push(`/quiz/${quizId}/attempts`)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors">
              Storico Tentativi
            </button>
            <button onClick={() => router.push(`/quiz/${quizId}/stats`)} className="px-4 py-2 rounded-lg bg-sky-900/20 text-sky-400 border border-sky-800/30 text-xs font-medium hover:bg-sky-900/40 transition-colors">
              Statistiche Avanzate
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Official Simulation Card */}
          <div className="rounded-2xl border border-emerald-800/30 bg-emerald-900/5 p-6 hover:border-emerald-700/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Simulazione Ufficiale</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Replica fedelmente la prova d'esame. Stesso numero di domande, tempo limite e distribuzione materie del bando ufficiale.
            </p>
            
            <div className="mb-6 space-y-2">
              <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">Composizione Prova</p>
              {rulesWithNames.length > 0 ? (
                <ul className="text-xs text-slate-400 space-y-1 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  {rulesWithNames.map(r => (
                    <li key={r.id} className="flex justify-between">
                      <span>{r.name}</span>
                      <span className="font-mono text-emerald-400">{r.question_count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">Nessuna regola specifica definita.</p>
              )}
            </div>

            <button 
              onClick={() => router.push(`/quiz/${quizId}/official`)}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all"
            >
              Avvia Simulazione
            </button>
          </div>

          {/* Custom Training Card */}
          <div className="rounded-2xl border border-sky-800/30 bg-sky-900/5 p-6 hover:border-sky-700/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-900/30 rounded-lg text-sky-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">Allenamento Personalizzato</h2>
            </div>
            
            {/* Mode Selection */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: "standard", label: "Standard" },
                { id: "errors_recent", label: "Errori Recenti" },
                { id: "most_wrong", label: "Più Sbagliate" }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setCustomMode(mode.id as CustomMode)}
                  className={`px-2 py-2 rounded-lg text-[10px] font-medium transition-colors border ${
                    customMode === mode.id 
                      ? "bg-sky-600 border-sky-500 text-white" 
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Config Area */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-300">Minuti a disposizione</label>
                <input 
                  type="number" 
                  placeholder="Illimitato"
                  className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-right focus:border-sky-500 outline-none"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-slate-300">Materie</label>
                  <button onClick={handleToggleAll} className="text-[10px] text-sky-400 hover:text-sky-300">
                    {selectedSubjectIds.length === activeSubjects.length ? "Deseleziona" : "Seleziona Tutti"}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {activeSubjects.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input 
                          type="checkbox" 
                          checked={selectedSubjectIds.includes(s.id)}
                          onChange={() => handleToggleSubject(s.id)}
                          className="rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-0"
                        />
                        <span className="text-[11px] text-slate-300 truncate">{s.name}</span>
                      </div>
                      
                      {customMode === "standard" && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCountChange(s.id, -1)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:text-white">-</button>
                          <span className="w-6 text-center text-[11px] font-mono text-sky-400">{subjectCustomCounts[s.id] || 0}</span>
                          <button onClick={() => handleCountChange(s.id, 1)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:text-white">+</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-2 mb-4">
              <select 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-2 text-slate-300 outline-none"
                value={selectedPresetId}
                onChange={e => setSelectedPresetId(e.target.value)}
              >
                <option value="">Carica Preset...</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleApplyPreset} disabled={!selectedPresetId} className="px-3 py-2 bg-slate-800 rounded-lg text-xs text-white disabled:opacity-50">Applica</button>
              <button onClick={handleSavePreset} className="px-3 py-2 bg-slate-800 rounded-lg text-xs text-sky-400 hover:text-sky-300">Salva</button>
            </div>

            <button 
              onClick={handleStartCustom}
              className="w-full py-3 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 shadow-lg shadow-sky-900/20 transition-all"
            >
              Inizia Allenamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
