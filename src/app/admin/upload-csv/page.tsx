import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import { AdminLayout, AdminPageHeader } from "@/components/admin";

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
  explanation?: string;
};

const BUCKET = "question-images";

function normalizeImageName(original: string): string {
  return original.trim().replace(/\s+/g, "_").toLowerCase();
}

export default function AdminUploadCsvPage() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<CsvRow[]>([]);
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

    // Auto-detect separator
    const headerLine = lines[0];
    const separator = headerLine.includes(";") ? ";" : ",";

    // Helper to split CSV line respecting quotes (basic)
    const splitLine = (line: string) => {
      // Regex matches: quoted fields OR non-comma/semicolon sequences
      const pattern = separator === ";" ? /(".*?"|[^";]+)(?=\s*;|\s*$)/g : /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
      const matches = line.match(pattern) || [];
      return matches.map(m => m.replace(/^"|"$/g, "").trim()); // remove quotes
    };

    const headers = splitLine(headerLine).map(h => h.toLowerCase().replace(/['"]/g, "").trim());

    // Map common aliases
    const findIdx = (candidates: string[]) => headers.findIndex(h => candidates.includes(h));

    const idxText = findIdx(["question_text", "question", "domanda", "testo"]);
    const idxA = findIdx(["option_a", "a", "opzione_a"]);
    const idxB = findIdx(["option_b", "b", "opzione_b"]);
    const idxC = findIdx(["option_c", "c", "opzione_c"]);
    const idxD = findIdx(["option_d", "d", "opzione_d"]);
    const idxCorrect = findIdx(["correct_option", "correct", "correct_answer", "risposta", "esatta"]);
    const idxSubj = findIdx(["subject_id", "subject", "materia"]);
    const idxImg = findIdx(["image_name", "image", "immagine", "img"]);
    const idxExp = findIdx(["explanation", "spiegazione", "commento"]);

    if (idxText === -1 || idxA === -1 || idxCorrect === -1) {
      throw new Error(`Colonne obbligatorie mancanti. Trovate: ${headers.join(", ")}. Servono: question_text, option_a... correct_option`);
    }

    const result: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      if (cols.length < 3) continue; // skip empty/malformed lines

      // Clean Correct Option
      const rawCorrect = cols[idxCorrect] ?? "";
      // Remove punctuation, brackets, whitespace
      const cleanCorrect = rawCorrect.replace(/[.,:;()\[\]"' ]/g, "").toLowerCase().substring(0, 1);

      if (!["a", "b", "c", "d"].includes(cleanCorrect)) {
        console.warn(`Row ${i}: Invalid correct option '${rawCorrect}' (cleaned: '${cleanCorrect}'). Skipping.`);
        continue;
      }

      // Helper to sanitize CSV Injection (Formula Injection)
      // If a field starts with =, +, -, @, it can execute code in Excel.
      const sanitize = (val: string | undefined) => {
        if (!val) return val;
        // If it starts with a dangerous char, prepend a single quote to force text mode
        if (/^[\=\+\-\@]/.test(val)) {
          return "'" + val;
        }
        return val;
      };

      result.push({
        question_text: sanitize(cols[idxText] ?? "")!,
        option_a: sanitize(cols[idxA] ?? "")!,
        option_b: sanitize(cols[idxB] ?? "")!,
        option_c: sanitize(cols[idxC] ?? "")!,
        option_d: sanitize(cols[idxD] ?? "")!,
        correct_option: cleanCorrect,
        subject_id: idxSubj > -1 ? cols[idxSubj] : undefined,
        image_name: idxImg > -1 ? cols[idxImg] : undefined,
        explanation: sanitize(idxExp > -1 ? cols[idxExp] : undefined),
      });
    }

    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setCsvFile(f || null);
    setParsedPreview([]);
    setImportMsg(null);

    if (f) {
      try {
        const rows = await parseCsv(f);
        setParsedPreview(rows.slice(0, 5)); // Show first 5
        setImportMsg({ type: 'success', text: `File letto correttamente. ${rows.length} domande valide trovate.` });
      } catch (err: any) {
        setImportMsg({ type: 'error', text: err.message });
      }
    }
  };

  const handleImport = async () => {
    if (!selectedQuizId || !csvFile) return;
    setImporting(true);

    try {
      const rows = await parseCsv(csvFile);
      const toInsert = [];

      for (const row of rows) {
        let sid = row.subject_id;
        // If subject_id in CSV is just a name, we can't map it easily without fetching all subjects.
        // For now, we fallback to selected default if CSV subject is missing.
        if (!sid && selectedSubjectId) sid = selectedSubjectId;

        if (!sid) continue;

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
          image_url: imgUrl,
          explanation: row.explanation
        });
      }

      if (toInsert.length === 0) throw new Error("Nessuna riga valida da importare.");

      const { error } = await supabase.from("questions").insert(toInsert);
      if (error) throw error;

      setImportMsg({ type: 'success', text: `Importazione completata! ${toInsert.length} domande aggiunte.` });
      setCsvFile(null);
      setParsedPreview([]);
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
        const { error } = await supabase.storage.from(BUCKET).upload(name, file, { upsert: true });
        if (error) {
          console.error("Upload fail:", name, error);
          errors++;
        }
        else count++;
      }
      setImageMsg({ type: count > 0 ? 'success' : 'error', text: `Caricate: ${count}, Errori: ${errors}` });
    } catch (err: any) {
      setImageMsg({ type: 'error', text: "Errore upload massivo." });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option", "subject", "image_name", "explanation"];
    const rows = [
      ['"Qual è la capitale d\'Italia?"', '"Roma"', '"Milano"', '"Napoli"', '"Torino"', '"A"', '"Geografia"', '"capitale.jpg"', '"Roma è la capitale dal 1871..."'],
      ['"Quanto fa 2+2?"', '"3"', '"4"', '"5"', '"6"', '"B"', '"Matematica"', '""', '""']
    ];
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "template_domande.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl">
        <AdminPageHeader
          title="Import Massivo"
          subtitle="Carica domande e immagini in blocco per popolare i tuoi concorsi."
          breadcrumb={[
            { label: 'Admin', path: '/admin' },
            { label: 'Import CSV' }
          ]}
        />

        <div className="flex gap-3 mb-8">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200">.CSV (UTF-8)</span>
          <span className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-bold border border-sky-200">.JPG / .PNG</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* CSV Section */}
          <div className="bg-white border border-slate-200/50 rounded-[20px] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <span className="text-9xl grayscale">📄</span>
            </div>
            <h2 className="text-xl font-black mb-6 text-slate-900 flex items-center gap-3 relative z-10">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">1</span>
              Domande (CSV)
            </h2>

            <div className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Concorso Destinazione</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#00B1FF]/20 focus:border-[#00B1FF] transition-all font-medium"
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                >
                  <option value="">Seleziona un concorso...</option>
                  {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materia Default (Fallback)</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#00B1FF]/20 focus:border-[#00B1FF] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  disabled={!selectedQuizId}
                >
                  <option value="">-- Seleziona Materia --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  Usata se la colonna <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">subject_id</code> nel CSV è vuota.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  File CSV
                  <button onClick={handleDownloadTemplate} className="text-[#00B1FF] hover:text-[#0091D5] underline transition-colors font-medium normal-case flex items-center gap-1">
                    <span>⬇️</span> Scarica Template
                  </button>
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group hover:border-slate-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-2xl group-hover:scale-110 transition-transform">📂</p>
                    <p className="mb-1 text-sm text-slate-500 font-medium"><span className="font-bold text-slate-700">Clicca per caricare</span> o trascina</p>
                    <p className="text-xs text-slate-400">CSV delimitato da virgola o punto e virgola</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>
                {csvFile && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <span>✅ File selezionato:</span>
                    <span className="text-emerald-700">{csvFile.name}</span>
                  </div>
                )}
              </div>

              {importMsg && (
                <div className={`text-xs p-3 rounded-xl border font-medium flex items-start gap-2 ${importMsg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                  <span>{importMsg.type === 'error' ? '⚠️' : '🎉'}</span>
                  {importMsg.text}
                </div>
              )}

              {/* Preview */}
              {parsedPreview.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden">
                  <p className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Anteprima (Prime 5 righe)</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white rounded-lg overflow-hidden shadow-sm border border-slate-100">
                      <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-2">Domanda</th>
                          <th className="p-2 w-16 text-center text-emerald-600">Risp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.map((r, i) => (
                          <tr key={i} className="group hover:bg-slate-50 transition-colors">
                            <td className="p-2 truncate max-w-[150px] text-slate-700 font-medium">{r.question_text}</td>
                            <td className="p-2 font-mono text-center font-bold text-emerald-600 bg-emerald-50">{r.correct_option}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing || !csvFile || !selectedQuizId}
                className="w-full py-4 bg-emerald-500 text-white text-sm font-black rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span> Importazione in corso...
                  </>
                ) : "🚀  Esegui Importazione CSV"}
              </button>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white border border-slate-200/50 rounded-[20px] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <span className="text-9xl grayscale">🖼️</span>
            </div>
            <h2 className="text-xl font-black mb-6 text-slate-900 flex items-center gap-3 relative z-10">
              <span className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold">2</span>
              Immagini (Bulk)
            </h2>

            <div className="space-y-5 relative z-10">
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
                <p className="text-xs text-sky-700 font-medium leading-relaxed">
                  Carica tutte le immagini citate nel CSV (colonna <code className="bg-white px-1 py-0.5 rounded border border-sky-200 font-mono text-sky-600">image_name</code>).
                  I nomi file verranno normalizzati automaticamente (es. &quot;Fig 1.jpg&quot; &rarr; &quot;fig_1.jpg&quot;).
                </p>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group hover:border-slate-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-2xl group-hover:scale-110 transition-transform">🌇</p>
                  <p className="mb-1 text-sm text-slate-500 font-medium"><span className="font-bold text-slate-700">Seleziona immagini</span> (multiplo)</p>
                  <p className="text-xs text-slate-400">JPG, PNG supportati</p>
                </div>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImageFiles(e.target.files)} />
              </label>

              {imageFiles && imageFiles.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-sky-600 bg-sky-50 px-3 py-2 rounded-lg border border-sky-200">
                  <span>📸 Selezionate:</span>
                  <span className="text-sky-700">{imageFiles.length} immagini</span>
                </div>
              )}

              {imageMsg && (
                <div className={`text-xs p-3 rounded-xl border font-medium flex items-start gap-2 ${imageMsg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                  <span>{imageMsg.type === 'error' ? '⚠️' : '✅'}</span>
                  {imageMsg.text}
                </div>
              )}

              <button
                onClick={handleUploadImages}
                disabled={uploadingImages || !imageFiles}
                className="w-full py-4 bg-sky-500 text-white text-sm font-black rounded-xl hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {uploadingImages ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span> Caricamento...
                  </>
                ) : "☁️  Carica Immagini su Cloud"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}