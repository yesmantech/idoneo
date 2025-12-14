import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/admin";
import { ArrowLeft, Home, FileText, Sparkles, Upload, X, Save, Loader2, Info, Type } from "lucide-react";

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
    const [year, setYear] = useState<string>("");
    const [availableSeats, setAvailableSeats] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [subtitle, setSubtitle] = useState<string>("");

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
            setYear(data.year?.toString() || "");
            setAvailableSeats(data.available_seats?.toString() || "");
            setDescription(data.description || "");
            setTitle(data.title || "");
            setSubtitle(data.subtitle || "");
        }
        setLoading(false);
    };

    const handleUpload = async (file: File, bucket = "banners") => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

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

            if (homeFile) {
                homeUrl = await handleUpload(homeFile);
            }
            if (innerFile) {
                innerUrl = await handleUpload(innerFile);
            }

            const { error } = await supabase.from("categories").update({
                title: title || null,
                subtitle: subtitle || null,
                home_banner_url: homeUrl,
                inner_banner_url: innerUrl,
                is_new: isNew,
                year: year ? parseInt(year) : null,
                available_seats: availableSeats ? parseInt(availableSeats) : null,
                description: description || null
            }).eq("id", id);

            if (error) throw error;

            alert("Salvato correttamente!");
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

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-[#00B1FF] animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/admin/structure")}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{category.title}</h1>
                        <p className="text-sm text-slate-500">Modifica immagini e impostazioni categoria</p>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Title Panel */}
                    <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                <Type className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Titolo Categoria</h3>
                                <p className="text-xs text-slate-500">Nome visualizzato nella homepage e nelle pagine interne</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="es. Guardia di Finanza"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all text-lg font-medium"
                        />
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-500 mb-2">
                                Sottotitolo (opzionale)
                            </label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={e => setSubtitle(e.target.value)}
                                placeholder="es. Concorso pubblico 2024 - 150 posti"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1.5">Mostrato sotto il titolo nella card della homepage</p>
                        </div>
                    </div>

                    {/* Settings Panel - Badge "Nuovo" */}
                    <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Badge "Nuovo"</h3>
                                    <p className="text-sm text-slate-500">Mostra il badge NUOVO sulla card del concorso</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isNew}
                                    onChange={e => setIsNew(e.target.checked)}
                                />
                                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00B1FF]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-[#00B1FF]"></div>
                            </label>
                        </div>
                    </div>

                    {/* Year and Seats Panel */}
                    <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    📅 Anno del Concorso
                                </label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    placeholder="es. 2024"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">L'anno mostrato sulla card</p>
                            </div>

                            {/* Available Seats */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    👥 Posti Disponibili
                                </label>
                                <input
                                    type="number"
                                    value={availableSeats}
                                    onChange={e => setAvailableSeats(e.target.value)}
                                    placeholder="es. 150"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Numero di posti mostrato nel badge</p>
                            </div>
                        </div>
                    </div>

                    {/* Informazioni Panel */}
                    <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Info className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Informazioni</h3>
                                <p className="text-xs text-slate-500">Testo mostrato nella pagina interna del concorso</p>
                            </div>
                        </div>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Inserisci le informazioni sul concorso che verranno mostrate agli utenti..."
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-2">Questo testo appare nella sezione "Informazioni" della pagina del concorso</p>
                    </div>

                    {/* Banner Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Home Banner */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Home className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Home Banner</h3>
                                    <p className="text-xs text-slate-500">Card nella Homepage</p>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mb-4">
                                {homeBanner ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                                        <img
                                            src={homeBanner}
                                            alt="Home Banner"
                                            className="w-full h-40 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => setHomeBanner("")}
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" /> Rimuovi
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="h-40 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 cursor-pointer hover:border-[#00B1FF] hover:bg-slate-100 transition-all">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-500 font-medium">Carica immagine</span>
                                        <span className="text-xs text-slate-400 mt-1">2:1 ratio (400×200px)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setHomeFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* File input when image exists */}
                            {homeBanner && (
                                <label className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-600 font-medium">Sostituisci immagine</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setHomeFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {homeFile && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-emerald-700 font-medium truncate">{homeFile.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Inner Banner */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-sky-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Inner Header</h3>
                                    <p className="text-xs text-slate-500">Header pagina concorso</p>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mb-4">
                                {innerBanner ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                                        <img
                                            src={innerBanner}
                                            alt="Inner Banner"
                                            className="w-full h-40 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => setInnerBanner("")}
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" /> Rimuovi
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="h-40 bg-slate-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 cursor-pointer hover:border-[#00B1FF] hover:bg-slate-100 transition-all">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-500 font-medium">Carica immagine</span>
                                        <span className="text-xs text-slate-400 mt-1">16:9 ratio (1920×1080px)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setInnerFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* File input when image exists */}
                            {innerBanner && (
                                <label className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-600 font-medium">Sostituisci immagine</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setInnerFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {innerFile && (
                                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-lg border border-sky-100">
                                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-sky-700 font-medium truncate">{innerFile.name}</span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-[#00B1FF] hover:bg-[#0099E6] text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(0,177,255,0.3)] hover:shadow-[0_8px_24px_rgba(0,177,255,0.4)]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Salvataggio...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salva Modifiche
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
