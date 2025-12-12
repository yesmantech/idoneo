import React from 'react';

// ================== TYPES ==================

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
    label: string;
    variant?: StatusVariant;
    icon?: string;
    size?: 'sm' | 'md';
}

// ================== VARIANT CONFIG ==================

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; border: string }> = {
    success: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
    },
    warning: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
    },
    error: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
    },
    info: {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
        border: 'border-sky-500/20',
    },
    neutral: {
        bg: 'bg-slate-800',
        text: 'text-slate-400',
        border: 'border-slate-700',
    },
};

// ================== MAIN COMPONENT ==================

export default function StatusBadge({
    label,
    variant = 'neutral',
    icon,
    size = 'sm',
}: StatusBadgeProps) {
    const styles = VARIANT_STYLES[variant];

    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-[10px]'
        : 'px-3 py-1 text-xs';

    return (
        <span className={`
            inline-flex items-center gap-1 rounded-full font-medium border
            ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses}
        `}>
            {icon && <span>{icon}</span>}
            {label}
        </span>
    );
}

// ================== PRESETS ==================

// Common status configurations for reuse
export const STATUS_PRESETS = {
    published: { label: 'Pubblicato', variant: 'success' as const, icon: '✓' },
    draft: { label: 'Bozza', variant: 'neutral' as const, icon: '📝' },
    scheduled: { label: 'Programmato', variant: 'info' as const, icon: '⏰' },
    archived: { label: 'Archiviato', variant: 'warning' as const, icon: '📦' },
    active: { label: 'Attivo', variant: 'success' as const },
    inactive: { label: 'Inattivo', variant: 'neutral' as const },
};
