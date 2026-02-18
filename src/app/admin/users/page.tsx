import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AdminLayout, AdminPageHeader } from '@/components/admin';
import { Loader2 } from 'lucide-react';

interface Profile {
    id: string;
    nickname: string | null;
    role: string;
    email: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .rpc('get_admin_profiles');

            if (data) setUsers(data);
            if (error) console.error('Error fetching users:', error);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    return (
        <AdminLayout>
            <AdminPageHeader title="Utenti" subtitle="Lista degli utenti registrati" />

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
            ) : (
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-colors">
                    <table className="w-full text-left text-sm text-[var(--foreground)] opacity-70">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-[var(--card-border)] text-[var(--foreground)] opacity-40 uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Nickname</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--card-border)]">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-[10px] text-[var(--foreground)] opacity-30">{user.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 text-[var(--foreground)] opacity-80 font-bold">{user.nickname || <span className="opacity-30 italic font-normal">Nessun nickname</span>}</td>
                                    <td className="px-6 py-4 text-[var(--foreground)] opacity-50">{user.email || <span className="opacity-30 italic">-</span>}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user.role === 'admin'
                                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/30'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--foreground)] opacity-30">
                                        Nessun utente trovato
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
