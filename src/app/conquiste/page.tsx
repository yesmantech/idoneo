import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Share2, Lock, Zap, Flame, Calendar, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { badgeService } from '@/lib/badgeService';
import { BADGE_DEFINITIONS, BadgeDefinition } from '@/lib/badgeDefinitions';
import { hapticLight } from '@/lib/haptics';
import { useNavigate } from 'react-router-dom';
import { BadgeGlow } from '@/components/gamification/BadgeGlow';

interface Badge extends BadgeDefinition {
    unlocked: boolean;
}

// ============================================================================
// RECORD PERSONALI — Stat cards with gradient circles + number overlay
// ============================================================================

interface PersonalRecord {
    label: string;
    value: string | number;
    gradientFrom: string;
    gradientTo: string;
}

function RecordCard({ record, index }: { record: PersonalRecord; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * index, duration: 0.35, type: 'spring' }}
            className="shrink-0 w-[130px] snap-start"
        >
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden relative h-[150px] flex flex-col items-center justify-center px-2 py-3">
                {/* Icon circle with number */}
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center relative mb-2 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${record.gradientFrom}, ${record.gradientTo})` }}
                >
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className="absolute inset-0" style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)'
                        }} />
                    </div>
                    <span className="relative z-10 text-white text-lg font-black drop-shadow-md">
                        {record.value}
                    </span>
                </div>

                <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-center leading-tight">
                    {record.label}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// BADGE DETAIL MODAL — Dark fullscreen cinematic overlay
// ============================================================================

function BadgeDetailModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
    const handleShare = async () => {
        hapticLight();
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Ho sbloccato "${badge.name}" su Idoneo!`,
                    text: badge.description,
                    url: window.location.origin,
                });
            }
        } catch { /* cancelled */ }
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
        <motion.div
            key="badge-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center"
            style={{ background: '#0a0a0a' }}
        >
            {badge.unlocked && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: [0.12, 0.22, 0.12], scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[18%] w-80 h-80 rounded-full blur-[120px]"
                    style={{ background: glowColor }}
                />
            )}

            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 safe-area-top">
                <button onClick={onClose} className="w-11 h-11 rounded-full bg-white/[0.07] active:bg-white/[0.12] flex items-center justify-center">
                    <X className="w-5 h-5 text-white/70" />
                </button>
                {badge.unlocked && (
                    <button onClick={handleShare} className="w-11 h-11 rounded-full bg-white/[0.07] active:bg-white/[0.12] flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-white/70" />
                    </button>
                )}
            </div>

            <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260, delay: 0.1 }}
                className="relative z-10 flex flex-col items-center px-8 max-w-sm w-full"
            >
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.2 }}
                    className="mb-8"
                >
                    <img
                        src={badge.imageSrc}
                        alt={badge.name}
                        className={`w-40 h-40 object-contain ${badge.unlocked ? 'drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]' : 'grayscale opacity-25'}`}
                    />
                </motion.div>

                <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="text-2xl font-black text-white text-center tracking-tight mb-2">
                    {badge.name}
                </motion.h2>

                <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="text-[15px] text-white/50 text-center leading-relaxed mb-6 max-w-[260px]">
                    {badge.description}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                    className={`px-5 py-3 rounded-2xl text-center text-[13px] font-bold leading-snug mb-10 max-w-[280px]
                        ${badge.unlocked ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-white/[0.03] text-white/40 ring-1 ring-white/[0.06]'}`}>
                    {badge.unlocked ? '✓ ' : ''}{badge.requirement}
                </motion.div>

                <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                    onClick={badge.unlocked ? handleShare : onClose}
                    className={`w-full py-4 rounded-2xl font-black text-base active:scale-[0.97] transition-transform relative overflow-hidden
                        ${badge.unlocked ? `bg-gradient-to-r ${badge.color} text-white shadow-xl` : 'bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08]'}`}>
                    {badge.unlocked && (
                        <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
                    )}
                    <span className="relative z-10">{badge.unlocked ? 'Condividi Conquista' : 'Ho capito'}</span>
                </motion.button>
            </motion.div>
        </motion.div>
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            (async () => {
                try {
                    await badgeService.checkAndAwardBadges(user.id);
                    const earned = await badgeService.getUserBadges(user.id);
                    setUnlockedBadges(earned);
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
    }));

    const sorted = [...badges].sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });

    const unlockedCount = badges.filter(b => b.unlocked).length;

    const records: PersonalRecord[] = [
        { label: 'Streak Migliore', value: profile?.streak_max || 0, gradientFrom: '#f97316', gradientTo: '#ef4444' },
        { label: 'XP Totali', value: profile?.total_xp || 0, gradientFrom: '#f59e0b', gradientTo: '#f97316' },
        { label: 'Badge Ottenuti', value: unlockedCount, gradientFrom: '#34d399', gradientTo: '#14b8a6' },
        { label: 'Streak Attuale', value: profile?.streak_current || 0, gradientFrom: '#60a5fa', gradientTo: '#6366f1' },
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

            <div className="max-w-lg mx-auto px-4 pt-5 pb-32">
                {/* Record personali — horizontal cards */}
                <div className="mb-7">
                    <h2 className="text-lg font-black text-[var(--foreground)] mb-3 tracking-tight">Record personali</h2>
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide snap-x pb-1 -mx-1 px-1">
                        {records.map((record, i) => (
                            <RecordCard key={record.label} record={record} index={i} />
                        ))}
                    </div>
                </div>

                {/* Premi — 3 column grid */}
                <div>
                    <h2 className="text-lg font-black text-[var(--foreground)] mb-4 tracking-tight">Premi</h2>

                    {loading ? (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-[90px] h-[90px] rounded-full bg-[var(--card)] animate-pulse" />
                                    <div className="w-14 h-3 rounded-full bg-[var(--card)] animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-6">
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
                                    {/* Badge image with Tier S glow */}
                                    <BadgeGlow color={badge.color} unlocked={badge.unlocked} size={90}>
                                        <div className="relative w-[82px] h-[82px] flex items-center justify-center">
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
                                    </BadgeGlow>

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

            {/* Detail Modal — keeps dark for cinematic effect */}
            <AnimatePresence>
                {selectedBadge && (
                    <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
