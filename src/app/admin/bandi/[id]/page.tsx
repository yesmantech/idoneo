import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Eye, Loader2 } from 'lucide-react';
import {
    fetchBandoById,
    createBando,
    updateBando,
    deleteBando,
    fetchEnti,
    fetchAdminCategories,
    BandoFormData
} from '@/lib/adminBandiService';
import { Ente, BandiCategory, ITALIAN_REGIONS, EDUCATION_LEVELS, CONTRACT_TYPES } from '@/lib/bandiService';

export default function AdminBandoEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = !id || id === 'nuovo';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [enti, setEnti] = useState<Ente[]>([]);
    const [categories, setCategories] = useState<BandiCategory[]>([]);
    const [formData, setFormData] = useState<BandoFormData>({
        title: '',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft'
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        const [entiData, categoriesData] = await Promise.all([
            fetchEnti(),
            fetchAdminCategories()
        ]);
        setEnti(entiData);
        setCategories(categoriesData);

        if (!isNew && id) {
            setLoading(true);
            const bando = await fetchBandoById(id);
            if (bando) {
                setFormData({
                    title: bando.title,
                    slug: bando.slug,
                    ente_id: bando.ente_id || null,
                    category_id: bando.category_id || null,
                    seats_total: bando.seats_total || null,
                    seats_reserved: bando.seats_reserved || null,
                    contract_type: bando.contract_type || null,
                    salary_range: bando.salary_range || null,
                    education_level: bando.education_level || [],
                    age_min: bando.age_min || null,
                    age_max: bando.age_max || null,
                    region: bando.region || null,
                    province: bando.province || null,
                    city: bando.city || null,
                    is_remote: bando.is_remote || false,
                    publication_date: bando.publication_date || null,
                    deadline: bando.deadline?.split('T')[0] || '',
                    exam_date: bando.exam_date?.split('T')[0] || null,
                    application_url: bando.application_url || null,
                    application_method: bando.application_method || null,
                    description: bando.description || null,
                    short_description: bando.short_description || null,
                    exam_stages: bando.exam_stages || [],
                    status: bando.status,
                    is_featured: bando.is_featured || false,
                    source_urls: bando.source_urls || [],
                    tags: bando.tags || []
                });
            }
            setLoading(false);
        }
    };

    const handleChange = (field: keyof BandoFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.deadline) {
            alert('Titolo e scadenza sono obbligatori');
            return;
        }

        setSaving(true);
        try {
            if (isNew) {
                const created = await createBando(formData);
                navigate(`/admin/bandi/${created.id}`);
            } else if (id) {
                await updateBando(id, formData);
            }
            alert('Salvato con successo!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Errore durante il salvataggio');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (!confirm('Sei sicuro di voler eliminare questo bando?')) return;

        try {
            await deleteBando(id);
            navigate('/admin/bandi');
        } catch (error) {
            alert('Errore durante l\'eliminazione');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/bandi" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isNew ? 'Nuovo Bando' : 'Modifica Bando'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isNew && formData.slug && (
                            <Link
                                to={`/bandi/${formData.slug}`}
                                target="_blank"
                                className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                <Eye className="w-4 h-4" />
                                Anteprima
                            </Link>
                        )}
                        {!isNew && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                                Elimina
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salva
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <FormSection title="Informazioni Base">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Titolo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    placeholder="Es: Concorso 100 Allievi Agenti Polizia di Stato"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Ente
                                </label>
                                <select
                                    value={formData.ente_id || ''}
                                    onChange={(e) => handleChange('ente_id', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                >
                                    <option value="">Seleziona ente...</option>
                                    {enti.map(ente => (
                                        <option key={ente.id} value={ente.id}>{ente.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Categoria
                                </label>
                                <select
                                    value={formData.category_id || ''}
                                    onChange={(e) => handleChange('category_id', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                >
                                    <option value="">Seleziona categoria...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Stato
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                >
                                    <option value="draft">Bozza</option>
                                    <option value="review">In Revisione</option>
                                    <option value="published">Pubblicato</option>
                                    <option value="closed">Chiuso</option>
                                    <option value="suspended">Sospeso</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured || false}
                                        onChange={(e) => handleChange('is_featured', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        In evidenza
                                    </span>
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    {/* Dates */}
                    <FormSection title="Date">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data Pubblicazione
                                </label>
                                <input
                                    type="date"
                                    value={formData.publication_date || ''}
                                    onChange={(e) => handleChange('publication_date', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Scadenza *
                                </label>
                                <input
                                    type="date"
                                    value={formData.deadline?.split('T')[0] || ''}
                                    onChange={(e) => handleChange('deadline', e.target.value)}
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data Esame
                                </label>
                                <input
                                    type="date"
                                    value={formData.exam_date || ''}
                                    onChange={(e) => handleChange('exam_date', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Positions */}
                    <FormSection title="Posti e Contratto">
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Posti Totali
                                </label>
                                <input
                                    type="number"
                                    value={formData.seats_total || ''}
                                    onChange={(e) => handleChange('seats_total', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Posti Riservati
                                </label>
                                <input
                                    type="number"
                                    value={formData.seats_reserved || ''}
                                    onChange={(e) => handleChange('seats_reserved', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Tipo Contratto
                                </label>
                                <select
                                    value={formData.contract_type || ''}
                                    onChange={(e) => handleChange('contract_type', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                >
                                    <option value="">Seleziona...</option>
                                    {CONTRACT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Range Stipendio
                                </label>
                                <input
                                    type="text"
                                    value={formData.salary_range || ''}
                                    onChange={(e) => handleChange('salary_range', e.target.value || null)}
                                    placeholder="Es: €1.500 - €2.000"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Location */}
                    <FormSection title="Località">
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Regione
                                </label>
                                <select
                                    value={formData.region || ''}
                                    onChange={(e) => handleChange('region', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                >
                                    <option value="">Seleziona regione...</option>
                                    {ITALIAN_REGIONS.map(region => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Provincia
                                </label>
                                <input
                                    type="text"
                                    value={formData.province || ''}
                                    onChange={(e) => handleChange('province', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Città
                                </label>
                                <input
                                    type="text"
                                    value={formData.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value || null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mt-7">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_remote || false}
                                        onChange={(e) => handleChange('is_remote', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Lavoro da remoto
                                    </span>
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    {/* Requirements */}
                    <FormSection title="Requisiti">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Titolo di Studio
                                </label>
                                <div className="space-y-2">
                                    {EDUCATION_LEVELS.map(level => (
                                        <label key={level.value} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={(formData.education_level || []).includes(level.value)}
                                                onChange={(e) => {
                                                    const current = formData.education_level || [];
                                                    if (e.target.checked) {
                                                        handleChange('education_level', [...current, level.value]);
                                                    } else {
                                                        handleChange('education_level', current.filter(v => v !== level.value));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{level.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Età Minima
                                </label>
                                <input
                                    type="number"
                                    value={formData.age_min || ''}
                                    onChange={(e) => handleChange('age_min', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Età Massima
                                </label>
                                <input
                                    type="number"
                                    value={formData.age_max || ''}
                                    onChange={(e) => handleChange('age_max', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Application */}
                    <FormSection title="Candidatura">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    URL Candidatura
                                </label>
                                <input
                                    type="url"
                                    value={formData.application_url || ''}
                                    onChange={(e) => handleChange('application_url', e.target.value || null)}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Metodo Candidatura
                                </label>
                                <input
                                    type="text"
                                    value={formData.application_method || ''}
                                    onChange={(e) => handleChange('application_method', e.target.value || null)}
                                    placeholder="Es: Online tramite portale inPA"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Content */}
                    <FormSection title="Contenuto">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Descrizione Breve
                                </label>
                                <textarea
                                    value={formData.short_description || ''}
                                    onChange={(e) => handleChange('short_description', e.target.value || null)}
                                    rows={2}
                                    placeholder="Breve riassunto per le card..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Descrizione Completa
                                </label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => handleChange('description', e.target.value || null)}
                                    rows={6}
                                    placeholder="Descrizione dettagliata del bando..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Source */}
                    <FormSection title="Fonte">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                URL Fonte (uno per riga)
                            </label>
                            <textarea
                                value={(formData.source_urls || []).join('\n')}
                                onChange={(e) => handleChange('source_urls', e.target.value.split('\n').filter(Boolean))}
                                rows={3}
                                placeholder="https://www.gazzettaufficiale.it/..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm"
                            />
                        </div>
                    </FormSection>
                </form>
            </div>
        </div>
    );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h2>
            {children}
        </div>
    );
}
