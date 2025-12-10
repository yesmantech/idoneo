import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import AdminLayout from "../../AdminLayout";

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

const BUCKET = "question-images";

export default function AdminQuestionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [text, setText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"a" | "b" | "c" | "d" | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [explanation, setExplanation] = useState("");

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadSuccess, setImageUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!id) throw new Error("ID mancante");

        // 1. Load Question
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", id)
          .single();

        if (qError || !qData) throw new Error("Domanda non trovata");
        const q = qData as QuestionRow;
        setQuestion(q);

        // 2. Load Subjects for the related Quiz
        if (q.quiz_id) {
          const { data: subjData } = await supabase
            .from("subjects")
            .select("*")
            .eq("quiz_id", q.quiz_id)
            .order("name", { ascending: true });

          setSubjects((subjData || []) as SubjectRow[]);
        }

        // 3. Init Form
        setText(q.text ?? "");
        setOptionA(q.option_a ?? "");
        setOptionB(q.option_b ?? "");
        setOptionC(q.option_c ?? "");
        setOptionD(q.option_d ?? "");
        setCorrectOption((q.correct_option as "a" | "b" | "c" | "d") ?? "");
        setImageUrl(q.image_url ?? "");
        setSubjectId(q.subject_id ?? "");
        setExplanation(q.explanation ?? "");

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Errore caricamento.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSave = async () => {
    if (!question) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!text.trim()) throw new Error("Il testo è obbligatorio.");
      if (!correctOption) throw new Error("Seleziona l'opzione corretta.");

      const { data: updated, error: updateError } = await supabase
        .from("questions")
        .update({
          text: text.trim(),
          option_a: optionA.trim(),
          option_b: optionB.trim(),
          option_c: optionC.trim(),
          option_d: optionD.trim(),
          correct_option: correctOption,
          image_url: imageUrl.trim() || null,
          subject_id: subjectId || null,
          explanation: explanation.trim() || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setQuestion(updated as QuestionRow);
      setSuccess("Domanda salvata con successo.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile || !id) return;
    setUploadingImage(true);
    setImageUploadError(null);
    setImageUploadSuccess(null);

    try {
      const ext = imageFile.name.split('.').pop();
      const fileName = `${id}_${Date.now()}.${ext}`;
      const filePath = fileName; // root of bucket

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Auto-save URL to DB
      const { error: dbError } = await supabase
        .from("questions")
        .update({ image_url: publicUrl })
        .eq("id", id);

      if (dbError) throw dbError;

      setImageUrl(publicUrl);
      setImageUploadSuccess("Immagine caricata e collegata!");
      setImageFile(null);
    } catch (err: any) {
      console.error(err);
      setImageUploadError(err.message || "Errore upload.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center text-slate-400">Caricamento...</div></AdminLayout>;
  if (!question) return <AdminLayout><div className="flex items-center justify-center text-red-400">{error || "Non trovato"}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate("/admin")} className="text-xs text-slate-400 hover:text-white mb-4">← Torna alla lista</button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Modifica Domanda</h1>
          <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{id}</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">

          {/* Main Fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Materia</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">(Nessuna)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Testo Domanda</label>
              <textarea
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 min-h-[100px] outline-none focus:border-sky-500"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Testo Domanda</label>
              <textarea
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 min-h-[100px] outline-none focus:border-sky-500"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Spiegazione (Opzionale)</label>
              <textarea
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 min-h-[80px] outline-none focus:border-sky-500"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Inserisci la spiegazione della risposta corretta..."
              />
            </div>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {['a', 'b', 'c', 'd'].map((opt) => (
              <div key={opt}>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Opzione {opt}</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500"
                  value={opt === 'a' ? optionA : opt === 'b' ? optionB : opt === 'c' ? optionC : optionD}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (opt === 'a') setOptionA(val);
                    else if (opt === 'b') setOptionB(val);
                    else if (opt === 'c') setOptionC(val);
                    else setOptionD(val);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Correct Option */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-400 mb-1">Risposta Corretta</label>
            <div className="flex gap-4">
              {['a', 'b', 'c', 'd'].map((opt) => (
                <label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${correctOption === opt ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>
                  <input
                    type="radio"
                    name="correctOption"
                    value={opt}
                    checked={correctOption === opt}
                    onChange={() => setCorrectOption(opt as any)}
                    className="hidden"
                  />
                  <span className="uppercase font-bold">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="mb-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-2">Immagine (Opzionale)</label>

            <div className="flex gap-4 items-end mb-3">
              <div className="flex-1">
                <input
                  placeholder="URL immagine..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
              <button
                type="button"
                onClick={handleUploadImage}
                disabled={!imageFile || uploadingImage}
                className="px-3 py-2 bg-slate-800 text-xs text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {uploadingImage ? "Caricamento..." : "Upload"}
              </button>
            </div>

            {imageUploadError && <p className="text-xs text-red-400 mb-2">{imageUploadError}</p>}
            {imageUploadSuccess && <p className="text-xs text-emerald-400 mb-2">{imageUploadSuccess}</p>}

            {imageUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="max-h-40 rounded border border-slate-700 object-contain" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-emerald-400">{success}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : "Salva Modifiche"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}