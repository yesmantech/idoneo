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
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white w-8 h-8" /></div>
            ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900 text-slate-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Nickname</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 text-white font-medium">{user.nickname || <span className="text-slate-600 italic">Nessun nickname</span>}</td>
                                    <td className="px-6 py-4 text-slate-300">{user.email || <span className="text-slate-600 italic">-</span>}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${user.role === 'admin'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-slate-800 text-slate-300 border-slate-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
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
