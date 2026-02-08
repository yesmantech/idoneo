import { motion } from 'framer-motion';

interface BandoSkeletonProps {
    variant?: 'card' | 'detail';
}

export default function BandoSkeleton({ variant = 'card' }: BandoSkeletonProps) {
    if (variant === 'detail') {
        return (
            <div className="animate-pulse space-y-6 p-4">
                {/* Header skeleton */}
                <div className="space-y-3">
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>

                {/* Meta info */}
                <div className="flex gap-4">
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>

                {/* Content blocks */}
                <div className="space-y-4">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 animate-pulse">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="flex gap-3">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                </div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
        </div>
    );
}

export function BandoCardSkeletonList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <BandoSkeleton />
                </motion.div>
            ))}
        </div>
    );
}
