import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Clock, Layers, Star, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'prep' | 'xp';
    onMoreInfo: () => void;
}

export default function InfoModal({ isOpen, onClose, type, onMoreInfo }: InfoModalProps) {
    if (!isOpen) return null;

    const isPrep = type === 'prep';

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
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-[var(--card)] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col border border-[var(--card-border)]"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[var(--foreground)] opacity-50 hover:opacity-100 z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide p-5 pt-8 pb-4">

                            {/* Hero - Compact */}
                            <div className="flex flex-col items-center text-center mb-5">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${isPrep ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'}`}>
                                    {isPrep ? <Target className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
                                </div>
                                <h2 className="text-xl font-black text-[var(--foreground)] leading-tight mb-2">
                                    {isPrep ? "Il tuo Punteggio" : "XP e Classifiche"}
                                </h2>
                                <p className="text-[var(--foreground)] opacity-50 font-medium leading-snug text-sm px-2">
                                    {isPrep
                                        ? "Il punteggio da 0 a 100 indica quanto sei pronto per questo concorso."
                                        : "Gli XP misurano quanto ti alleni su Idoneo e servono per scalare le classifiche globali."
                                    }
                                </p>
                            </div>

                            {/* Bullets - Compact */}
                            <div className="space-y-2.5">
                                {isPrep ? (
                                    <>
                                        <BulletRow icon={<Layers className="w-4 h-4" />} title="Volume di quiz" text="Più quiz diversi svolgi, più il punteggio è affidabile." color="cyan" />
                                        <BulletRow icon={<Target className="w-4 h-4" />} title="Accuracy" text="La percentuale di risposte corrette influenza il voto." color="cyan" />
                                        <BulletRow icon={<Clock className="w-4 h-4" />} title="Recenza" text="I risultati recenti valgono più di quelli vecchi." color="cyan" />
                                        <BulletRow icon={<FileText className="w-4 h-4" />} title="Copertura" text="Premia chi si allena su tutta la banca dati." color="cyan" />
                                    </>
                                ) : (
                                    <>
                                        <BulletRow icon={<Star className="w-4 h-4" />} title="XP per risposta" text="Ogni risposta corretta ti dà 1 XP." color="amber" />
                                        <BulletRow icon={<Trophy className="w-4 h-4" />} title="Classifica Settimanale" text="La classifica si azzera ogni settimana." color="amber" />
                                        <BulletRow icon={<Shield className="w-4 h-4" />} title="XP Totali" text="I tuoi XP totali restano sempre nel profilo." color="amber" />
                                        <BulletRow icon={<Target className="w-4 h-4" />} title="Allenamento" text="Gli XP misurano l'impegno, non la preparazione." color="amber" />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-[var(--card)]">
                            <Button
                                fullWidth
                                className="bg-[#00B1FF] hover:bg-[#0099e6] text-white shadow-lg shadow-[#00B1FF]/30 border-none"
                                onClick={onClose}
                            >
                                Ho capito
                            </Button>
                            <button
                                onClick={onMoreInfo}
                                className="w-full py-2 mt-2 text-xs font-bold text-[var(--foreground)] opacity-40 hover:opacity-100 transition-colors"
                            >
                                Voglio saperne di più →
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Helper Component for consistency - Compact version
function BulletRow({ icon, title, text, color }: { icon: React.ReactNode, title: string, text: string, color: 'cyan' | 'amber' }) {
    const bgClass = color === 'cyan' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500';
    return (
        <div className="flex gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-700/50">
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${bgClass}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <h4 className="font-bold text-[var(--foreground)] text-[14px] mb-0.5 leading-tight">{title}</h4>
                <p className="text-[12px] text-[var(--foreground)] opacity-50 leading-snug">{text}</p>
            </div>
        </div>
    );
}
