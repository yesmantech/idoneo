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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-slate-100">Gestione Regole Simulazione</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* FORM */}
                <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 h-fit sticky top-4">
                    <h2 className="text-lg font-semibold mb-4 text-emerald-400">{editingId ? "Modifica Regola" : "Nuova Regola"}</h2>
                    <form onSubmit={handleSave} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-slate-400 mb-1">Titolo (es. Standard 60m)</label>
                            <input required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1">Descrizione</label>
                            <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-slate-400 mb-1">Minuti</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={timeMinutes} onChange={e => setTimeMinutes(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">N. Domande</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={totalQuestions} onChange={e => setTotalQuestions(Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-slate-400 mb-1">Punti OK</label>
                                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={pointsCorrect} onChange={e => setPointsCorrect(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">Punti KO</label>
                                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={pointsWrong} onChange={e => setPointsWrong(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1">Vuota</label>
                                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={pointsBlank} onChange={e => setPointsBlank(Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-2">
                            {editingId && <button type="button" onClick={handleReset} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded">Annulla</button>}
                            <button type="submit" disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold">
                                {saving ? "Salvando..." : "Salva"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* LIST */}
                <div className="md:col-span-2 space-y-4">
                    {loading ? <p className="text-slate-400">Caricamento...</p> : rules.length === 0 ? <p className="text-slate-500">Nessuna regola trovata.</p> : (
                        rules.map(rule => (
                            <div key={rule.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-start group hover:border-emerald-500/30 transition-colors">
                                <div>
                                    <h3 className="font-bold text-slate-200">{rule.title}</h3>
                                    <p className="text-xs text-slate-500 mb-2">{rule.description || "Nessuna descrizione"}</p>
                                    <div className="flex gap-4 text-xs font-mono text-emerald-400">
                                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">⏱ {rule.time_minutes}m</span>
                                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">❓ {rule.total_questions} quest</span>
                                        <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">✅ {rule.points_correct} / ❌ {rule.points_wrong}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleEdit(rule)} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded">Modifica</button>
                                    <button onClick={() => handleDelete(rule.id)} className="text-xs text-rose-500 hover:text-rose-400 px-3 py-1">Elimina</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
