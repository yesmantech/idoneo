import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Copy, Check, Palette, Type, Sun, Moon, Sparkles, Layers, Square, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hapticLight } from '@/lib/haptics';

// ─── DATA ───
const BRAND_COLORS = [
    { name: 'Idoneo Blue', hex: '#00B1FF', rgb: '0, 177, 255', role: 'Primary — Logo, CTA, accents', primary: true },
    { name: 'Deep Blue', hex: '#0066FF', rgb: '0, 102, 255', role: 'Gradient endpoint, depth' },
    { name: 'Utility Blue', hex: '#0095FF', rgb: '0, 149, 255', role: 'Secondary actions' },
    { name: 'Brand Cyan', hex: '#06D6D3', rgb: '6, 214, 211', role: 'Gradient start, progress bars' },
    { name: 'Purple', hex: '#5856D6', rgb: '88, 86, 214', role: 'Alt accent, categories' },
    { name: 'Orange', hex: '#FF9F0A', rgb: '255, 159, 10', role: 'Streaks, warnings, badges' },
];

const SEMANTIC_COLORS = [
    { name: 'Success', hex: '#34C759', role: 'Correct, confirm' },
    { name: 'Error', hex: '#FF3B30', role: 'Wrong, errors' },
    { name: 'Warning', hex: '#FF9F0A', role: 'Cautions' },
    { name: 'Info', hex: '#00B1FF', role: 'Tips, info' },
];

const SURFACE_COLORS = [
    { name: 'Light BG', light: '#F5F5F7', dark: '#000000' },
    { name: 'Card', light: '#FFFFFF', dark: '#111111' },
    { name: 'Text Primary', light: '#111827', dark: '#F8FAFC' },
    { name: 'Text Secondary', light: '#6B7280', dark: '#94A3B8' },
    { name: 'Sheet BG', light: '#1C1C1E', dark: '#1C1C1E' },
];

const GRADIENTS = [
    { name: 'Primary CTA', from: '#06D6D3', to: '#0095FF', angle: '135deg' },
    { name: 'Vibrant', from: '#00A8FF', to: '#00E5FF', angle: '90deg' },
    { name: 'Blue CTA', from: '#00B1FF', to: '#0066FF', angle: '135deg' },
    { name: 'Accent Edge', from: '#00B1FF', to: '#0066FF', angle: '180deg' },
];

const RADII = [
    { name: 'Squircle', value: '22%', use: 'App icons' },
    { name: 'Card', value: '24px', use: 'Cards, modals' },
    { name: 'Pill', value: '9999px', use: 'CTAs, badges' },
    { name: 'Input', value: '16px', use: 'Inputs, search' },
];

const TYPE_SCALE = [
    { name: 'Hero Title', size: '28px', weight: 'Black (900)' },
    { name: 'Section Title', size: '18px', weight: 'Bold (700)' },
    { name: 'Card Title', size: '15px', weight: 'Bold (700)' },
    { name: 'Body', size: '14px', weight: 'Medium (500)' },
    { name: 'Caption', size: '11px', weight: 'Bold (700) uppercase' },
    { name: 'Stat Value', size: '24px', weight: 'Black (900)' },
];

// ─── Components ───

function CopiedToast({ show }: { show: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: show ? 1 : 0, y: show ? 0 : 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{ backgroundColor: '#1C1C1E', pointerEvents: show ? 'auto' : 'none' }}
        >
            <Check style={{ width: 14, height: 14, color: '#34C759' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Copied!</span>
        </motion.div>
    );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ style?: React.CSSProperties }>; title: string }) {
    return (
        <div className="flex items-center gap-3 mb-5 mt-10">
            <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,177,255,0.12), rgba(0,102,255,0.12))' }}
            >
                <Icon style={{ width: 20, height: 20, color: '#00B1FF' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }} className="text-[var(--foreground)]">
                {title}
            </h2>
        </div>
    );
}

function ColorSwatch({ color, onCopy }: { color: { name: string; hex: string; rgb?: string; role: string; primary?: boolean }; onCopy: (hex: string) => void }) {
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { hapticLight(); onCopy(color.hex); }}
            className="text-left w-full"
        >
            <div
                className="rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)]"
                style={color.primary ? { boxShadow: `0 4px 24px ${color.hex}30` } : {}}
            >
                <div
                    className="h-20 relative"
                    style={{ backgroundColor: color.hex }}
                >
                    {color.primary && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>Primary</span>
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }} className="text-[var(--foreground)]">{color.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: color.hex, fontFamily: 'monospace' }}>{color.hex}</p>
                    {color.rgb && <p style={{ fontSize: 10, fontWeight: 500 }} className="text-slate-400 mt-0.5">RGB {color.rgb}</p>}
                    <p style={{ fontSize: 10, fontWeight: 500 }} className="text-slate-400 mt-1">{color.role}</p>
                </div>
            </div>
        </motion.button>
    );
}

// ─── Page ───

export default function BrandGuidelinesPage() {
    const navigate = useNavigate();
    const [copiedHex, setCopiedHex] = useState<string | null>(null);

    const copyToClipboard = (hex: string) => {
        navigator.clipboard.writeText(hex);
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1500);
    };

    const handleDownload = () => {
        hapticLight();
        window.open('/Idoneo_Brand_Guidelines.md', '_blank');
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
                    <button onClick={() => { hapticLight(); navigate(-1); }} className="active:scale-90 transition-transform p-1">
                        <ArrowLeft style={{ width: 22, height: 22 }} className="text-[var(--foreground)]" />
                    </button>
                    <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }} className="text-[var(--foreground)]">Brand Guidelines</h1>
                    <button onClick={handleDownload} className="active:scale-90 transition-transform p-1">
                        <Download style={{ width: 20, height: 20, color: '#00B1FF' }} />
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-32">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
                    className="mt-6 rounded-3xl overflow-hidden relative"
                    style={{ background: 'linear-gradient(135deg, #00B1FF, #0066FF)' }}
                >
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)'
                    }} />
                    <div className="relative z-10 px-6 py-10 text-center">
                        <div className="w-16 h-16 rounded-[22%] mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                            <Palette style={{ width: 32, height: 32, color: '#fff' }} />
                        </div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.8 }}>Idoneo</h1>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>Brand & Design System</p>
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>PRIMARY COLOR</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>#00B1FF</span>
                            <button
                                onClick={() => copyToClipboard('#00B1FF')}
                                className="active:scale-90 transition-transform ml-1"
                            >
                                <Copy style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.7)' }} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ──── BRAND COLORS ──── */}
                <SectionTitle icon={Droplets} title="Brand Colors" />
                <div className="grid grid-cols-2 gap-3">
                    {BRAND_COLORS.map(c => (
                        <ColorSwatch key={c.hex} color={c} onCopy={copyToClipboard} />
                    ))}
                </div>

                {/* ──── SEMANTIC COLORS ──── */}
                <SectionTitle icon={Sparkles} title="Semantic Colors" />
                <div className="grid grid-cols-2 gap-3">
                    {SEMANTIC_COLORS.map(c => (
                        <ColorSwatch key={c.hex + c.name} color={c} onCopy={copyToClipboard} />
                    ))}
                </div>

                {/* ──── GRADIENTS ──── */}
                <SectionTitle icon={Layers} title="Gradients" />
                <div className="space-y-3">
                    {GRADIENTS.map(g => (
                        <motion.button
                            key={g.name}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { hapticLight(); copyToClipboard(`${g.from} → ${g.to}`); }}
                            className="w-full text-left rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)]"
                        >
                            <div className="h-14 rounded-t-2xl" style={{ background: `linear-gradient(${g.angle}, ${g.from}, ${g.to})` }} />
                            <div className="flex items-center justify-between p-3">
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }} className="text-[var(--foreground)]">{g.name}</p>
                                    <p style={{ fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }} className="text-slate-400">{g.from} → {g.to} ({g.angle})</p>
                                </div>
                                <Copy style={{ width: 14, height: 14, color: '#8E8E93' }} />
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* ──── SURFACES / THEMES ──── */}
                <SectionTitle icon={Sun} title="Surfaces & Themes" />
                <div className="rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)]">
                    <div className="grid grid-cols-3 gap-0 text-center py-2 px-3 border-b border-[var(--card-border)]">
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} className="text-slate-400">Element</span>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} className="text-slate-400 flex items-center justify-center gap-1"><Sun style={{ width: 10, height: 10 }} /> Light</span>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }} className="text-slate-400 flex items-center justify-center gap-1"><Moon style={{ width: 10, height: 10 }} /> Dark</span>
                    </div>
                    {SURFACE_COLORS.map((s, i) => (
                        <div key={s.name} className={`grid grid-cols-3 gap-0 items-center py-3 px-3 ${i < SURFACE_COLORS.length - 1 ? 'border-b border-[var(--card-border)]' : ''}`}>
                            <span style={{ fontSize: 12, fontWeight: 600 }} className="text-[var(--foreground)]">{s.name}</span>
                            <button onClick={() => { hapticLight(); copyToClipboard(s.light); }} className="flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                <div className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700" style={{ backgroundColor: s.light }} />
                                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }} className="text-slate-500">{s.light}</span>
                            </button>
                            <button onClick={() => { hapticLight(); copyToClipboard(s.dark); }} className="flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                <div className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700" style={{ backgroundColor: s.dark }} />
                                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }} className="text-slate-500">{s.dark}</span>
                            </button>
                        </div>
                    ))}
                </div>

                {/* ──── TYPOGRAPHY ──── */}
                <SectionTitle icon={Type} title="Typography" />
                <div className="rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Inter' }} className="text-[var(--foreground)]">Aa</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700 }} className="text-[var(--foreground)]">Inter</p>
                            <p style={{ fontSize: 11, fontWeight: 500 }} className="text-slate-400">Google Fonts — Fallback: SF Pro, system sans</p>
                        </div>
                    </div>
                    <div className="space-y-2 border-t border-[var(--card-border)] pt-3">
                        {TYPE_SCALE.map(t => (
                            <div key={t.name} className="flex items-baseline justify-between py-1.5">
                                <span style={{ fontSize: parseInt(t.size), fontWeight: t.weight.includes('900') ? 900 : t.weight.includes('700') ? 700 : 500, textTransform: t.weight.includes('uppercase') ? 'uppercase' : undefined, letterSpacing: t.weight.includes('uppercase') ? 1 : -0.2 }} className="text-[var(--foreground)]">
                                    {t.name}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }} className="text-slate-400">{t.size} / {t.weight}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ──── CORNER RADII ──── */}
                <SectionTitle icon={Square} title="Corner Radius" />
                <div className="grid grid-cols-2 gap-3">
                    {RADII.map(r => (
                        <div key={r.name} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 flex flex-col items-center">
                            <div className="w-14 h-14 border-2 border-[#00B1FF] mb-3" style={{ borderRadius: r.value === '22%' ? '22%' : r.value }} />
                            <p style={{ fontSize: 13, fontWeight: 700 }} className="text-[var(--foreground)]">{r.name}</p>
                            <p style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: '#00B1FF' }}>{r.value}</p>
                            <p style={{ fontSize: 10, fontWeight: 500 }} className="text-slate-400 mt-1">{r.use}</p>
                        </div>
                    ))}
                </div>

                {/* ──── GLASSMORPHISM ──── */}
                <SectionTitle icon={Layers} title="Glassmorphism (Tier S)" />
                <div className="relative rounded-2xl overflow-hidden p-1" style={{ background: 'linear-gradient(135deg, #06D6D3, #0066FF)' }}>
                    <div className="rounded-[14px] p-5" style={{
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Recipe</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Background', value: 'white/80 (light) · white/4% (dark)' },
                                { label: 'Blur', value: 'backdrop-blur-xl' },
                                { label: 'Border', value: 'white/60 (light) · white/8% (dark)' },
                                { label: 'Shadow', value: '0 2px 16px -4px rgba(0,0,0,0.08)' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between">
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ──── LOGO RULES ──── */}
                <SectionTitle icon={Sparkles} title="Logo Rules" />
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
                    <div className="grid grid-cols-2 gap-0">
                        {/* Logo on light */}
                        <div className="flex items-center justify-center py-8" style={{ backgroundColor: '#F5F5F7' }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: '#00B1FF', letterSpacing: -0.5 }}>Idoneo</span>
                        </div>
                        {/* Logo on dark */}
                        <div className="flex items-center justify-center py-8" style={{ backgroundColor: '#000' }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: '#00B1FF', letterSpacing: -0.5 }}>Idoneo</span>
                        </div>
                    </div>
                    <div className="p-4 border-t border-[var(--card-border)]">
                        <div className="space-y-2">
                            {[
                                { label: 'Primary Color', value: '#00B1FF (always)' },
                                { label: 'On Light BG', value: '#00B1FF or #111827' },
                                { label: 'On Dark BG', value: '#00B1FF or #FFFFFF' },
                                { label: 'Min Size', value: '32px height' },
                                { label: 'Clear Space', value: '1× logo height, all sides' },
                            ].map(r => (
                                <div key={r.label} className="flex justify-between items-center">
                                    <span style={{ fontSize: 12, fontWeight: 600 }} className="text-slate-400">{r.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }} className="text-[var(--foreground)]">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Download CTA */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDownload}
                    className="w-full mt-10 py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                    style={{ background: 'linear-gradient(135deg, #00B1FF, #0066FF)', boxShadow: '0 8px 30px rgba(0,177,255,0.25)' }}
                >
                    <Download style={{ width: 18, height: 18, color: '#fff' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>Download Guidelines (.md)</span>
                </motion.button>

                <p style={{ fontSize: 11, fontWeight: 500, textAlign: 'center', marginTop: 16 }} className="text-slate-400">
                    Idoneo v1 — March 2026
                </p>
            </div>

            <CopiedToast show={copiedHex !== null} />
        </div>
    );
}
