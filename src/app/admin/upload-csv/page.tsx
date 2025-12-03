"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

type CsvRow = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  subject_id?: string;
  image_name?: string;
};

const BUCKET = "question-images"; // cambia se il bucket ha altro nome

function normalizeImageName(original: string): string {
  // stessa normalizzazione che useremo in upload multiplo
  return original.trim().replace(/\s+/g, "_").toLowerCase();
}

export default function AdminUploadCsvPage() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Bulk immagini
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageMsg, setImageMsg] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);

  useEffect(() => {
    const loadQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Errore caricando quizzes:", error);
        return;
      }
      setQuizzes((data || []) as QuizRow[]);
    };

    loadQuizzes();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedQuizId) {
        setSubjects([]);
        setSelectedSubjectId("");
        return;
      }

      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("quiz_id", selectedQuizId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Errore caricando subjects:", error);
        setSubjects([]);
        setSelectedSubjectId("");
        return;
      }

      const list = (data || []) as SubjectRow[];
      setSubjects(list);
      if (list.length > 0) {
        setSelectedSubjectId(list[0].id);
      } else {
        setSelectedSubjectId("");
      }
    };

    loadSubjects();
  }, [selectedQuizId]);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setCsvFile(f);
    setImportError(null);
    setImportSuccess(null);
  };

  const parseCsv = async (file: File): Promise<CsvRow[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV vuoto o senza righe di dati.");
    }

    const headerLine = lines[0];
    const headers = headerLine
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));

    const required = [
      "question_text",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct_option",
    ];

    for (const r of required) {
      if (!headers.includes(r)) {
        throw new Error(
          `Colonna obbligatoria mancante: "${r}". Header trovati: ${headers.join(
            ", "
          )}`
        );
      }
    }

    const idx = (name: string) => headers.indexOf(name);

    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;

      const cols = raw
        .split(",")
        .map((c) => c.trim().replace(/^"|"$/g, ""));

      const row: CsvRow = {
        question_text: cols[idx("question_text")] ?? "",
        option_a: cols[idx("option_a")] ?? "",
        option_b: cols[idx("option_b")] ?? "",
        option_c: cols[idx("option_c")] ?? "",
        option_d: cols[idx("option_d")] ?? "",
        correct_option: (cols[idx("correct_option")] ?? "").toLowerCase(),
      };

      if (idx("subject_id") >= 0) {
        const sid = cols[idx("subject_id")]?.trim();
        if (sid) row.subject_id = sid;
      }

      if (idx("image_name") >= 0) {
        const iname = cols[idx("image_name")]?.trim();
        if (iname) row.image_name = iname;
      } else if (idx("image") >= 0) {
        const iname = cols[idx("image")]?.trim();
        if (iname) row.image_name = iname;
      }

      rows.push(row);
    }

    return rows;
  };

  const handleImport = async () => {
    if (!selectedQuizId) {
      setImportError("Seleziona prima un concorso.");
      return;
    }
    if (!csvFile) {
      setImportError("Seleziona prima un file CSV.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const parsed = await parseCsv(csvFile);
      if (parsed.length === 0) {
        throw new Error("Nessuna riga valida trovata nel CSV.");
      }

      // preparazione dei record per insert
      const toInsert = parsed.map((row, idx) => {
        let subjectId = row.subject_id?.trim();
        if (!subjectId && selectedSubjectId) {
          subjectId = selectedSubjectId;
        }

        if (!subjectId) {
          console.warn(
            `Riga ${idx + 2}: subject_id mancante e nessuna materia selezionata. La domanda verrà saltata.`
          );
        }

        // normalizziamo correct_option: a/b/c/d
        const corr = row.correct_option?.toLowerCase();
        if (!["a", "b", "c", "d"].includes(corr)) {
          console.warn(
            `Riga ${idx + 2}: correct_option non valida "${row.correct_option}". Deve essere a, b, c o d.`
          );
        }

        // costruiamo image_url se image_name presente
        let imageUrl: string | null = null;
        if (row.image_name) {
          const normalizedName = normalizeImageName(row.image_name);
          const { data: urlData } = supabase
            .storage
            .from(BUCKET)
            .getPublicUrl(normalizedName);
          imageUrl = urlData?.publicUrl || null;
        }

        return {
          quiz_id: selectedQuizId,
          subject_id: subjectId ?? null,
          text: row.question_text,
          option_a: row.option_a,
          option_b: row.option_b,
          option_c: row.option_c,
          option_d: row.option_d,
          correct_option: corr,
          image_url: imageUrl,
          is_archived: false,
        };
      });

      const valid = toInsert.filter(
        (q) =>
          q.subject_id &&
          q.text &&
          q.option_a &&
          q.option_b &&
          q.option_c &&
          q.option_d &&
          q.correct_option
      );

      if (valid.length === 0) {
        throw new Error(
          "Nessuna riga valida da importare. Controlla subject_id, opzioni e correct_option."
        );
      }

      const { error: insertError } = await supabase
        .from("questions")
        .insert(valid);

      if (insertError) {
        console.error("Errore durante l'inserimento delle domande:", insertError);
        setImportError(
          `Errore durante l'inserimento delle domande: ${insertError.message}`
        );
        return;
      }

      setImportSuccess(
        `Import completato: ${valid.length} domande inserite con successo.`
      );
    } catch (err: any) {
      console.error("Errore import CSV:", err);
      setImportError(
        err?.message ||
          "Errore durante l'import del CSV. Controlla il formato del file."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleImageFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImageFiles(e.target.files ?? null);
    setImageMsg(null);
    setImageErr(null);
  };

  const handleUploadImages = async () => {
    if (!imageFiles || imageFiles.length === 0) {
      setImageErr("Seleziona uno o più file immagine.");
      return;
    }

    setUploadingImages(true);
    setImageErr(null);
    setImageMsg(null);

    try {
      let uploaded = 0;
      let skipped = 0;
      let failed = 0;

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const normalizedName = normalizeImageName(file.name);

        const { data: existing, error: listError } = await supabase.storage
          .from(BUCKET)
          .list("", {
            search: normalizedName,
            limit: 1,
          });

        if (listError) {
          console.warn("Errore in list per bulk upload:", listError);
        }

        if (existing && existing.length > 0) {
          // già esiste un file con questo nome → per ora lo saltiamo
          console.log(
            `File ${normalizedName} già presente nel bucket, lo salto.`
          );
          skipped++;
          continue;
        }

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(normalizedName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Errore upload immagine:", uploadError);
          failed++;
        } else {
          uploaded++;
        }
      }

      setImageMsg(
        `Upload completato. Caricate: ${uploaded}, già presenti: ${skipped}, fallite: ${failed}.` +
          "\nNel CSV usa la colonna image_name con il nome normalizzato (es. 'figura1.png' → 'figura1.png', 'Figura 1.PNG' → 'figura_1.png')."
      );
    } catch (err: any) {
      console.error("Errore bulk upload immagini:", err);
      setImageErr(
        err?.message || "Errore durante l'upload delle immagini."
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const anySelectedQuiz = quizzes.find((q) => q.id === selectedQuizId) as
    | any
    | undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna alla Admin Dashboard
        </button>

        <h1 className="text-xl font-semibold mb-1">Import domande da CSV</h1>
        <p className="text-xs text-slate-300 mb-4">
          Seleziona concorso e (opzionalmente) una materia, carica un file CSV
          con le domande. Puoi anche caricare in bulk le immagini e collegarle
          alle domande usando la colonna <code>image_name</code>.
        </p>

        {/* 🔹 Sezione bulk immagini */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-4 text-xs">
          <h2 className="text-sm font-semibold mb-2">Bulk upload immagini</h2>
          <p className="text-[11px] text-slate-300 mb-2">
            Tutte le immagini vengono caricate nel bucket{" "}
            <code>{BUCKET}</code> con nome normalizzato (minuscole, spazi →{" "}
            underscore). Nel CSV puoi usare la colonna{" "}
            <code>image_name</code> con lo stesso nome.
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFilesChange}
              className="text-[11px]"
            />
            <button
              type="button"
              onClick={handleUploadImages}
              disabled={uploadingImages || !imageFiles || imageFiles.length === 0}
              className="w-full rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages
                ? "Caricamento immagini…"
                : "Carica immagini selezionate"}
            </button>
            {imageErr && (
              <p className="text-[11px] text-red-400 whitespace-pre-line">
                {imageErr}
              </p>
            )}
            {imageMsg && (
              <p className="text-[11px] text-emerald-400 whitespace-pre-line">
                {imageMsg}
              </p>
            )}
            <p className="text-[10px] text-slate-400">
              Esempio: carichi <code>Figura 1.PNG</code> → viene salvata come{" "}
              <code>figura_1.png</code>. Nel CSV usa{" "}
              <code>image_name</code> = <code>figura_1.png</code>.
            </p>
          </div>
        </div>

        {/* 🔹 Selezione quiz/materia + upload CSV */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
          <h2 className="text-sm font-semibold mb-2">
            Import domande da CSV
          </h2>

          {/* Selezione concorso */}
          <div className="mb-3">
            <label className="block text-slate-200 mb-1">
              Concorso (quiz)
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
            >
              <option value="">Seleziona un concorso…</option>
              {quizzes.map((q) => {
                const anyQ: any = q;
                return (
                  <option key={q.id} value={q.id}>
                    {anyQ.title || "Senza titolo"}{" "}
                    {anyQ.year ? `(${anyQ.year})` : ""}
                  </option>
                );
              })}
            </select>
            {anySelectedQuiz && (
              <p className="mt-1 text-[11px] text-slate-400">
                Domande ufficiali:{" "}
                <span className="font-mono text-slate-100">
                  {anySelectedQuiz.total_questions ?? "—"}
                </span>{" "}
                · Tempo:{" "}
                <span className="font-mono text-slate-100">
                  {anySelectedQuiz.time_limit ?? "—"} min
                </span>
              </p>
            )}
          </div>

          {/* Selezione materia */}
          <div className="mb-3">
            <label className="block text-slate-200 mb-1">
              Materia (opzionale, usata se nel CSV manca &quot;subject_id&quot;)
            </label>
            {selectedQuizId ? (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
              >
                {subjects.length === 0 && (
                  <option value="">Nessuna materia disponibile</option>
                )}
                {subjects.map((s) => {
                  const anyS: any = s;
                  return (
                    <option key={s.id} value={s.id}>
                      {anyS.name || "Materia"}{" "}
                      {anyS.code ? `(${anyS.code})` : ""}
                    </option>
                  );
                })}
              </select>
            ) : (
              <p className="text-[11px] text-slate-400">
                Seleziona prima un concorso per vedere le materie disponibili.
              </p>
            )}
          </div>

          {/* Upload CSV */}
          <div className="mb-3">
            <label className="block text-slate-200 mb-1">File CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              className="text-[11px]"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Formato colonne obbligatorie:{" "}
              <code>
                question_text, option_a, option_b, option_c, option_d,
                correct_option
              </code>
              . Opzionali:{" "}
              <code>subject_id, image_name</code>. Se{" "}
              <code>subject_id</code> manca, viene usata la materia selezionata
              sopra.
            </p>
          </div>

          {importError && (
            <p className="text-[11px] text-red-400 mb-1 whitespace-pre-line">
              {importError}
            </p>
          )}
          {importSuccess && (
            <p className="text-[11px] text-emerald-400 mb-1 whitespace-pre-line">
              {importSuccess}
            </p>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !csvFile || !selectedQuizId}
            className="mt-1 w-full rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {importing ? "Import in corso…" : "Importa domande da CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}
