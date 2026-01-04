import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Zap, Trophy, Crown, Flame, GraduationCap, Medal, Users, ShieldCheck, Crosshair, Sparkles, BookOpen, Moon, Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { badgeService } from '@/lib/badgeService';
import { supabase } from '@/lib/supabaseClient';

interface Badge {
    id: string;
    name: string;
    icon: React.ReactNode;
    unlocked: boolean;
    description: string;
    requirement: string;
    color: string;
}

export default function BadgesBlock() {
    const { user, profile } = useAuth();
    const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [loading, setLoading] = useState(true);
    const [debugData, setDebugData] = useState<any>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Use role-based check instead of hardcoded emails
    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (user?.id) {
            fetchBadges();
        }
    }, [user?.id]);

    const fetchBadges = async () => {
        if (!user?.id) {
            console.warn('BadgesBlock: No user ID found');
            return;
        }
        setLoading(true);
        console.log('BadgesBlock: Fetching badges for', user.id);
        try {
            // First check if any new badges should be awarded
            await badgeService.checkAndAwardBadges(user.id);
            console.log('BadgesBlock: checkAndAwardBadges completed');

            // Then fetch all awarded badges
            const earned = await badgeService.getUserBadges(user.id);
            console.log('BadgesBlock: User ID:', user.id);
            console.log('BadgesBlock: Earned badges raw:', earned);
            setUnlockedBadges(earned);

            // Fetch debug data for admins
            if (isAdmin) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('total_xp, current_streak, referral_count')
                    .eq('id', user.id)
                    .single();
                setDebugData(profile);
            }
        } catch (err) {
            console.error('BadgesBlock: Error fetching badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const badges: Badge[] = [
        {
            id: 'primo_passo',
            name: 'Primo Passo',
            icon: <Target className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('primo_passo'),
            description: 'Benvenuto a bordo! Hai iniziato il tuo percorso verso il successo.',
            requirement: 'Hai completato la tua prima simulazione su Idoneo.',
            color: 'from-blue-400 to-cyan-400'
        },
        {
            id: 'secchione',
            name: 'Secchione',
            icon: <GraduationCap className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('secchione'),
            description: 'La perfezione fatta persona. Non hai sbagliato neanche una virgola!',
            requirement: 'Hai ottenuto il 100% in una simulazione ufficiale (min. 10 domande).',
            color: 'from-amber-400 to-orange-500'
        },
        {
            id: 'veterano',
            name: 'Veterano',
            icon: <ShieldCheck className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('veterano'),
            description: 'La tua esperienza è un esempio per tutti. Conosci i quiz a memoria!',
            requirement: 'Rispondi correttamente a 1.000 quiz (Raggiungi 1.000 XP).',
            color: 'from-slate-700 to-slate-900'
        },
        {
            id: 'social',
            name: 'Social-ONE',
            icon: <Users className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('social'),
            description: 'Studiare in compagnia è meglio! Sei un vero leader della community.',
            requirement: 'Invita con successo 5 amici a iscriversi su Idoneo.',
            color: 'from-pink-400 to-rose-500'
        },
        {
            id: 'inarrestabile',
            name: 'Inarrestabile',
            icon: <Zap className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('inarrestabile'),
            description: 'Niente può fermare la tua voglia di imparare. Sei un treno!',
            requirement: 'Mantieni una streak di studio per 30 giorni consecutivi.',
            color: 'from-yellow-400 to-amber-500'
        },
        {
            id: 'cecchino',
            name: 'Cecchino',
            icon: <Crosshair className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('cecchino'),
            description: 'Ogni colpo va a segno. La tua precisione è chirurgica.',
            requirement: 'Completa 10 simulazioni di fila con un\'accuratezza superiore al 90%.',
            color: 'from-red-500 to-maroon-700'
        },
        {
            id: 'fulmine',
            name: 'Fulmine',
            icon: <Zap className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('fulmine'),
            description: 'Velocità e precisione. Hai finito il test prima ancora di iniziarlo!',
            requirement: 'Completa 5 simulazioni in meno della metà del tempo con un punteggio > 80%.',
            color: 'from-cyan-400 to-blue-600'
        },
        {
            id: 'enciclopedia',
            name: 'Enciclopedia',
            icon: <BookOpen className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('enciclopedia'),
            description: 'La tua conoscenza non ha confini. Hai esplorato ogni angolo del sapere.',
            requirement: 'Completa almeno un quiz in tutte le categorie disponibili.',
            color: 'from-emerald-400 to-teal-600'
        },
        {
            id: 'nottambulo',
            name: 'Nottambulo',
            icon: <Moon className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('nottambulo'),
            description: 'Il successo non dorme mai. Le tue ore piccole porteranno grandi risultati.',
            requirement: 'Completa 5 simulazioni tra l\'una e le cinque del mattino.',
            color: 'from-indigo-600 to-purple-900'
        },
        {
            id: 'hub_master',
            name: 'Master Hub',
            icon: <Compass className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('hub_master'),
            description: 'Sei il re del territorio. Nessun concorso ha segreti per te.',
            requirement: 'Partecipa a simulazioni per 5 concorsi diversi.',
            color: 'from-orange-500 to-red-600'
        },
        {
            id: 'costanza',
            name: 'Costanza',
            icon: <Flame className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('costanza'),
            description: 'Il segreto del successo è la regolarità. Continua così!',
            requirement: 'Completa almeno una simulazione al giorno per 7 giorni di fila.',
            color: 'from-orange-400 to-red-500'
        },
        {
            id: 'leggenda',
            name: 'Leggenda',
            icon: <Crown className="w-8 h-8" />,
            unlocked: unlockedBadges.includes('leggenda'),
            description: 'Sei tra i migliori aspiranti d\'Italia. Continua a scalare la vetta!',
            requirement: 'Raggiungi la Top 10 nella classifica globale (Gold League).',
            color: 'from-purple-400 to-indigo-600'
        },
    ];

    if (loading && !badges.length) return null;

    return (
        <div className="mb-10 mt-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">I tuoi Badge</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
                        >
                            DEBUG
                        </button>
                    )}
                    <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-full">{unlockedCount(badges)} / {badges.length}</span>
                </div>
            </div>

            {/* Debug Info Overlay */}
            {showDebug && debugData && (
                <div className="mx-2 mb-4 p-4 bg-slate-900 rounded-3xl text-white text-[11px] font-mono leading-relaxed shadow-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Admin Debug Mode</span>
                        <div className="flex gap-2">
                            <button onClick={() => fetchBadges()} className="text-blue-400 hover:text-blue-300">REFRESH</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1">
                        <div className="text-slate-400 text-[10px] uppercase">Total XP:</div>
                        <div className="text-right font-bold text-brand-green">{debugData.total_xp || 0}</div>

                        <div className="text-slate-400 text-[10px] uppercase">Streak:</div>
                        <div className="text-right font-bold text-orange-400">{debugData.current_streak || 0} giorni</div>

                        <div className="text-slate-400 text-[10px] uppercase">Referrals:</div>
                        <div className="text-right font-bold text-pink-400">{debugData.referral_count || 0}</div>

                        <div className="text-slate-400 text-[10px] uppercase">Badge Count:</div>
                        <div className="text-right font-bold text-cyan-400">{unlockedBadges.length}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/10 text-[9px] text-slate-500 overflow-x-auto whitespace-nowrap">
                        Earned: {unlockedBadges.join(', ')}
                    </div>
                </div>
            )}

            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x px-2 pt-2">
                {badges.map(badge => (
                    <motion.div
                        key={badge.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBadge(badge)}
                        className="flex-none snap-start w-24 flex flex-col items-center gap-3 cursor-pointer"
                    >
                        {/* Squircle Shape with Effects */}
                        <div className={`relative w-20 h-20 flex items-center justify-center rounded-[24px] transition-all duration-300 shadow-sm
                            ${badge.unlocked
                                ? `bg-gradient-to-br ${badge.color} text-white shadow-lg shadow-black/5`
                                : 'bg-slate-100/80 text-slate-400 grayscale border border-slate-100'
                            }`}
                        >
                            {/* Inner Shine for Unlocked Badges */}
                            {badge.unlocked && (
                                <div className="absolute inset-0 bg-white/20 rounded-[24px] pointer-events-none opacity-50"
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                            )}

                            {/* Locked Overlay Icon */}
                            {!badge.unlocked && (
                                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50">
                                    <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center">
                                        <X className="w-2.5 h-2.5 text-slate-400" strokeWidth={4} />
                                    </div>
                                </div>
                            )}

                            <div className="z-10 relative drop-shadow-sm">
                                {badge.icon}
                            </div>
                        </div>

                        <span className={`text-[10px] font-black text-center leading-tight uppercase tracking-wide
                            ${badge.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                            {badge.name}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Premium Badge Modal */}
            <AnimatePresence>
                {selectedBadge && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBadge(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl text-center overflow-hidden"
                        >
                            {/* Animated Background Decor */}
                            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${selectedBadge.color} opacity-10 rounded-full blur-3xl`} />
                            <div className={`absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br ${selectedBadge.color} opacity-10 rounded-full blur-3xl`} />

                            <button
                                onClick={() => setSelectedBadge(null)}
                                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Large Badge Preview */}
                            <div className={`w-28 h-28 rounded-[32px] bg-gradient-to-br ${selectedBadge.unlocked ? selectedBadge.color : 'from-slate-100 to-slate-200'}
                                flex items-center justify-center mx-auto mb-8 shadow-2xl relative group`}
                            >
                                {selectedBadge.unlocked && (
                                    <div className="absolute inset-0 bg-white/20 rounded-[32px] pointer-events-none"
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                                )}
                                <div className={`${selectedBadge.unlocked ? 'text-white' : 'text-slate-400'} drop-shadow-md scale-125`}>
                                    {selectedBadge.icon}
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">
                                {selectedBadge.name}
                            </h3>

                            <p className="text-slate-600 text-sm font-bold leading-relaxed mb-6 px-4">
                                "{selectedBadge.description}"
                            </p>

                            <div className={`p-5 rounded-3xl text-left border mb-8
                                ${selectedBadge.unlocked
                                    ? 'bg-emerald-50 border-emerald-100/50'
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center
                                        ${selectedBadge.unlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <Medal className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {selectedBadge.unlocked ? 'Badge Ottenuto' : 'Come sbloccare'}
                                    </span>
                                </div>
                                <p className={`text-[13px] font-black leading-snug
                                    ${selectedBadge.unlocked ? 'text-emerald-700' : 'text-slate-600'}`}>
                                    {selectedBadge.requirement}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedBadge(null)}
                                className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-transform active:scale-95
                                    ${selectedBadge.unlocked
                                        ? `bg-gradient-to-r ${selectedBadge.color} shadow-black/10`
                                        : 'bg-slate-900 shadow-black/10'
                                    }`}
                            >
                                {selectedBadge.unlocked ? 'Condividi Traguardo' : 'Ho capito'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function unlockedCount(badges: Badge[]) {
    return badges.filter(b => b.unlocked).length;
}
