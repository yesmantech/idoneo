import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    ExternalLink,
    Building2,
    MapPin,
    Loader2,
    X,
    Check
} from 'lucide-react';
import { AdminLayout } from '@/components/admin';
import { fetchEnti, createEnte, updateEnte, deleteEnte } from '@/lib/adminBandiService';
import { Ente, ITALIAN_REGIONS } from '@/lib/bandiService';

const ENTE_TYPES = [
    { value: 'comune', label: 'Comune' },
    { value: 'provincia', label: 'Provincia' },
    { value: 'regione', label: 'Regione' },
    { value: 'ministero', label: 'Ministero' },
    { value: 'forze_armate', label: 'Forze Armate' },
    { value: 'forze_ordine', label: 'Forze dell\'Ordine' },
    { value: 'universita', label: 'Università' },
    { value: 'asl', label: 'ASL/Azienda Sanitaria' },
    { value: 'agenzia', label: 'Agenzia' },
    { value: 'ente_pubblico', label: 'Ente Pubblico' },
    { value: 'altro', label: 'Altro' }
];

export default function AdminEntiListPage() {
    const [enti, setEnti] = useState<Ente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEnte, setEditingEnte] = useState<Ente | null>(null);
    const [saving, setSaving] = useState(false);

    const loadEnti = useCallback(async () => {
        setLoading(true);
        const data = await fetchEnti();
        setEnti(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadEnti();
    }, [loadEnti]);

    const filteredEnti = searchQuery
        ? enti.filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.slug?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : enti;

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo ente? I bandi associati perderanno il riferimento.')) return;
        try {
            await deleteEnte(id);
            loadEnti();
        } catch (error) {
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleEdit = (ente: Ente) => {
        setEditingEnte(ente);
        setShowModal(true);
    };

    const handleNew = () => {
        setEditingEnte(null);
        setShowModal(true);
    };

    const handleSave = async (data: Partial<Ente>) => {
        setSaving(true);
        try {
            if (editingEnte) {
                await updateEnte(editingEnte.id, data);
            } else {
                await createEnte(data);
            }
            setShowModal(false);
            loadEnti();
        } catch (error) {
            alert('Errore durante il salvataggio');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestione Enti</h1>
                        <p className="text-sm text-slate-500 mt-1">{enti.length} enti totali</p>
                    </div>
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                    >
                        <Plus className="w-4 h-4" />
                        Nuovo Ente
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cerca enti..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : filteredEnti.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            Nessun ente trovato
                        </div>
                    ) : (
                        filteredEnti.map(ente => (
                            <div
                                key={ente.id}
                                className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                        <Building2 className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                            {ente.name}
                                        </h3>
                                        <p className="text-xs text-slate-400">{ente.slug}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                    <span className="capitalize">{ente.type?.replace('_', ' ')}</span>
                                    {ente.region && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {ente.region}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-auto">
                                    {ente.website && (
                                        <a
                                            href={ente.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                        >
                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleEdit(ente)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                    >
                                        <Edit className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ente.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <EnteModal
                        ente={editingEnte}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

// ============================================
// ENTE MODAL
// ============================================

interface EnteModalProps {
    ente: Ente | null;
    saving: boolean;
    onSave: (data: Partial<Ente>) => void;
    onClose: () => void;
}

function EnteModal({ ente, saving, onSave, onClose }: EnteModalProps) {
    const [formData, setFormData] = useState<Partial<Ente>>({
        name: ente?.name || '',
        slug: ente?.slug || '',
        type: ente?.type || '',
        region: ente?.region || '',
        province: ente?.province || '',
        city: ente?.city || '',
        website: ente?.website || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Il nome è obbligatorio');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {ente ? 'Modifica Ente' : 'Nuovo Ente'}
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
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Tipo
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                        >
                            <option value="">Seleziona...</option>
                            {ENTE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Regione
                            </label>
                            <select
                                value={formData.region}
                                onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                            >
                                <option value="">Seleziona...</option>
                                {ITALIAN_REGIONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Città
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Sito Web
                        </label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))}
                            placeholder="https://..."
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
