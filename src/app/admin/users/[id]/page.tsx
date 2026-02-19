
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AdminLayout, AdminPageHeader } from '@/components/admin';
import { Loader2, ChevronLeft, Calendar, Award, Target, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface UserActivity {
    profile: {
        id: string;
        nickname: string | null;
        role: string;
        email: string | null;
        created_at: string;
        total_xp?: number;
    };
    attempts: {
        id: string;
        created_at: string;
        score: number;
        is_idoneo: boolean;
        mode: string;
        quiz_title: string;
        total_questions: number;
        correct: number;
    }[];
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<UserActivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchUserActivity();
    }, [id]);

    const fetchUserActivity = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_activity_admin', { target_user_id: id });

            if (error) throw error;
            setData(data);
        } catch (err: any) {
            console.error('Error fetching user activity:', err);
            setError(err.message || 'Errore nel caricamento dei dati');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="animate-spin text-slate-400 w-10 h-10 mb-4" />
                    <p className="text-slate-500 font-medium">Caricamento attività utente...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error || !data) {
        return (
            <AdminLayout>
                <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
                    <p className="text-red-600 dark:text-red-400 font-bold mb-4">{error || 'Utente non trovato'}</p>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold"
                    >
                        Torna alla lista
                    </button>
                </div>
            </AdminLayout>
        );
    }

    const profile = data.profile;
    const attempts = data.attempts || [];

    if (!profile) {
        return (
            <AdminLayout>
                <div className="p-8 text-center bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                    <p className="text-amber-600 dark:text-amber-400 font-bold mb-4">Profilo utente non trovato nel database.</p>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold"
                    >
                        Torna alla lista
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-105 transition-transform"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <AdminPageHeader
                    title={profile.nickname || 'Utente senza nome'}
                    subtitle={`Attività dell'utente: ${profile.email || profile.id}`}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Profile Info Card */}
                <div className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--card-border)] shadow-soft">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Iscritto il</p>
                            <p className="font-bold text-[var(--foreground)]">
                                {profile.created_at ? format(new Date(profile.created_at), 'PPP', { locale: it }) : 'Data sconosciuta'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Totale XP</p>
                            <p className="font-bold text-[var(--foreground)]">{profile.total_xp || 0} XP</p>
                        </div>
                    </div>
                </div>

                {/* Engagement Stats */}
                <div className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--card-border)] shadow-soft">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Test Completati</p>
                            <p className="font-bold text-[var(--foreground)]">{attempts.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idoneo in</p>
                            <p className="font-bold text-[var(--foreground)]">
                                {attempts.filter(a => a.is_idoneo).length} test
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--card-border)] shadow-soft flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ruolo Sistema</p>
                    <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${profile.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {profile.role || 'user'}
                    </span>
                </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[24px] overflow-hidden shadow-soft">
                <div className="px-6 py-4 border-b border-[var(--card-border)] flex justify-between items-center">
                    <h3 className="font-black text-[var(--foreground)]">Ultimi 50 Tentativi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-[var(--card-border)] text-[var(--foreground)] opacity-40 uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Quiz</th>
                                <th className="px-6 py-4 text-center">Punteggio</th>
                                <th className="px-6 py-4 text-center">Risposte</th>
                                <th className="px-6 py-4 text-center">Esito</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--card-border)]">
                            {attempts.map(attempt => (
                                <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-[var(--foreground)] opacity-50">
                                        {format(new Date(attempt.created_at), 'dd MMM HH:mm', { locale: it })}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-[var(--foreground)]">
                                        {attempt.quiz_title}
                                        <span className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] text-slate-400 uppercase">
                                            {attempt.mode || 'Normal'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-black">
                                        {attempt.score.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs opacity-60">
                                        {attempt.correct}/{attempt.total_questions}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {attempt.is_idoneo ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[10px] font-black uppercase tracking-tighter">Idoneo</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] font-black uppercase tracking-tighter">Non Idoneo</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {attempts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        Nessuna attività registrata per questo utente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
