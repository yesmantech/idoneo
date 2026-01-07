import React from 'react';

// =============================================================================
// SKELETON - Reusable loading placeholder component
// =============================================================================

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
    animation = 'pulse'
}: SkeletonProps) {
    const baseClasses = 'bg-slate-200 dark:bg-slate-700';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-xl'
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: ''
    };

    const style: React.CSSProperties = {
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? '1em' : undefined),
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

// Preset skeleton components for common use cases
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-[var(--card)] rounded-[24px] p-5 shadow-soft ${className}`}>
            <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                </div>
            </div>
            <Skeleton variant="rounded" height={100} className="mb-3" />
            <div className="flex gap-2">
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
            </div>
        </div>
    );
}

export function SkeletonList({ count = 3, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-[var(--card)] rounded-xl">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="70%" height={14} />
                        <Skeleton variant="text" width="40%" height={10} />
                    </div>
                    <Skeleton variant="rounded" width={60} height={24} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonStats({ className = '' }: { className?: string }) {
    return (
        <div className={`flex gap-3 ${className}`}>
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 bg-white dark:bg-[var(--card)] rounded-2xl p-4 text-center">
                    <Skeleton variant="circular" width={32} height={32} className="mx-auto mb-2" />
                    <Skeleton variant="text" width="60%" height={24} className="mx-auto mb-1" />
                    <Skeleton variant="text" width="80%" height={10} className="mx-auto" />
                </div>
            ))}
        </div>
    );
}
