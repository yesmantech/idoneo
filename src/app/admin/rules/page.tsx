import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import { AdminLayout } from "@/components/admin";

type RuleRow = Database["public"]["Tables"]["simulation_rules"]["Row"];

export default function AdminRulesPage() {
    const [rules, setRules] = useState<RuleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timeMinutes, setTimeMinutes] = useState(60);
    const [totalQuestions, setTotalQuestions] = useState(100);
    const [pointsCorrect, setPointsCorrect] = useState(1.0);
    const [pointsWrong, setPointsWrong] = useState(-0.25);
    const [pointsBlank, setPointsBlank] = useState(0.0);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        const { data, error } = await supabase.from("simulation_rules").select("*").order("created_at", { ascending: false });
        if (error) {
            setError(error.message);
        } else {
            setRules(data || []);
        }
        setLoading(false);
    };

    const handleEdit = (rule: RuleRow) => {
        setEditingId(rule.id);
        setTitle(rule.title);
        setDescription(rule.description || "");
        setTimeMinutes(rule.time_minutes ?? 60);
        setTotalQuestions(rule.total_questions ?? 100);
        setPointsCorrect(rule.points_correct ?? 1);
        setPointsWrong(rule.points_wrong ?? -0.25);
        setPointsBlank(rule.points_blank ?? 0);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleReset = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setTimeMinutes(60);
        setTotalQuestions(100);
        setPointsCorrect(1.0);
        setPointsWrong(-0.25);
        setPointsBlank(0.0);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa regola? Se è usata da qualche concorso, potresti rompere dei collegamenti.")) return;
        const { error } = await supabase.from("simulation_rules").delete().eq("id", id);
        if (error) alert(error.message);
        else loadRules();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                title,
                description: description || null,
                time_minutes: timeMinutes,
                total_questions: totalQuestions,
                points_correct: pointsCorrect,
                points_wrong: pointsWrong,
                points_blank: pointsBlank,
            };

            if (editingId) {
                const { error } = await supabase.from("simulation_rules").update(payload).eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("simulation_rules").insert(payload);
                if (error) throw error;
            }
            handleReset();
            loadRules();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestione Regole Simulazione</h1>
                    <p className="text-gray-500 text-sm mt-1">Definisci i parametri di punteggio e tempo per le simulazioni.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
                {/* FORM */}
                <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm p-6 h-fit sticky top-4">
                    <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-sm border border-brand-cyan/20">⚙️</span>
                        {editingId ? "Modifica Regola" : "Nuova Regola"}
                    </h2>
                    <form onSubmit={handleSave} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1.5">Titolo</label>
                            <input
                                required
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all"
                                placeholder="es. Standard 60m"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1.5">Descrizione</label>
                            <textarea
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all min-h-[80px]"
                                placeholder="Dettagli sulla regola..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1.5">Minuti</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 focus:outline-none"
                                        value={timeMinutes}
                                        onChange={e => setTimeMinutes(Number(e.target.value))}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-medium">min</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1.5">N. Domande</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 focus:outline-none"
                                    value={totalQuestions}
                                    onChange={e => setTotalQuestions(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Punteggi</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-emerald-400 mb-1">Esatta</label>
                                    <input type="number" step="0.01" className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-2 py-2.5 text-sm text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none" value={pointsCorrect} onChange={e => setPointsCorrect(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-rose-400 mb-1">Errata</label>
                                    <input type="number" step="0.01" className="w-full bg-slate-900 border border-rose-500/30 rounded-lg px-2 py-2.5 text-sm text-rose-400 font-bold focus:border-rose-500 focus:outline-none" value={pointsWrong} onChange={e => setPointsWrong(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Vuota</label>
                                    <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2.5 text-sm text-slate-400 font-bold focus:border-slate-500 focus:outline-none" value={pointsBlank} onChange={e => setPointsBlank(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Annulla
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-brand-cyan hover:bg-brand-cyan/90 text-slate-900 py-3 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(6,214,211,0.3)] hover:-translate-y-0.5 transition-all"
                            >
                                {saving ? "Salvando..." : editingId ? "Aggiorna Regola" : "Crea Regola"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* LIST */}
                <div className="md:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500 animate-pulse">Caricamento regole...</div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900 rounded-[24px] border border-slate-800 border-dashed">
                            <span className="text-4xl mb-4 block">📏</span>
                            <p className="text-slate-500">Nessuna regola definita.</p>
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:shadow-md hover:border-brand-cyan/50 group">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-white">{rule.title}</h3>
                                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-400 border border-slate-700">
                                            {rule.total_questions} dom
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 leading-relaxed max-w-lg">{rule.description || "Nessuna descrizione"}</p>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                                            <span>⏱</span> {rule.time_minutes} min
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                            <span>✅</span> +{rule.points_correct}
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                                            <span>❌</span> {rule.points_wrong}
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
                                            <span>⚪️</span> {rule.points_blank}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(rule)}
                                        className="p-2 text-slate-500 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-colors"
                                        title="Modifica"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
