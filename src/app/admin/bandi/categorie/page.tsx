import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    GripVertical,
    Folder,
    Loader2,
    X,
    Check
} from 'lucide-react';
import { fetchAdminCategories, createCategory, updateCategory } from '@/lib/adminBandiService';
import { BandiCategory } from '@/lib/bandiService';
import { supabase } from '@/lib/supabaseClient';

export default function AdminBandiCategoriesPage() {
    const [categories, setCategories] = useState<BandiCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<BandiCategory | null>(null);
    const [saving, setSaving] = useState(false);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        const data = await fetchAdminCategories();
        setCategories(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa categoria? I bandi associati perderanno il riferimento.')) return;
        try {
            const { error } = await supabase.from('bandi_categories').delete().eq('id', id);
            if (error) throw error;
            loadCategories();
        } catch (error) {
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleEdit = (category: BandiCategory) => {
        setEditingCategory(category);
        setShowModal(true);
    };

    const handleNew = () => {
        setEditingCategory(null);
        setShowModal(true);
    };

    const handleSave = async (data: Partial<BandiCategory>) => {
        setSaving(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, data);
            } else {
                await createCategory(data);
            }
            setShowModal(false);
            loadCategories();
        } catch (error) {
            alert('Errore durante il salvataggio');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categorie Bandi</h1>
                    <p className="text-sm text-slate-500 mt-1">{categories.length} categorie</p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                >
                    <Plus className="w-4 h-4" />
                    Nuova Categoria
                </button>
            </div>

            {/* Categories Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>Nessuna categoria creata</p>
                        <button
                            onClick={handleNew}
                            className="mt-4 text-emerald-500 font-medium hover:underline"
                        >
                            Crea la prima categoria
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 w-12">#</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Nome</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Slug</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Icona</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Colore</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {categories.map((category, index) => (
                                <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {category.sort_order || index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                                                style={{ backgroundColor: category.color || '#6366f1' }}
                                            >
                                                {category.icon || '📁'}
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {category.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                                        {category.slug}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">
                                        {category.icon || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: category.color || '#6366f1' }}
                                            />
                                            <span className="text-sm text-slate-500 font-mono">
                                                {category.color || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <CategoryModal
                    category={editingCategory}
                    saving={saving}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

// ============================================
// CATEGORY MODAL
// ============================================

interface CategoryModalProps {
    category: BandiCategory | null;
    saving: boolean;
    onSave: (data: Partial<BandiCategory>) => void;
    onClose: () => void;
}

function CategoryModal({ category, saving, onSave, onClose }: CategoryModalProps) {
    const [formData, setFormData] = useState<Partial<BandiCategory>>({
        name: category?.name || '',
        slug: category?.slug || '',
        icon: category?.icon || '',
        color: category?.color || '#6366f1',
        sort_order: category?.sort_order || 0
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Il nome è obbligatorio');
            return;
        }
        // Auto-generate slug if empty
        if (!formData.slug) {
            formData.slug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }
        onSave(formData);
    };

    const PRESET_COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];

    const PRESET_ICONS = [
        '🏛️', '👮', '🎖️', '⚖️', '🏥', '📚', '🎓', '🏢',
        '🌍', '💼', '🔬', '📊', '🚗', '✈️', '🚂', '🏗️'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {category ? 'Modifica Categoria' : 'Nuova Categoria'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nome *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            required
                            placeholder="Es: Forze Armate"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Slug
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                            placeholder="Autogenerato se vuoto"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Icona
                        </label>
                        <div className="grid grid-cols-8 gap-2 mb-2">
                            {PRESET_ICONS.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, icon }))}
                                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${formData.icon === icon
                                            ? 'bg-slate-200 dark:bg-slate-600 ring-2 ring-emerald-500'
                                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={formData.icon}
                            onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))}
                            placeholder="Emoji o testo"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Colore
                        </label>
                        <div className="grid grid-cols-8 gap-2 mb-2">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, color }))}
                                    className={`w-9 h-9 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ordine
                        </label>
                        <input
                            type="number"
                            value={formData.sort_order}
                            onChange={(e) => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-600 rounded-lg font-medium"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Salva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
