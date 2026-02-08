import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle2,
    Loader2,
    X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ImportResult {
    success: number;
    errors: string[];
}

export default function AdminBandiImportPage() {
    const [mode, setMode] = useState<'import' | 'export'>('import');
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // CSV Headers for bandi
    const CSV_HEADERS = [
        'title',
        'ente_name',  // Will be matched to ente_id
        'category_name',  // Will be matched to category_id
        'seats_total',
        'seats_reserved',
        'contract_type',
        'salary_range',
        'education_level',  // Comma-separated
        'age_min',
        'age_max',
        'region',
        'province',
        'city',
        'is_remote',
        'publication_date',
        'deadline',
        'exam_date',
        'application_url',
        'application_method',
        'description',
        'short_description',
        'status',
        'is_featured',
        'source_urls'  // Comma-separated
    ];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('Seleziona un file CSV');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            const text = await file.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                setResult({ success: 0, errors: ['Il file è vuoto'] });
                return;
            }

            // Get headers from first row
            const headers = rows[0].map(h => h.trim().toLowerCase());
            const data = rows.slice(1);

            // Fetch enti and categories for matching
            const { data: entiData } = await supabase.from('enti').select('id, name');
            const { data: categoriesData } = await supabase.from('bandi_categories').select('id, name');

            const entiMap = new Map(entiData?.map(e => [e.name.toLowerCase(), e.id]) || []);
            const categoriesMap = new Map(categoriesData?.map(c => [c.name.toLowerCase(), c.id]) || []);

            let successCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row.length === 0 || (row.length === 1 && !row[0])) continue;

                try {
                    const bando = mapRowToBando(headers, row, entiMap, categoriesMap);

                    if (!bando.title || !bando.deadline) {
                        errors.push(`Riga ${i + 2}: titolo e scadenza sono obbligatori`);
                        continue;
                    }

                    const { error } = await supabase.from('bandi').insert(bando);
                    if (error) {
                        errors.push(`Riga ${i + 2}: ${error.message}`);
                    } else {
                        successCount++;
                    }
                } catch (err: any) {
                    errors.push(`Riga ${i + 2}: ${err.message}`);
                }
            }

            setResult({ success: successCount, errors });
        } catch (err: any) {
            setResult({ success: 0, errors: [err.message] });
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const parseCSV = (text: string): string[][] => {
        const lines = text.split('\n');
        return lines.map(line => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;

            for (const char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        });
    };

    const mapRowToBando = (
        headers: string[],
        row: string[],
        entiMap: Map<string, string>,
        categoriesMap: Map<string, string>
    ) => {
        const getValue = (key: string): string => {
            const idx = headers.indexOf(key);
            return idx >= 0 ? row[idx]?.trim() || '' : '';
        };

        const enteName = getValue('ente_name');
        const categoryName = getValue('category_name');

        return {
            title: getValue('title'),
            ente_id: enteName ? entiMap.get(enteName.toLowerCase()) || null : null,
            category_id: categoryName ? categoriesMap.get(categoryName.toLowerCase()) || null : null,
            seats_total: getValue('seats_total') ? parseInt(getValue('seats_total')) : null,
            seats_reserved: getValue('seats_reserved') ? parseInt(getValue('seats_reserved')) : null,
            contract_type: getValue('contract_type') || null,
            salary_range: getValue('salary_range') || null,
            education_level: getValue('education_level') ? getValue('education_level').split(',').map(s => s.trim()) : null,
            age_min: getValue('age_min') ? parseInt(getValue('age_min')) : null,
            age_max: getValue('age_max') ? parseInt(getValue('age_max')) : null,
            region: getValue('region') || null,
            province: getValue('province') || null,
            city: getValue('city') || null,
            is_remote: getValue('is_remote').toLowerCase() === 'true',
            publication_date: getValue('publication_date') || null,
            deadline: getValue('deadline'),
            exam_date: getValue('exam_date') || null,
            application_url: getValue('application_url') || null,
            application_method: getValue('application_method') || null,
            description: getValue('description') || null,
            short_description: getValue('short_description') || null,
            status: getValue('status') || 'draft',
            is_featured: getValue('is_featured').toLowerCase() === 'true',
            source_urls: getValue('source_urls') ? getValue('source_urls').split(',').map(s => s.trim()) : null
        };
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const { data: bandi, error } = await supabase
                .from('bandi')
                .select(`
                    *,
                    ente:enti(name),
                    category:bandi_categories(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!bandi || bandi.length === 0) {
                alert('Nessun bando da esportare');
                return;
            }

            // Build CSV
            const rows = [CSV_HEADERS.join(',')];

            for (const bando of bandi) {
                const row = [
                    escapeCSV(bando.title),
                    escapeCSV(bando.ente?.name || ''),
                    escapeCSV(bando.category?.name || ''),
                    bando.seats_total || '',
                    bando.seats_reserved || '',
                    escapeCSV(bando.contract_type || ''),
                    escapeCSV(bando.salary_range || ''),
                    escapeCSV((bando.education_level || []).join(', ')),
                    bando.age_min || '',
                    bando.age_max || '',
                    escapeCSV(bando.region || ''),
                    escapeCSV(bando.province || ''),
                    escapeCSV(bando.city || ''),
                    bando.is_remote ? 'true' : 'false',
                    bando.publication_date || '',
                    bando.deadline || '',
                    bando.exam_date || '',
                    escapeCSV(bando.application_url || ''),
                    escapeCSV(bando.application_method || ''),
                    escapeCSV(bando.description || ''),
                    escapeCSV(bando.short_description || ''),
                    bando.status,
                    bando.is_featured ? 'true' : 'false',
                    escapeCSV((bando.source_urls || []).join(', '))
                ];
                rows.push(row.join(','));
            }

            // Download
            const csv = rows.join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bandi_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

        } catch (err: any) {
            alert('Errore durante l\'esportazione: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const escapeCSV = (str: string): string => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const downloadTemplate = () => {
        const csv = CSV_HEADERS.join(',') + '\n';
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bandi_template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/bandi" className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg">
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Import / Export Bandi</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setMode('import')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'import'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Import
                </button>
                <button
                    onClick={() => setMode('export')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'export'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                >
                    <Download className="w-4 h-4 inline mr-2" />
                    Export
                </button>
            </div>

            {mode === 'import' ? (
                <div className="space-y-6">
                    {/* Import Instructions */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Importa Bandi da CSV
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Carica un file CSV con i bandi da importare. Assicurati che il file rispetti il formato del template.
                        </p>

                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Scarica Template
                            </button>
                        </div>

                        {/* Upload Area */}
                        <div
                            className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {importing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                                    <span className="text-slate-600 dark:text-slate-400">Importazione in corso...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Upload className="w-10 h-10 text-slate-400" />
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Clicca o trascina un file CSV
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result */}
                    {result && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {result.errors.length === 0 ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-amber-500" />
                                )}
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Risultato Importazione
                                </h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                {result.success} bandi importati con successo
                            </p>

                            {result.errors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                                        Errori ({result.errors.length})
                                    </h4>
                                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                                        {result.errors.map((err, i) => (
                                            <li key={i} className="text-sm text-red-600 dark:text-red-400">
                                                {err}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Esporta Bandi in CSV
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Esporta tutti i bandi presenti nel database in formato CSV.
                    </p>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Esporta CSV
                    </button>
                </div>
            )}
        </div>
    );
}
