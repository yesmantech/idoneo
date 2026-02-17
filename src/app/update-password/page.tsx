
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Cloud, Zap, Heart, Shield, Sparkles, Lock, Check } from "lucide-react";
import SEOHead from '@/components/seo/SEOHead';

export default function UpdatePasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Decorative icons
    const decorativeIcons = [
        { Icon: Star, color: "text-amber-400", bg: "bg-amber-100", top: "15%", left: "10%", size: "w-12 h-12", delay: "0s" },
        { Icon: Cloud, color: "text-sky-400", bg: "bg-sky-100", top: "12%", right: "15%", size: "w-16 h-16", delay: "0.5s" },
        { Icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100", bottom: "20%", left: "8%", size: "w-14 h-14", delay: "1s" },
        { Icon: Heart, color: "text-rose-400", bg: "bg-rose-100", bottom: "15%", right: "10%", size: "w-12 h-12", delay: "1.5s" },
        { Icon: Shield, color: "text-indigo-400", bg: "bg-indigo-100", top: "45%", left: "5%", size: "w-10 h-10", delay: "2s" },
        { Icon: Sparkles, color: "text-purple-400", bg: "bg-purple-100", top: "40%", right: "5%", size: "w-14 h-14", delay: "2.5s" },
    ];

    useEffect(() => {
        // Check if we have a session (user clicked the recovery link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, redirect to login (link might be invalid or expired)
                navigate('/login');
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Le password non coincidono.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("La password deve essere di almeno 6 caratteri.");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(err.message || 'Si è verificato un errore durante l\'aggiornamento della password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col justify-center overflow-hidden relative transition-colors duration-500">
            <SEOHead
                title="Imposta Nuova Password | Idoneo"
                description="Imposta una nuova password per il tuo account."
            />

            {/* Decorative Background Icons */}
            <div className="absolute inset-0 pointer-events-none">
                {decorativeIcons.map((item, idx) => (
                    <div
                        key={idx}
                        className={`absolute rounded-full flex items-center justify-center ${item.bg} dark:bg-slate-800/50 ${item.size} animate-in fade-in zoom-in duration-1000 opacity-60 dark:opacity-40`}
                        style={{
                            top: item.top,
                            left: item.left,
                            right: item.right,
                            bottom: item.bottom,
                            animationDelay: item.delay
                        }}
                    >
                        <item.Icon className={`w-1/2 h-1/2 ${item.color}`} strokeWidth={2.5} />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="w-full max-w-md mx-auto px-6 flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300 relative z-10 pb-8">

                {!success ? (
                    <>
                        <div className="space-y-3 text-center w-full">
                            <h1 className="text-3xl md:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                                Nuova Password
                            </h1>
                            <h2 className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-50 leading-relaxed max-w-xs mx-auto">
                                Inserisci la tua nuova password qui sotto.
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full space-y-4">
                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Nuova password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full h-14 pl-12 pr-5 rounded-2xl bg-[#F5F5F5] dark:bg-slate-800 text-lg font-medium text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 dark:focus:bg-slate-700 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-slate-700"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Conferma password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full h-14 pl-12 pr-5 rounded-2xl bg-[#F5F5F5] dark:bg-slate-800 text-lg font-medium text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 dark:focus:bg-slate-700 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center`}
                            >
                                {loading ? 'Aggiornamento...' : 'Aggiorna password'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="space-y-4 text-center w-full animate-in zoom-in-50 duration-500">
                        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                            Password aggiornata!
                        </h1>
                        <p className="text-lg text-[var(--foreground)] opacity-60 leading-relaxed max-w-sm mx-auto">
                            La tua password è stata modificata con successo. Ora puoi accedere con le nuove credenziali.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block w-full py-4 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 mt-6"
                        >
                            Vai al login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
