"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "question-images";

type StoredImage = {
  name: string;
  publicUrl: string;
  created_at?: string;
};

export default function AdminImagesPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const list: StoredImage[] = (data || []).map((f) => {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
        return {
          name: f.name,
          created_at: f.created_at,
          publicUrl: urlData.publicUrl,
        };
      });

      setImages(list);
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: "Errore caricamento lista." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMsg(null);

    try {
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_").toLowerCase()}`;
      const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, { cacheControl: "3600", upsert: false });
      
      if (error) throw error;

      setMsg({ type: 'success', text: "Upload completato!" });
      setFile(null);
      await loadImages();
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: "Errore durante l'upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setMsg({ type: 'success', text: "URL copiato!" });
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => router.push("/admin")} className="text-xs text-slate-400 hover:text-white mb-4">← Dashboard</button>
        <h1 className="text-2xl font-bold mb-6 text-slate-100">Gestione Immagini</h1>

        {/* Upload Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-end gap-4 shadow-sm">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-400 mb-2">Nuova Immagine</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full md:w-auto px-6 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-500 disabled:opacity-50 transition-all shadow-lg shadow-sky-900/20"
          >
            {uploading ? "Caricamento..." : "Carica"}
          </button>
        </div>

        {msg && (
          <div className={`mb-6 p-3 rounded-lg border text-sm ${msg.type === 'error' ? 'bg-rose-900/20 border-rose-800 text-rose-300' : 'bg-emerald-900/20 border-emerald-800 text-emerald-300'}`}>
            {msg.text}
          </div>
        )}

        {/* Gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            <p className="text-slate-500 col-span-full text-center py-8">Caricamento gallery...</p>
          ) : images.length === 0 ? (
            <p className="text-slate-500 col-span-full text-center py-8">Nessuna immagine nel bucket.</p>
          ) : (
            images.map((img) => (
              <div key={img.name} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
                <div className="aspect-square bg-slate-950 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.publicUrl} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleCopy(img.publicUrl)}
                      className="px-3 py-1 bg-slate-200 text-slate-900 text-xs rounded font-medium hover:bg-white"
                    >
                      Copia URL
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-slate-400 truncate" title={img.name}>{img.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}