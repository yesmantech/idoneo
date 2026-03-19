import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingProvider';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { deleteUserAccount } from '@/lib/accountService';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';
import {
    ChevronRight, Pencil, Check, AlertTriangle, Loader2,
    Sun, Moon, Monitor, LogOut, Mail, FileText, Shield,
    User, Palette, ExternalLink, X, Instagram, AtSign, Share2, UserPlus, PlayCircle,
    Vibrate, Volume2, Settings
} from 'lucide-react';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import ThemeSelectorModal from '@/components/profile/ThemeSelectorModal';
import ProfileImageBottomSheet from '@/components/profile/ProfileImageBottomSheet';
import EmojiPickerSheet from '@/components/profile/EmojiPickerSheet';
import IconPickerSheet from '@/components/profile/IconPickerSheet';
import { hapticLight, getHapticsEnabled, setHapticsEnabled } from '@/lib/haptics';
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
    const [themeLabel, setThemeLabel] = useState<string>('Auto'); // Added themeLabel state
    const [showImageSheet, setShowImageSheet] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);

    // Preference toggles
    const [hapticsOn, setHapticsOn] = useState(() => getHapticsEnabled());
    const [soundsOn, setSoundsOn] = useState(() => {
        try { const v = localStorage.getItem('idoneo_sounds_enabled'); return v === null ? true : v === 'true'; } catch { return true; }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
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
        // Initialize themeLabel based on currentTheme
        const initialThemeLabel = currentTheme === 'light' ? 'Chiaro' : currentTheme === 'dark' ? 'Scuro' : 'Automatico';
        setThemeLabel(initialThemeLabel);
    }, [user, profile, loading, navigate, currentTheme]); // Added currentTheme to dependencies

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

        // SEC-025 FIX: Validate MIME type and file size
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
        if (!ALLOWED_TYPES.includes(file.type)) {
            showToast('error', 'Formato non supportato. Usa JPG, PNG, WebP o GIF.');
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            showToast('error', 'Immagine troppo grande. Massimo 5MB.');
            return;
        }

        try {
            setSaving(true);
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            // Use user's own ID as folder prefix to enforce ownership at path level
            const fileName = `${user?.id}/${user?.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { contentType: file.type });
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
        // Update themeLabel state
        const newThemeLabel = t === 'light' ? 'Chiaro' : t === 'dark' ? 'Scuro' : 'Automatico';
        setThemeLabel(newThemeLabel);
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 2500);
    };

    // Theme display name (now derived from selectedTheme for the icon)
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
                    <BackButton onClick={() => navigate('/profile')} />
                    <h1 className="text-[17px] font-bold text-[var(--foreground)]">Impostazioni</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 pt-4">

                {/* ─── Floating Toast (AI Coach style via portal) ─── */}
                {createPortal(
                    <AnimatePresence>
                        {msg && (
                            <motion.div
                                initial={{ opacity: 0, y: -40, x: '-50%' }}
                                animate={{ opacity: 1, y: 0, x: '-50%' }}
                                exit={{ opacity: 0, y: -20, x: '-50%', transition: { duration: 0.2, ease: 'easeIn' } }}
                                transition={{ duration: 0.3, ease: [0.18, 0.89, 0.32, 1.28] }}
                                className="fixed left-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-[#3A3A3C] shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-full whitespace-nowrap"
                                style={{ top: 'calc(var(--safe-area-top, 0px) + 20px)' }}
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                    {msg.type === 'success'
                                        ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        : <AlertTriangle className="w-3 h-3 text-white" strokeWidth={3} />
                                    }
                                </div>
                                <span className="text-[14px] font-medium text-black dark:text-white">{msg.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
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
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden mb-6">
                    {/* Avatar Row */}
                    <button
                        onClick={() => setShowImageSheet(true)}
                        className="w-full flex items-center gap-4 px-5 py-5 active:bg-white/5 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <UserAvatar src={avatarUrl} name={nickname || 'U'} size="md" />
                        </div>
                        <span className="flex-1 text-left text-[16px] font-semibold text-[var(--foreground)]">Foto profilo</span>
                        {saving ? (
                            <Loader2 className="w-5 h-5 text-[#00B1FF] animate-spin" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-[var(--foreground)] opacity-25" />
                        )}
                    </button>

                    <Divider />

                    {/* Nickname Row */}
                    {editingNickname ? (
                        <div className="flex items-center gap-3 px-5 py-4">
                            <User className="w-6 h-6 text-[var(--foreground)] opacity-40 flex-shrink-0" strokeWidth={2.5} />
                            <input
                                ref={nicknameInputRef}
                                type="text"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setEditingNickname(false); }}
                                className="flex-1 bg-transparent outline-none text-[16px] font-semibold text-[var(--foreground)] border-b-2 border-[#00B1FF] py-1"
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
                            icon={<User className="w-6 h-6" strokeWidth={2.5} />}
                            label="Nickname"
                            value={nickname || 'Non impostato'}
                            onClick={() => setEditingNickname(true)}
                        />
                    )}

                    <Divider />

                    {/* Email Row (read-only, no chevron) */}
                    <div className="w-full flex items-center gap-4 px-5 py-5">
                        <span className="text-[var(--foreground)] opacity-40 flex-shrink-0"><AtSign className="w-6 h-6" strokeWidth={2.5} /></span>
                        <span className="text-[16px] font-semibold text-[var(--foreground)]">Email</span>
                        <span className="flex-1 text-right text-[15px] text-[var(--foreground)] opacity-40 font-normal truncate">{user?.email || ''}</span>
                    </div>

                    <Divider />

                    {/* Invite Friend Row */}
                    <div className="w-full flex items-center gap-4 px-5 py-5">
                        <span className="text-[var(--foreground)] opacity-40 flex-shrink-0"><UserPlus className="w-6 h-6" strokeWidth={2.5} /></span>
                        <span className="flex-1 text-left text-[16px] font-semibold text-[var(--foreground)]">Invita un Amico</span>
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
                            className="px-5 py-2 rounded-full bg-[#00B1FF]/20 text-[#00B1FF] text-[14px] font-bold active:scale-95 transition-transform"
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
                <input
                    type="file"
                    ref={cameraInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                />

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
                    onRestoreDefault={async () => {
                        setShowImageSheet(false);
                        try {
                            await supabase.from('profiles').upsert({
                                id: user?.id,
                                avatar_url: null,
                                updated_at: new Date().toISOString()
                            });
                            setAvatarUrl(null);
                            await refreshProfile();
                            showToast('success', 'Avatar predefinito ripristinato!');
                        } catch {
                            showToast('error', 'Errore durante il ripristino.');
                        }
                    }}
                />

                <EmojiPickerSheet
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    initialEmoji={avatarUrl?.startsWith('emoji:') ? avatarUrl.split(':')[1] : '😀'}
                    initialColor={avatarUrl?.startsWith('emoji:') ? avatarUrl.split(':').slice(2).join(':') : '#007AFF'}
                    onSave={async (emoji, bgColor) => {
                        const emojiAvatarUrl = `emoji:${emoji}:${bgColor}`;
                        try {
                            setSaving(true);
                            await supabase.from('profiles').upsert({
                                id: user?.id,
                                avatar_url: emojiAvatarUrl,
                                updated_at: new Date().toISOString()
                            });
                            setAvatarUrl(emojiAvatarUrl);
                            await refreshProfile();
                            showToast('success', 'Avatar emoji salvato!');
                        } catch {
                            showToast('error', 'Errore salvataggio emoji.');
                        } finally {
                            setSaving(false);
                        }
                    }}
                />

                <IconPickerSheet
                    isOpen={showIconPicker}
                    onClose={() => setShowIconPicker(false)}
                    initialIcon={avatarUrl?.startsWith('icon:') ? avatarUrl.split(':')[1] : 'Star'}
                    initialColor={avatarUrl?.startsWith('icon:') ? avatarUrl.split(':').slice(2).join(':') : '#FF9500'}
                    onSave={async (iconName, bgColor) => {
                        const iconAvatarUrl = `icon:${iconName}:${bgColor}`;
                        try {
                            setSaving(true);
                            await supabase.from('profiles').upsert({
                                id: user?.id,
                                avatar_url: iconAvatarUrl,
                                updated_at: new Date().toISOString()
                            });
                            setAvatarUrl(iconAvatarUrl);
                            await refreshProfile();
                            showToast('success', 'Avatar icona salvato!');
                        } catch {
                            showToast('error', 'Errore salvataggio icona.');
                        } finally {
                            setSaving(false);
                        }
                    }}
                />

                {/* ─── GENERALE ─── */}
                <SectionLabel>Generale</SectionLabel>
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden mb-6">
                    {/* Theme Row */}
                    <SettingsRow
                        icon={<ThemeIcon className="w-6 h-6" strokeWidth={2.5} />}
                        label="Tema"
                        value={themeLabel}
                        onClick={() => setShowThemeSelector(true)}
                    />
                    <Divider />
                    {/* Haptics Toggle */}
                    <ToggleRow
                        icon={<Vibrate className="w-6 h-6" strokeWidth={2.5} />}
                        label="Vibrazioni"
                        enabled={hapticsOn}
                        onToggle={(v) => { setHapticsOn(v); setHapticsEnabled(v); if (v) hapticLight(); }}
                    />
                    <Divider />
                    {/* Sound Toggle */}
                    <ToggleRow
                        icon={<Volume2 className="w-6 h-6" strokeWidth={2.5} />}
                        label="Suoni"
                        enabled={soundsOn}
                        onToggle={(v) => { setSoundsOn(v); try { localStorage.setItem('idoneo_sounds_enabled', String(v)); } catch {} }}
                    />
                    <Divider />
                    {/* Change Preferences Row */}
                    <SettingsRow
                        icon={<Settings className="w-6 h-6" strokeWidth={2.5} />}
                        label="Modifica Preferenze"
                        onClick={() => navigate('/onboarding')}
                    />
                </div>

                {/* ─── CONTATTO E AIUTO ─── */}
                <SectionLabel>Contatto e aiuto</SectionLabel>
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden mb-6">
                    <SettingsRow
                        icon={<Mail className="w-6 h-6" strokeWidth={2.5} />}
                        label="Contattaci via Email"
                        external
                        onClick={() => window.open('mailto:supporto@idoneo.ai', '_blank')}
                    />
                    <Divider />
                    <SettingsRow
                        icon={<FileText className="w-6 h-6" strokeWidth={2.5} />}
                        label="Termini e Condizioni"
                        onClick={() => navigate('/terms')}
                    />
                    <Divider />
                    <SettingsRow
                        icon={<Shield className="w-6 h-6" strokeWidth={2.5} />}
                        label="Privacy Policy"
                        onClick={() => navigate('/privacy')}
                    />
                </div>

                {/* ─── SIGN OUT ─── */}
                <div className="bg-[var(--card)] rounded-2xl overflow-hidden mb-6">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            // SEC-030: Purge SW caches to prevent stale data on shared devices
                            if ('caches' in window) {
                                try {
                                    const names = await caches.keys();
                                    await Promise.all(names.filter(n => n.includes('supabase') || n.includes('api')).map(n => caches.delete(n)));
                                } catch (e) { /* best-effort */ }
                            }
                            navigate('/', { replace: true });
                        }}
                        className="w-full flex items-center gap-4 px-5 py-5 active:bg-white/5 transition-colors"
                    >
                        <LogOut className="w-6 h-6 text-[var(--foreground)] opacity-40" strokeWidth={2.5} />
                        <span className="text-[16px] font-semibold text-[var(--foreground)]">Sign Out</span>
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
                    <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center">
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

            {/* Theme Selector Modal */}
            <ThemeSelectorModal
                isOpen={showThemeSelector}
                onClose={() => setShowThemeSelector(false)}
                currentTheme={selectedTheme as 'light' | 'dark' | 'system'}
                onSelectTheme={selectTheme}
            />
        </div>
    );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[12px] font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest px-1 mb-2 mt-4">
            {children}
        </p>
    );
}

function Divider() {
    return <div className="h-px bg-[var(--foreground)] opacity-[0.06]" />;
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
            className="w-full flex items-center gap-4 px-5 py-5 active:bg-white/5 transition-colors"
        >
            <span className="text-[var(--foreground)] opacity-40 flex-shrink-0">{icon}</span>
            <span className="flex-1 text-left text-[16px] font-semibold text-[var(--foreground)]">{label}</span>
            {value && (
                <span className="text-[15px] text-[var(--foreground)] opacity-40 font-normal">{value}</span>
            )}
            {external ? (
                <ExternalLink className="w-5 h-5 text-[var(--foreground)] opacity-25 flex-shrink-0" />
            ) : (
                <ChevronRight className="w-5 h-5 text-[var(--foreground)] opacity-25 flex-shrink-0" />
            )}
        </button>
    );
}

function ToggleRow({ icon, label, enabled, onToggle }: {
    icon: React.ReactNode;
    label: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
}) {
    return (
        <div className="w-full flex items-center gap-4 px-5 py-5">
            <span className="text-[var(--foreground)] opacity-40 flex-shrink-0">{icon}</span>
            <span className="flex-1 text-left text-[16px] font-semibold text-[var(--foreground)]">{label}</span>
            <button
                onClick={() => onToggle(!enabled)}
                style={{
                    width: 52, height: 32, borderRadius: 16, padding: 2,
                    background: enabled ? '#34C759' : 'rgba(120,120,128,0.2)',
                    transition: 'background .25s ease',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', display: 'flex', alignItems: 'center',
                }}
            >
                <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    transform: enabled ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform .25s ease',
                }} />
            </button>
        </div>
    );
}
