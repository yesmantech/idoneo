/**
 * @file ProfileSetupPage.tsx
 * @description Profile setup (nickname + avatar) — Tier S branded.
 * Matches login page floating icons, brand gradient accents, and shared Button CTA.
 *
 * Redirects to /onboarding after successful setup.
 */

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Plus, User, Loader2, Star, Cloud, Zap, Heart, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

// Decorative icons — same pattern as Login/Onboarding Welcome
const decorativeIcons = [
    { Icon: Star, color: 'text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20', top: '10%', left: '8%', size: 'w-12 h-12', delay: '0s' },
    { Icon: Cloud, color: 'text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/20', top: '8%', right: '10%', size: 'w-14 h-14', delay: '0.4s' },
    { Icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20', bottom: '18%', left: '6%', size: 'w-11 h-11', delay: '0.8s' },
    { Icon: Heart, color: 'text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/20', bottom: '14%', right: '8%', size: 'w-12 h-12', delay: '1.2s' },
    { Icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/20', top: '45%', left: '4%', size: 'w-10 h-10', delay: '1.6s' },
    { Icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20', top: '40%', right: '5%', size: 'w-13 h-13', delay: '2s' },
];

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
            hapticLight();

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Devi selezionare un\'immagine da caricare.');
            }

            const file = event.target.files[0];

            // V4 SEC-1: Validate file size (max 2MB) and type
            const MAX_FILE_SIZE = 2 * 1024 * 1024;
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

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            hapticSuccess();

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
        if (!currentUser) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user) currentUser = sessionData.session.user;
            if (!currentUser) {
                const { data: userData } = await supabase.auth.getUser();
                currentUser = userData.user;
            }
            if (!currentUser) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: retryData } = await supabase.auth.getSession();
                if (retryData?.session?.user) currentUser = retryData.session.user;
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
            hapticLight();

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

            if (result?.error) {
                if (result.code === 'NICKNAME_TAKEN') {
                    setError('Questo nickname è già in uso. Scegline un altro!');
                } else if (result.code === 'ALREADY_SETUP') {
                    await refreshProfile();
                    navigate('/onboarding');
                    return;
                } else {
                    setError(result.error);
                }
                setSaving(false);
                return;
            }

            if (storedRefCode) localStorage.removeItem('referral_code');

            await refreshProfile();
            hapticSuccess();
            navigate('/onboarding');
        } catch (err: any) {
            setError(err?.message || 'Errore durante il salvataggio del profilo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col justify-center overflow-hidden relative transition-colors duration-500">

            {/* Floating Decorative Icons — matching login page */}
            <div className="absolute inset-0 pointer-events-none">
                {decorativeIcons.map((item, idx) => (
                    <div
                        key={idx}
                        className={`absolute rounded-full flex items-center justify-center ${item.bg} ${item.size} animate-in fade-in zoom-in duration-1000 opacity-60 dark:opacity-40`}
                        style={{
                            top: item.top,
                            left: item.left,
                            right: item.right,
                            bottom: item.bottom,
                            animationDelay: item.delay,
                            animationFillMode: 'both',
                        }}
                    >
                        <item.Icon className={`w-1/2 h-1/2 ${item.color}`} strokeWidth={2.5} />
                    </div>
                ))}
            </div>

            {/* Content Container */}
            <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300 relative z-10">

                {/* Header — matching login h1/h2 styling */}
                <div className="space-y-3 text-center w-full">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                        Completa il profilo
                    </h1>
                    <h2 className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-50 leading-relaxed max-w-xs mx-auto">
                        Scegli una foto e un nickname per iniziare
                    </h2>
                </div>

                {/* Avatar — Tier S glassmorphic ring with gradient accent */}
                <div className="relative group cursor-pointer shrink-0">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-[#00B1FF]/20 to-[#0066FF]/20 blur-md group-hover:from-[#00B1FF]/30 group-hover:to-[#0066FF]/30 transition-all duration-300" />

                    {/* Avatar circle */}
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center overflow-hidden bg-white dark:bg-white/[0.04] border-[3px] border-white/80 dark:border-white/[0.1] shadow-xl shadow-black/5 transition-all duration-300 group-hover:scale-[1.03] group-active:scale-[0.97]">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 md:w-14 md:h-14 text-[#00B1FF] opacity-60" strokeWidth={1.5} />
                        )}

                        {/* Upload overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-full">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Plus Button — brand gradient */}
                    <label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-[#00B1FF] to-[#0066FF] text-white p-2.5 rounded-full shadow-lg shadow-[#00B1FF]/30 cursor-pointer hover:shadow-xl hover:shadow-[#00B1FF]/40 transition-all duration-200 active:scale-[0.9] border-[3px] border-[var(--background)]"
                    >
                        <Plus className="w-5 h-5" strokeWidth={3} />
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
                <form onSubmit={handleSubmit} className="w-full space-y-5">
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[var(--foreground)] opacity-60 uppercase tracking-wide ml-1">
                            Nickname
                        </label>
                        <input
                            type="text"
                            placeholder="Come vuoi essere chiamato?"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                            className="w-full h-14 px-5 rounded-2xl bg-white dark:bg-[#111] text-lg font-medium text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 dark:focus:bg-slate-700 transition-all shadow-soft border border-slate-100 dark:border-slate-700"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold text-center animate-in fade-in slide-in-from-top-2 border border-red-100 dark:border-red-800/30">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        isLoading={saving}
                        disabled={saving || uploading || !nickname.trim()}
                    >
                        Continua
                    </Button>

                    <p className="text-[11px] text-[var(--foreground)] opacity-35 font-medium text-center">
                        Potrai modificare queste informazioni in seguito
                    </p>
                </form>
            </div>
        </div>
    );
}
