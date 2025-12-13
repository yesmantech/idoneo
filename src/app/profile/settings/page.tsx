import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Check, AlertTriangle, Loader2 } from 'lucide-react';

export default function ProfileSettingsPage() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Form States
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
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

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

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
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
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

    if (loading) return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-28">

            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-all hover:bg-slate-200 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="text-[17px] font-bold text-slate-900">Impostazioni Profilo</h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </header>

            <div className="max-w-md mx-auto px-5 pt-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10">
                    <div
                        className="relative cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {/* Avatar Circle */}
                        <div className="w-28 h-28 rounded-[32px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden transition-all group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-active:scale-95">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100">👤</div>
                            )}
                        </div>

                        {/* Edit Badge */}
                        <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 border-[3px] border-[#F5F5F7] transition-all group-hover:scale-110">
                            <Pencil className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <p className="text-[13px] text-slate-400 mt-4 font-medium">Tocca per cambiare foto</p>
                </div>

                {/* Message Toast */}
                {msg && (
                    <div className={`mb-6 p-4 rounded-2xl text-[14px] text-center font-semibold flex items-center justify-center gap-2 ${msg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                        {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {msg.text}
                    </div>
                )}

                {/* Nickname Input */}
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Nickname
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-0 py-2 bg-transparent border-b-2 border-slate-100 focus:border-emerald-400 outline-none transition-all text-[18px] font-bold text-slate-900 placeholder-slate-300"
                            placeholder="Come vuoi chiamarti?"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                        <p className="text-[12px] text-slate-400 mt-3">
                            Questo nome sarà visibile nelle classifiche.
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[16px] active:scale-[0.98]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Salvataggio...
                            </>
                        ) : showSuccess ? (
                            <>
                                <Check className="w-5 h-5" />
                                Salvato!
                            </>
                        ) : (
                            'Salva modifiche'
                        )}
                    </button>
                </form>

                {/* Danger Zone */}
                <div className="mt-12 pt-8 border-t border-slate-200/60">
                    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Zona pericolo
                    </h3>
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full py-3.5 bg-white border-2 border-rose-100 text-rose-500 font-bold rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-[0.98]"
                    >
                        Elimina account
                    </button>
                </div>

            </div>
        </div>
    );
}
