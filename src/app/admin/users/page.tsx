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
                .from('profiles')
                .select('*');

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
                <div className="bg-white border border-slate-200/50 rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Nickname</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{user.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 text-slate-900 font-semibold">{user.nickname || <span className="text-slate-300 italic">Nessun nickname</span>}</td>
                                    <td className="px-6 py-4 text-slate-600">{user.email || <span className="text-slate-300 italic">-</span>}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${user.role === 'admin'
                                            ? 'bg-purple-50 text-purple-600 border-purple-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
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
