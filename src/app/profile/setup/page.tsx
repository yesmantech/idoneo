/**
 * @file ProfileSetupPage.tsx
 * @description Profile setup (nickname + avatar) — Tier S branded.
 * Matches login page floating icons, brand gradient accents, and shared Button CTA.
 * Uses the same image/emoji/icon picker from profile settings.
 *
 * Redirects to /onboarding after successful setup.
 */

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Loader2, Star, Cloud, Zap, Heart, Shield, Sparkles, User } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import ProfileImageBottomSheet from '@/components/profile/ProfileImageBottomSheet';
import EmojiPickerSheet from '@/components/profile/EmojiPickerSheet';
import IconPickerSheet from '@/components/profile/IconPickerSheet';

// Default mascot avatars
const DEFAULT_MASCOTS = [
    '/avatars/default/mascot-blue.png',
    '/avatars/default/mascot-coral.png',
    '/avatars/default/mascot-green.png',
    '/avatars/default/mascot-orange.png',
    '/avatars/default/mascot-pink.png',
    '/avatars/default/mascot-purple.png',
    '/avatars/default/mascot-teal.png',
    '/avatars/default/mascot-yellow.png',
];

// Pick a random default mascot
const getRandomMascot = () => DEFAULT_MASCOTS[Math.floor(Math.random() * DEFAULT_MASCOTS.length)];

// Decorative icons — static (no animations to avoid iOS lag)
const decorativeIcons = [
    { Icon: Star, color: 'text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20', top: '10%', left: '8%', size: 'w-12 h-12' },
    { Icon: Cloud, color: 'text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/20', top: '8%', right: '10%', size: 'w-14 h-14' },
    { Icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20', bottom: '18%', left: '6%', size: 'w-11 h-11' },
    { Icon: Heart, color: 'text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/20', bottom: '14%', right: '8%', size: 'w-12 h-12' },
];


export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();

    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setTimeout(() => setShow(true), 60)); }, []);

    // Guard: redirect returning users who already completed setup
    useEffect(() => {
        if (profile?.nickname && profile?.onboarding_completed_at) {
            navigate('/', { replace: true });
        }
    }, [profile, navigate]);

    // Image picker states (same as settings)
    const [showImageSheet, setShowImageSheet] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Load existing data or set default mascot
    useEffect(() => {
        if (profile) {
            if (profile.nickname) setNickname(profile.nickname);
            if (profile.avatar_url) {
                setAvatarUrl(profile.avatar_url);
            } else {
                // Set random default mascot for new users
                setAvatarUrl('emoji:🦦:#007AFF');
            }
        } else {
            // No profile yet, preload a mascot
            setAvatarUrl('emoji:🦦:#007AFF');
        }
    }, [profile]);

    // Handle file upload (from Choose Image or Take Photo)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // SEC-025 FIX: Validate MIME type and file size
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Formato non supportato. Usa JPEG, PNG, WebP o GIF.');
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setError('L\'immagine è troppo grande. Massimo 5MB.');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            hapticLight();

            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { contentType: file.type });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
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

            if (rpcError) { console.error("Profile setup RPC error:", rpcError); throw rpcError; }

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

            {/* Floating Decorative Icons — static, no animations */}
            <div className="absolute inset-0 pointer-events-none">
                {decorativeIcons.map((item, idx) => (
                    <div
                        key={idx}
                        className={`absolute rounded-full flex items-center justify-center ${item.bg} ${item.size} opacity-50 dark:opacity-30`}
                        style={{ top: item.top, left: item.left, right: (item as any).right, bottom: (item as any).bottom }}
                    >
                        <item.Icon className={`w-1/2 h-1/2 ${item.color}`} strokeWidth={2.5} />
                    </div>
                ))}
            </div>

            {/* Content Container */}
            <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col items-center justify-center space-y-8 relative z-10">

                {/* Header */}
                <div className="space-y-3 text-center w-full" style={{
                    opacity: show ? 1 : 0,
                    transform: show ? 'translateY(0)' : 'translateY(-16px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                        Completa il profilo
                    </h1>
                    <h2 className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-50 leading-relaxed max-w-xs mx-auto">
                        Scegli una foto e un nickname per iniziare
                    </h2>
                </div>

                {/* Avatar */}
                <div className="relative group cursor-pointer shrink-0" onClick={() => { hapticLight(); setShowImageSheet(true); }} style={{
                    opacity: show ? 1 : 0,
                    transform: show ? 'scale(1)' : 'scale(0.85)',
                    transition: 'opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
                }}>
                    {/* Outer glow ring */}
                    <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-[#00B1FF]/20 to-[#0066FF]/20 group-hover:from-[#00B1FF]/30 group-hover:to-[#0066FF]/30 transition-all duration-300" />

                    {/* Avatar circle — renders emoji/icon/image/mascot at full size */}
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center overflow-hidden bg-white dark:bg-white/[0.04] border-[3px] border-white/80 dark:border-white/[0.1] shadow-xl shadow-black/5 transition-all duration-300 group-hover:scale-[1.03] group-active:scale-[0.97]">
                        {(() => {
                            if (avatarUrl?.startsWith('emoji:')) {
                                const parts = avatarUrl.split(':');
                                const emoji = parts[1] || '😀';
                                const bgColor = parts.slice(2).join(':') || '#007AFF';
                                return (
                                    <div className="w-full h-full flex items-center justify-center rounded-full" style={{ backgroundColor: bgColor }}>
                                        <span className="text-5xl" style={{ lineHeight: 1 }}>{emoji}</span>
                                    </div>
                                );
                            }
                            if (avatarUrl?.startsWith('icon:')) {
                                const parts = avatarUrl.split(':');
                                const iconName = parts[1] || 'Star';
                                const bgColor = parts.slice(2).join(':') || '#FF9500';
                                const IconComp = (LucideIcons as Record<string, any>)[iconName] as React.ComponentType<any> | undefined;
                                return (
                                    <div className="w-full h-full flex items-center justify-center rounded-full" style={{ backgroundColor: bgColor }}>
                                        {IconComp ? <IconComp className="w-14 h-14 text-white" style={{ fill: 'white', strokeWidth: 0 }} /> : <User className="w-14 h-14 text-white" />}
                                    </div>
                                );
                            }
                            if (avatarUrl) {
                                return <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />;
                            }
                            return (
                                <div className="w-full h-full bg-gradient-to-br from-[#00B1FF]/10 to-[#0066FF]/10 flex items-center justify-center">
                                    <User className="w-12 h-12 text-[#00B1FF] opacity-60" strokeWidth={1.5} />
                                </div>
                            );
                        })()}

                        {/* Upload overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-full">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Edit Button — brand gradient */}
                    <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-[#00B1FF] to-[#0066FF] text-white p-2.5 rounded-full shadow-lg shadow-[#00B1FF]/30 transition-all duration-200 active:scale-[0.9] border-[3px] border-[var(--background)]">
                        <Pencil className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-5" style={{
                    opacity: show ? 1 : 0,
                    transform: show ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
                }}>
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

            {/* Hidden file inputs for image upload */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="user" onChange={handleFileChange} />

            {/* Profile Image Bottom Sheet — same as settings */}
            <ProfileImageBottomSheet
                isOpen={showImageSheet}
                onClose={() => setShowImageSheet(false)}
                onTakePhoto={() => {
                    setShowImageSheet(false);
                    setTimeout(() => cameraInputRef.current?.click(), 300);
                }}
                onChooseImage={() => {
                    setShowImageSheet(false);
                    setTimeout(() => fileInputRef.current?.click(), 300);
                }}
                onUseEmoji={() => {
                    setShowImageSheet(false);
                    setTimeout(() => setShowEmojiPicker(true), 300);
                }}
                onUseIcon={() => {
                    setShowImageSheet(false);
                    setTimeout(() => setShowIconPicker(true), 300);
                }}
                onRestoreDefault={() => {
                    setShowImageSheet(false);
                    setAvatarUrl('emoji:🦦:#007AFF');
                    hapticLight();
                }}
            />

            {/* Emoji Picker — saves to local state, not DB (DB save happens on Continua) */}
            <EmojiPickerSheet
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                initialEmoji={avatarUrl?.startsWith('emoji:') ? avatarUrl.split(':')[1] : '🦦'}
                initialColor={avatarUrl?.startsWith('emoji:') ? avatarUrl.split(':').slice(2).join(':') : '#007AFF'}
                onSave={(emoji, bgColor) => {
                    setAvatarUrl(`emoji:${emoji}:${bgColor}`);
                    setShowEmojiPicker(false);
                    hapticSuccess();
                }}
            />

            {/* Icon Picker — saves to local state */}
            <IconPickerSheet
                isOpen={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                initialIcon={avatarUrl?.startsWith('icon:') ? avatarUrl.split(':')[1] : 'Star'}
                initialColor={avatarUrl?.startsWith('icon:') ? avatarUrl.split(':').slice(2).join(':') : '#FF9500'}
                onSave={(iconName, bgColor) => {
                    setAvatarUrl(`icon:${iconName}:${bgColor}`);
                    setShowIconPicker(false);
                    hapticSuccess();
                }}
            />
        </div>
    );
}
