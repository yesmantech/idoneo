/**
 * @file page.tsx (Admin Structure)
 * @description Admin panel for managing the Category → Role → Quiz hierarchy.
 *
 * This is the primary admin interface for organizing content structure.
 * Uses a 3-column cascading selection pattern:
 *
 * ```
 * [Categories] → [Roles] → [Quizzes]
 *     ↓              ↓          ↓
 *  Select      Filter+Select  View
 * ```
 *
 * ## Features
 *
 * | Feature          | Description                               |
 * |------------------|-------------------------------------------|
 * | CRUD Categories  | Add/delete categories with auto-slug      |
 * | CRUD Roles       | Add/delete roles within selected category |
 * | View Quizzes     | List quizzes for selected role            |
 * | Column Navigation| Cascading selection filters next column   |
 *
 * ## Data Hierarchy
 *
 * - **Category**: Top-level grouping (e.g., "Polizia di Stato")
 * - **Role**: Job position within category (e.g., "Allievo Agente")
 * - **Quiz**: Actual test/simulation for the role
 *
 * ## Note
 *
 * Quizzes are created/edited in the Quiz Admin panel (`/admin/quiz`),
 * not directly in this structure view.
 */

import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { AdminLayout } from "@/components/admin";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// --- Types Local to this Admin Page ---
type Category = { id: string; slug: string; title: string; description: string; is_featured: boolean; is_archived?: boolean };
type Role = { id: string; category_id: string; slug: string; title: string; order_index: number; is_archived?: boolean };
type Quiz = { id: string; title: string; slug: string; year: number; is_official: boolean; role_id: string; is_archived?: boolean };

// ============================================================================
// UTILITIES
// ============================================================================

// Simple Slugify Helper
const slugify = (text: string) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminStructurePage() {
    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    // Selection State (Column Navigation)
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    // Archive Toggle States
    const [showArchivedCats, setShowArchivedCats] = useState(false);
    const [showArchivedRoles, setShowArchivedRoles] = useState(false);
    const [showArchivedQuizzes, setShowArchivedQuizzes] = useState(false);

    // Loading
    const [loading, setLoading] = useState(true);

    // Form State - Category
    const [catTitle, setCatTitle] = useState("");
    const [catSlug, setCatSlug] = useState("");

    // Form State - Role
    const [roleTitle, setRoleTitle] = useState("");
    const [roleSlug, setRoleSlug] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [c, r, q] = await Promise.all([
            supabase.from("categories").select("*").order("title"),
            supabase.from("roles").select("*").order("order_index"),
            supabase.from("quizzes").select("id, title, slug, year, is_official, role_id, is_archived").order("created_at", { ascending: false })
        ]);

        if (c.data) setCategories(c.data);
        if (r.data) setRoles(r.data);
        if (q.data) setQuizzes(q.data);
        setLoading(false);
    };

    // --- ACTIONS: Category ---
    const handleAddCategory = async () => {
        if (!catTitle) return;
        const slug = catSlug || slugify(catTitle);
        const { error } = await supabase.from("categories").insert({ title: catTitle, slug });
        if (!error) {
            setCatTitle(""); setCatSlug(""); loadData();
        } else {
            alert(error.message);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Cancella categoria e tutto il contenuto?")) return;
        await supabase.from("categories").delete().eq("id", id);
        if (selectedCatId === id) setSelectedCatId(null);
        loadData();
    };

    const handleArchiveCategory = async (id: string, archive: boolean) => {
        await supabase.from("categories").update({ is_archived: archive }).eq("id", id);
        loadData();
    };

    // --- ACTIONS: Role ---
    const handleAddRole = async () => {
        if (!roleTitle || !selectedCatId) return;
        const slug = roleSlug || slugify(roleTitle);
        const { error } = await supabase.from("roles").insert({
            title: roleTitle,
            slug,
            category_id: selectedCatId,
            order_index: roles.filter(r => r.category_id === selectedCatId).length + 1
        });
        if (!error) {
            setRoleTitle(""); setRoleSlug(""); loadData();
        } else {
            alert(error.message);
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm("Cancella ruolo?")) return;
        await supabase.from("roles").delete().eq("id", id);
        if (selectedRoleId === id) setSelectedRoleId(null);
        loadData();
    };

    const handleArchiveRole = async (id: string, archive: boolean) => {
        await supabase.from("roles").update({ is_archived: archive }).eq("id", id);
        loadData();
    };

    // --- ACTIONS: Quiz ---
    const handleArchiveQuiz = async (id: string, archive: boolean) => {
        await supabase.from("quizzes").update({ is_archived: archive }).eq("id", id);
        loadData();
    };

    // --- Filtered Lists (respecting archive toggle) ---
    const visibleCategories = useMemo(() =>
        categories.filter(c => showArchivedCats ? true : !c.is_archived),
        [categories, showArchivedCats]
    );
    const visibleRoles = useMemo(() =>
        roles.filter(r => r.category_id === selectedCatId && (showArchivedRoles ? true : !r.is_archived)),
        [roles, selectedCatId, showArchivedRoles]
    );
    const visibleQuizzes = useMemo(() =>
        quizzes.filter(q => q.role_id === selectedRoleId && (showArchivedQuizzes ? true : !q.is_archived)),
        [quizzes, selectedRoleId, showArchivedQuizzes]
    );

    const selectedCat = categories.find(c => c.id === selectedCatId);
    const selectedRole = roles.find(r => r.id === selectedRoleId);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Caricamento struttura...</div>;

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Gestione Struttura</h1>
                    <p className="text-[var(--foreground)] opacity-50 text-sm mt-1">Organizza categorie, ruoli e concorsi in una gerarchia chiara.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">

                {/* COLUMN 1: CATEGORIES */}
                <div className="flex flex-col bg-[var(--card)] border border-[var(--card-border)] rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                            Categorie
                        </h2>
                        <label className="flex items-center gap-1.5 text-[10px] text-[var(--foreground)] opacity-50 cursor-pointer hover:opacity-70">
                            <input
                                type="checkbox"
                                checked={showArchivedCats}
                                onChange={(e) => setShowArchivedCats(e.target.checked)}
                                className="w-3 h-3 rounded"
                            />
                            Archiviati
                        </label>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {visibleCategories.map(c => (
                            <div
                                key={c.id}
                                onClick={() => { setSelectedCatId(c.id); setSelectedRoleId(null); }}
                                className={`p-4 rounded-2xl cursor-pointer border transition-all flex justify-between group ${c.is_archived ? 'opacity-50' : ''} ${selectedCatId === c.id
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 ring-1 ring-emerald-100 dark:ring-emerald-500/20 shadow-sm"
                                    : "bg-slate-50/50 dark:bg-slate-900/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                    }`}
                            >
                                <div>
                                    <div className={`font-semibold text-sm ${c.is_archived ? 'line-through' : ''} ${selectedCatId === c.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--foreground)] opacity-70'}`}>{c.title}</div>
                                    <div className="text-[10px] text-[var(--foreground)] opacity-30 font-mono mt-0.5">/{c.slug}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link
                                        to={`/admin/structure/categories/${c.id}`}
                                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                                        title="Modifica Banner"
                                    >
                                        EDIT
                                    </Link>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveCategory(c.id, !c.is_archived); }}
                                        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all text-xs ${c.is_archived ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                                        title={c.is_archived ? "Ripristina" : "Archivia"}
                                    >
                                        {c.is_archived ? '↩' : '📦'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}
                                        className="text-rose-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-[var(--card-border)] bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
                        <div className="space-y-2">
                            <input
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                placeholder="Nuova Categoria..."
                                value={catTitle}
                                onChange={e => { setCatTitle(e.target.value); setCatSlug(slugify(e.target.value)); }}
                            />
                            <div className="flex gap-2">
                                <input
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-[var(--foreground)] opacity-50 font-mono placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
                                    placeholder="slug-automatico"
                                    value={catSlug}
                                    onChange={e => setCatSlug(e.target.value)}
                                />
                                <button
                                    onClick={handleAddCategory}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm transition-colors font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: ROLES */}
                <div className={`flex flex-col bg-[var(--card)] border border-[var(--card-border)] rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 ${!selectedCatId ? "opacity-40 grayscale pointer-events-none" : "opacity-100"}`}>
                    <div className="p-5 border-b border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold">2</span>
                            Ruoli
                        </h2>
                        <div className="flex items-center gap-2">
                            {selectedCat && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] opacity-60 font-medium px-2 py-1 rounded-full">{selectedCat.title}</span>}
                            <label className="flex items-center gap-1.5 text-[10px] text-[var(--foreground)] opacity-50 cursor-pointer hover:opacity-70">
                                <input
                                    type="checkbox"
                                    checked={showArchivedRoles}
                                    onChange={(e) => setShowArchivedRoles(e.target.checked)}
                                    className="w-3 h-3 rounded"
                                />
                                Archiviati
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {visibleRoles.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                                <span className="text-2xl mb-2">👤</span>
                                <p className="text-sm text-[var(--foreground)] opacity-50">Nessun ruolo</p>
                            </div>
                        )}
                        {visibleRoles.map(r => (
                            <div
                                key={r.id}
                                onClick={() => setSelectedRoleId(r.id)}
                                className={`p-4 rounded-2xl cursor-pointer border transition-all flex justify-between group ${r.is_archived ? 'opacity-50' : ''} ${selectedRoleId === r.id
                                    ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 ring-1 ring-sky-100 dark:ring-sky-500/20 shadow-sm"
                                    : "bg-slate-50/50 dark:bg-slate-900/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                    }`}
                            >
                                <div>
                                    <div className={`font-semibold text-sm ${r.is_archived ? 'line-through' : ''} ${selectedRoleId === r.id ? 'text-sky-700 dark:text-sky-400' : 'text-[var(--foreground)] opacity-70'}`}>{r.title}</div>
                                    <div className="text-[10px] text-[var(--foreground)] opacity-30 font-mono mt-0.5">/{r.slug}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Link
                                        to={`/admin/structure/roles/${r.id}`}
                                        className="text-sky-600 dark:text-sky-400 hover:text-sky-500 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                                        title="Modifica Info e Risorse"
                                    >
                                        EDIT
                                    </Link>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveRole(r.id, !r.is_archived); }}
                                        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all text-xs ${r.is_archived ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                                        title={r.is_archived ? "Ripristina" : "Archivia"}
                                    >
                                        {r.is_archived ? '↩' : '📦'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(r.id); }}
                                        className="text-rose-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-[var(--card-border)] bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
                        <div className="space-y-2">
                            <input
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                placeholder="Nuovo Ruolo..."
                                value={roleTitle}
                                onChange={e => { setRoleTitle(e.target.value); setRoleSlug(slugify(e.target.value)); }}
                            />
                            <div className="flex gap-2">
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono placeholder:text-slate-400 focus:outline-none focus:border-slate-300"
                                    placeholder="slug"
                                    value={roleSlug}
                                    onChange={e => setRoleSlug(e.target.value)}
                                />
                                <button
                                    onClick={handleAddRole}
                                    className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl shadow-sm transition-colors font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: CONTESTS (Quizzes) */}
                <div className={`flex flex-col bg-[var(--card)] border border-[var(--card-border)] rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 ${!selectedRoleId ? "opacity-40 grayscale pointer-events-none" : "opacity-100"}`}>
                    <div className="p-5 border-b border-[var(--card-border)] bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">3</span>
                            Concorsi
                        </h2>
                        <div className="flex items-center gap-2">
                            {selectedRole && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--foreground)] opacity-60 font-medium px-2 py-1 rounded-full">{selectedRole.title}</span>}
                            <label className="flex items-center gap-1.5 text-[10px] text-[var(--foreground)] opacity-50 cursor-pointer hover:opacity-70">
                                <input
                                    type="checkbox"
                                    checked={showArchivedQuizzes}
                                    onChange={(e) => setShowArchivedQuizzes(e.target.checked)}
                                    className="w-3 h-3 rounded"
                                />
                                Archiviati
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {visibleQuizzes.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                                <span className="text-2xl mb-2">📚</span>
                                <p className="text-sm text-[var(--foreground)] opacity-50">Nessun concorso</p>
                            </div>
                        )}
                        {visibleQuizzes.map(q => (
                            <div key={q.id} className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm flex flex-col gap-2 hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-all group ${q.is_archived ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-semibold text-sm text-[var(--foreground)] opacity-80 leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors ${q.is_archived ? 'line-through' : ''}`}>{q.title}</h4>
                                    <div className="flex items-center gap-1.5">
                                        {q.year && <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-[var(--foreground)] opacity-50 font-bold px-1.5 py-0.5 rounded-md">{q.year}</span>}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleArchiveQuiz(q.id, !q.is_archived); }}
                                            className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all text-xs ${q.is_archived ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                                            title={q.is_archived ? "Ripristina" : "Archivia"}
                                        >
                                            {q.is_archived ? '↩' : '📦'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                    <span className="text-[10px] text-[var(--foreground)] opacity-30 font-mono">{q.slug || "no-slug"}</span>
                                    <div className="flex gap-2">
                                        <Link to={`/concorsi/${selectedCat?.slug}/${selectedRole?.slug}/${q.slug || q.id}`} target="_blank" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">Preview ↗</Link>
                                        <Link to={`/admin/quiz`} className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">Modifica</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-[var(--card-border)] bg-slate-50/30 dark:bg-slate-900/30">
                        <Link to="/admin/quiz">
                            <button className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--foreground)] opacity-70 border border-slate-200 dark:border-slate-700 text-xs py-3 rounded-xl font-bold transition-all shadow-sm">
                                Gestisci / Crea Concorsi
                            </button>
                        </Link>
                        <p className="text-[10px] text-[var(--foreground)] opacity-30 text-center mt-2 px-4">
                            Vai al pannello completo per creare concorsi e collegarli a questo ruolo.
                        </p>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
