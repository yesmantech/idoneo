/**
 * @file LoginPage.tsx — TIER S
 * Two-page flow: landing → auth.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface AppleSignInResult {
    identityToken: string;
    authorizationCode: string;
    user: string;
    email?: string;
    givenName?: string;
    familyName?: string;
}
interface AppleSignInPlugin {
    authorize(): Promise<AppleSignInResult>;
}
const AppleSignIn = registerPlugin<AppleSignInPlugin>('AppleSignIn');

type View = 'landing' | 'auth';

const KF = `
@keyframes heroFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes glowPulse {
  0%,100% { transform: scale(1); opacity: .5; }
  50% { transform: scale(1.08); opacity: .8; }
}
@keyframes shimBtn {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes blobFloat {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(15px,-10px) scale(1.05); }
  66% { transform: translate(-10px,8px) scale(.97); }
}
@keyframes pFloat1 {
  0%,100% { transform: translateY(0) translateX(0); opacity: .4; }
  25% { transform: translateY(-22px) translateX(8px); opacity: .9; }
  50% { transform: translateY(-10px) translateX(-6px); opacity: .5; }
  75% { transform: translateY(-18px) translateX(12px); opacity: .8; }
}
@keyframes pFloat2 {
  0%,100% { transform: translateY(0) translateX(0); opacity: .3; }
  33% { transform: translateY(-18px) translateX(-12px); opacity: .85; }
  66% { transform: translateY(-5px) translateX(10px); opacity: .45; }
}
@keyframes pFloat3 {
  0%,100% { transform: translateY(0); opacity: .25; }
  50% { transform: translateY(-28px); opacity: .9; }
}
@keyframes sparkSpin {
  0%,100% { transform: scale(1) rotate(0deg); opacity: .35; }
  50% { transform: scale(1.4) rotate(22deg); opacity: .9; }
}
`;

let _i = false;
function inj() { if (_i) return; _i = true; const s = document.createElement('style'); s.textContent = KF; document.head.appendChild(s); }

/* ════════════════════════════════════════════════
   HERO IMAGE — compact animated
════════════════════════════════════════════════ */
function HeroImage() {
    return (
        <div style={{
            position: 'relative',
            width: 280, height: 280,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'heroFloat 6s ease-in-out infinite',
        }}>
            <div style={{
                position: 'absolute', width: 260, height: 260, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,150,255,0.18) 0%, rgba(0,80,200,0.06) 45%, transparent 65%)',
                animation: 'glowPulse 4s ease-in-out infinite', pointerEvents: 'none',
            }}/>
            <div style={{
                position: 'absolute', width: 170, height: 170, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100,60,255,0.10) 0%, transparent 60%)',
                animation: 'glowPulse 5s ease-in-out infinite 1.5s', pointerEvents: 'none',
            }}/>
            <img src="/images/login-hero.png" alt="Idoneo" style={{
                width: 220, height: 'auto', objectFit: 'contain', position: 'relative', zIndex: 2,
                filter: 'drop-shadow(0 0 30px rgba(0,140,255,0.25)) drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
            }}/>
            {[
                { t: '5%', l: '8%', s: 3.5, a: 'pFloat1', dur: '6s', d: '0s', c: '#00D4FF' },
                { t: '75%', l: '85%', s: 4, a: 'pFloat2', dur: '7s', d: '1s', c: '#6366F1' },
                { t: '15%', l: '88%', s: 2.5, a: 'pFloat3', dur: '5s', d: '0.5s', c: '#38BDF8' },
                { t: '85%', l: '10%', s: 3, a: 'pFloat1', dur: '8s', d: '2s', c: '#00D4FF' },
                { t: '50%', l: '3%', s: 2, a: 'pFloat2', dur: '6.5s', d: '1.5s', c: '#818CF8' },
                { t: '45%', l: '95%', s: 2.5, a: 'pFloat3', dur: '5.5s', d: '0.8s', c: '#38BDF8' },
            ].map((p, i) => (
                <div key={i} style={{
                    position: 'absolute', top: p.t, left: p.l,
                    width: p.s, height: p.s, borderRadius: '50%',
                    background: p.c, boxShadow: `0 0 ${p.s * 3}px ${p.c}60`,
                    animation: `${p.a} ${p.dur} ease-in-out infinite ${p.d}`, zIndex: 4,
                }}/>
            ))}
            {[
                { t: '2%', l: '30%', s: 9 },
                { t: '68%', l: '90%', s: 7 },
                { t: '88%', l: '18%', s: 7 },
                { t: '25%', l: '95%', s: 5 },
            ].map((p, i) => (
                <div key={i} style={{
                    position: 'absolute', top: p.t, left: p.l, width: p.s, height: p.s,
                    background: 'linear-gradient(135deg, #38D9FF, #4B6BFF)',
                    clipPath: 'polygon(50% 0%,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0% 50%,39% 35%)',
                    animation: `sparkSpin ${3.2 + i * 0.7}s ease-in-out infinite ${i * 0.5}s`,
                    filter: `drop-shadow(0 0 ${p.s * 0.6}px rgba(0,200,255,0.65))`, zIndex: 4,
                }}/>
            ))}
        </div>
    );
}

/* ────────────────────────────────────────────
   MAIN PAGE — Two-view flow
──────────────────────────────────────────── */
export default function LoginPage() {
    const nav = useNavigate();
    const [view, setView] = useState<View>('landing');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => { inj(); requestAnimationFrame(() => setTimeout(() => setShow(true), 80)); }, []);

    const openAuth = () => { hapticLight(); setView('auth'); setError(null); setSuccess(false); setEmail(''); setPw(''); };
    const goBack = () => { hapticLight(); setView('landing'); setError(null); setSuccess(false); };

    // Smart post-login routing: skip welcome/onboarding for returning users
    const navigateAfterLogin = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) { nav('/welcome'); return; }
            const { data: prof } = await supabase
                .from('profiles')
                .select('nickname, onboarding_completed_at')
                .eq('id', session.user.id)
                .single();
            if (prof?.nickname && prof?.onboarding_completed_at) {
                nav('/'); // Returning user — skip everything
            } else if (prof?.nickname) {
                nav('/onboarding'); // Has profile but no onboarding
            } else {
                nav('/welcome'); // Brand new user
            }
        } catch {
            nav('/welcome'); // Fallback
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError(null);
        try {
            const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pw });
            if (!signInErr) { hapticSuccess(); await navigateAfterLogin(); return; }

            const { data, error: signUpErr } = await supabase.auth.signUp({
                email, password: pw,
                options: { emailRedirectTo: `${window.location.origin}/welcome` },
            });
            if (signUpErr) throw signUpErr;
            if (data?.user?.identities?.length === 0) {
                setError('Credenziali non valide. Controlla email e password.');
                return;
            }
            setSuccess(true); hapticSuccess();
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('already registered') || msg.includes('User already exists'))
                setError('Credenziali non valide. Controlla email e password.');
            else if (msg.includes('Password should be'))
                setError('La password deve avere almeno 6 caratteri.');
            else setError(msg || "Errore durante l'autenticazione");
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            minHeight: '100dvh', background: 'var(--background)', color: 'var(--foreground)',
            fontFamily: "'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif",
            display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
            paddingTop: 'var(--safe-area-top, 0px)',
        }}>
            <SEOHead title="Idoneo — Passa i Concorsi in Settimane, Non Anni" description="Quiz intelligenti, statistiche e un coach AI per il tuo concorso." />

            {/* ── Background ── */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: 350, height: 350,
                    top: '-8%', right: '-15%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,120,255,0.10) 0%, transparent 60%)',
                    animation: 'blobFloat 12s ease-in-out infinite',
                }}/>
                <div style={{
                    position: 'absolute', width: 300, height: 300,
                    bottom: '-10%', left: '-10%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,50,200,0.07) 0%, transparent 55%)',
                    animation: 'blobFloat 16s ease-in-out infinite 4s',
                }}/>
            </div>

            {/* ═══ PAGE 1 — LANDING ═══ */}
            {view === 'landing' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Centered content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: -16 }}>
                        {/* Hero */}
                        <div style={{
                            opacity: show ? 1 : 0,
                            transform: show ? 'scale(1)' : 'scale(0.9)',
                            transition: 'all 1.2s cubic-bezier(0.22,1,0.36,1) 0s',
                        }}>
                            <HeroImage />
                        </div>

                        {/* Headline */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '0 28px',
                            opacity: show ? 1 : 0,
                            transform: show ? 'translateY(0)' : 'translateY(26px)',
                            transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 0.25s',
                        }}>
                            <h1 style={{ textAlign: 'center', lineHeight: 1.12, letterSpacing: '-0.045em', margin: 0 }}>
                                <span style={{ display: 'block', fontSize: 34, fontWeight: 800, color: 'var(--foreground)', opacity: 0.94 }}>
                                    Passa i concorsi
                                </span>
                                <span style={{
                                    display: 'block', fontSize: 42, fontWeight: 900, marginTop: 2,
                                    background: 'linear-gradient(120deg, #38D9FF 10%, #4B8AFF 50%, #38D9FF 90%)',
                                    backgroundSize: '200% 100%',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 24px rgba(0,180,255,0.25))',
                                    animation: 'shimBtn 4s ease-in-out infinite',
                                }}>in Settimane,</span>
                                <span style={{ display: 'block', fontSize: 34, fontWeight: 800, color: 'var(--foreground)', opacity: 0.94, marginTop: 2 }}>
                                    non Anni
                                </span>
                            </h1>
                            <p style={{
                                fontSize: 14, fontWeight: 500, color: 'var(--foreground)', opacity: 0.35,
                                marginTop: 8, textAlign: 'center', maxWidth: 260, lineHeight: 1.5,
                            }}>
                                La piattaforma preferita dagli italiani per prepararsi ai concorsi pubblici
                            </p>
                        </div>

                        {/* CTA */}
                        <div style={{
                            marginTop: 24, padding: '0 22px', width: '100%',
                            opacity: show ? 1 : 0,
                            transform: show ? 'translateY(0)' : 'translateY(14px)',
                            transition: 'all 1s cubic-bezier(0.22,1,0.36,1) 0.4s',
                            boxSizing: 'border-box',
                        }}>
                            <div style={{ maxWidth: 380, margin: '0 auto' }}>
                                <button onClick={openAuth} style={{
                                    width: '100%', height: 58, borderRadius: 30, border: 'none',
                                    background: '#0095FF',
                                    color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(0,60,200,0.3)',
                                    transition: 'transform .15s ease',
                                }}
                                    onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                                    onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                >Inizia</button>
                            </div>
                        </div>
                    </div>

                    {/* Legal Footer — fixed at bottom, always visible */}
                    <div style={{
                        position: 'fixed',
                        bottom: 0, left: 0, right: 0,
                        padding: '10px 22px',
                        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
                        display: 'flex', justifyContent: 'center', gap: 16,
                        zIndex: 10,
                        opacity: show ? 1 : 0,
                        transition: 'opacity 1s ease 0.6s',
                    }}>
                        <Link to="/privacy" style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', opacity: 0.35, textDecoration: 'none' }}>
                            Privacy Policy
                        </Link>
                        <span style={{ fontSize: 12, color: 'var(--foreground)', opacity: 0.2 }}>·</span>
                        <Link to="/terms" style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', opacity: 0.35, textDecoration: 'none' }}>
                            Termini e Condizioni
                        </Link>
                    </div>
                </div>
            )}

            {/* ═══ PAGE 2 — AUTH ═══ */}
            {view === 'auth' && !success && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>


                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 60px' }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--foreground)' }}>
                                Inizia
                            </h1>
                            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', opacity: 0.35, marginTop: 8 }}>
                                Accedi o crea il tuo account
                            </p>
                        </div>

                        <div style={{ width: '100%', maxWidth: 380 }}>
                            <form onSubmit={handleSubmit}>
                                {/* Email */}
                                <div style={{ position: 'relative', marginBottom: 10 }}>
                                    <input type="email" placeholder="Email" value={email}
                                        onChange={e => setEmail(e.target.value)} required autoComplete="email"
                                        style={{
                                            width: '100%', height: 52, padding: '0 16px',
                                            borderRadius: 14, border: '1px solid var(--card-border)',
                                            background: 'var(--card)', color: 'var(--foreground)',
                                            fontSize: 15, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
                                        }} />
                                </div>
                                {/* Password — appears after email has @ */}
                                <div style={{
                                    maxHeight: email.includes('@') ? 120 : 0,
                                    opacity: email.includes('@') ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
                                }}>
                                    <div style={{ position: 'relative', marginBottom: 10 }}>
                                        <input type={showPw ? 'text' : 'password'} placeholder="Password"
                                            value={pw} onChange={e => setPw(e.target.value)} required
                                            autoComplete="password"
                                            style={{
                                                width: '100%', height: 52, padding: '0 48px 0 16px',
                                                borderRadius: 14, border: '1px solid var(--card-border)',
                                                background: 'var(--card)', color: 'var(--foreground)',
                                                fontSize: 15, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
                                            }} />
                                        <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--foreground)', opacity: 0.25, cursor: 'pointer', padding: 6 }}>
                                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                                        <Link to="/recover-password" style={{ fontSize: 12, fontWeight: 600, color: '#38D9FF', textDecoration: 'none' }}>Password dimenticata?</Link>
                                    </div>
                                </div>
                                {error && <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: 13, fontWeight: 500, textAlign: 'center', marginBottom: 10 }}>{error}</div>}
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', height: 52, borderRadius: 14, border: 'none', marginTop: 4,
                                    background: '#0095FF',
                                    color: '#fff', fontSize: 16, fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
                                    boxShadow: '0 4px 16px rgba(0,60,200,0.3)', transition: 'all .2s ease',
                                }}>{loading ? '...' : 'Continua'}</button>
                            </form>

                            {/* Separator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', opacity: 0.28, flexShrink: 0 }}>oppure</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
                            </div>

                            {/* Google */}
                            <button onClick={async () => {
                                hapticLight();
                                if (Capacitor.isNativePlatform()) {
                                    const { data, error } = await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            redirectTo: 'com.idoneo.app://welcome',
                                            skipBrowserRedirect: true,
                                        },
                                    });
                                    if (data?.url) {
                                        await Browser.open({
                                            url: data.url,
                                            presentationStyle: 'popover',
                                            toolbarColor: '#000000',
                                        });
                                    }
                                } else {
                                    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/welcome` } });
                                }
                            }}
                                style={{
                                    width: '100%', height: 52, borderRadius: 14, border: '1px solid var(--card-border)',
                                    background: 'var(--card)', color: 'var(--foreground)', fontSize: 15, fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    transition: 'transform .15s ease',
                                }}
                                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continua con Google
                            </button>

                            {/* Facebook */}
                            <button onClick={async () => {
                                hapticLight();
                                if (Capacitor.isNativePlatform()) {
                                    const { data, error } = await supabase.auth.signInWithOAuth({
                                        provider: 'facebook',
                                        options: {
                                            redirectTo: 'com.idoneo.app://welcome',
                                            skipBrowserRedirect: true,
                                        },
                                    });
                                    if (data?.url) {
                                        await Browser.open({
                                            url: data.url,
                                            presentationStyle: 'popover',
                                            toolbarColor: '#000000',
                                        });
                                    }
                                } else {
                                    await supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: `${window.location.origin}/welcome` } });
                                }
                            }}
                                style={{
                                    width: '100%', height: 52, borderRadius: 14, border: '1px solid var(--card-border)',
                                    background: 'var(--card)', color: 'var(--foreground)', fontSize: 15, fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    marginTop: 10, transition: 'transform .15s ease',
                                }}
                                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                                </svg>
                                Continua con Facebook
                            </button>
                            {/* Apple */}
                            <button onClick={async () => {
                                hapticLight();
                                setError(null);
                                try {
                                    if (Capacitor.isNativePlatform()) {
                                        // Native: use the Apple Sign In popup (Face ID)
                                        const result = await AppleSignIn.authorize();
                                        // Pass the ID token to Supabase
                                        const { error: supaErr } = await supabase.auth.signInWithIdToken({
                                            provider: 'apple',
                                            token: result.identityToken,
                                        });
                                        if (supaErr) throw supaErr;
                                        hapticSuccess();
                                        await navigateAfterLogin();
                                    } else {
                                        // Web: standard OAuth redirect
                                        await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/welcome` } });
                                    }
                                } catch (err: any) {
                                    const msg = err?.message || '';
                                    // Suppress user-cancelled and all Apple AuthorizationError codes
                                    if (msg.includes('canceled') || msg.includes('cancelled') || msg.includes('1001') || msg.includes('1000') || msg.includes('AuthorizationError')) {
                                        // User cancelled or Apple auth not configured — silent
                                    } else {
                                        setError('Errore durante il login con Apple. Riprova.');
                                    }
                                }
                            }}
                                style={{
                                    width: '100%', height: 52, borderRadius: 14, border: '1px solid var(--card-border)',
                                    background: 'var(--card)', color: 'var(--foreground)', fontSize: 15, fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    marginTop: 10, transition: 'transform .15s ease',
                                }}
                                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--foreground)">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                </svg>
                                Continua con Apple
                            </button>

                            {/* Legal disclaimer */}
                            <p style={{ fontSize: 11, fontWeight: 400, color: 'var(--foreground)', opacity: 0.25, textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
                                Registrandoti accetti i{' '}
                                <Link to="/terms" style={{ color: 'var(--foreground)', opacity: 0.6, textDecoration: 'underline' }}>Termini e Condizioni</Link>
                                {' '}e la{' '}
                                <Link to="/privacy" style={{ color: 'var(--foreground)', opacity: 0.6, textDecoration: 'underline' }}>Privacy Policy</Link>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ SUCCESS ═══ */}
            {view === 'auth' && success && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
                    <div style={{ textAlign: 'center', maxWidth: 340 }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(16,185,129,0.18)' }}>
                            <Sparkles style={{ width: 40, height: 40, color: '#34D399' }} />
                        </div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8, color: 'var(--foreground)' }}>Controlla l'email</h1>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)', opacity: 0.4, marginBottom: 28, lineHeight: 1.6 }}>Ti abbiamo inviato un link di conferma. Cliccalo per attivare il tuo account!</p>
                        <button onClick={goBack} style={{ fontSize: 14, fontWeight: 700, color: '#0095FF', background: 'none', border: 'none', cursor: 'pointer' }}>Torna alla home</button>
                    </div>
                </div>
            )}
        </div>
    );
}
