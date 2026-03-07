import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Clock, Heart, Building2, ExternalLink, GraduationCap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bando } from '@/lib/bandiService';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getCategoryStyle } from '@/lib/categoryIcons';

interface BandoCardProps {
    bando: Bando;
    variant?: 'default' | 'compact' | 'featured';
    onSaveToggle?: (bandoId: string, saved: boolean) => void;
    isSaved?: boolean;
}

export default function BandoCard({ bando, variant = 'default', onSaveToggle, isSaved = false }: BandoCardProps) {
    const daysRemaining = bando.days_remaining ?? 0;
    const isClosingSoon = daysRemaining <= 7 && daysRemaining > 0;
    const isClosed = daysRemaining <= 0;
    const queryClient = useQueryClient();

    const handleSaveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSaveToggle?.(bando.id, !isSaved);
    };

    const handleMouseEnter = () => {
        queryClient.prefetchQuery({
            queryKey: ['bando', bando.slug],
            queryFn: async () => {
                const { data } = await supabase.from('bandi').select('*, category:categories(*)').eq('slug', bando.slug).single();
                return data;
            },
            staleTime: 1000 * 60 * 5, // 5 mins
        });
    };

    if (variant === 'compact') {
        return (
            <Link to={`/bandi/${bando.slug}`}>
                <motion.div
                    onMouseEnter={handleMouseEnter}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-[#111] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {bando.ente?.name || 'Ente non specificato'}
                            </p>
                            <motion.h4
                                layoutId={`bando-title-${bando.id}`}
                                className="font-semibold text-slate-900 dark:text-white text-sm mt-1 line-clamp-2"
                            >
                                {bando.short_title || bando.title}
                            </motion.h4>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                {bando.seats_total && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {bando.seats_total}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1 ${isClosingSoon ? 'text-amber-500 font-medium' : ''}`}>
                                    <Clock className="w-3 h-3" />
                                    {daysRemaining}gg
                                </span>
                            </div>
                        </div>
                        <BandoStatusBadge daysRemaining={daysRemaining} size="sm" />
                    </div>
                </motion.div>
            </Link>
        );
    }

    if (variant === 'featured') {
        return (
            <Link to={`/bandi/${bando.slug}`}>
                <motion.div
                    onMouseEnter={handleMouseEnter}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-[280px] sm:w-[320px] h-full bg-[var(--card)] rounded-3xl shadow-sm hover:shadow-xl hover:shadow-[#00B1FF]/10 border border-[var(--card-border)] hover:border-[#00B1FF]/30 overflow-hidden group transition-all duration-500 flex flex-col"
                >
                    {/* Subtle Glow Background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-[#00B1FF]/10 blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="p-6 flex flex-col h-full relative z-10 space-y-4">
                        {/* Header: Icon & Ente Name */}
                        <div className="flex items-start gap-3">
                            {(() => {
                                const { Icon: CatIcon, color: catColor, bg: catBg, bgLight: catBgLight } = getCategoryStyle(bando.category?.name); return (
                                    <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 cat-icon-bg" style={{ '--cat-bg-light': catBgLight, '--cat-bg-dark': catBg, backgroundColor: catBgLight } as React.CSSProperties}>
                                        <CatIcon className="w-5 h-5" style={{ color: catColor }} />
                                    </div>
                                );
                            })()}
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-2 leading-tight flex-1 pt-1">
                                {bando.ente?.name || 'Ente Non Specificato'}
                            </span>
                        </div>

                        {/* Title */}
                        <motion.h3
                            layoutId={`bando-title-${bando.id}`}
                            className="font-black text-lg text-[var(--foreground)] leading-tight mb-auto line-clamp-3 group-hover:text-[#00B1FF] transition-colors duration-300"
                        >
                            {bando.short_title || bando.title}
                        </motion.h3>

                        {/* Footer Info */}
                        <div className="pt-4 border-t border-[var(--card-border)] mt-auto space-y-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[120px]">{bando.region || 'Nazionale'}</span>
                                </div>
                                {bando.seats_total && (
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{bando.seats_total} posti</span>
                                    </div>
                                )}
                            </div>

                            {/* Urgency Badge (Tier S Style) */}
                            <div className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border transition-colors ${daysRemaining <= 3
                                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-[0_0_15px_-3px_rgba(225,29,72,0.1)]'
                                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]'
                                }`}>
                                <Clock className={`w-4 h-4 ${daysRemaining <= 3 ? 'animate-pulse' : ''}`} />
                                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {daysRemaining <= 2 ? 'Scadenza Imminente' : `Scade tra ${daysRemaining} gg`}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        );
    }

    // Default variant
    return (
        <Link to={`/bandi/${bando.slug}`}>
            <motion.div
                onMouseEnter={handleMouseEnter}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white dark:bg-[#111] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {/* Ente */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                            <Building2 className="w-4 h-4" />
                            <span className="truncate">{bando.ente?.name || 'Ente non specificato'}</span>
                        </div>

                        {/* Title */}
                        <motion.h3
                            layoutId={`bando-title-${bando.id}`}
                            className="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight"
                        >
                            {bando.short_title || bando.title}
                        </motion.h3>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500 dark:text-slate-400">
                            {bando.region && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {bando.region}
                                </span>
                            )}
                            {bando.seats_total && (
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {bando.seats_total} posti
                                    {bando.seats_reserved ? ` (${bando.seats_reserved} ris.)` : ''}
                                </span>
                            )}
                            {bando.education_level && bando.education_level.length > 0 && bando.education_level[0] !== 'Nessuno' && (
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="w-4 h-4" />
                                    {bando.education_level[0]}
                                </span>
                            )}
                            {bando.is_remote && (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <Globe className="w-4 h-4" />
                                    Smart Working
                                </span>
                            )}
                        </div>

                        {/* Tags */}
                        {bando.category && (() => {
                            const { Icon: CatIcon, color: catColor, bg: catBg, bgLight: catBgLight } = getCategoryStyle(bando.category.name); return (
                                <div className="mt-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold cat-icon-bg" style={{ '--cat-bg-light': catBgLight, '--cat-bg-dark': catBg, backgroundColor: catBgLight, color: catColor } as React.CSSProperties}>
                                        <CatIcon className="w-3.5 h-3.5" style={{ color: catColor }} />
                                        {bando.category.name}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Right side: Status + Save */}
                    <div className="flex flex-col items-end gap-3">
                        <BandoStatusBadge daysRemaining={daysRemaining} />

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSaveClick}
                            className={`p-2 rounded-xl transition-colors ${isSaved
                                ? 'bg-red-50 dark:bg-red-500/20 text-red-500'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-red-500'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface BandoStatusBadgeProps {
    daysRemaining: number;
    size?: 'sm' | 'md';
}

function BandoStatusBadge({ daysRemaining, size = 'md' }: BandoStatusBadgeProps) {
    let bgColor: string;
    let textColor: string;
    let label = `${daysRemaining}gg`;
    let pulse = false;

    if (daysRemaining <= 0) {
        // Closed
        bgColor = 'bg-slate-200/80 dark:bg-slate-700';
        textColor = 'text-slate-500 dark:text-slate-400';
        label = 'Chiuso';
    } else if (daysRemaining <= 1) {
        // TODAY / TOMORROW — critical red with pulse
        bgColor = 'bg-red-500';
        textColor = 'text-white';
        label = daysRemaining === 0 ? 'OGGI' : 'DOMANI';
        pulse = true;
    } else if (daysRemaining <= 3) {
        // 2-3 days — red
        bgColor = 'bg-red-100 dark:bg-red-500/20';
        textColor = 'text-red-600 dark:text-red-400';
    } else if (daysRemaining <= 7) {
        // 4-7 days — orange
        bgColor = 'bg-orange-100 dark:bg-orange-500/20';
        textColor = 'text-orange-600 dark:text-orange-400';
    } else if (daysRemaining <= 14) {
        // 8-14 days — amber/yellow
        bgColor = 'bg-amber-100 dark:bg-amber-500/15';
        textColor = 'text-amber-600 dark:text-amber-400';
    } else if (daysRemaining <= 30) {
        // 15-30 days — sky blue (plenty of time)
        bgColor = 'bg-sky-100 dark:bg-sky-500/15';
        textColor = 'text-sky-600 dark:text-sky-400';
    } else {
        // 30+ days — green (lots of time)
        bgColor = 'bg-emerald-100 dark:bg-emerald-500/15';
        textColor = 'text-emerald-600 dark:text-emerald-400';
    }

    const sizeClasses = size === 'sm'
        ? 'px-2.5 py-1 text-[11px]'
        : 'px-3 py-1.5 text-[12px]';

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${bgColor} ${textColor} ${sizeClasses} rounded-xl font-black tracking-tight flex items-center gap-1.5 ${pulse ? 'animate-pulse' : ''}`}
        >
            <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            {label}
        </motion.div>
    );
}

export { BandoStatusBadge };
