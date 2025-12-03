"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "question-images"; // cambia qui se il bucket ha un altro nome

type StoredImage = {
  name: string;
  path: string;
  publicUrl: string;
};

export default function AdminImagesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Carica lista immagini dal bucket
  const loadImages = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error("Errore list immagini:", error);
        setError("Errore nel caricamento della lista immagini.");
        setImages([]);
        return;
      }

      const files = data || [];
      const list: StoredImage[] = files.map((f) => {
        const { data: urlData } = supabase
          .storage
          .from(BUCKET)
          .getPublicUrl(f.name);

        return {
          name: f.name,
          path: f.name,
          publicUrl: urlData?.publicUrl || "",
        };
      });

      setImages(list);
    } catch (err) {
      console.error("Errore imprevisto list immagini:", err);
      setError("Errore nel caricamento della lista immagini.");
      setImages([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0] || null;
    setFile(f);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Seleziona prima un file da caricare.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const safeName = file.name.replace(/\s+/g, "_").toLowerCase();
      const filePath = `${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Errore upload immagine:", uploadError);
        setError("Errore durante l'upload dell'immagine.");
        return;
      }

      const { data: urlData } = supabase
        .storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || "";

      setSuccess("Immagine caricata con successo.");
      setFile(null);

      // refresh lista
      await loadImages();

      if (publicUrl) {
        console.log("URL pubblica dell'immagine:", publicUrl);
      }
    } catch (err) {
      console.error("Errore imprevisto upload immagine:", err);
      setError("Errore durante l'upload dell'immagine.");
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess("URL copiata negli appunti.");
    } catch {
      setError("Impossibile copiare negli appunti. Copia manualmente.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 text-xs text-slate-300 hover:text-slate-100"
        >
          ← Torna alla Admin Dashboard
        </button>

        <h1 className="text-xl font-semibold mb-1">Immagini domande</h1>
        <p className="text-xs text-slate-300 mb-4">
          Carica le immagini nel bucket <code>{BUCKET}</code> e copia la URL
          pubblica da usare nel campo <code>image_url</code> della sezione
          Domande.
        </p>

        {/* UPLOAD */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-4">
          <h2 className="text-sm font-semibold mb-2">Nuova immagine</h2>

          <div className="flex flex-col gap-2 text-xs">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-[11px]"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !file}
              className="w-full rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Caricamento in corso…" : "Carica immagine"}
            </button>

            {error && (
              <p className="text-[11px] text-red-400 mt-1">{error}</p>
            )}
            {success && (
              <p className="text-[11px] text-emerald-400 mt-1">{success}</p>
            )}

            <p className="text-[10px] text-slate-400 mt-1">
              Suggerimento: usa immagini leggere (max qualche centinaio di KB)
              per non appesantire il caricamento dei quiz.
            </p>
          </div>
        </div>

        {/* LISTA IMMAGINI */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold mb-2">Immagini caricate</h2>

          {loadingList ? (
            <p className="text-xs text-slate-300">
              Caricamento elenco immagini…
            </p>
          ) : images.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nessuna immagine trovata nel bucket.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1 text-xs">
              {images.map((img) => (
                <div
                  key={img.path}
                  className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-2"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.publicUrl}
                      alt={img.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-100 text-[11px] mb-1">
                      {img.name}
                    </p>
                    <p className="text-[10px] text-slate-400 break-all mb-1">
                      {img.publicUrl}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(img.publicUrl)}
                      className="rounded-md bg-slate-800 px-2 py-1 text-[10px] hover:bg-slate-700"
                    >
                      Copia URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
