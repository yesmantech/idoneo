import { motion } from 'framer-motion';
import { Search, Heart, Frown, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
    type: 'no-results' | 'no-saved' | 'error' | 'offline';
    searchQuery?: string;
    onRetry?: () => void;
    onClearFilters?: () => void;
}

export default function BandiEmptyState({ type, searchQuery, onRetry, onClearFilters }: EmptyStateProps) {
    const config = {
        'no-results': {
            icon: Search,
            title: searchQuery ? `Nessun risultato per "${searchQuery}"` : 'Nessun bando trovato',
            description: 'Prova a modificare i filtri o i termini di ricerca',
            color: 'from-blue-500 to-indigo-600',
            bgGlow: 'bg-blue-500/10',
            action: onClearFilters ? {
                label: 'Rimuovi filtri',
                onClick: onClearFilters
            } : undefined
        },
        'no-saved': {
            icon: Heart,
            title: 'Nessun bando salvato',
            description: 'Esplora i bandi e salva quelli che ti interessano',
            color: 'from-pink-500 to-rose-600',
            bgGlow: 'bg-pink-500/10',
            action: {
                label: 'Sfoglia Bandi',
                href: '/bandi'
            }
        },
        'error': {
            icon: Frown,
            title: 'Qualcosa è andato storto',
            description: 'Non siamo riusciti a caricare i bandi. Riprova.',
            color: 'from-amber-500 to-orange-600',
            bgGlow: 'bg-amber-500/10',
            action: onRetry ? {
                label: 'Riprova',
                onClick: onRetry
            } : undefined
        },
        'offline': {
            icon: WifiOff,
            title: 'Sei offline',
            description: 'I dati mostrati potrebbero non essere aggiornati',
            color: 'from-slate-500 to-slate-700',
            bgGlow: 'bg-slate-500/10',
            action: undefined
        }
    };

    const { icon: Icon, title, description, action, color, bgGlow } = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center justify-center py-24 px-6 text-center overflow-hidden"
        >
            {/* Background Mesh Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${bgGlow} blur-[100px] rounded-full -z-10`} />

            {/* Glassmorphic Icon Container */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="relative mb-8"
            >
                <div className="absolute inset-0 bg-white/20 dark:bg-white/5 blur-2xl rounded-full" />
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-28 h-28 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 flex items-center justify-center border border-white/40 dark:border-white/10 backdrop-blur-xl"
                >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                </motion.div>
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3"
            >
                {title}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 dark:text-slate-400 mb-10 max-w-sm leading-relaxed"
            >
                {description}
            </motion.p>

            {action && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {'href' in action ? (
                        <Link
                            to={action.href}
                            className="group relative flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            {action.label}
                        </Link>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={action.onClick}
                            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-cyan text-white font-bold shadow-xl shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all duration-300"
                        >
                            {type === 'error' ? <RefreshCw className="w-5 h-5" /> : <Search className="w-5 h-5 opacity-60" />}
                            {action.label}
                        </motion.button>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
