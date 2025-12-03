"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type QuizSubjectRuleRow = {
  id: string;
  quiz_id: string;
  subject_id: string;
  num_questions: number;
};

type SubjectQuestionCount = {
  subjectId: string;
  totalQuestions: number;
};

type CustomMode = "standard" | "errors_recent" | "most_wrong";

type TrainingPreset = {
  id: string;
  name: string;
  mode: CustomMode;
  minutes: number | null;
  subjects: string[];
  dist?: Record<string, number>; // solo per mode=standard
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
  const [questionCounts, setQuestionCounts] = useState<SubjectQuestionCount[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modalità allenamento personalizzato
  const [customMode, setCustomMode] = useState<CustomMode>("standard");

  // form prova personalizzata
  const [customMinutes, setCustomMinutes] = useState("");

  // materie selezionate per la prova personalizzata
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  // numero di domande per materia (con + e -) - usato SOLO in modalità standard
  const [subjectCustomCounts, setSubjectCustomCounts] = useState<
    Record<string, number>
  >({});

  // PRESET
  const [presets, setPresets] = useState<TrainingPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Carica quiz, materie, regole e domande
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Quiz
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError || !quizData) {
          console.warn("Errore caricando quiz:", quizError);
          setError("Impossibile caricare il concorso.");
          setQuiz(null);
          setSubjects([]);
          setRules([]);
          setQuestionCounts([]);
          setLoading(false);
          return;
        }

        setQuiz(quizData as QuizRow);

        // 2) Subjects, rules, questions (safe, senza throw)
        const [
          { data: subjectsData, error: subjectsError },
          { data: rulesData, error: rulesError },
          { data: questionsData, error: questionsError },
        ] = await Promise.all([
          supabase.from("subjects").select("*").eq("quiz_id", quizId),
          supabase.from("quiz_subject_rules").select("*").eq("quiz_id", quizId),
          supabase
            .from("questions")
            .select("*") // select("*") per evitare mismatch colonne
            .eq("quiz_id", quizId),
        ]);

        if (subjectsError) {
          console.warn("Errore caricando subjects:", subjectsError);
          setSubjects([]);
        } else {
          setSubjects((subjectsData || []) as SubjectRow[]);
        }

        if (rulesError) {
          console.warn("Errore caricando rules:", rulesError);
          setRules([]);
        } else {
          setRules((rulesData || []) as QuizSubjectRuleRow[]);
        }

        let qs = (questionsData || []) as QuestionRow[];

        if (questionsError) {
          console.warn("Errore caricando questions:", questionsError);
          qs = [];
        }

        // calcola numero di domande attive per materia
        const countsMap: Record<string, number> = {};
        qs.forEach((q: any) => {
          // se non esiste is_archived, consideriamo tutte attive
          if (q.is_archived) return;
          const sid = q.subject_id as string | null;
          if (!sid) return;
          countsMap[sid] = (countsMap[sid] || 0) + 1;
        });

        const countsArr: SubjectQuestionCount[] = Object.entries(countsMap).map(
          ([subjectId, totalQuestions]) => ({
            subjectId,
            totalQuestions,
          })
        );
        setQuestionCounts(countsArr);

        // materie attive
        const active = (subjectsData || []).filter(
          (s: any) => !s.is_archived
        ) as SubjectRow[];

        // se non hai ancora selezioni, seleziona tutte le attive
        if (active.length > 0 && selectedSubjectIds.length === 0) {
          setSelectedSubjectIds(active.map((s) => s.id));
        }

        // inizializza contatori domande per materia a 0 (per modalità standard)
        const initialCounts: Record<string, number> = {};
        active.forEach((s) => {
          if (initialCounts[s.id] == null) {
            initialCounts[s.id] = 0;
          }
        });
        setSubjectCustomCounts((prev) => ({
          ...initialCounts,
          ...prev,
        }));
      } catch (err) {
        console.error("Errore imprevisto in QuizLandingPage:", err);
        setError("Errore nel caricamento del concorso.");
        setQuiz(null);
        setSubjects([]);
        setRules([]);
        setQuestionCounts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [quizId, selectedSubjectIds.length]);

  // Carica preset da localStorage per questo quiz
  useEffect(() => {
    if (!quizId) return;
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(getPresetsStorageKey(quizId));
      if (!raw) {
        setPresets([]);
        return;
      }
      const parsed = JSON.parse(raw) as TrainingPreset[];
      if (Array.isArray(parsed)) {
        setPresets(parsed);
      } else {
        setPresets([]);
      }
    } catch (err) {
      console.error("Errore nel parsing dei preset:", err);
      setPresets([]);
    }
  }, [quizId]);

  const savePresetsToStorage = (items: TrainingPreset[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        getPresetsStorageKey(quizId),
        JSON.stringify(items)
      );
    } catch (err) {
      console.error("Errore nel salvataggio dei preset:", err);
    }
  };

  const anyQuiz: any = quiz || {};

  const subjectsMap = useMemo(() => {
    const map: Record<string, SubjectRow> = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  const questionCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    questionCounts.forEach((c) => {
      map[c.subjectId] = c.totalQuestions;
    });
    return map;
  }, [questionCounts]);

  const rulesWithSubjectName = useMemo(() => {
    return rules.map((r) => ({
      ...r,
      subjectName: subjectsMap[r.subject_id]?.name || r.subject_id,
    }));
  }, [rules, subjectsMap]);

  const activeSubjects = useMemo(
    () => (subjects || []).filter((s: any) => !s.is_archived),
    [subjects]
  );

  const allSelected =
    activeSubjects.length > 0 &&
    activeSubjects.every((s) => selectedSubjectIds.includes(s.id));

  const handleToggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(activeSubjects.map((s) => s.id));
    }
  };

  const handleChangeSubjectCount = (id: string, delta: number) => {
    if (customMode !== "standard") {
      return;
    }

    setSubjectCustomCounts((prev) => {
      const current = prev[id] ?? 0;
      const max = questionCountMap[id] ?? 0;
      let next = current + delta;
      if (next < 0) next = 0;
      if (next > max) next = max;
      return {
        ...prev,
        [id]: next,
      };
    });
  };

  const totalSelectedQuestions = useMemo(
    () =>
      Object.entries(subjectCustomCounts)
        .filter(([subjectId]) => selectedSubjectIds.includes(subjectId))
        .reduce((sum, [, value]) => sum + (value || 0), 0),
    [subjectCustomCounts, selectedSubjectIds]
  );

  const handleStartOfficial = () => {
    if (!quiz) return;
    router.push(`/quiz/${quizId}/official`);
  };

  const handleStartCustom = () => {
    if (!quiz) return;

    const subjectsToUse =
      selectedSubjectIds.length > 0
        ? selectedSubjectIds
        : activeSubjects.map((s) => s.id);

    if (subjectsToUse.length === 0) {
      alert("Seleziona almeno una materia per la prova personalizzata.");
      return;
    }

    const params = new URLSearchParams();
    params.set("mode", customMode);

    if (customMode === "standard") {
      const activeWithCounts = subjectsToUse.filter(
        (id) => (subjectCustomCounts[id] ?? 0) > 0
      );

      if (activeWithCounts.length === 0) {
        alert(
          "Imposta almeno una domanda per una delle materie selezionate usando i pulsanti + e −."
        );
        return;
      }

      const distChunks: string[] = [];
      activeWithCounts.forEach((id) => {
        const count = subjectCustomCounts[id] ?? 0;
        if (count > 0) {
          distChunks.push(`${id}:${count}`);
        }
      });

      params.set("dist", distChunks.join(","));
      params.set("subjects", activeWithCounts.join(","));
    } else {
      params.set("subjects", subjectsToUse.join(","));

      if (customMode === "errors_recent") {
        params.set("attempts", "10");
      } else if (customMode === "most_wrong") {
        params.set("limit", "50");
      }
    }

    const minutes = Number.parseInt(customMinutes.trim(), 10);
    if (Number.isFinite(minutes) && minutes > 0) {
      params.set("minutes", String(minutes));
    }

    router.push(`/quiz/${quizId}/custom?${params.toString()}`);
  };

  // Salva preset
  const handleSavePreset = () => {
    if (!quiz) return;

    const subjectsToUse =
      selectedSubjectIds.length > 0
        ? selectedSubjectIds
        : activeSubjects.map((s) => s.id);

    if (subjectsToUse.length === 0) {
      alert(
        "Non puoi salvare un preset senza materie. Seleziona almeno una materia."
      );
      return;
    }

    if (customMode === "standard") {
      const activeWithCounts = subjectsToUse.filter(
        (id) => (subjectCustomCounts[id] ?? 0) > 0
      );
      if (activeWithCounts.length === 0) {
        alert(
          "Per il preset standard, imposta almeno una domanda per una materia usando i pulsanti + e −."
        );
        return;
      }
    }

    const name = window.prompt(
      "Nome del preset (es. 'Logica Strong', 'Ripasso errori GdF'):"
    );
    if (!name) return;

    const minutesVal = (() => {
      const m = Number.parseInt(customMinutes.trim(), 10);
      if (!Number.isFinite(m) || m <= 0) return null;
      return m;
    })();

    const preset: TrainingPreset = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.trim(),
      mode: customMode,
      minutes: minutesVal,
      subjects: subjectsToUse,
      dist:
        customMode === "standard"
          ? subjectsToUse.reduce((acc, id) => {
              const count = subjectCustomCounts[id] ?? 0;
              if (count > 0) acc[id] = count;
              return acc;
            }, {} as Record<string, number>)
          : undefined,
    };

    const next = [...presets, preset];
    setPresets(next);
    savePresetsToStorage(next);
    setSelectedPresetId(preset.id);
  };

  const handleApplyPreset = () => {
    if (!selectedPresetId) {
      alert("Seleziona prima un preset dall'elenco.");
      return;
    }
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) {
      alert("Preset non trovato. Riprova.");
      return;
    }

    setCustomMode(preset.mode);
    setCustomMinutes(
      preset.minutes && preset.minutes > 0 ? String(preset.minutes) : ""
    );
    setSelectedSubjectIds(preset.subjects);

    if (preset.mode === "standard" && preset.dist) {
      setSubjectCustomCounts((prev) => {
        const next: Record<string, number> = { ...prev };
        Object.keys(preset.dist!).forEach((subjectId) => {
          next[subjectId] = preset.dist![subjectId] ?? 0;
        });
        return next;
      });
    }
  };

  const handleDeletePreset = () => {
    if (!selectedPresetId) {
      alert("Seleziona prima un preset da eliminare.");
      return;
    }
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) {
      alert("Preset non trovato.");
      return;
    }

    const confirmDelete = window.confirm(
      `Vuoi davvero eliminare il preset "${preset.name}"?`
    );
    if (!confirmDelete) return;

    const next = presets.filter((p) => p.id !== selectedPresetId);
    setPresets(next);
    savePresetsToStorage(next);
    setSelectedPresetId("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push("/")}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna ai concorsi
        </button>

        {loading ? (
          <p className="text-sm text-slate-300">Caricamento concorso…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !quiz ? (
          <p className="text-sm text-red-400">
            Concorso non trovato. Controlla l&apos;URL.
          </p>
        ) : (
          <>
            {/* Header concorso */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-xl font-semibold mb-1">
                    {anyQuiz.title || "Concorso"}
                  </h1>
                  <p className="text-xs text-slate-300 mb-2">
                    {anyQuiz.year && (
                      <span className="mr-2">Anno {anyQuiz.year}</span>
                    )}
                    {anyQuiz.total_questions && (
                      <span className="mr-2">
                        Domande ufficiali: {anyQuiz.total_questions}
                      </span>
                    )}
                    {anyQuiz.time_limit && (
                      <span className="mr-2">
                        Tempo: {anyQuiz.time_limit} min
                      </span>
                    )}
                  </p>
                  {anyQuiz.description && (
                    <p className="text-xs text-slate-200 mb-1">
                      {anyQuiz.description}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-300">
                    Punteggio:{" "}
                    <span className="text-emerald-400">
                      +{anyQuiz.points_correct ?? 1} corretta
                    </span>{" "}
                    ·{" "}
                    <span className="text-rose-400">
                      {anyQuiz.points_wrong ?? -0.33} errata
                    </span>{" "}
                    ·{" "}
                    <span className="text-slate-100">
                      {anyQuiz.points_blank ?? 0} omessa
                    </span>
                  </p>
                </div>

                {/* Bottoni navigazione: storico + stats */}
                <div className="flex flex-row gap-2 md:flex-col md:items-end text-xs">
                  <button
                    type="button"
                    onClick={() => router.push(`/quiz/${quizId}/attempts`)}
                    className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 hover:border-slate-400"
                  >
                    Storico tentativi
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/quiz/${quizId}/stats`)}
                    className="rounded-md border border-sky-700 bg-sky-900/40 px-3 py-1.5 text-sky-100 hover:border-sky-400"
                  >
                    Statistiche
                  </button>
                </div>
              </div>
            </div>

            {/* Carte: quiz ufficiale / personalizzato */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Ufficiale */}
              <div className="rounded-2xl border border-emerald-700/70 bg-emerald-900/10 p-4">
                <h2 className="text-sm font-semibold mb-1">Quiz ufficiale</h2>
                <p className="text-xs text-slate-200 mb-2">
                  Simulazione fedele al concorso: numero di domande, tempo e
                  distribuzione per materia seguono le regole impostate
                  nell&apos;area admin.
                </p>

                <div className="mb-3 text-[11px] text-slate-300">
                  <p className="font-semibold mb-1">Distribuzione materie</p>
                  {rulesWithSubjectName.length === 0 ? (
                    <p className="text-slate-400">
                      Nessuna regola configurata per questo concorso. Impostale
                      dall&apos;area admin (&quot;Regole concorso&quot;).
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {rulesWithSubjectName.map((r) => (
                        <li key={r.id}>
                          <span className="text-slate-100">
                            {r.subjectName}
                          </span>{" "}
                          · {r.num_questions} domande
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={handleStartOfficial}
                  className="mt-2 w-full rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                  disabled={rulesWithSubjectName.length === 0}
                >
                  Inizia quiz ufficiale
                </button>
              </div>

              {/* Personalizzato */}
              <div className="rounded-2xl border border-sky-700/70 bg-sky-900/10 p-4">
                <h2 className="text-sm font-semibold mb-1">
                  Quiz personalizzato
                </h2>
                <p className="text-xs text-slate-200 mb-2">
                  Allenati in tre modalità:
                  <br />
                  <span className="text-slate-100">
                    • Standard →
                  </span>{" "}
                  scegli quante domande per materia
                  <br />
                  <span className="text-slate-100">
                    • Solo errori →
                  </span>{" "}
                  domande che hai sbagliato negli ultimi tentativi
                  <br />
                  <span className="text-slate-100">
                    • Domande più sbagliate →
                  </span>{" "}
                  quelle dove sbagli più spesso
                </p>

                <div className="space-y-3 text-xs">
                  {/* Modalità */}
                  <div>
                    <p className="mb-1 text-slate-200">Modalità</p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[11px]">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={customMode === "standard"}
                          onChange={() => setCustomMode("standard")}
                        />
                        <span>Standard (distribuzione a +/− per materia)</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px]">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={customMode === "errors_recent"}
                          onChange={() => setCustomMode("errors_recent")}
                        />
                        <span>Solo errori recenti (ultimi 10 tentativi)</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px]">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={customMode === "most_wrong"}
                          onChange={() => setCustomMode("most_wrong")}
                        />
                        <span>Domande più sbagliate (max 50 domande)</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Le modalità basate sugli errori usano i dati dei quiz
                      ufficiali per trovare le domande dove fai più fatica.
                    </p>
                  </div>

                  {/* Tempo */}
                  <div>
                    <label className="mb-1 block text-slate-200">
                      Tempo (minuti) (opzionale)
                    </label>
                    <input
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="Es. 60"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Se lasci vuoto, verrà usato il tempo ufficiale del
                      concorso (se impostato), altrimenti nessun timer.
                    </p>
                  </div>

                  {/* Materie + selezione domande */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-200">
                        Materie e numero di domande *
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-[11px] text-sky-300 hover:text-sky-200"
                      >
                        {allSelected ? "Deseleziona tutte" : "Seleziona tutte"}
                      </button>
                    </div>

                    {activeSubjects.length === 0 ? (
                      <p className="text-[11px] text-slate-400">
                        Nessuna materia attiva per questo concorso. Aggiungile
                        dall&apos;area admin.
                      </p>
                    ) : (
                      <div className="max-h-52 overflow-auto rounded-md border border-slate-700 bg-slate-950/80 px-2 py-2 space-y-2">
                        {activeSubjects.map((s) => {
                          const anyS: any = s;
                          const checked = selectedSubjectIds.includes(s.id);
                          const max = questionCountMap[s.id] ?? 0;
                          const value = subjectCustomCounts[s.id] ?? 0;

                          const buttonsDisabled = customMode !== "standard";

                          return (
                            <div
                              key={s.id}
                              className="flex flex-col gap-1 rounded-md bg-slate-900/70 px-2 py-2"
                            >
                              <label className="flex items-center gap-2 text-[11px] text-slate-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="h-3 w-3"
                                  checked={checked}
                                  onChange={() => handleToggleSubject(s.id)}
                                />
                                <span>
                                  {anyS.name || "Materia"}
                                  {anyS.code ? ` (${anyS.code})` : ""}
                                </span>
                              </label>
                              <div className="flex items-center justify-between text-[11px] text-slate-300">
                                <span>
                                  Domande:{" "}
                                  <span className="font-mono text-slate-100">
                                    {value}
                                  </span>{" "}
                                  / {max}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeSubjectCount(s.id, -1)
                                    }
                                    disabled={buttonsDisabled}
                                    className="h-6 w-6 rounded-md border border-slate-600 bg-slate-900 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleChangeSubjectCount(s.id, +1)
                                    }
                                    disabled={buttonsDisabled}
                                    className="h-6 w-6 rounded-md border border-slate-600 bg-slate-900 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {customMode === "standard" ? (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Totale domande selezionate:{" "}
                        <span className="font-mono text-slate-100">
                          {totalSelectedQuestions}
                        </span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Nelle modalità &quot;solo errori&quot; e
                        &quot;più sbagliate&quot; i numeri impostati con + e −
                        non vengono usati: il sistema sceglie automaticamente le
                        domande dagli errori registrati.
                      </p>
                    )}
                  </div>

                  {/* PRESET */}
                  <div className="border-t border-slate-800 pt-2 mt-1">
                    <p className="text-[11px] text-slate-200 mb-1">
                      Preset di allenamento
                    </p>

                    {presets.length === 0 ? (
                      <p className="text-[11px] text-slate-400 mb-1">
                        Nessun preset salvato. Imposta modalità, materie e
                        (se standard) domande per materia, poi clicca{" "}
                        <span className="text-slate-100">Salva preset</span>.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <select
                          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px]"
                          value={selectedPresetId}
                          onChange={(e) =>
                            setSelectedPresetId(e.target.value)
                          }
                        >
                          <option value="">Seleziona un preset…</option>
                          {presets.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ·{" "}
                              {p.mode === "standard"
                                ? "Standard"
                                : p.mode === "errors_recent"
                                ? "Solo errori"
                                : "Più sbagliate"}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleApplyPreset}
                            className="flex-1 rounded-md bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white"
                          >
                            Applica preset
                          </button>
                          <button
                            type="button"
                            onClick={handleDeletePreset}
                            className="rounded-md bg-rose-700/90 px-3 py-1.5 text-[11px] font-medium text-white"
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSavePreset}
                      className="mt-2 w-full rounded-md bg-sky-700 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-sky-600"
                    >
                      Salva preset attuale
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleStartCustom}
                  className="mt-3 w-full rounded-md bg-sky-700 px-4 py-2 text-xs font-medium text-white hover:bg-sky-600"
                >
                  Inizia quiz personalizzato
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
