import { motion } from 'framer-motion';
import { Search, Heart, Frown, WifiOff, RefreshCw } from 'lucide-react';
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
            action: onClearFilters ? {
                label: 'Rimuovi filtri',
                onClick: onClearFilters
            } : undefined
        },
        'no-saved': {
            icon: Heart,
            title: 'Nessun bando salvato',
            description: 'Esplora i bandi e salva quelli che ti interessano',
            action: {
                label: 'Sfoglia Bandi',
                href: '/bandi'
            }
        },
        'error': {
            icon: Frown,
            title: 'Qualcosa è andato storto',
            description: 'Non siamo riusciti a caricare i bandi. Riprova.',
            action: onRetry ? {
                label: 'Riprova',
                onClick: onRetry
            } : undefined
        },
        'offline': {
            icon: WifiOff,
            title: 'Sei offline',
            description: 'I dati mostrati potrebbero non essere aggiornati',
            action: undefined
        }
    };

    const { icon: Icon, title, description, action } = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, damping: 10 }}
                className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6"
            >
                <Icon className="w-10 h-10 text-slate-400" />
            </motion.div>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                {description}
            </p>

            {action && (
                'href' in action ? (
                    <Link
                        to={action.href}
                        className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        {action.label}
                    </Link>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.onClick}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        {type === 'error' && <RefreshCw className="w-4 h-4" />}
                        {action.label}
                    </motion.button>
                )
            )}
        </motion.div>
    );
}
