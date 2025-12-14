import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/admin";
import { ArrowLeft, FileText, Users, Link2, BookOpen, Plus, Trash2, Save, Loader2, ExternalLink } from "lucide-react";

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
    const [newResType, setNewResType] = useState("link");

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
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

        const { data: resData } = await supabase
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

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#00B1FF] animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F5F5F7] py-8 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => navigate("/admin/structure")}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{role.title}</h1>
                            <p className="text-sm text-slate-500">Modifica informazioni e risorse del ruolo</p>
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* Description Panel */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-sky-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Descrizione</h3>
                                    <p className="text-xs text-slate-500">Testo introduttivo del ruolo</p>
                                </div>
                            </div>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Descrivi brevemente questo ruolo e cosa comporta..."
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all resize-none"
                            />
                        </div>

                        {/* Positions & Share Link */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Positions */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <label className="font-medium text-slate-700">Posti Disponibili</label>
                                    </div>
                                    <input
                                        type="text"
                                        value={positions}
                                        onChange={e => setPositions(e.target.value)}
                                        placeholder="es. 1250 posti"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                    />
                                </div>

                                {/* Share Link */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                            <Link2 className="w-4 h-4 text-violet-500" />
                                        </div>
                                        <label className="font-medium text-slate-700">Link Banca Dati</label>
                                    </div>
                                    <input
                                        type="text"
                                        value={shareLink}
                                        onChange={e => setShareLink(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveRole}
                            disabled={saving}
                            className="w-full py-4 rounded-2xl bg-[#00B1FF] text-white font-bold text-lg shadow-lg shadow-blue-500/20 hover:bg-[#00a0e6] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salva Informazioni
                                </>
                            )}
                        </button>

                        {/* Resources Panel */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Risorse Utili</h3>
                                    <p className="text-xs text-slate-500">Link e documenti per prepararsi</p>
                                </div>
                            </div>

                            {/* Resources List */}
                            <div className="space-y-3 mb-6">
                                {resources.length === 0 && (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">Nessuna risorsa aggiunta</p>
                                    </div>
                                )}
                                {resources.map(res => (
                                    <div key={res.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${res.type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'}`}>
                                            {res.type === 'pdf' ? (
                                                <FileText className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <ExternalLink className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900">{res.title}</p>
                                            <p className="text-xs text-slate-400 truncate">{res.url}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteResource(res.id)}
                                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Resource */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Aggiungi Nuova Risorsa</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <input
                                        className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                        placeholder="Titolo"
                                        value={newResTitle}
                                        onChange={e => setNewResTitle(e.target.value)}
                                    />
                                    <select
                                        className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                        value={newResType}
                                        onChange={e => setNewResType(e.target.value)}
                                    >
                                        <option value="link">🔗 Link</option>
                                        <option value="pdf">📄 PDF</option>
                                    </select>
                                    <input
                                        className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/30 focus:border-[#00B1FF] transition-all"
                                        placeholder="URL"
                                        value={newResUrl}
                                        onChange={e => setNewResUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAddResource}
                                        className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Aggiungi
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
