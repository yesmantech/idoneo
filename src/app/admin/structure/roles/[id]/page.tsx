import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/admin";

export default function AdminRoleEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Role Data
    const [role, setRole] = useState<any>(null);
    const [description, setDescription] = useState("");
    const [positions, setPositions] = useState("");
    const [shareLink, setShareLink] = useState("");

    // Resources
    const [resources, setResources] = useState<any[]>([]);

    // New Resource Form
    const [newResTitle, setNewResTitle] = useState("");
    const [newResUrl, setNewResUrl] = useState("");
    const [newResType, setNewResType] = useState("link"); // link, pdf

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        // Load Role
        const { data: roleData, error: roleError } = await supabase.from("roles").select("*").eq("id", id).single();
        if (roleError) {
            alert("Errore ruolo: " + roleError.message);
            navigate("/admin/structure");
            return;
        }
        setRole(roleData);
        setDescription(roleData.description || "");
        setPositions(roleData.available_positions || "");
        setShareLink(roleData.share_bank_link || "");

        // Load Resources
        const { data: resData, error: resError } = await supabase
            .from("role_resources")
            .select("*")
            .eq("role_id", id)
            .order("created_at", { ascending: true });

        if (resData) setResources(resData);

        setLoading(false);
    };

    const handleSaveRole = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from("roles").update({
                description,
                available_positions: positions,
                share_bank_link: shareLink
            }).eq("id", id);

            if (error) throw error;
            alert("Informazioni Ruolo Salvate!");
        } catch (e: any) {
            alert("Errore: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAddResource = async () => {
        if (!newResTitle || !newResUrl) return alert("Compila titolo e url");

        const { data, error } = await supabase.from("role_resources").insert({
            role_id: id,
            title: newResTitle,
            url: newResUrl,
            type: newResType
        }).select().single();

        if (error) {
            alert("Errore aggiunta: " + error.message);
        } else {
            setResources([...resources, data]);
            setNewResTitle("");
            setNewResUrl("");
        }
    };

    const handleDeleteResource = async (resId: string) => {
        if (!confirm("Eliminare risorsa?")) return;
        const { error } = await supabase.from("role_resources").delete().eq("id", resId);
        if (!error) {
            setResources(resources.filter(r => r.id !== resId));
        } else {
            alert(error.message);
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
                    <h1 className="text-2xl font-bold text-white">Gestione Ruolo: {role.title}</h1>
                </div>

                <div className="space-y-8">

                    {/* 1. Metadata Metadata */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-sky-400">📝 Metadata Principali</h3>
                            <button onClick={handleSaveRole} disabled={saving} className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-4 py-2 rounded font-bold">
                                {saving ? "Saving..." : "Salva Info"}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Descrizione (Intro)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-3 text-slate-200 text-sm focus:border-sky-500 outline-none"
                                    placeholder="Descrivi brevemente questo ruolo e cosa comporta..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Posti Disponibili</label>
                                    <input
                                        type="text"
                                        value={positions}
                                        onChange={e => setPositions(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm"
                                        placeholder="es. 1250 posti"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Link Condivisione Banca Dati</label>
                                    <input
                                        type="text"
                                        value={shareLink}
                                        onChange={e => setShareLink(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Resources */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-amber-400 mb-6">📚 Risorse Utili</h3>

                        {/* List */}
                        <div className="space-y-2 mb-6">
                            {resources.length === 0 && <p className="text-slate-500 text-sm italic">Nessuna risorsa aggiunta.</p>}
                            {resources.map(res => (
                                <div key={res.id} className="flex items-center gap-3 bg-slate-950 p-3 rounded border border-slate-800">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-lg">
                                        {res.type === 'pdf' ? '📄' : '🔗'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-200">{res.title}</p>
                                        <p className="text-xs text-slate-500 truncate">{res.url}</p>
                                    </div>
                                    <button onClick={() => handleDeleteResource(res.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded">
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add New */}
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase">Aggiungi Nuova Risorsa</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <input
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                                    placeholder="Titolo (es. Bando PDF)"
                                    value={newResTitle}
                                    onChange={e => setNewResTitle(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <select
                                        className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white w-24"
                                        value={newResType}
                                        onChange={e => setNewResType(e.target.value)}
                                    >
                                        <option value="link">Link</option>
                                        <option value="pdf">PDF</option>
                                    </select>
                                    <input
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                                        placeholder="URL"
                                        value={newResUrl}
                                        onChange={e => setNewResUrl(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleAddResource} className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded p-2 text-sm">
                                    Aggiungi +
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
