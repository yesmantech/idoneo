import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '@/components/admin/AdminPageHeader'; // Reusing header for consistency

export default function ProfileSettingsPage() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Form States
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize state from context
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }
        if (profile) {
            setNickname(profile.nickname || '');
            setAvatarUrl(profile.avatar_url);
        }
    }, [user, profile, loading, navigate]);

    // Handle File Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setSaving(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            setMsg({ type: 'success', text: 'Immagine caricata. Ricordati di salvare!' });
        } catch (error: any) {
            console.error('Upload Error:', error);
            setMsg({ type: 'error', text: 'Errore durante il caricamento immagine.' });
        } finally {
            setSaving(false);
        }
    };

    // Handle Save Profile
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    email: user?.email,
                    nickname: nickname,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            await refreshProfile();
            setMsg({ type: 'success', text: 'Profilo aggiornato con successo!' });
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: `Errore: ${err.message || 'Salvataggio fallito'}` });
        } finally {
            setSaving(false);
        }
    };

    // Deletion (Placeholder)
    const handleDeleteAccount = () => {
        if (confirm("Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.")) {
            alert('Funzionalità in arrivo.');
        }
    };


    if (loading) return <div className="p-8 text-center animate-pulse">Caricamento impostazioni...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <h1 className="text-lg font-bold">Impostazioni Profilo</h1>
            </div>

            <div className="max-w-md mx-auto p-6">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-lg relative">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">👤</div>
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Modifica</span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-2 rounded-full border-2 border-white shadow-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <p className="text-sm text-slate-400 mt-2">Tocca per cambiare foto</p>
                </div>

                {msg && (
                    <div className={`mb-6 p-3 rounded-lg text-sm text-center font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-slate-400 font-bold text-lg"
                            placeholder="Come vuoi chiamarti?"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                        <p className="text-xs text-slate-400 mt-1 pl-1">Questo nome sarà visibile nelle classifiche.</p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg uppercase tracking-wide"
                        >
                            {saving ? (
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                            ) : null}
                            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                </form>

                <div className="mt-12 pt-6 border-t border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Zona Pericolo</h3>
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full py-3 border-2 border-rose-100 text-rose-500 font-bold rounded-xl hover:bg-rose-50 transition-colors"
                    >
                        Elimina Account
                    </button>
                </div>

            </div>
        </div>
    );
}
