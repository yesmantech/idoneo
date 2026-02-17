/**
 * @file LoginPage.tsx
 * @description Unified authentication page (Login/Register).
 *
 * Handles user authentication using Supabase Auth.
 * Features a decorative animated background and a dual-mode form.
 *
 * ## Features
 *
 * - **Dual Mode**: Toggles between Login and Registration
 * - **Magic Link**: Supports passwordless/email confirmation flows
 * - **Feedback**: Animated success state for registration
 * - **Decoration**: Floating icons sequence using Framer Motion
 *
 * ## Auth Flow
 *
 * 1. user enters email/pass
 * 2. `supabase.auth.signInWithPassword` OR `signUp`
 * 3. On Register:
 *    - Checks if user exists via workaround (Supabase identity check)
 *    - If new, shows "Check Email" success screen
 * 4. On Login:
 *    - Redirects to `/profile/setup` (or intended destination)
 *
 * ## Decorative Elements
 *
 * Uses `decorativeIcons` array to place floating icons (Star, Cloud, Zap...)
 * at absolute positions with staggered entrance animations.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    Star, Shield, Zap, Heart,
    Cloud, Sun, Moon, Music,
    Gift, Crown, Bell, Sparkles
} from "lucide-react";
import SEOHead from '@/components/seo/SEOHead';

// ============================================================================
// COMPONENT
// ============================================================================

export default function LoginPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false); // Default to Register mode
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Decorative icons scattered around the center
    const decorativeIcons = [
        { Icon: Star, color: "text-amber-400", bg: "bg-amber-100", top: "15%", left: "10%", size: "w-12 h-12", delay: "0s" },
        { Icon: Cloud, color: "text-sky-400", bg: "bg-sky-100", top: "12%", right: "15%", size: "w-16 h-16", delay: "0.5s" },
        { Icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100", bottom: "20%", left: "8%", size: "w-14 h-14", delay: "1s" },
        { Icon: Heart, color: "text-rose-400", bg: "bg-rose-100", bottom: "15%", right: "10%", size: "w-12 h-12", delay: "1.5s" },
        { Icon: Shield, color: "text-indigo-400", bg: "bg-indigo-100", top: "45%", left: "5%", size: "w-10 h-10", delay: "2s" },
        { Icon: Sparkles, color: "text-purple-400", bg: "bg-purple-100", top: "40%", right: "5%", size: "w-14 h-14", delay: "2.5s" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                // LOGIN LOGIC
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Success Login -> Redirect
                navigate('/profile/setup');
            } else {
                // REGISTER LOGIC
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/profile/setup`,
                    },
                });

                if (error) throw error;

                // WORKAROUND: Supabase with "Email Enumeration Protection" ON
                // returns success but with empty identities for existing users
                if (data?.user?.identities?.length === 0) {
                    // User already exists! Show error instead of success
                    setError('Questo indirizzo email è già registrato. Accedi al tuo account!');
                    return;
                }

                // If genuinely new user, show check email
                setSuccess(true);
            }
        } catch (err: any) {
            console.error("Auth Error:", err);

            // Handle "User already registered" specifically
            if (err.message && (err.message.includes('already registered') || err.message.includes('User already exists'))) {
                setError('Questo indirizzo email è già registrato. Accedi al tuo account!');
                // Optional: Auto-switch to login? 
                // setIsLogin(true); 
            } else {
                setError(err.message || 'Errore durante l\'autenticazione');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setSuccess(false);
        setEmail('');
        setPassword('');
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col justify-center overflow-hidden relative transition-colors duration-500">
            <SEOHead
                title={isLogin ? "Accedi | Idoneo" : "Inizia ora | Idoneo"}
                description="Entra nel mondo di Idoneo e inizia a prepararti per il tuo futuro nelle Forze Armate e di Polizia."
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


            {/* Bottom Half: Content */}
            <div className="w-full max-w-md mx-auto px-6 flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300 relative z-10 pb-8">

                {/* Header or Success Message */}
                {!success ? (
                    <div className="space-y-3 text-center w-full">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                            {isLogin ? 'Bentornato' : 'Benvenuto'}
                        </h1>
                        <h2 className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-50 leading-relaxed max-w-xs mx-auto">
                            {isLogin
                                ? 'Inserisci le tue credenziali per accedere'
                                : 'Inserisci le tue credenziali per registrarti'
                            }
                        </h2>
                    </div>
                ) : (
                    <div className="space-y-4 text-center w-full animate-in zoom-in-50 duration-500">
                        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                            Controlla l'email
                        </h1>
                        <p className="text-lg text-[var(--foreground)] opacity-60 leading-relaxed max-w-sm mx-auto">
                            Ti abbiamo inviato un link magico per accedere. Cliccalo per confermare la tua identità!
                        </p>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-[var(--foreground)] opacity-50 border border-slate-100 dark:border-slate-700">
                            Non trovi l'email? Controlla nello spam o riprova.
                        </div>
                        <button
                            onClick={toggleMode}
                            className="text-[#00B1FF] font-bold text-sm hover:underline mt-4"
                        >
                            Torna al login
                        </button>
                    </div>
                )}

                {/* Form */}
                {!success && (
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F5] dark:bg-slate-800 text-lg font-medium text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 dark:focus:bg-slate-700 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-slate-700"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F5] dark:bg-slate-800 text-lg font-medium text-[var(--foreground)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 dark:focus:bg-slate-700 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-slate-700"
                            />
                            {isLogin && (
                                <div className="flex justify-end px-2">
                                    <Link
                                        to="/recover-password"
                                        className="text-sm font-medium text-[#00B1FF] hover:underline opacity-90 hover:opacity-100 transition-opacity"
                                    >
                                        Password dimenticata?
                                    </Link>
                                </div>
                            )}
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
                            {loading
                                ? (isLogin ? 'Accesso in corso...' : 'Registrazione in corso...')
                                : (isLogin ? 'Accedi' : 'Registrati')
                            }
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="text-center space-y-4">
                        <button
                            onClick={toggleMode}
                            className="text-[#00B1FF] font-medium text-sm hover:underline transition-all"
                        >
                            {isLogin
                                ? "Non hai un account? Registrati"
                                : "Hai già un account? Accedi"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
