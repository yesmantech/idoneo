import React, { useState, useMemo } from 'react';
import { STATUS_CONFIG } from '@/types/blog';
import { useBlogEditor, calculateReadingTime } from './useBlogEditor';
import { ImportModal, ImportedArticleData } from './ImportModal';
import BlockEditor from './BlockEditor';
import { AdminLayout } from '@/components/admin';

// ================== SUB-COMPONENTS ==================

interface EditorSectionNavProps {
    activeSection: 'content' | 'media' | 'seo' | 'publish';
    onChangeSection: (section: 'content' | 'media' | 'seo' | 'publish') => void;
}

const SECTION_LABELS = {
    content: '📝 Contenuto',
    media: '🖼️ Media',
    seo: '🔍 SEO',
    publish: '📤 Pubblicazione',
} as const;

function EditorSectionNav({ activeSection, onChangeSection }: EditorSectionNavProps) {
    return (
        <div className="w-48 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-24">
                {(Object.keys(SECTION_LABELS) as Array<keyof typeof SECTION_LABELS>).map(section => (
                    <button
                        key={section}
                        onClick={() => onChangeSection(section)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 transition-colors ${activeSection === section
                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {SECTION_LABELS[section]}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ================== MAIN COMPONENT ==================

export default function AdminBlogEditorPage() {
    const {
        formState,
        categories,
        allTags,
        isNew,
        loading,
        saving,
        uploading,
        updateField,
        handleTitleChange,
        handleSave,
        handleImageUpload,
        addBlock,
        updateBlock,
        removeBlock,
        moveBlock,
        navigate,
    } = useBlogEditor();

    const [activeSection, setActiveSection] = useState<'content' | 'media' | 'seo' | 'publish'>('content');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Memoize reading time calculation
    const readingTime = useMemo(() => calculateReadingTime(formState.content), [formState.content]);

    // Handle import from AI
    const handleImport = (data: ImportedArticleData) => {
        if (data.title) handleTitleChange(data.title);
        if (data.subtitle) updateField('subtitle', data.subtitle);
        if (data.slug) updateField('slug', data.slug);

        if (data.category) {
            const catName = data.category.toLowerCase();
            const found = categories.find(c => c.name.toLowerCase() === catName || c.slug === catName);
            if (found) updateField('categoryId', found.id);
        }

        if (data.tags && Array.isArray(data.tags)) {
            const tagIds = data.tags
                .map((tName: string) => allTags.find(t => t.name.toLowerCase() === tName.toLowerCase())?.id)
                .filter((id): id is string => id !== undefined);
            updateField('selectedTags', tagIds);
        }

        if (data.content && Array.isArray(data.content)) {
            updateField('content', data.content as typeof formState.content);
        }

        if (data.seo_title) updateField('seoTitle', data.seo_title);
        if (data.seo_description) updateField('seoDescription', data.seo_description);

        alert('Importazione completata! Verifica i dati e aggiungi l\'immagine di copertina.');
    };

    // Handle file input change
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleImageUpload(file);
        }
        e.target.value = ''; // Reset for re-selection
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-500">Caricamento...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 z-20 bg-white/95 backdrop-blur py-4 border-b border-slate-200 -mx-6 px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/blog')}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ← Torna
                        </button>
                        <h1 className="text-xl font-bold text-slate-900">
                            {isNew ? 'Nuovo Articolo' : 'Modifica Articolo'}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[formState.status].bgColor} ${STATUS_CONFIG[formState.status].color}`}>
                            {STATUS_CONFIG[formState.status].label}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 font-medium transition-colors flex items-center gap-2"
                        >
                            🤖 Importa AI
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            {saving ? 'Salvataggio...' : 'Salva'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 items-start">
                    {/* Sidebar Navigation */}
                    <EditorSectionNav activeSection={activeSection} onChangeSection={setActiveSection} />

                    {/* Main Content */}
                    <div className="flex-1 space-y-6 min-w-0">
                        {/* Content Section */}
                        {activeSection === 'content' && (
                            <div className="space-y-6">
                                {/* Title & Subtitle */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                                    <h2 className="font-bold text-lg text-slate-800">Titolo e Sottotitolo</h2>
                                    <input
                                        type="text"
                                        placeholder="Titolo dell'articolo"
                                        value={formState.title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        className="w-full px-4 py-3 text-xl font-bold border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Sottotitolo / Hook (opzionale)"
                                        value={formState.subtitle}
                                        onChange={(e) => updateField('subtitle', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                                    />
                                </div>

                                {/* Category & Tags */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                                    <h2 className="font-bold text-lg text-slate-800">Organizzazione</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Categoria</label>
                                            <select
                                                value={formState.categoryId}
                                                onChange={(e) => updateField('categoryId', e.target.value)}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="">Seleziona categoria...</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Tag</label>
                                            <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg min-h-[42px]">
                                                {allTags.slice(0, 10).map(tag => (
                                                    <label key={tag.id} className="flex items-center gap-1 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                                                        <input
                                                            type="checkbox"
                                                            checked={formState.selectedTags.includes(tag.id)}
                                                            onChange={(e) => {
                                                                const newTags = e.target.checked
                                                                    ? [...formState.selectedTags, tag.id]
                                                                    : formState.selectedTags.filter(t => t !== tag.id);
                                                                updateField('selectedTags', newTags);
                                                            }}
                                                            className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                                        />
                                                        {tag.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Blocks */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <BlockEditor
                                        content={formState.content}
                                        onAdd={addBlock}
                                        onUpdate={updateBlock}
                                        onRemove={removeBlock}
                                        onMove={moveBlock}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Media Section */}
                        {activeSection === 'media' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                                <h2 className="font-bold text-lg text-slate-800">Immagine di Copertina</h2>

                                {/* Upload Area */}
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative group cursor-pointer bg-slate-50/50">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={onFileChange}
                                        disabled={uploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                    />
                                    <div className="space-y-3 pointer-events-none">
                                        <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
                                            {uploading ? '⏳' : '📤'}
                                        </div>
                                        <div className="font-medium text-slate-600">
                                            {uploading ? 'Caricamento in corso...' : 'Clicca o trascina un immagine qui'}
                                        </div>
                                        <div className="text-sm text-slate-500">JPG, PNG, WebP (max 5MB)</div>
                                    </div>
                                </div>

                                {/* Manual URL Fallback */}
                                <div className="space-y-2">
                                    <div className="text-sm text-slate-600 font-medium">Oppure incolla URL</div>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={formState.coverImageUrl}
                                        onChange={(e) => updateField('coverImageUrl', e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Preview */}
                                {formState.coverImageUrl && (
                                    <div className="space-y-2 pt-4 border-t border-slate-200">
                                        <div className="text-sm font-medium text-slate-600">Anteprima</div>
                                        <div className="relative group max-w-lg">
                                            <img
                                                src={formState.coverImageUrl}
                                                alt="Preview"
                                                className="rounded-lg border border-slate-200 w-full shadow-sm bg-slate-50"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Immagine+non+valida')}
                                            />
                                            <button
                                                onClick={() => updateField('coverImageUrl', '')}
                                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-rose-500 p-2 rounded-full shadow-md transition-colors"
                                                title="Rimuovi immagine"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEO Section */}
                        {activeSection === 'seo' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                                <h2 className="font-bold text-lg text-slate-800">SEO</h2>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">
                                        Slug URL
                                        <span className="text-slate-400 font-normal ml-2">/blog/{formState.slug || 'url-articolo'}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.slug}
                                        onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">
                                        Titolo SEO
                                        <span className="text-slate-400 font-normal ml-2">({(formState.seoTitle || formState.title).length}/60)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.seoTitle}
                                        onChange={(e) => updateField('seoTitle', e.target.value)}
                                        placeholder={formState.title || 'Titolo per i motori di ricerca'}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">
                                        Meta Description
                                        <span className="text-slate-400 font-normal ml-2">({formState.seoDescription.length}/160)</span>
                                    </label>
                                    <textarea
                                        value={formState.seoDescription}
                                        onChange={(e) => updateField('seoDescription', e.target.value)}
                                        placeholder="Descrizione che apparirà nei risultati di ricerca..."
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Canonical URL (opzionale)</label>
                                    <input
                                        type="text"
                                        value={formState.canonicalUrl}
                                        onChange={(e) => updateField('canonicalUrl', e.target.value)}
                                        placeholder="https://idoneo.it/blog/..."
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <input
                                        type="checkbox"
                                        checked={formState.isNoindex}
                                        onChange={(e) => updateField('isNoindex', e.target.checked)}
                                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                    />
                                    <div>
                                        <div className="font-medium text-amber-800">Nascondi dai motori di ricerca (noindex)</div>
                                        <div className="text-sm text-amber-600">Attiva solo per contenuti di test o bassa qualità</div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Publish Section */}
                        {activeSection === 'publish' && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                                <h2 className="font-bold text-lg text-slate-800">Pubblicazione</h2>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Stato</label>
                                    <select
                                        value={formState.status}
                                        onChange={(e) => updateField('status', e.target.value as typeof formState.status)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="draft">📝 Bozza</option>
                                        <option value="scheduled">⏰ Programmato</option>
                                        <option value="published">✅ Pubblicato</option>
                                        <option value="archived">📦 Archiviato</option>
                                    </select>
                                </div>

                                {(formState.status === 'scheduled' || formState.status === 'published') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Data di pubblicazione</label>
                                        <input
                                            type="datetime-local"
                                            value={formState.publishedAt}
                                            onChange={(e) => updateField('publishedAt', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                )}

                                <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <input
                                        type="checkbox"
                                        checked={formState.isFeatured}
                                        onChange={(e) => updateField('isFeatured', e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <div className="font-medium text-emerald-800">⭐ Articolo in evidenza</div>
                                        <div className="text-sm text-emerald-600">Mostra in primo piano nella pagina del blog</div>
                                    </div>
                                </label>

                                <div className="pt-4 border-t border-slate-200">
                                    <div className="text-sm text-slate-500">
                                        Tempo di lettura stimato: <strong>{readingTime} min</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <ImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImport}
                />
            </div>
        </AdminLayout>
    );
}
