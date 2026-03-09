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
        weight: '33.33%',
        description: 'Domande totali risposte / dimensione della banca dati. Ogni risposta (giusta o sbagliata) contribuisce al volume.',
        insight: 'Con una banca di 4000+ domande, servono molte simulazioni per arrivare al 100%. Il volume premia la quantità di pratica, indipendentemente dal risultato.',
        pro_tip: 'Fai simulazioni regolarmente. Anche quelle "andate male" contribuiscono al volume e aiutano l\'algoritmo a valutarti meglio.'
    },
    accuracy: {
        title: 'Precisione',
        icon: Target,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
        weight: 'Moltiplicatore ×',
        description: 'Media pesata delle ultime 10 simulazioni: le più recenti contano di più. Moltiplica il punteggio complessivo (da ×0.00 a ×1.00).',
        insight: 'Se migliori nel tempo, la tua accuratezza sale più velocemente rispetto a una media semplice. Una simulazione recente al 90% "pesa" più di una vecchia al 60%.',
        pro_tip: 'Punta alla qualità. Leggi bene le domande invece di correre; una precisione costante sopra l\'85% è l\'obiettivo per i concorsi più difficili.'
    },
    recency: {
        title: 'Recency',
        icon: Clock,
        color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30',
        weight: 'Incluso in Costanza',
        description: 'Misura quanto recentemente ti sei allenato. Il valore di Costanza decade gradualmente se non fai simulazioni per più di 30 giorni.',
        insight: 'Il fattore recency è integrato nella Costanza (Reliability). Dopo 30 giorni senza simulazioni, la costanza si dimezza ogni 15 giorni aggiuntivi.',
        pro_tip: 'Meglio 15 minuti ogni giorno che 4 ore una volta a settimana. La regolarità mantiene alta la costanza.'
    },
    coverage: {
        title: 'Copertura',
        icon: FileText,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
        weight: '33.33%',
        description: 'Domande uniche risposte correttamente / domande totali nella banca dati. Solo le risposte corrette contano per la copertura.',
        insight: 'Diversamente dal Volume, la Copertura premia la qualità e l\'ampiezza: rispondere 100 volte alle stesse 20 domande non aumenta la Copertura, e rispondere sbagliato neanche.',
        pro_tip: 'Usa la funzione "Domande mai viste" nelle simulazioni personalizzate per scoprire nuove domande e aumentare la copertura.'
    },
    reliability: {
        title: 'Costanza',
        icon: Shield,
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
        weight: '33.33%',
        description: 'Calcola la stabilità dei tuoi risultati: 1 - (deviazione standard delle ultime 10 accuratezze / 40), scalata per numero di tentativi.',
        insight: 'Se le tue accuratezze sono 85%, 87%, 83%, 86% = costanza alta. Ma se sono 30%, 90%, 50%, 80% = costanza bassa. Decade del 50% ogni 15 giorni dopo 30 giorni di inattività.',
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
                        className="relative w-full max-w-sm bg-white dark:bg-black rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10"
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
