"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

const formatErrorMessage = (error: unknown) => {
  if (!error) return "Errore sconosciuto";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return String(error);
};

const BUCKET = "question-images"; // nome bucket Storage

export default function AdminQuestionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params); // ID domanda
  const router = useRouter();

  const [question, setQuestion] = useState<QuestionRow | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // campi editabili
  const [text, setText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"a" | "b" | "c" | "d" | "">(
    ""
  );
  const [imageUrl, setImageUrl] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");

  // upload immagine diretto
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadSuccess, setImageUploadSuccess] = useState<string | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // 1) carico domanda
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", id)
          .single();

        if (qError || !qData) {
          console.error("Errore caricando domanda:", qError);
          setError("Domanda non trovata.");
          setQuestion(null);
          setLoading(false);
          return;
        }

        const q = qData as QuestionRow;
        setQuestion(q);

        // 2) carico materie dello stesso quiz (se quiz_id presente)
        let subj: SubjectRow[] = [];
        if (q.quiz_id) {
          const { data: subjData, error: subjError } = await supabase
            .from("subjects")
            .select("*")
            .eq("quiz_id", q.quiz_id)
            .order("created_at", { ascending: true });

          if (subjError) {
            console.warn("Errore caricando subjects in edit:", subjError);
          } else {
            subj = (subjData || []) as SubjectRow[];
          }
        }
        setSubjects(subj);

        // 3) inizializza form
        setText(q.text ?? "");
        setOptionA(q.option_a ?? "");
        setOptionB(q.option_b ?? "");
        setOptionC(q.option_c ?? "");
        setOptionD(q.option_d ?? "");
        setCorrectOption(
          (q.correct_option as "a" | "b" | "c" | "d" | "") ?? ""
        );
        setImageUrl(q.image_url ?? "");
        setSubjectId(q.subject_id ?? "");
      } catch (err) {
        console.error("Errore imprevisto in edit domanda:", err);
        setError("Errore nel caricamento della domanda.");
        setQuestion(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSave = async () => {
    if (!question) return;

    if (!text.trim()) {
      setError("Il testo della domanda è obbligatorio.");
      setSuccess(null);
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setError("Tutte le opzioni (A, B, C, D) sono obbligatorie.");
      setSuccess(null);
      return;
    }
    if (!correctOption) {
      setError("Seleziona l'opzione corretta.");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
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
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (updateError) {
        const msg =
          updateError.message || updateError.details || String(updateError);
        console.error("Supabase UPDATE questions error:", updateError, {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        setError(`Errore durante il salvataggio della domanda: ${msg}`);
        return;
      }

      if (!updated) {
        setError("Nessuna riga aggiornata (ID non trovato).");
        return;
      }

      setQuestion(updated as QuestionRow);
      setSuccess("Domanda salvata con successo.");
    } catch (err: unknown) {
      console.error("Errore imprevisto salvataggio domanda:", err);
      setError(
        formatErrorMessage(err) ||
          "Errore durante il salvataggio della domanda."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    router.push("/admin");
  };
  // 🔹 gestione upload immagine diretto: carica su Storage + salva SUBITO nel DB
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    setImageUploadError(null);
    setImageUploadSuccess(null);
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setImageUploadError("Seleziona prima un file immagine.");
      setImageUploadSuccess(null);
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);
    setImageUploadSuccess(null);

    try {
      // nome file "pulito"
      const safeName = imageFile.name.trim().replace(/\s+/g, "_").toLowerCase();
      const filePath = `${id}_${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Errore upload immagine:", uploadError);
        setImageUploadError(
          uploadError.message || "Errore durante l'upload dell'immagine."
        );
        return;
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || "";

      if (!publicUrl) {
        setImageUploadError(
          "Upload riuscito, ma non è stato possibile ottenere la URL pubblica."
        );
        return;
      }

      // 🔥 Salva SUBITO image_url nel DB, così non resta mai null
      const { data: updated, error: updateError } = await supabase
        .from("questions")
        .update({ image_url: publicUrl })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error("Errore aggiornando image_url nel DB:", updateError, {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        setImageUploadError(
          updateError.message ||
            updateError.details ||
            "Upload ok, ma errore nel salvataggio dell'URL nel DB."
        );
        return;
      }

      // aggiorno stato locale + input URL
      if (updated) {
        setQuestion(updated as QuestionRow);
      }
      setImageUrl(publicUrl);
      setImageUploadSuccess(
        "Immagine caricata e salvata nel DB. L'URL è stato impostato automaticamente."
      );
      setImageFile(null);
    } catch (err: unknown) {
      console.error("Errore imprevisto upload immagine:", err);
      setImageUploadError(
        formatErrorMessage(err) || "Errore durante l'upload dell'immagine."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <button
          onClick={handleGoBack}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna alla Admin
        </button>

        {loading ? (
          <p className="text-sm text-slate-300">
            Caricamento dati domanda…
          </p>
        ) : error && !question ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : !question ? (
          <p className="text-sm text-red-400">Domanda non trovata.</p>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1">
              Modifica domanda
            </h1>
            <p className="text-xs text-slate-300 mb-4">
              ID:{" "}
              <span className="font-mono text-slate-100">
                {id}
              </span>
              {question.quiz_id && (
                <>
                  {" "}
                  · Quiz:{" "}
                  <span className="font-mono text-slate-100">
                    {question.quiz_id}
                  </span>
                </>
              )}
            </p>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs space-y-3">
              {/* Materia */}
              <div>
                <label className="block text-slate-200 mb-1">
                  Materia (subject)
                </label>
                {subjects.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Nessuna materia trovata per il quiz associato a questa
                    domanda.
                  </p>
                ) : (
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                  >
                    <option value="">(Nessuna materia)</option>
                    {subjects.map((s) => {
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name || "Materia"}{" "}
                          {s.code ? `(${s.code})` : ""}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Testo domanda */}
              <div>
                <label className="block text-slate-200 mb-1">
                  Testo domanda
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs min-h-[80px]"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              {/* Opzioni */}
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="block text-slate-200 mb-1">
                    Opzione A
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-200 mb-1">
                    Opzione B
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-200 mb-1">
                    Opzione C
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-200 mb-1">
                    Opzione D
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                  />
                </div>
              </div>

              {/* Corretta */}
              <div>
                <label className="block text-slate-200 mb-1">
                  Opzione corretta
                </label>
                <select
                  value={correctOption}
                  onChange={(e) =>
                    setCorrectOption(e.target.value as "a" | "b" | "c" | "d" | "")
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                >
                  <option value="">Seleziona…</option>
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              {/* Immagine: URL + Upload diretto */}
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-200 mb-1">
                    URL immagine (image_url)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Incolla qui la URL pubblica dell'immagine oppure usa il caricamento qui sotto…"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Puoi incollare manualmente una URL pubblica oppure usare il
                    caricamento diretto: al termine l&apos;URL viene impostata
                    automaticamente e salvata nel DB.
                  </p>
                </div>

                {/* Upload diretto */}
                <div className="rounded-md border border-slate-800 bg-slate-950 p-2">
                  <p className="text-[11px] text-slate-200 mb-1">
                    Carica immagine su Supabase Storage
                  </p>
                  <div className="flex flex-col gap-2 text-[11px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={uploadingImage || !imageFile}
                      className="w-full rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage
                        ? "Caricamento immagine…"
                        : "Carica immagine e salva nel DB"}
                    </button>
                    {imageUploadError && (
                      <p className="text-[11px] text-red-400">
                        {imageUploadError}
                      </p>
                    )}
                    {imageUploadSuccess && (
                      <p className="text-[11px] text-emerald-400">
                        {imageUploadSuccess}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Il file viene caricato nel bucket <code>{BUCKET}</code>{" "}
                      e l&apos;URL pubblica viene salvata direttamente in{" "}
                      <code>questions.image_url</code> per questa domanda.
                    </p>
                  </div>
                </div>

                {imageUrl && (
                  <div className="mt-2 rounded-md border border-slate-800 bg-slate-950 p-2">
                    <p className="text-[11px] text-slate-200 mb-1">
                      Anteprima immagine:
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Anteprima immagine domanda"
                      className="max-h-48 rounded-md border border-slate-800 object-contain"
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-[11px] text-red-400 whitespace-pre-line">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-[11px] text-emerald-400 whitespace-pre-line">
                  {success}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? "Salvataggio…" : "Salva modifiche"}
                </button>
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
                >
                  Annulla
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
