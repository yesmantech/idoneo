import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Trash2,
    Edit,
    Eye,
    Check,
    X,
    ChevronDown,
    Upload,
    Download,
    Bot,
    Loader2
} from 'lucide-react';
import {
    fetchAdminBandi,
    deleteBando,
    bulkUpdateStatus,
    bulkDelete,
    publishBando,
    closeBando,
    runImportAgent
} from '@/lib/adminBandiService';
import { Bando } from '@/lib/bandiService';

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    review: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-200 text-slate-500',
    suspended: 'bg-red-100 text-red-700'
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Bozza',
    review: 'In Revisione',
    published: 'Pubblicato',
    closed: 'Chiuso',
    suspended: 'Sospeso'
};

export default function AdminBandiListPage() {
    const navigate = useNavigate();
    const [bandi, setBandi] = useState<Bando[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const limit = 50;

    const handleAutoImport = async () => {
        setIsImporting(true);
        try {
            const result = await runImportAgent();
            alert(`Importazione completata!\nBandi importati: ${result.imported}\nErrori: ${result.errors}`);
            loadBandi();
        } catch (error) {
            alert('Errore durante l\'esecuzione dell\'agent');
        } finally {
            setIsImporting(false);
        }
    };

    const loadBandi = useCallback(async () => {
        setLoading(true);
        try {
            const { data, count } = await fetchAdminBandi({
                status: statusFilter,
                search: searchQuery || undefined,
                limit,
                offset: page * limit
            });
            setBandi(data);
            setTotalCount(count);
        } catch (error) {
            console.error('Error loading bandi:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchQuery, page]);

    useEffect(() => {
        loadBandi();
    }, [loadBandi]);

    useEffect(() => {
        setShowBulkActions(selectedIds.size > 0);
    }, [selectedIds]);

    const handleSelectAll = () => {
        if (selectedIds.size === bandi.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(bandi.map(b => b.id)));
        }
    };

    const handleSelectOne = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo bando?')) return;
        try {
            await deleteBando(id);
            loadBandi();
        } catch (error) {
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.size} bandi?`)) return;
        try {
            await bulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            loadBandi();
        } catch (error) {
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleBulkPublish = async () => {
        try {
            await bulkUpdateStatus(Array.from(selectedIds), 'published');
            setSelectedIds(new Set());
            loadBandi();
        } catch (error) {
            alert('Errore durante la pubblicazione');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await publishBando(id);
            loadBandi();
        } catch (error) {
            alert('Errore durante la pubblicazione');
        }
    };

    const handleClose = async (id: string) => {
        try {
            await closeBando(id);
            loadBandi();
        } catch (error) {
            alert('Errore durante la chiusura');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestione Bandi</h1>
                    <p className="text-sm text-slate-500 mt-1">{totalCount} bandi totali</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAutoImport}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                        {isImporting ? 'Import in corso...' : 'Auto Import Agent'}
                    </button>
                    <Link
                        to="/admin/bandi/nuovo"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                    >
                        <Plus className="w-4 h-4" />
                        Nuovo Bando
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca bandi..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                >
                    <option value="all">Tutti gli stati</option>
                    <option value="draft">Bozza</option>
                    <option value="review">In Revisione</option>
                    <option value="published">Pubblicati</option>
                    <option value="closed">Chiusi</option>
                </select>
            </div>

            {/* Bulk Actions Bar */}
            {showBulkActions && (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedIds.size} selezionati
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkPublish}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                        >
                            Pubblica
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium"
                        >
                            Elimina
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === bandi.length && bandi.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Titolo</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Ente</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Scadenza</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Stato</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Posti</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                    Caricamento...
                                </td>
                            </tr>
                        ) : bandi.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                    Nessun bando trovato
                                </td>
                            </tr>
                        ) : (
                            bandi.map((bando) => (
                                <tr key={bando.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(bando.id)}
                                            onChange={() => handleSelectOne(bando.id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
                                            {bando.title}
                                        </div>
                                        <div className="text-xs text-slate-400">{bando.slug}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                        {bando.ente?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                        {new Date(bando.deadline).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[bando.status]}`}>
                                            {STATUS_LABELS[bando.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                        {bando.seats_total || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                to={`/bandi/${bando.slug}`}
                                                target="_blank"
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                                                title="Anteprima"
                                            >
                                                <Eye className="w-4 h-4 text-slate-400" />
                                            </Link>
                                            <Link
                                                to={`/admin/bandi/${bando.id}`}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                                                title="Modifica"
                                            >
                                                <Edit className="w-4 h-4 text-slate-400" />
                                            </Link>
                                            {bando.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublish(bando.id)}
                                                    className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg"
                                                    title="Pubblica"
                                                >
                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                </button>
                                            )}
                                            {bando.status === 'published' && (
                                                <button
                                                    onClick={() => handleClose(bando.id)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg"
                                                    title="Chiudi"
                                                >
                                                    <X className="w-4 h-4 text-slate-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(bando.id)}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"
                                                title="Elimina"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalCount > limit && (
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Pagina {page + 1} di {Math.ceil(totalCount / limit)}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-50"
                            >
                                Precedente
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * limit >= totalCount}
                                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-50"
                            >
                                Successiva
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
