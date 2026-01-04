import React, { useState } from 'react';
import { ContentBlock } from '@/types/blog';

// Define explicit type for imported data (different from BlogPost structure)
export interface ImportedArticleData {
    title?: string;
    subtitle?: string;
    slug?: string;
    category?: string; // Category NAME, not ID
    tags?: string[];   // Tag NAMES, not IDs
    content?: ContentBlock[];
    seo_title?: string;
    seo_description?: string;
}

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: ImportedArticleData) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleImport = () => {
        try {
            setError('');
            const data = JSON.parse(jsonInput);

            // Basic validation
            if (!data.title) throw new Error("Manca il campo 'title'");
            if (!Array.isArray(data.content)) throw new Error("Il campo 'content' deve essere una lista");

            // Normalize content blocks if needed
            const normalizedContent = data.content.map((block: any) => {
                if (!block.type) throw new Error("Blocco senza 'type'");
                return block;
            });

            onImport({
                ...data,
                content: normalizedContent,
                tags: data.tags || []
            });

            onClose();
            setJsonInput(''); // Reset after success
        } catch (err: any) {
            setError(err.message || 'JSON non valido');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-[var(--card-border)] flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                    <h3 className="font-bold text-xl text-[var(--foreground)]">🤖 Importa da AI Script</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(PROMPT_TEMPLATE);
                                alert("Prompt copiato! Incollalo su ChatGPT.");
                            }}
                            className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
                        >
                            📋 Copia Prompt
                        </button>
                        <button onClick={onClose} className="text-[var(--foreground)] opacity-40 hover:opacity-100 font-bold text-xl ml-2 transition-all">×</button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 p-4 rounded-lg text-sm border border-blue-100 dark:border-blue-500/20">
                        Incolla qui il JSON generato da ChatGPT. Assicurati che segua lo schema richiesto.
                    </div>

                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='{ "title": "...", "content": [...] }'
                        className="w-full h-64 p-4 font-mono text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-[var(--foreground)]/20"
                    />

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium border border-rose-100">
                            ❌ Errore: {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--foreground)] opacity-60 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!jsonInput.trim()}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        Importa Articolo
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper to copy the prompt template
export const PROMPT_TEMPLATE = `
Agisci come un esperto copywriter SEO e crea un articolo di blog strutturato.
Rispondi SOLO con un oggetto JSON valido (nessun markdown, nessun testo prima/dopo) che segua esattamente questo schema:

{
  "title": "Titolo Accattivante",
  "subtitle": "Sottotitolo persuasivo",
  "category": "Nome Categoria (es. Concorsi, Studio, News)",
  "tags": ["Tag1", "Tag2"],
  "content": [
    { "type": "paragraph", "text": "Testo introduttivo..." },
    { "type": "heading", "level": 2, "text": "Titolo Sezione" },
    { "type": "paragraph", "text": "Contenuto sezione..." },
    { "type": "list", "ordered": false, "items": ["Punto 1", "Punto 2"] },
    { "type": "callout", "variant": "tip", "title": "Consiglio", "text": "Testo del consiglio" },
    { "type": "faq", "items": [{ "question": "Domanda?", "answer": "Risposta." }] },
    { "type": "cta", "title": "Titolo CTA", "description": "Descrizione", "buttonText": "Bottone", "buttonUrl": "https://..." }
  ],
  "seo_title": "Titolo ottimizzato SEO (max 60 car)",
  "seo_description": "Meta description ottimizzata (max 160 car)",
  "slug": "slug-articolo-ottimizzato"
}
`;
