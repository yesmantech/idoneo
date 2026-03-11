import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { badgeService } from '@/lib/badgeService';
import { BADGE_DEFINITIONS, BadgeDefinition } from '@/lib/badgeDefinitions';
import { hapticLight } from '@/lib/haptics';
import { generateBadgeGraphicFile, generateRecordGraphicFile } from '@/lib/shareGraphic';
import { useNavigate } from 'react-router-dom';

interface Badge extends BadgeDefinition {
    unlocked: boolean;
    unlockedAt?: string;
}

// ============================================================================
// RECORD PERSONALI — Stat cards with gradient circles + number overlay
// ============================================================================

interface PersonalRecord {
    label: string;
    value: string | number;
    gradientFrom: string;
    gradientTo: string;
    /** Optional 3D icon image to replace the gradient circle */
    iconSrc?: string;
    /** Optional custom size for the icon (default: 56px / w-14) */
    iconSize?: number;
}

function RecordCard({ record, index }: { record: PersonalRecord; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * index, duration: 0.35, type: 'spring' }}
            className="shrink-0 snap-start flex-1 min-w-0"
        >
            <div
                className="relative overflow-hidden rounded-[20px] bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl flex flex-col items-center px-3 pt-5 pb-4"
                style={{
                    border: '2px solid var(--card-border)',
                    borderBottomWidth: '4px',
                }}
            >
                {/* Ambient Glow — color bleed matching record theme */}
                <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-3xl opacity-25 pointer-events-none"
                    style={{ background: record.gradientFrom }}
                />

                {/* 3D Icon — Hero element */}
                <div className="relative z-10 mb-1">
                    <img
                        src={record.iconSrc}
                        alt={record.label}
                        className="object-contain drop-shadow-xl"
                        style={{ width: 80, height: 80 }}
                    />
                </div>

                {/* Value — colored to match icon theme */}
                <span
                    className="relative z-10 text-[22px] font-black leading-none mb-1"
                    style={{ color: record.gradientTo }}
                >
                    {record.value}
                </span>

                {/* Label */}
                <span className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)] opacity-40 text-center leading-tight">
                    {record.label}
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// RECORD DETAIL MODAL — Cinematic modal (identical to BadgeDetailModal design)
// ============================================================================

function RecordDetailModal({ record, onClose }: { record: PersonalRecord; onClose: () => void }) {
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);

    // Cleanup blob URL on unmount to prevent memory leak
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    // Map record gradient to share config
    const recordShareConfig: Record<string, { bgKey: string; accentColor: string }> = {
        '#f97316': { bgKey: 'orange', accentColor: '#f97316' },
        '#67e8f9': { bgKey: 'cyan', accentColor: '#22d3ee' },
        '#34d399': { bgKey: 'green', accentColor: '#34d399' },
    };
    const config = recordShareConfig[record.gradientFrom] || { bgKey: 'cyan', accentColor: '#00B1FF' };
    const glowColor = config.accentColor;

    const handleGeneratePreview = async () => {
        if (isGenerating) return;
        hapticLight();
        setIsGenerating(true);
        try {
            // Compute human-friendly text per record type
            const shareTextMap: Record<string, string> = {
                'Streak Migliore': `${record.value} giorni`,
                'XP Totali': `${record.value} XP`,
                'Precisione Media': `${record.value} precisione`,
            };
            const shareText = shareTextMap[record.label] || `${record.value}`;

            const file = await generateRecordGraphicFile({
                label: record.label,
                value: record.value,
                shareText,
                iconSrc: record.iconSrc!,
                accentColor: config.accentColor,
                bgKey: config.bgKey,
            });
            const url = URL.createObjectURL(file);
            setPreviewFile(file);
            setPreviewUrl(url);
            setShowShareSheet(true);
        } catch (err) {
            console.error('Failed to generate record preview:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const fakeBadge = {
        name: record.label,
        description: `Il mio record: ${record.value}`,
        imageSrc: record.iconSrc!,
        icon: null,
        color: '',
        id: '',
        requirement: '',
        unlocked: true,
        unlockedAt: undefined as string | undefined,
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#0a0a0a]"
            >
                {/* Radial background glow — identical to badges */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at 50% 38%, ${glowColor}15 0%, transparent 55%)`,
                    }}
                />
                {/* Ambient glow layer 1 — large breathing bleed (same as badges) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0.12, 0.25, 0.12], scale: [0.9, 1.2, 0.9] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[15%] w-80 h-80 rounded-full blur-[120px] pointer-events-none"
                    style={{ background: glowColor }}
                />
                {/* Ambient glow layer 2 — tighter ring (same as badges) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-[22%] w-52 h-52 rounded-full blur-[60px] pointer-events-none"
                    style={{ background: glowColor }}
                />

                {/* X close button — glass (same as badges) */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 safe-area-top">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={onClose}
                        className="w-11 h-11 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] active:scale-[0.92] transition-transform flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-white/80" />
                    </motion.button>
                </div>

                {/* Main content — same stagger as badges */}
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                    className="relative z-10 flex flex-col items-center px-8 max-w-sm w-full"
                >
                    {/* Record icon — hero, same size as badges (w-48 h-48) */}
                    <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 10, delay: 0.1 }}
                        className="mb-6"
                    >
                        <img
                            src={record.iconSrc}
                            alt={record.label}
                            className="w-48 h-48 object-contain"
                            style={{
                                filter: `drop-shadow(0 0 30px ${glowColor}40) drop-shadow(0 8px 20px rgba(0,0,0,0.4))`,
                            }}
                        />
                    </motion.div>

                    {/* Value pill — same as badge date pill */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="px-5 py-2 rounded-full mb-4"
                        style={{ background: `${glowColor}20` }}
                    >
                        <span className="text-[22px] font-black tracking-tight" style={{ color: glowColor }}>
                            {record.value}
                        </span>
                    </motion.div>

                    {/* Title — same as badge name */}
                    <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="text-[26px] font-black text-white text-center tracking-tight mb-3"
                        style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                        {record.label}
                    </motion.h2>

                    {/* Subtitle — same as badge requirement */}
                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                        className="text-[15px] text-white/45 text-center leading-relaxed max-w-[280px]">
                        Il tuo record personale su Idoneo
                    </motion.p>
                </motion.div>

                {/* Bottom button — same as badges */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-0 left-0 right-0 p-6 pb-8 safe-area-bottom z-20"
                >
                    <button
                        onClick={handleGeneratePreview}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] bg-[#00B1FF] text-white active:scale-[0.97] transition-transform
                            ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}
                        style={{ boxShadow: '0 4px 24px -4px rgba(0,177,255,0.4)' }}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generazione in corso...
                            </>
                        ) : 'Condividi Record'}
                    </button>
                </motion.div>
            </motion.div>

            {/* Share preview sheet */}
            <AnimatePresence>
                {showShareSheet && previewUrl && previewFile && (
                    <SharePreviewSheet
                        badge={fakeBadge}
                        previewUrl={previewUrl}
                        previewFile={previewFile}
                        onClose={() => setShowShareSheet(false)}
                        glowColor={glowColor}
                        sheetTitle={`Condividi Record`}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================================================
// BADGE DETAIL MODAL — Dark fullscreen cinematic overlay
// ============================================================================
// SHARE PREVIEW SHEET — iOS-style bottom sheet that slides up over the modal
// ============================================================================

function SharePreviewSheet({
    badge,
    previewUrl,
    previewFile,
    onClose,
    glowColor,
    sheetTitle,
}: {
    badge: Badge;
    previewUrl: string;
    previewFile: File;
    onClose: () => void;
    glowColor: string;
    sheetTitle?: string;
}) {
    const handleDownload = () => {
        hapticLight();
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = previewFile.name;
        a.click();
    };

    const handleNativeShare = async () => {
        hapticLight();
        if (navigator.share && navigator.canShare?.({ files: [previewFile] })) {
            try {
                await navigator.share({
                    title: sheetTitle || `Ho sbloccato "${badge.name}" su Idoneo!`,
                    text: badge.description,
                    files: [previewFile],
                });
            } catch { /* cancelled */ }
        } else {
            handleDownload();
        }
    };

    // Share app icons
    const shareApps = [
        {
            label: 'WhatsApp',
            bg: '#25D366',
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.549 4.12 1.507 5.861L.057 23.982l6.233-1.644C7.9 23.452 9.904 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.946 0-3.756-.523-5.307-1.432l-.381-.225-3.697.975.981-3.616-.247-.394C2.523 15.537 2.182 13.815 2.182 12 2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
                </svg>
            ),
        },
        {
            label: 'Instagram',
            bg: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            ),
        },
        {
            label: 'Messaggi',
            bg: '#34C759',
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.824.967 5.424 2.572 7.479L1 23l3.694-1.539C6.584 22.729 9.209 23.5 12 23.5c6.627 0 12-5.149 12-11.5S18.627 0 12 0z" />
                </svg>
            ),
        },
        {
            label: 'Telegram',
            bg: '#2AABEE',
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.014 9.49c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.155 14.53l-2.953-.924c-.643-.2-.657-.643.136-.953l11.537-4.45c.537-.194 1.006.131.687.045z" />
                </svg>
            ),
        },
        {
            label: 'Copia',
            bg: '#636366',
            icon: (
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
            ),
        },
    ];

    return (
        // Backdrop: taps outside dismiss
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[130]"
            onClick={onClose}
        >
            {/* Dark glass overlay on top of blurred badge modal */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Bottom sheet — slides up from the bottom */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 rounded-t-[28px] overflow-hidden"
                style={{ background: '#1c1c1e' }}
            >
                {/* Drag pill */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4 pt-1">
                    <span className="text-white/50 text-[11px] font-bold uppercase tracking-widest">
                        {sheetTitle || 'Condividi Conquista'}
                    </span>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <X className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                {/* Generated image preview */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 20, stiffness: 250 }}
                    className="mx-5 mb-5 rounded-2xl overflow-hidden aspect-square"
                    style={{
                        boxShadow: `0 8px 40px -8px rgba(0,0,0,0.7), 0 0 0 1px ${glowColor}25`,
                    }}
                >
                    <img src={previewUrl} alt="Share preview" className="w-full h-full object-cover" />
                </motion.div>

                {/* Share app icons row */}
                <div className="px-4 mb-4">
                    <div className="flex justify-around">
                        {shareApps.map((app, i) => (
                            <motion.button
                                key={app.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.05 }}
                                onClick={handleNativeShare}
                                className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: app.bg,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {app.icon}
                                </div>
                                <span className="text-[10px] text-white/60 font-medium">{app.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.08] mx-4 mb-2" />

                {/* Bottom action row */}
                <div className="flex gap-3 px-4 pb-10 pt-2">
                    {/* Download */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/[0.08] active:scale-[0.97] transition-transform"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                            <path d="M12 15V3m0 12l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" />
                        </svg>
                        <span className="text-white font-bold text-[14px]">Salva</span>
                    </motion.button>

                    {/* Native share */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        onClick={handleNativeShare}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                        style={{
                            background: '#00B1FF',
                            boxShadow: '0 4px 20px -4px rgba(0,177,255,0.5)',
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                        </svg>
                        <span className="text-white font-black text-[14px]">Altri</span>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================================================
// BADGE DETAIL MODAL — Dark fullscreen cinematic overlay
// ============================================================================

function BadgeDetailModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showShareSheet, setShowShareSheet] = useState(false);

    // Cleanup blob URL on unmount to prevent memory leak
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const handleGeneratePreview = async () => {
        if (isGenerating) return;
        hapticLight();
        setIsGenerating(true);
        try {
            const file = await generateBadgeGraphicFile({
                name: badge.name,
                description: badge.description,
                imageSrc: badge.imageSrc,
                color: badge.color,
            });
            const url = URL.createObjectURL(file);
            setPreviewFile(file);
            setPreviewUrl(url);
            setShowShareSheet(true);
        } catch (error) {
            console.error('Failed to generate preview:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const colorMap: Record<string, string> = {
        'from-blue-400 to-cyan-400': '#38bdf8',
        'from-amber-400 to-orange-500': '#f59e0b',
        'from-slate-700 to-slate-900': '#64748b',
        'from-pink-400 to-rose-500': '#f472b6',
        'from-yellow-400 to-amber-500': '#facc15',
        'from-red-500 to-maroon-700': '#ef4444',
        'from-cyan-400 to-blue-600': '#22d3ee',
        'from-emerald-400 to-teal-600': '#34d399',
        'from-indigo-600 to-purple-900': '#818cf8',
        'from-orange-500 to-red-600': '#f97316',
        'from-slate-300 to-slate-500': '#cbd5e1',
        'from-blue-400 to-indigo-600': '#60a5fa',
        'from-pink-400 via-purple-500 to-cyan-400': '#c084fc',
        'from-purple-400 to-indigo-600': '#a78bfa',
    };
    const glowColor = colorMap[badge.color] || '#60a5fa';

    return (
        <>
            <motion.div
                key="badge-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#0a0a0a]"
            >
                {/* Radial background glow */}
                {badge.unlocked && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `radial-gradient(ellipse at 50% 38%, ${glowColor}15 0%, transparent 55%)`,
                        }}
                    />
                )}
                {/* Ambient glow layer 1 */}
                {badge.unlocked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0.12, 0.25, 0.12], scale: [0.9, 1.2, 0.9] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-[15%] w-80 h-80 rounded-full blur-[120px] pointer-events-none"
                        style={{ background: glowColor }}
                    />
                )}
                {/* Ambient glow layer 2 */}
                {badge.unlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-[22%] w-52 h-52 rounded-full blur-[60px] pointer-events-none"
                        style={{ background: glowColor }}
                    />
                )}

                {/* X close button */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 safe-area-top">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={onClose}
                        className="w-11 h-11 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] active:scale-[0.92] transition-transform flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-white/80" />
                    </motion.button>
                </div>

                {/* Main content */}
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                    className="relative z-10 flex flex-col items-center px-8 max-w-sm w-full"
                >
                    {/* Badge icon — hero */}
                    <motion.div
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 10, delay: 0.1 }}
                        className="mb-6"
                    >
                        <img
                            src={badge.imageSrc}
                            alt={badge.name}
                            className={`w-48 h-48 object-contain ${badge.unlocked ? '' : 'grayscale opacity-20'}`}
                            style={badge.unlocked ? {
                                filter: `drop-shadow(0 0 30px ${glowColor}40) drop-shadow(0 8px 20px rgba(0,0,0,0.4))`,
                            } : undefined}
                        />
                    </motion.div>

                    {/* Date pill */}
                    {badge.unlocked && badge.unlockedAt && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="px-4 py-1.5 rounded-full mb-4"
                            style={{ background: `${glowColor}20` }}
                        >
                            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: glowColor }}>
                                {new Date(badge.unlockedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                            </span>
                        </motion.div>
                    )}

                    {/* Title */}
                    <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="text-[26px] font-black text-white text-center tracking-tight mb-3"
                        style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                        {badge.name}
                    </motion.h2>

                    {/* Requirement */}
                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                        className="text-[15px] text-white/45 text-center leading-relaxed max-w-[280px]">
                        {badge.requirement}
                    </motion.p>
                </motion.div>

                {/* Bottom button */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-0 left-0 right-0 p-6 pb-8 safe-area-bottom z-20"
                >
                    <button
                        onClick={badge.unlocked ? handleGeneratePreview : onClose}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[15px] active:scale-[0.97] transition-transform
                            ${badge.unlocked ? 'bg-[#00B1FF] text-white' : 'bg-white/[0.06] text-white/50 ring-1 ring-white/[0.08]'}
                            ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}
                        style={badge.unlocked ? { boxShadow: '0 4px 24px -4px rgba(0,177,255,0.4)' } : undefined}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generazione in corso...
                            </>
                        ) : badge.unlocked ? 'Condividi Conquista' : 'Ho capito'}
                    </button>
                </motion.div>
            </motion.div>

            {/* Share preview sheet — slides up over the modal */}
            <AnimatePresence>
                {showShareSheet && previewUrl && previewFile && (
                    <SharePreviewSheet
                        badge={badge}
                        previewUrl={previewUrl}
                        previewFile={previewFile}
                        onClose={() => setShowShareSheet(false)}
                        glowColor={glowColor}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================================================
// CONQUISTE PAGE — Light theme, reference structure
// ============================================================================

export default function ConquistePage() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<PersonalRecord | null>(null); // 3. Add selectedRecord state
    const [loading, setLoading] = useState(true);
    const [avgAccuracy, setAvgAccuracy] = useState<number | null>(null);
    const [badgeDates, setBadgeDates] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user?.id) {
            (async () => {
                try {
                    await badgeService.checkAndAwardBadges(user.id);

                    // Try to get badges with dates first
                    const earnedDates = await badgeService.getUserBadgesWithDates(user.id);
                    const earnedIds = Object.keys(earnedDates);

                    if (earnedIds.length > 0) {
                        setUnlockedBadges(earnedIds);
                        setBadgeDates(earnedDates);
                    } else {
                        // Fallback to basic query (in case created_at column doesn't exist)
                        const earned = await badgeService.getUserBadges(user.id);
                        setUnlockedBadges(earned);
                    }

                    // Fetch average accuracy across all finished attempts
                    const { supabase } = await import('@/lib/supabaseClient');
                    const { data: attempts } = await supabase
                        .from('quiz_attempts')
                        .select('correct, total_questions')
                        .eq('user_id', user.id)
                        .not('finished_at', 'is', null)
                        .gt('total_questions', 0);

                    if (attempts && attempts.length > 0) {
                        const totalCorrect = attempts.reduce((sum: number, a: any) => sum + (a.correct || 0), 0);
                        const totalQuestions = attempts.reduce((sum: number, a: any) => sum + (a.total_questions || 0), 0);
                        setAvgAccuracy(totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0);
                    } else {
                        setAvgAccuracy(0);
                    }
                } catch (err) {
                    console.error('ConquistePage: Error:', err);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [user?.id]);

    const badges: Badge[] = BADGE_DEFINITIONS.map(def => ({
        ...def,
        unlocked: unlockedBadges.includes(def.id),
        unlockedAt: badgeDates[def.id],
    }));

    const sorted = [...badges].sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });

    const unlockedCount = badges.filter(b => b.unlocked).length;

    const records: PersonalRecord[] = [
        { label: 'Streak Migliore', value: profile?.streak_max || 0, gradientFrom: '#f97316', gradientTo: '#ef4444', iconSrc: '/icons/flame-ruby.png' },
        { label: 'XP Totali', value: profile?.total_xp || 0, gradientFrom: '#67e8f9', gradientTo: '#0077CC', iconSrc: '/icons/xp.png' },
        { label: 'Precisione Media', value: avgAccuracy !== null ? `${avgAccuracy}%` : '—', gradientFrom: '#34d399', gradientTo: '#059669', iconSrc: '/icons/precisione.png' },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--card-border)]">
                <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-[var(--card)] active:scale-95 flex items-center justify-center transition-all">
                        <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                    <h1 className="text-base font-black text-[var(--foreground)] tracking-tight">Conquiste</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="max-w-lg lg:max-w-4xl mx-auto px-4 lg:px-6 pt-5 pb-32">
                {/* Record personali — horizontal cards */}
                <div className="mb-7">
                    <h2 className="text-lg font-black text-[var(--foreground)] mb-3 tracking-tight">Record personali</h2>
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x pb-1 -mx-4 px-4">
                        {records.map((record, i) => (
                            <motion.div
                                key={record.label}
                                className="shrink-0 snap-start flex-1 min-w-[140px] cursor-pointer"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.06 * i, duration: 0.35, type: 'spring' }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { hapticLight(); setSelectedRecord(record); }}
                            >
                                <RecordCard record={record} index={i} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Premi — 3 column grid */}
                <div>
                    <h2 className="text-lg font-black text-[var(--foreground)] mb-4 tracking-tight">Premi</h2>

                    {loading ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-[90px] h-[90px] rounded-full bg-[var(--card)] animate-pulse" />
                                    <div className="w-14 h-3 rounded-full bg-[var(--card)] animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                            {sorted.map((badge, i) => (
                                <motion.button
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.03 * i, duration: 0.3 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => { hapticLight(); setSelectedBadge(badge); }}
                                    className="flex flex-col items-center gap-1.5"
                                >
                                    {/* Badge image */}
                                    <div className="relative w-[90px] h-[90px] flex items-center justify-center">
                                        <img
                                            src={badge.imageSrc}
                                            alt={badge.name}
                                            className={`w-[82px] h-[82px] object-contain transition-all
                                                ${badge.unlocked
                                                    ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                                                    : 'grayscale opacity-[0.15]'}`}
                                            loading="lazy"
                                        />
                                        {!badge.unlocked && (
                                            <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center shadow-sm">
                                                <Lock className="w-2.5 h-2.5 text-[var(--muted-foreground)]" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span className={`text-[11px] font-bold text-center leading-tight max-w-[90px] line-clamp-2
                                        ${badge.unlocked ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] opacity-50'}`}>
                                        {badge.name}
                                    </span>

                                    {/* Progress */}
                                    <span className={`text-[9px] font-medium ${badge.unlocked ? 'text-[var(--muted-foreground)]' : 'text-[var(--muted-foreground)] opacity-40'}`}>
                                        {badge.unlocked ? '1 di 1' : '0 di 1'}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Record Detail Modal */}
            <AnimatePresence>
                {selectedRecord && (
                    <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
                )}
            </AnimatePresence>

            {/* Badge Detail Modal */}
            <AnimatePresence>
                {selectedBadge && (
                    <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
