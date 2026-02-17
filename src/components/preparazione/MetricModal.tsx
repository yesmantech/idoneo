import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Layers, Clock, FileText, Shield, Info, Activity, BarChart2 } from 'lucide-react';

export type MetricType = 'volume' | 'accuracy' | 'recency' | 'coverage' | 'reliability';

interface MetricModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: MetricType | null;
}

const METRIC_DETAILS: Record<MetricType, {
    title: string;
    icon: any;
    color: string;
    weight: string;
    description: string;
    insight: string;
    pro_tip: string;
}> = {
    volume: {
        title: 'Volume',
        icon: BarChart2,
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
        weight: '20%',
        description: 'Misura la quantità totale di risposte corrette salvate nella tua banca dati personale.',
        insight: 'Più domande diverse affronti, più il sistema ha dati statistici per valutare il tuo livello reale. Un volume elevato riduce il margine di errore del punteggio.',
        pro_tip: 'Non fermarti ai primi 100 quiz. La stima diventa realmente solida dopo aver superato le 500-1000 domande risposte.'
    },
    accuracy: {
        title: 'Precisione',
        icon: Target,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
        weight: '25%',
        description: 'Rappresenta il rapporto tra risposte corrette e tentativi totali.',
        insight: 'È il cuore qualitativo del tuo score. Il sistema non guarda solo al numero, ma a quanto sei efficace nel rispondere correttamente al primo colpo.',
        pro_tip: 'Punta alla qualità. Leggi bene le domande invece di correre; una precisione costante sopra l\'85% è l\'obiettivo per i concorsi più difficili.'
    },
    recency: {
        title: 'Recency',
        icon: Clock,
        color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30',
        weight: '20%',
        description: 'Analizza quanto sono recenti i tuoi progressi e la tua attività sulla piattaforma.',
        insight: 'La memoria a breve termine è fondamentale. Se smetti di allenarti, lo score scende gradualmente per riflettere il "decadimento" naturale della preparazione.',
        pro_tip: 'Meglio 15 minuti ogni giorno che 4 ore una volta a settimana. La regolarità mantiene questo indicatore al 100%.'
    },
    coverage: {
        title: 'Copertura',
        icon: FileText,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
        weight: '20%',
        description: 'Valuta quanta parte dell\'intera banca dati ufficiale hai esplorato.',
        insight: 'Premia chi varia le materie e i capitoli. Ripetere sempre le stesse domande (che già conosci) "gonfia" l\'accuratezza ma abbassa la copertura.',
        pro_tip: 'Usa la funzione "Domande mai viste" nelle simulazioni personalizzate per massimizzare questo fattore velocemente.'
    },
    reliability: {
        title: 'Affidabilità',
        icon: Shield,
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
        weight: '15%',
        description: 'Riflette la stabilità dei tuoi risultati nel tempo e la varianza statistica.',
        insight: 'Indica quanto il sistema è sicuro che il tuo score sia reale. Se passi dal 10% al 90% improvvisamente, l\'affidabilità sarà bassa finché il trend non si stabilizza.',
        pro_tip: 'Cerca di mantenere una performance costante. Una preparazione matura non mostra sbalzi eccessivi tra un tentativo e l\'altro.'
    }
};

export default function MetricModal({ isOpen, onClose, type }: MetricModalProps) {
    const details = type ? METRIC_DETAILS[type] : null;

    if (!details) return null;

    const Icon = details.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10"
                    >
                        {/* Shimmer Effect */}
                        <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${details.color.split(' ')[0]}`} />

                        <div className="p-8">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Header */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-inner ${details.color}`}>
                                    <Icon className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                                    {details.title}
                                </h2>
                                <div className="inline-flex px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200/50 dark:border-white/5">
                                    Peso Algoritmo: {details.weight}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Cos'è
                                    </h4>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {details.description}
                                    </p>
                                </div>

                                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-[24px] border border-slate-100 dark:border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Insight Tecnico
                                    </h4>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed opacity-80">
                                        {details.insight}
                                    </p>
                                </div>

                                <div className="flex gap-4 items-start pt-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Pro Tip</h4>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                            "{details.pro_tip}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <button
                                onClick={onClose}
                                className="w-full py-4 mt-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                            >
                                Ho capito
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Re-using TrendingUp for Pro Tip
import { TrendingUp } from 'lucide-react';
