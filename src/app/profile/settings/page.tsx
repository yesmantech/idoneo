import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingProvider';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { deleteUserAccount } from '@/lib/accountService';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ChevronRight, Pencil, Check, AlertTriangle, Loader2,
    Sun, Moon, Monitor, LogOut, Mail, FileText, Shield,
    User, Palette, ExternalLink, X, Instagram, AtSign, Share2, UserPlus
} from 'lucide-react';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { hapticLight } from '@/lib/haptics';
import { UserAvatar } from '@/components/ui/UserAvatar';

// =============================================================================
// SETTINGS PAGE — Praktika Style
// =============================================================================

export default function ProfileSettingsPage() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const { theme: currentTheme, setTheme, persistTheme } = useTheme();
    const navigate = useNavigate();
    const { resetOnboarding } = useOnboarding();

    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState(currentTheme);
    const [hasSaved, setHasSaved] = useState(false);

    // Form States
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Inline edit states
    const [editingNickname, setEditingNickname] = useState(false);
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const nicknameInputRef = useRef<HTMLInputElement>(null);

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

    // Cleanup: Reset to actual persisted theme if user leaves without saving
    useEffect(() => {
        return () => {
            if (!hasSaved) {
                const persistedTheme = (localStorage.getItem('theme') as any) || 'light';
                setTheme(persistedTheme);
            }
        };
    }, [hasSaved, setTheme]);

    // Focus nickname input when editing
    useEffect(() => {
        if (editingNickname && nicknameInputRef.current) {
            nicknameInputRef.current.focus();
            nicknameInputRef.current.select();
        }
    }, [editingNickname]);

    // Handle File Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setSaving(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const newUrl = data.publicUrl;
            setAvatarUrl(newUrl);

            // Auto-save avatar
            await supabase.from('profiles').upsert({
                id: user?.id,
                avatar_url: newUrl,
                updated_at: new Date().toISOString()
            });
            await refreshProfile();
            showToast('success', 'Foto aggiornata!');
        } catch (error: any) {
            console.error('Upload Error:', error);
            showToast('error', 'Errore caricamento foto.');
        } finally {
            setSaving(false);
        }
    };

    // Save nickname
    const saveNickname = async () => {
        const clean = DOMPurify.sanitize(nickname.trim());
        if (!clean || clean.length < 3) {
            showToast('error', 'Il nickname deve avere almeno 3 caratteri.');
            return;
        }
        setSaving(true);
        try {
            await supabase.from('profiles').upsert({
                id: user?.id,
                email: user?.email,
                nickname: clean,
                updated_at: new Date().toISOString()
            });
            await refreshProfile();
            setEditingNickname(false);
            showToast('success', 'Nickname salvato!');
        } catch (err: any) {
            showToast('error', err.message || 'Errore salvataggio');
        } finally {
            setSaving(false);
        }
    };

    // Save theme
    const selectTheme = (t: 'light' | 'dark' | 'system') => {
        hapticLight();
        setSelectedTheme(t);
        setTheme(t);
        persistTheme(t);
        setHasSaved(true);
        setShowThemeSelector(false);
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 2500);
    };

    // Theme display name
    const themeLabel = selectedTheme === 'light' ? 'Chiaro' : selectedTheme === 'dark' ? 'Scuro' : 'Automatico';
    const ThemeIcon = selectedTheme === 'light' ? Sun : selectedTheme === 'dark' ? Moon : Monitor;

    // Deletion
    const handleDeleteAccount = () => {
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        const result = await deleteUserAccount();
        if (result.success) {
            navigate('/', { replace: true });
        } else {
            setDeleteError(result.error || 'Errore durante l\'eliminazione');
            setIsDeleting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--background)] pb-28 transition-colors duration-300">

            {/* ─── Header ─── */}
            <header className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-md pt-safe">
                <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                    <h1 className="text-[17px] font-bold text-[var(--foreground)]">Impostazioni</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 pt-4">

                {/* ─── Toast ─── */}
                {msg && (
                    <div className={`mb-4 p-3 rounded-2xl text-[13px] text-center font-semibold flex items-center justify-center gap-2 animate-in fade-in duration-200 ${msg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                        {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {msg.text}
                    </div>
                )}

                {/* ─── Instagram Banner ─── */}
                <button
                    onClick={() => window.open('https://instagram.com/idoneo.app', '_blank')}
                    className="w-full mb-6 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
                >
                    <div className="relative bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#E1306C] p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                            <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-[15px] font-bold text-white">Seguici su Instagram</h3>
                            <p className="text-[12px] text-white/70">News, consigli e aggiornamenti</p>
                        </div>
                        <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[13px] font-bold flex-shrink-0">
                            Seguici
                        </span>
                    </div>
                </button>

                {/* ─── PROFILO ─── */}
                <SectionLabel>Profilo</SectionLabel>
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden mb-6">
                    {/* Avatar Row */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[var(--card-border)]">
                            <UserAvatar src={avatarUrl} name={nickname || 'U'} size="md" />
                        </div>
                        <div className="flex-1 text-left">
                            <span className="text-[15px] font-semibold text-[var(--foreground)]">Foto profilo</span>
                            <p className="text-[12px] text-[var(--foreground)] opacity-40">Tocca per cambiare</p>
                        </div>
                        {saving ? (
                            <Loader2 className="w-4 h-4 text-[#00B1FF] animate-spin" />
                        ) : (
                            <Pencil className="w-4 h-4 text-[var(--foreground)] opacity-30" />
                        )}
                    </button>

                    <Divider />

                    {/* Nickname Row */}
                    {editingNickname ? (
                        <div className="flex items-center gap-3 px-4 py-3.5">
                            <User className="w-5 h-5 text-[var(--foreground)] opacity-40 flex-shrink-0" />
                            <input
                                ref={nicknameInputRef}
                                type="text"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setEditingNickname(false); }}
                                className="flex-1 bg-transparent outline-none text-[15px] font-semibold text-[var(--foreground)] border-b-2 border-[#00B1FF] py-1"
                                placeholder="Nickname"
                                minLength={3}
                                maxLength={20}
                            />
                            <button onClick={saveNickname} className="p-1.5 rounded-full bg-[#00B1FF] text-white">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setEditingNickname(false); setNickname(profile?.nickname || ''); }} className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[var(--foreground)]">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <SettingsRow
                            icon={<User className="w-5 h-5" />}
                            label="Nickname"
                            value={nickname || 'Non impostato'}
                            onClick={() => setEditingNickname(true)}
                        />
                    )}

                    <Divider />

                    {/* Email Row (read-only) */}
                    <div className="w-full flex items-center gap-4 px-4 py-4">
                        <span className="text-[var(--foreground)] opacity-40 flex-shrink-0"><AtSign className="w-5 h-5" /></span>
                        <span className="flex-1 text-left text-[15px] font-semibold text-[var(--foreground)]">Email</span>
                        <span className="text-[14px] text-[var(--foreground)] opacity-40 font-medium truncate max-w-[160px]">{user?.email || ''}</span>
                    </div>

                    <Divider />

                    {/* Invite Friend Row */}
                    <div className="w-full flex items-center gap-4 px-4 py-4">
                        <span className="text-[var(--foreground)] opacity-40 flex-shrink-0"><UserPlus className="w-5 h-5" /></span>
                        <span className="flex-1 text-left text-[15px] font-semibold text-[var(--foreground)]">Invita un Amico</span>
                        <button
                            onClick={() => {
                                const shareData = {
                                    title: 'Idoneo',
                                    text: 'Preparati ai concorsi pubblici con Idoneo! Quiz, simulazioni e classifiche.',
                                    url: 'https://idoneo.ai'
                                };
                                if (navigator.share) {
                                    navigator.share(shareData);
                                } else {
                                    navigator.clipboard.writeText('https://idoneo.ai');
                                    showToast('success', 'Link copiato!');
                                }
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#7C3AED] text-white text-[13px] font-bold active:scale-95 transition-transform"
                        >
                            Invita
                        </button>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {/* ─── GENERALE ─── */}
                <SectionLabel>Generale</SectionLabel>
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden mb-6">
                    {/* Theme Row */}
                    <SettingsRow
                        icon={<ThemeIcon className="w-5 h-5" />}
                        label="Tema"
                        value={themeLabel}
                        onClick={() => setShowThemeSelector(!showThemeSelector)}
                    />

                    {/* Theme Selector (expandable) */}
                    {showThemeSelector && (
                        <div className="px-4 pb-4 pt-1 flex gap-2">
                            {([
                                { key: 'light' as const, label: 'Chiaro', Icon: Sun },
                                { key: 'dark' as const, label: 'Scuro', Icon: Moon },
                                { key: 'system' as const, label: 'Auto', Icon: Monitor },
                            ]).map(({ key, label, Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => selectTheme(key)}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all text-[12px] font-bold ${selectedTheme === key
                                        ? 'bg-[#00B1FF] text-white shadow-lg shadow-[#00B1FF]/30'
                                        : 'bg-slate-100 dark:bg-[#111] text-[var(--foreground)] opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── CONTATTO E AIUTO ─── */}
                <SectionLabel>Contatto e aiuto</SectionLabel>
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden mb-6">
                    <SettingsRow
                        icon={<Mail className="w-5 h-5" />}
                        label="Contattaci via Email"
                        external
                        onClick={() => window.open('mailto:supporto@idoneo.ai', '_blank')}
                    />
                    <Divider />
                    <SettingsRow
                        icon={<FileText className="w-5 h-5" />}
                        label="Termini e Condizioni"
                        external
                        onClick={() => window.open('https://idoneo.ai/legal/terms', '_blank')}
                    />
                    <Divider />
                    <SettingsRow
                        icon={<Shield className="w-5 h-5" />}
                        label="Privacy Policy"
                        external
                        onClick={() => window.open('https://idoneo.ai/legal/privacy', '_blank')}
                    />
                </div>

                {/* ─── SIGN OUT ─── */}
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden mb-6">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/', { replace: true });
                        }}
                        className="w-full flex items-center gap-4 px-4 py-4 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                    >
                        <LogOut className="w-5 h-5 text-[var(--foreground)] opacity-40" />
                        <span className="text-[15px] font-semibold text-[var(--foreground)]">Sign Out</span>
                    </button>
                </div>

                {/* ─── Danger Zone (subtle) ─── */}
                <p className="text-center text-[13px] text-[var(--foreground)] opacity-30 mb-10">
                    Per eliminare il tuo account e tutti i dati,{' '}
                    <button
                        onClick={handleDeleteAccount}
                        className="text-[#00B1FF] font-semibold hover:underline"
                    >
                        tocca qui
                    </button>
                </p>

                {/* ─── Footer ─── */}
                <div className="flex flex-col items-center gap-1.5 pb-8">
                    <div className="w-10 h-10 rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center">
                        <span className="text-[16px] font-black text-[var(--foreground)] opacity-30">i</span>
                    </div>
                    <span className="text-[14px] font-bold text-[var(--foreground)] opacity-20">Idoneo</span>
                    <span className="text-[11px] text-[var(--foreground)] opacity-15 font-medium">
                        Versione 1.0.0
                    </span>
                </div>

            </div>

            {/* Delete Account Modal */}
            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDeleteAccount}
                isDeleting={isDeleting}
                error={deleteError}
            />
        </div>
    );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 px-1 mb-2 mt-4">
            <span className="text-[11px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest whitespace-nowrap">
                {children}
            </span>
            <div className="flex-1 h-px bg-[var(--card-border)]" />
        </div>
    );
}

function Divider() {
    return <div className="h-px bg-[var(--card-border)] mx-4" />;
}

function SettingsRow({ icon, label, value, external, onClick }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    external?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 px-4 py-4 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
        >
            <span className="text-[var(--foreground)] opacity-40 flex-shrink-0">{icon}</span>
            <span className="flex-1 text-left text-[15px] font-semibold text-[var(--foreground)]">{label}</span>
            {value && (
                <span className="text-[14px] text-[var(--foreground)] opacity-40 font-medium truncate max-w-[140px]">{value}</span>
            )}
            {external ? (
                <ExternalLink className="w-4 h-4 text-[var(--foreground)] opacity-25 flex-shrink-0" />
            ) : (
                <ChevronRight className="w-4 h-4 text-[var(--foreground)] opacity-25 flex-shrink-0" />
            )}
        </button>
    );
}
