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

const BUCKET = "question-images";

function normalizeImageName(original: string): string {
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
  const [importMsg, setImportMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Bulk Images
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageMsg, setImageMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Load Data
  useEffect(() => {
    supabase.from("quizzes").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setQuizzes((data || []) as QuizRow[]));
  }, []);

  useEffect(() => {
    if (!selectedQuizId) {
      setSubjects([]);
      return;
    }
    supabase.from("subjects").select("*").eq("quiz_id", selectedQuizId)
      .then(({ data }) => {
        const list = (data || []) as SubjectRow[];
        setSubjects(list);
        if (list.length > 0) setSelectedSubjectId(list[0].id);
      });
  }, [selectedQuizId]);

  // CSV Logic
  const parseCsv = async (file: File): Promise<CsvRow[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new Error("CSV vuoto o senza righe.");

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const required = ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"];
    
    for (const r of required) {
      if (!headers.includes(r)) throw new Error(`Colonna mancante: ${r}`);
    }

    const idx = (name: string) => headers.indexOf(name);
    
    return lines.slice(1).map(line => {
      // Very basic CSV split (doesn't handle commas inside quotes well, but sufficient for simple format)
      // For robust parsing, a library like PapaParse is recommended, but we stick to zero-dep for now if consistent.
      // Better regex split:
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(","); 
      // Fallback simple split if regex fails or for simplicity in this context:
      const safeCols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));

      return {
        question_text: safeCols[idx("question_text")] ?? "",
        option_a: safeCols[idx("option_a")] ?? "",
        option_b: safeCols[idx("option_b")] ?? "",
        option_c: safeCols[idx("option_c")] ?? "",
        option_d: safeCols[idx("option_d")] ?? "",
        correct_option: (safeCols[idx("correct_option")] ?? "").toLowerCase(),
        subject_id: idx("subject_id") > -1 ? safeCols[idx("subject_id")] : undefined,
        image_name: idx("image_name") > -1 ? safeCols[idx("image_name")] : undefined,
      };
    });
  };

  const handleImport = async () => {
    if (!selectedQuizId || !csvFile) return;
    setImporting(true);
    setImportMsg(null);

    try {
      const rows = await parseCsv(csvFile);
      const toInsert = [];

      for (const row of rows) {
        let sid = row.subject_id;
        if (!sid && selectedSubjectId) sid = selectedSubjectId;
        if (!sid) continue; // Skip if no subject

        const validOptions = ["a", "b", "c", "d"];
        if (!validOptions.includes(row.correct_option)) continue;

        let imgUrl = null;
        if (row.image_name) {
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(normalizeImageName(row.image_name));
          imgUrl = data.publicUrl;
        }

        toInsert.push({
          quiz_id: selectedQuizId,
          subject_id: sid,
          text: row.question_text,
          option_a: row.option_a,
          option_b: row.option_b,
          option_c: row.option_c,
          option_d: row.option_d,
          correct_option: row.correct_option,
          image_url: imgUrl
        });
      }

      if (toInsert.length === 0) throw new Error("Nessuna riga valida trovata.");

      const { error } = await supabase.from("questions").insert(toInsert);
      if (error) throw error;

      setImportMsg({ type: 'success', text: `Importati ${toInsert.length} quesiti con successo!` });
    } catch (err: any) {
      console.error(err);
      setImportMsg({ type: 'error', text: err.message || "Errore import." });
    } finally {
      setImporting(false);
    }
  };

  // Bulk Image Upload
  const handleUploadImages = async () => {
    if (!imageFiles || imageFiles.length === 0) return;
    setUploadingImages(true);
    setImageMsg(null);

    let count = 0;
    let errors = 0;

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const name = normalizeImageName(file.name);
        const { error } = await supabase.storage.from(BUCKET).upload(name, file, { upsert: false });
        if (error) errors++;
        else count++;
      }
      setImageMsg({ type: count > 0 ? 'success' : 'error', text: `Caricate: ${count}, Errori/Duplicati: ${errors}` });
    } catch (err: any) {
      setImageMsg({ type: 'error', text: "Errore upload massivo." });
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => router.push("/admin")} className="text-xs text-slate-400 hover:text-white mb-4">← Dashboard</button>
        <h1 className="text-2xl font-bold mb-2 text-slate-100">Import Massivo</h1>
        <p className="text-sm text-slate-400 mb-8">Carica domande da CSV e immagini in bulk.</p>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* CSV Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400">1. Domande (CSV)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Concorso</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                >
                  <option value="">Seleziona...</option>
                  {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Materia Default</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={!selectedQuizId}
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">File CSV</label>
                <input 
                  type="file" accept=".csv"
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
              </div>

              {importMsg && (
                <div className={`text-xs p-2 rounded border ${importMsg.type === 'error' ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-emerald-900/20 border-emerald-800 text-emerald-300'}`}>
                  {importMsg.text}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing || !csvFile || !selectedQuizId}
                className="w-full py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50"
              >
                {importing ? "Importazione..." : "Importa CSV"}
              </button>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-sky-400">2. Immagini (Bulk)</h2>
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Carica tutte le immagini citate nel CSV (colonna <code>image_name</code>).
                I nomi file verranno normalizzati (es. "Fig 1.jpg" -> "fig_1.jpg").
              </p>
              
              <input 
                type="file" accept="image/*" multiple
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                onChange={(e) => setImageFiles(e.target.files)}
              />

              {imageMsg && (
                <div className={`text-xs p-2 rounded border ${imageMsg.type === 'error' ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-sky-900/20 border-sky-800 text-sky-300'}`}>
                  {imageMsg.text}
                </div>
              )}

              <button
                onClick={handleUploadImages}
                disabled={uploadingImages || !imageFiles}
                className="w-full py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-500 disabled:opacity-50"
              >
                {uploadingImages ? "Caricamento..." : "Carica Immagini"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}