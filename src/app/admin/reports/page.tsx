"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AlertTriangle, CheckCircle, XCircle, Search, Filter, MoreHorizontal, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Types
interface Report {
    id: string;
    question_id: string;
    user_id: string;
    reason: string;
    description: string | null;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    profiles?: { email: string; nickname: string } | null;
    questionText?: string; // Loaded separately
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState("");

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Fetch reports with user profile
            const { data, error } = await supabase
                .from('question_reports')
                .select(`
                    *,
                    profiles (email, nickname)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const reportsData = data as Report[];

            // Batch fetch question texts
            const qIds = Array.from(new Set(reportsData.map(r => r.question_id)));
            if (qIds.length > 0) {
                const { data: questions } = await supabase
                    .from('questions')
                    .select('id, text')
                    .in('id', qIds);

                if (questions) {
                    const qMap = new Map(questions.map(q => [q.id, q.text]));
                    reportsData.forEach(r => {
                        r.questionText = qMap.get(r.question_id);
                    });
                }
            }

            setReports(reportsData);
        } catch (e) {
            console.error("Error fetching reports:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: 'resolved' | 'dismissed') => {
        try {
            const { error } = await supabase
                .from('question_reports')
                .update({ status: newStatus, resolved_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            setReports(prev => prev.map(r =>
                r.id === id ? { ...r, status: newStatus } : r
            ));
        } catch (e) {
            console.error("Error updating status:", e);
            alert("Errore aggiornamento status");
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesSearch =
            r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                        Segnalazioni Errori
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gestisci le segnalazioni inviate dagli utenti
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-sm">
                        Totale: {reports.length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cerca per motivo, testo domanda, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00B1FF]"
                    />
                </div>
                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                    {['all', 'pending', 'resolved', 'dismissed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === status
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {status === 'all' ? 'Tutti' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[120px]">Data</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[100px]">Stato</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[200px]">Utente</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[200px]">Motivo</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Domanda / Dettagli</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-[150px]">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Caricamento...</td></tr>
                            ) : filteredReports.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nessuna segnalazione trovata</td></tr>
                            ) : (
                                filteredReports.map(report => (
                                    <tr key={report.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4 align-top text-sm text-slate-500 font-mono">
                                            {format(new Date(report.created_at), 'dd MMM yyyy', { locale: it })}<br />
                                            {format(new Date(report.created_at), 'HH:mm', { locale: it })}
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${report.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                                    : report.status === 'resolved'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {report.profiles?.nickname || 'Utente'}
                                                </span>
                                                <span className="text-xs text-slate-500 truncate max-w-[180px]">
                                                    {report.profiles?.email || report.user_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {report.reason}
                                            </span>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 font-medium">
                                                    {report.questionText || <span className="italic opacity-50">Testo domanda non disponibile</span>}
                                                </div>
                                                {report.description && (
                                                    <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        "{report.description}"
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    ID: {report.question_id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {report.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'resolved')}
                                                        title="Segna come Risolto"
                                                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                                                        title="Ignora"
                                                        className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {report.status !== 'pending' && (
                                                <span className="text-xs text-slate-400 italic">No actions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
