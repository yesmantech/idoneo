import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingProvider';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { deleteUserAccount } from '@/lib/accountService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Check, AlertTriangle, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import { hapticLight } from '@/lib/haptics';
import { Button } from '@/components/ui/Button';

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
    const [showSuccess, setShowSuccess] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    // Cleanup: Reset to actual persisted theme if user leaves without saving
    useEffect(() => {
        return () => {
            if (!hasSaved) {
                const persistedTheme = (localStorage.getItem('theme') as any) || 'light';
                setTheme(persistedTheme);
            }
        };
    }, [hasSaved, setTheme]);

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
            // Persist theme selection
            persistTheme(selectedTheme);

            // Sanitization: Clean the nickname to prevent XSS
            const cleanNickname = DOMPurify.sanitize(nickname.trim());

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    email: user?.email,
                    nickname: cleanNickname,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            await refreshProfile();
            setHasSaved(true);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setHasSaved(false);
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: `Errore: ${err.message || 'Salvataggio fallito'}` });
        } finally {
            setSaving(false);
        }
    };

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
            // Account deleted successfully, redirect to home
            navigate('/', { replace: true });
        } else {
            // Show error and allow retry
            setDeleteError(result.error || 'Errore durante l\'eliminazione');
            setIsDeleting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--background)] pb-28 transition-colors duration-300">

            {/* Header */}
            <header className="sticky top-0 z-20 bg-[var(--background)]/80 backdrop-blur-md pt-safe">
                <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-10 h-10 p-0 rounded-full"
                        onClick={() => navigate('/profile')}
                        icon={<ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />}
                    />
                    <h1 className="text-[17px] font-bold text-[var(--foreground)]">Impostazioni Profilo</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-md mx-auto px-5 pt-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10">
                    <div
                        className="relative cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-28 h-28 rounded-[32px] bg-[var(--card)] shadow-lg overflow-hidden transition-all group-hover:shadow-xl group-active:scale-95">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 dark:bg-slate-700">👤</div>
                            )}
                        </div>

                        <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 border-[3px] border-[var(--background)] transition-all group-hover:scale-110">
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
                    <p className="text-[13px] text-[var(--foreground)] opacity-50 mt-4 font-medium">Tocca per cambiare foto</p>
                </div>

                {/* Message Toast */}
                {msg && (
                    <div className={`mb-6 p-4 rounded-2xl text-[14px] text-center font-semibold flex items-center justify-center gap-2 ${msg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                        }`}>
                        {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {msg.text}
                    </div>
                )}

                {/* Theme Selector */}
                <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm border border-[var(--card-border)] mb-6">
                    <label className="block text-[11px] font-bold text-[var(--foreground)] opacity-50 uppercase tracking-widest mb-4">
                        Tema
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={selectedTheme === 'light' ? 'primary' : 'secondary'}
                            size="sm"
                            className="flex-col h-auto py-3 gap-2"
                            onClick={() => { hapticLight(); setSelectedTheme('light'); setTheme('light'); }}
                            icon={<Sun className="w-5 h-5" />}
                        >
                            Chiaro
                        </Button>
                        <Button
                            variant={selectedTheme === 'dark' ? 'primary' : 'secondary'}
                            size="sm"
                            className="flex-col h-auto py-3 gap-2"
                            onClick={() => { hapticLight(); setSelectedTheme('dark'); setTheme('dark'); }}
                            icon={<Moon className="w-5 h-5" />}
                        >
                            Scuro
                        </Button>
                        <Button
                            variant={selectedTheme === 'system' ? 'primary' : 'secondary'}
                            size="sm"
                            className="flex-col h-auto py-3 gap-2"
                            onClick={() => { hapticLight(); setSelectedTheme('system'); setTheme('system'); }}
                            icon={<Monitor className="w-5 h-5" />}
                        >
                            Auto
                        </Button>
                    </div>
                </div>

                {/* Nickname Input */}
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm border border-[var(--card-border)]">
                        <label className="block text-[11px] font-bold text-[var(--foreground)] opacity-50 uppercase tracking-widest mb-3">
                            Nickname
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-0 py-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-600 focus:border-emerald-400 outline-none transition-all text-[18px] font-bold text-[var(--foreground)] placeholder-slate-400"
                            placeholder="Come vuoi chiamarti?"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                        <p className="text-[12px] text-[var(--foreground)] opacity-50 mt-3">
                            Questo nome sarà visibile nelle classifiche.
                        </p>
                    </div>

                    {/* Save Button */}
                    <Button
                        type="submit"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        isLoading={saving}
                        icon={showSuccess ? <Check className="w-5 h-5" /> : undefined}
                    >
                        {showSuccess ? 'Salvato!' : 'Salva modifiche'}
                    </Button>
                </form>

                {/* Danger Zone */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-[12px] font-bold text-[var(--foreground)] opacity-50 uppercase tracking-widest mb-4">
                        Zona pericolo
                    </h3>
                    <Button
                        variant="outline"
                        fullWidth
                        onClick={handleDeleteAccount}
                        className="border-rose-200 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-bold"
                    >
                        Elimina account
                    </Button>
                    <Button
                        variant="outline"
                        fullWidth
                        className="mt-4"
                        onClick={async () => {
                            if (window.confirm('Vuoi davvero ripristinare il tutorial iniziale?')) {
                                await resetOnboarding();
                                alert('Tutorial ripristinato! Torna alla Home per vederlo.');
                                navigate('/');
                            }
                        }}
                    >
                        Ripristina Tutorial
                    </Button>
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
