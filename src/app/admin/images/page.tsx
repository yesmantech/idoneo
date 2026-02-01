/**
 * @file AdminImagesPage.tsx
 * @description Image management dashboard for question images.
 *
 * Provides an interface to upload, view, and manage images stored in
 * the 'question-images' Supabase storage bucket.
 *
 * ## Features
 *
 * - **Upload**: Drag-and-drop or file select to upload images
 * - **Gallery**: Grid view of all images in the bucket
 * - **Copy URL**: One-click copy of public URL for use in questions
 * - **Auto-naming**: Files are renamed with timestamp to prevent collisions
 *
 * ## Storage Bucket
 *
 * Using bucket: `question-images`
 *
 * ## Usage in Questions
 *
 * 1. Upload image here
 * 2. Copy URL
 * 3. Paste URL into the `image_url` field of a question
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/admin";

const BUCKET = "question-images";

// ============================================================================
// TYPES
// ============================================================================

type StoredImage = {
  name: string;
  publicUrl: string;
  created_at?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminImagesPage() {
  const navigate = useNavigate();
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
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate("/admin")}
          className="text-xs text-[var(--foreground)] opacity-40 hover:opacity-100 mb-4 transition-all"
        >
          ← Dashboard
        </button>
        <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Gestione Immagini</h1>

        {/* Upload Card */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 mb-8 flex flex-col md:flex-row items-end gap-4 shadow-sm">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-[var(--foreground)] opacity-40 mb-2">Nuova Immagine</label>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-[var(--foreground)] opacity-60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-[var(--foreground)] hover:file:opacity-80"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full md:w-auto px-6 py-2 bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/10"
          >
            {uploading ? "Caricamento..." : "Carica"}
          </button>
        </div>

        {msg && (
          <div className={`mb-6 p-3 rounded-lg border text-sm ${msg.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
            : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
            {msg.text}
          </div>
        )}

        {/* Gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            <p className="text-[var(--foreground)] opacity-40 col-span-full text-center py-8">Caricamento gallery...</p>
          ) : images.length === 0 ? (
            <p className="text-[var(--foreground)] opacity-40 col-span-full text-center py-8">Nessuna immagine nel bucket.</p>
          ) : (
            images.map((img) => (
              <div key={img.name} className="group relative bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors">
                <div className="aspect-square bg-slate-50 dark:bg-slate-950 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.publicUrl} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopy(img.publicUrl)}
                      className="px-3 py-1 bg-white dark:bg-slate-200 text-slate-900 text-xs rounded font-medium hover:bg-slate-100"
                    >
                      Copia URL
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-[var(--foreground)] opacity-40 truncate" title={img.name}>{img.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}