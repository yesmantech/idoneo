import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Clock, Heart, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bando } from '@/lib/bandiService';

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

    const handleSaveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSaveToggle?.(bando.id, !isSaved);
    };

    if (variant === 'compact') {
        return (
            <Link to={`/bandi/${bando.slug}`}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
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
                                {bando.title}
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
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white overflow-hidden min-w-[280px] shadow-lg shadow-emerald-500/20"
                >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 opacity-80" />
                            <span className="text-sm opacity-90 truncate">{bando.ente?.name}</span>
                        </div>

                        <motion.h3
                            layoutId={`bando-title-${bando.id}`}
                            className="font-bold text-lg leading-tight line-clamp-2 mb-3"
                        >
                            {bando.title}
                        </motion.h3>

                        <div className="flex items-center gap-4 text-sm opacity-90">
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
                                </span>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm font-medium">
                                ⏰ Scade tra {daysRemaining} giorni
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
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
                            {bando.title}
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
                        </div>

                        {/* Tags */}
                        {bando.category && (
                            <div className="mt-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                                    {bando.category.icon} {bando.category.name}
                                </span>
                            </div>
                        )}
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
