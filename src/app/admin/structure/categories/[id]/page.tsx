import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/admin";

export default function AdminCategoryEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data
    const [category, setCategory] = useState<any>(null);
    const [homeBanner, setHomeBanner] = useState<string>("");
    const [innerBanner, setInnerBanner] = useState<string>("");
    const [isNew, setIsNew] = useState<boolean>(false);

    // Files
    const [homeFile, setHomeFile] = useState<File | null>(null);
    const [innerFile, setInnerFile] = useState<File | null>(null);

    useEffect(() => {
        if (id) loadCategory();
    }, [id]);

    const loadCategory = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();
        if (error) {
            alert("Errore caricamento: " + error.message);
            navigate("/admin/structure");
        } else {
            setCategory(data);
            setHomeBanner(data.home_banner_url || "");
            setInnerBanner(data.inner_banner_url || "");
            setIsNew(data.is_new || false);
        }
        setLoading(false);
    };

    const handleUpload = async (file: File, bucket = "banners") => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`; // Removed 'banners/' prefix since bucket is banners

        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let homeUrl = homeBanner;
            let innerUrl = innerBanner;

            // Upload files if selected
            if (homeFile) {
                homeUrl = await handleUpload(homeFile);
            }
            if (innerFile) {
                innerUrl = await handleUpload(innerFile);
            }

            const { error } = await supabase.from("categories").update({
                home_banner_url: homeUrl,
                inner_banner_url: innerUrl,
                is_new: isNew
            }).eq("id", id);

            if (error) throw error;

            alert("Salvato correttamente!");
            // Refresh local state
            setHomeFile(null);
            setInnerFile(null);
            setHomeBanner(homeUrl);
            setInnerBanner(innerUrl);

        } catch (e: any) {
            console.error(e);
            alert("Errore salvataggio: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout><div className="p-8">Caricamento...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate("/admin/structure")} className="text-slate-400 hover:text-white">
                        ← Indietro
                    </button>
                    <h1 className="text-2xl font-bold text-white">Modifica Categoria: {category.title}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Settings Panel */}
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">🏷️ Badge "Nuovo"</h3>
                            <p className="text-sm text-slate-400">Mostra il badge "NUOVO" sulla card del concorso.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isNew}
                                onChange={e => setIsNew(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>

                    {/* Home Banner */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-emerald-400 mb-4">🏠 Home Banner</h3>
                        <p className="text-sm text-slate-400 mb-4">Immagine mostrata nella card della Homepage.</p>

                        {homeBanner ? (
                            <div className="mb-4 relative group">
                                <img src={homeBanner} alt="Home Banner" className="w-full h-40 object-cover rounded-lg border border-slate-700" />
                                <button
                                    onClick={() => setHomeBanner("")}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Rimuovi
                                </button>
                            </div>
                        ) : (
                            <div className="mb-4 h-40 bg-slate-800 rounded-lg flex items-center justify-center border border-dashed border-slate-600">
                                <span className="text-slate-500 text-sm">Nessuna immagine</span>
                            </div>
                        )}

                        <input
                            type="file"
                            onChange={e => setHomeFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-emerald-50 file:text-emerald-700
                                hover:file:bg-emerald-100
                            "
                        />
                        {homeFile && <p className="text-xs text-emerald-400 mt-2">Nuovo file selezionato: {homeFile.name}</p>}
                    </div>

                    {/* Inner Banner */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-sky-400 mb-4">📄 Inner Header Banner</h3>
                        <p className="text-sm text-slate-400 mb-4">Immagine mostrata nell'header della pagina concorso.</p>

                        {innerBanner ? (
                            <div className="mb-4 relative group">
                                <img src={innerBanner} alt="Inner Banner" className="w-full h-40 object-cover rounded-lg border border-slate-700" />
                                <button
                                    onClick={() => setInnerBanner("")}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Rimuovi
                                </button>
                            </div>
                        ) : (
                            <div className="mb-4 h-40 bg-slate-800 rounded-lg flex items-center justify-center border border-dashed border-slate-600">
                                <span className="text-slate-500 text-sm">Nessuna immagine</span>
                            </div>
                        )}

                        <input
                            type="file"
                            onChange={e => setInnerFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-sky-50 file:text-sky-700
                                hover:file:bg-sky-100
                            "
                        />
                        {innerFile && <p className="text-xs text-sky-400 mt-2">Nuovo file selezionato: {innerFile.name}</p>}
                    </div>

                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {saving ? "Salvataggio..." : "Salva Modifiche"}
                    </button>
                </div>

            </div>
        </AdminLayout>
    );
}
