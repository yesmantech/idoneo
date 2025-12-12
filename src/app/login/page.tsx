import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    Star, Shield, Zap, Heart,
    Cloud, Sun, Moon, Music,
    Gift, Crown, Bell, Sparkles
} from "lucide-react";

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
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/profile/setup`,
                    },
                });

                if (error) throw error;

                // If successful (and NOT suppressed by security settings), show check email
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
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-center overflow-hidden relative">

            {/* Decorative Background Icons */}
            <div className="absolute inset-0 pointer-events-none">
                {decorativeIcons.map((item, idx) => (
                    <div
                        key={idx}
                        className={`absolute rounded-full flex items-center justify-center ${item.bg} ${item.size} animate-in fade-in zoom-in duration-1000`}
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
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                            {isLogin ? 'Bentornato' : 'Benvenuto'}
                        </h1>
                        <h2 className="text-[17px] md:text-lg font-medium text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">
                            {isLogin
                                ? 'Inserisci le tue credenziali per accedere'
                                : 'Inserisci le tue credenziali per registrarti'
                            }
                        </h2>
                    </div>
                ) : (
                    <div className="space-y-4 text-center w-full animate-in zoom-in-50 duration-500">
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Controlla l'email
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-sm mx-auto">
                            Ti abbiamo inviato un link magico per accedere. Cliccalo per confermare la tua identità!
                        </p>
                        <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-500 border border-slate-100">
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
                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F5] text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F5] text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                            />
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
