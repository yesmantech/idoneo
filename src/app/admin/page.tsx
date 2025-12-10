import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import {
  AdminLayout,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge
} from "@/components/admin";

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];

// Properly typed join result
type QuestionListItem = QuestionRow & {
  subjects: SubjectRow | null;
  quizzes: QuizRow | null;
};

export default function AdminQuestionsPage() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("questions")
        .select(
          `
          *,
          subjects(*),
          quizzes(*)
        `
        )
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;

      // Cast needed because Supabase types joins as array or object depending on relationship
      setQuestions((data as unknown) as QuestionListItem[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Errore imprevisto.";
      console.error("Errore caricando domande:", err);
      if (!message.includes('Failed to fetch')) {
        setError(message);
      }
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleToggleArchived = async (q: QuestionListItem) => {
    const newValue = !q.is_archived;
    try {
      const { error } = await supabase
        .from("questions")
        .update({ is_archived: newValue })
        .eq("id", q.id);

      if (error) throw error;

      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, is_archived: newValue } : item
        )
      );
    } catch (err) {
      console.error(err);
      alert("Errore nel cambiare lo stato della domanda.");
    }
  };

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return questions.filter((question) => {
      if (!showArchived && question.is_archived) return false;
      if (!term) return true;

      const text = (question.text || "").toLowerCase();
      const subjName = (question.subjects?.name || "").toLowerCase();
      const quizTitle = (question.quizzes?.title || "").toLowerCase();

      return (
        text.includes(term) ||
        subjName.includes(term) ||
        quizTitle.includes(term)
      );
    });
  }, [questions, search, showArchived]);

  // Table Config
  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      render: (q: QuestionListItem) => (
        <span className="font-mono text-[10px] text-slate-500">{q.id.slice(0, 6)}</span>
      )
    },
    {
      key: 'text',
      label: 'Testo',
      render: (q: QuestionListItem) => {
        const truncatedText = q.text && q.text.length > 120
          ? `${q.text.slice(0, 120)}...`
          : q.text || "(senza testo)";

        // Check for missing data (simple heuristic)
        // Note: casting to any to check for correct_answer which might exist in legacy data?
        // Actually adhering to strict types for now
        const hasMissingData = !q.correct_option;

        return (
          <div className="relative pr-4">
            <span className="text-slate-200 font-medium block">
              {truncatedText}
            </span>
            {hasMissingData && (
              <span
                className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-rose-600 rounded-full"
                title="Risposta corretta mancante"
              >!</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'subject',
      label: 'Materia',
      width: '150px',
      render: (q: QuestionListItem) => (
        <span className="text-slate-400 text-xs">
          {q.subjects?.name || (q.subject_id ? "..." : "-")}
        </span>
      )
    },
    {
      key: 'quiz',
      label: 'Concorso',
      width: '180px',
      render: (q: QuestionListItem) => (
        <span className="text-slate-400 text-xs truncate max-w-[150px] block" title={q.quizzes?.title}>
          {q.quizzes?.title || (q.quiz_id ? "..." : "-")}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      width: '100px',
      render: (q: QuestionListItem) => (
        <StatusBadge
          label={q.is_archived ? 'Archiviata' : 'Attiva'}
          variant={q.is_archived ? 'warning' : 'success'}
        />
      )
    }
  ];

  const rowActions = (q: QuestionListItem) => [
    {
      label: 'Modifica',
      icon: '✏️',
      onClick: () => navigate(`/admin/questions/${q.id}`)
    },
    {
      label: q.is_archived ? 'Ripristina' : 'Archivia',
      icon: q.is_archived ? '📤' : '📁',
      onClick: () => handleToggleArchived(q)
    }
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Domande"
        subtitle="Gestione completa della banca dati domande"
        action={{
          label: "Nuova Domanda (WIP)",
          icon: "+",
          onClick: () => alert("Funzionalità in arrivo!"),
          variant: "secondary"
        }}
        breadcrumb={[
          { label: 'Admin', path: '/admin' },
          { label: 'Domande' }
        ]}
      />

      {/* SEARCH & FILTER BAR */}
      <div className="mb-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full md:max-w-md relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Cerca per testo, materia, concorso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded bg-slate-800 border-slate-600 text-emerald-500 focus:ring-emerald-500"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Mostra archiviate
          </label>

          <button
            onClick={loadQuestions}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Ricarica"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          {error}
        </div>
      )}

      {/* TABLE */}
      <AdminTable
        columns={columns}
        data={filteredQuestions}
        loading={loading}
        rowKey={q => q.id}
        rowActions={rowActions}
        emptyState={
          <EmptyState
            icon="❓"
            title="Nessuna domanda trovata"
            description={search ? "Prova a modificare i filtri di ricerca." : "Il database delle domande è vuoto."}
          />
        }
      />
    </AdminLayout>
  );
}
