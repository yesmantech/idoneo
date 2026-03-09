import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { badgeService } from '@/lib/badgeService';
import { BADGE_DEFINITIONS, BadgeDefinition } from '@/lib/badgeDefinitions';
import { hapticLight } from '@/lib/haptics';
import { Link } from 'react-router-dom';
import { BadgeGlow } from '@/components/gamification/BadgeGlow';

interface Badge extends BadgeDefinition {
    unlocked: boolean;
}

/**
 * Profile page: "CONQUISTE >" badge strip.
 * Light theme, horizontal 3D badge icons.
 * Matches Duolingo reference structure.
 */
export default function BadgesBlock() {
    const { user } = useAuth();
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchBadges();
        }
    }, [user?.id]);

    const fetchBadges = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            await badgeService.checkAndAwardBadges(user.id);
            const earned = await badgeService.getUserBadges(user.id);
            setUnlockedBadges(earned);
        } catch (err) {
            console.error('BadgesBlock: Error fetching badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const allBadges: Badge[] = BADGE_DEFINITIONS.map(def => ({
        ...def,
        unlocked: unlockedBadges.includes(def.id),
    }));

    const earned = allBadges.filter(b => b.unlocked);
    const locked = allBadges.filter(b => !b.unlocked);

    // Show max 4 badges: earned first, then locked to fill
    const displayBadges = [...earned, ...locked].slice(0, 4);

    if (loading && !earned.length) return null;

    return (
        <div className="mb-5 mt-2">
            {/* Header: "CONQUISTE >" */}
            <Link
                to="/conquiste"
                onClick={() => hapticLight()}
                className="flex items-center justify-between mb-3 px-1 group"
            >
                <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.14em]">
                        Conquiste
                    </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-active:text-brand-blue transition-colors" />
            </Link>

            {/* Badge strip — exactly 4 badges, evenly spaced */}
            {earned.length > 0 ? (
                <Link to="/conquiste" className="block">
                    <div className="flex justify-between px-2">
                        {displayBadges.map((badge, i) => (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.06 * i, duration: 0.3, type: 'spring', stiffness: 300 }}
                                className="flex items-center justify-center"
                            >
                                <div className="w-[76px] h-[76px] flex items-center justify-center">
                                    <img
                                        src={badge.imageSrc}
                                        alt={badge.name}
                                        className={`w-[70px] h-[70px] object-contain transition-all
                                            ${badge.unlocked
                                                ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
                                                : 'grayscale opacity-[0.15]'}`}
                                        loading="lazy"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Link>
            ) : (
                <Link
                    to="/conquiste"
                    className="mx-1 py-5 rounded-2xl border-2 border-dashed border-[var(--card-border)] flex items-center justify-center"
                >
                    <p className="text-xs text-[var(--muted-foreground)] font-bold">Inizia a giocare per sbloccare badge!</p>
                </Link>
            )}
        </div>
    );
}
