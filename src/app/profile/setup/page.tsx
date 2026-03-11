import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Plus, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();

    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load existing data if available
    useEffect(() => {
        if (profile) {
            if (profile.nickname) setNickname(profile.nickname);
            if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Devi selezionare un\'immagine da caricare.');
            }

            const file = event.target.files[0];

            // V4 SEC-1: Validate file size (max 2MB) and type
            const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

            if (file.size > MAX_FILE_SIZE) {
                throw new Error('L\'immagine è troppo grande. Massimo 2MB.');
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                throw new Error('Formato non supportato. Usa JPEG, PNG o WebP.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);

        } catch (error: any) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let currentUser = user;

        // If context user is missing, try fetching directly with retries
        // This handles the case where session is still being processed from URL
        if (!currentUser) {

            // First, try to get session (which processes URL tokens if present)
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user) {
                currentUser = sessionData.session.user;
            }

            // If still no user, try getUser
            if (!currentUser) {
                const { data: userData } = await supabase.auth.getUser();
                currentUser = userData.user;
            }

            // Last resort: wait a moment and retry (session might still be processing)
            if (!currentUser) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: retryData } = await supabase.auth.getSession();
                if (retryData?.session?.user) {
                    currentUser = retryData.session.user;
                }
            }
        }

        if (!currentUser) {
            setError("Non sei autenticato. Effettua il login.");
            setSaving(false);
            return;
        }


        try {
            setSaving(true);
            setError(null);

            // V10: Single atomic RPC handles nickname validation + referral + setup
            // Replaces 5 sequential API calls (all broken by V5 RLS) with 1 server call
            const storedRefCode = localStorage.getItem('referral_code');
            const cleanNickname = DOMPurify.sanitize(nickname.trim());

            const { data: result, error: rpcError } = await supabase.rpc('setup_profile', {
                p_nickname: cleanNickname,
                p_avatar_url: avatarUrl || null,
                p_referral_code: storedRefCode || null,
            });

            if (rpcError) {
                console.error("Profile setup RPC error:", rpcError);
                throw rpcError;
            }

            // Handle structured errors from the RPC
            if (result?.error) {
                if (result.code === 'NICKNAME_TAKEN') {
                    setError('Questo nickname è già in uso. Scegline un altro!');
                } else if (result.code === 'ALREADY_SETUP') {
                    // Profile already set up, just navigate home
                    await refreshProfile();
                    navigate('/onboarding');
                    return;
                } else {
                    setError(result.error);
                }
                setSaving(false);
                return;
            }

            // Cleanup referral code from localStorage
            if (storedRefCode) {
                localStorage.removeItem('referral_code');
            }

            // Refresh context to reflect changes
            await refreshProfile();

            // Success -> Home Page
            navigate('/onboarding');
        } catch (err: any) {
            // V4 FUNC-2: Show error to user, do NOT navigate away
            setError(err?.message || 'Errore durante il salvataggio del profilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col justify-center overflow-y-auto overflow-x-hidden relative supports-[min-height:100dvh]:min-h-[100dvh] transition-colors duration-500">

            {/* Content Container */}
            <div className="w-full max-w-md mx-auto px-6 py-6 flex flex-col items-center justify-center space-y-6 md:space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 relative z-10">

                {/* Header */}
                <div className="space-y-2 md:space-y-3 text-center w-full">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                        Completa il profilo
                    </h1>
                    <h2 className="text-[16px] md:text-lg font-medium text-[var(--foreground)] opacity-60 leading-relaxed max-w-xs mx-auto">
                        Scegli una foto e un nickname per iniziare
                    </h2>
                </div>

                {/* Avatar Upload */}
                <div className="relative group cursor-pointer shrink-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center overflow-hidden border-4 border-[var(--background)] shadow-lg shadow-black/5 transition-all group-hover:scale-105 group-hover:shadow-xl">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 md:w-14 md:h-14 text-[#00B1FF]" strokeWidth={2} />
                        )}

                        {/* Overlay when uploading */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Plus Button */}
                    <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-1 right-1 bg-[#00B1FF] text-white p-2 md:p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-[#0099e6] transition-colors border-2 border-[var(--background)]"
                    >
                        <Plus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-5 md:space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-[var(--foreground)] opacity-70 ml-1">Nickname</label>
                        <input
                            type="text"
                            placeholder="Inserisci il tuo nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-[#111]/50 border border-slate-100 dark:border-slate-700/50 text-[17px] md:text-lg font-medium text-[var(--foreground)] placeholder:text-[var(--foreground)] placeholder:opacity-30 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 focus:bg-[var(--card)] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center animate-in fade-in border border-red-100 dark:border-red-800/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving || uploading || !nickname.trim()}
                        className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Salvataggio...' : 'Continua'}
                    </button>

                    <p className="text-[11px] text-[var(--foreground)] opacity-40 font-medium text-center">
                        Potrai modificare queste informazioni in seguito
                    </p>
                </form>
            </div>
        </div>
    );
}
