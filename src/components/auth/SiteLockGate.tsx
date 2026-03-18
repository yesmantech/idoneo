import React, { useState, useEffect } from 'react';

// =============================================================================
// SITE LOCK GATE — Premium full-screen login
// Wraps the entire app. If SITE_LOCK_ENABLED is true on server,
// shows a login page until valid credentials are provided.
// =============================================================================

interface LockState {
    loading: boolean;
    locked: boolean;
    authenticated: boolean;
}

export default function SiteLockGate({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<LockState>({
        loading: true,
        locked: false,
        authenticated: false,
    });
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Check lock status on mount
    useEffect(() => {
        fetch('/api/site-lock', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                setState({
                    loading: false,
                    locked: data.locked ?? false,
                    authenticated: data.authenticated ?? false,
                });
            })
            .catch(() => {
                // If API fails (e.g. local dev), skip lock
                setState({ loading: false, locked: false, authenticated: false });
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/site-lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await res.json();

            if (data.success) {
                setState(s => ({ ...s, authenticated: true }));
            } else {
                setError(data.error || 'Credenziali non valide');
            }
        } catch {
            setError('Errore di connessione. Riprova.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading — show nothing (fast check)
    if (state.loading) return null;

    // Not locked or authenticated — render app
    if (!state.locked || state.authenticated) {
        return <>{children}</>;
    }

    // Locked — show login page
    return (
        <div style={styles.container}>
            {/* Gradient background */}
            <div style={styles.bgGradient} />

            <div style={styles.lockContainer}>
                {/* Logo */}
                <div style={styles.logoSection}>
                    <div style={styles.logoIcon}>i</div>
                    <div style={styles.logoText}>ACCESSO RISERVATO</div>
                </div>

                {/* Card */}
                <div style={styles.card}>
                    {/* Lock icon */}
                    <svg style={styles.lockSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>

                    <h1 style={styles.title}>Sito in manutenzione</h1>
                    <p style={styles.subtitle}>Inserisci le credenziali per accedere</p>

                    {error && (
                        <div style={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={styles.field}>
                            <label style={styles.label} htmlFor="site-lock-user">Username</label>
                            <input
                                id="site-lock-user"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                                autoComplete="username"
                                autoCapitalize="off"
                                style={styles.input}
                                onFocus={e => { e.currentTarget.style.borderColor = '#00B1FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,177,255,0.15)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label} htmlFor="site-lock-pass">Password</label>
                            <input
                                id="site-lock-pass"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                style={styles.input}
                                onFocus={e => { e.currentTarget.style.borderColor = '#00B1FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,177,255,0.15)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                ...styles.submitBtn,
                                opacity: submitting ? 0.7 : 1,
                                cursor: submitting ? 'wait' : 'pointer',
                            }}
                        >
                            {submitting ? 'Verifica...' : 'Accedi'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// INLINE STYLES (no Tailwind dependency — must work before app CSS loads)
// =============================================================================
const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#fff',
        padding: 24,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        WebkitFontSmoothing: 'antialiased',
    },
    bgGradient: {
        position: 'fixed',
        inset: 0,
        background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,177,255,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.08) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
    },
    lockContainer: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 380,
        animation: 'sitelockSlideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
    },
    logoSection: {
        textAlign: 'center',
        marginBottom: 40,
    },
    logoIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #00B1FF 0%, #0066FF 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 800,
        color: '#fff',
        marginBottom: 12,
        boxShadow: '0 8px 32px rgba(0,177,255,0.3)',
    },
    logoText: {
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.15em',
    },
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '32px 28px',
        backdropFilter: 'blur(20px)',
    },
    lockSvg: {
        display: 'block',
        margin: '0 auto 4px',
        width: 20,
        height: 20,
        opacity: 0.25,
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 6,
        marginTop: 0,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginBottom: 28,
        marginTop: 0,
    },
    errorBox: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 13,
        fontWeight: 500,
        color: '#f87171',
        textAlign: 'center',
    },
    field: {
        marginBottom: 16,
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: '#fff',
        fontSize: 15,
        fontFamily: 'inherit',
        fontWeight: 500,
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    },
    submitBtn: {
        width: '100%',
        padding: 15,
        borderRadius: 14,
        border: 'none',
        background: 'linear-gradient(135deg, #00B1FF 0%, #0066FF 100%)',
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.2s',
        boxShadow: '0 4px 20px rgba(0,177,255,0.3)',
        marginTop: 8,
    },
};

// Inject keyframe animation
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        @keyframes sitelockSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(styleEl);
}
