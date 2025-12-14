import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Clock, Layers, Star, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                        className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="p-6 pt-10 pb-8 overflow-y-auto scrollbar-hide">

                            {/* Hero */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 shadow-sm ${isPrep ? 'bg-cyan-50 text-cyan-500' : 'bg-amber-50 text-amber-500'}`}>
                                    {isPrep ? <Target className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3">
                                    {isPrep ? "Il tuo Punteggio" : "XP e Classifiche"}
                                </h2>
                                <p className="text-slate-500 font-medium leading-relaxed px-2">
                                    {isPrep
                                        ? "Il punteggio da 0 a 100 indica quanto sei pronto per questo concorso, basandosi sulle tue simulazioni."
                                        : "Gli XP misurano quanto ti alleni su Idoneo e servono per scalare le classifiche globali."
                                    }
                                </p>
                            </div>

                            {/* Bullets */}
                            <div className="space-y-4 mb-8">
                                {isPrep ? (
                                    <>
                                        <BulletRow icon={<Layers className="w-5 h-5" />} title="Volume di quiz" text="Più quiz diversi svolgi, più il punteggio è affidabile." color="cyan" />
                                        <BulletRow icon={<Target className="w-5 h-5" />} title="Accuracy" text="La percentuale di risposte corrette influenza il voto." color="cyan" />
                                        <BulletRow icon={<Clock className="w-5 h-5" />} title="Recenza" text="I risultati recenti valgono più di quelli vecchi." color="cyan" />
                                        <BulletRow icon={<FileText className="w-5 h-5" />} title="Copertura" text="Premia chi si allena su tutta la banca dati." color="cyan" />
                                    </>
                                ) : (
                                    <>
                                        <BulletRow icon={<Star className="w-5 h-5" />} title="XP per risposta" text="Ogni risposta corretta ti dà 1 XP." color="amber" />
                                        <BulletRow icon={<Trophy className="w-5 h-5" />} title="Classifica 14 giorni" text="La classifica si azzera ogni due settimane." color="amber" />
                                        <BulletRow icon={<Shield className="w-5 h-5" />} title="XP Totali" text="I tuoi XP totali restano sempre nel profilo." color="amber" />
                                        <BulletRow icon={<Target className="w-5 h-5" />} title="Allenamento" text="Gli XP misurano l'impegno, non la preparazione." color="amber" />
                                    </>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <Button
                                    fullWidth
                                    className="bg-[#00B1FF] hover:bg-[#0099e6] text-white shadow-lg shadow-[#00B1FF]/30 border-none"
                                    onClick={onClose}
                                >
                                    Ho capito
                                </Button>
                                <button
                                    onClick={onMoreInfo}
                                    className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Voglio saperne di più →
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Helper Component for consistency
function BulletRow({ icon, title, text, color }: { icon: React.ReactNode, title: string, text: string, color: 'cyan' | 'amber' }) {
    const bgClass = color === 'cyan' ? 'bg-cyan-50 text-cyan-500' : 'bg-amber-50 text-amber-500';
    return (
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${bgClass}`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 text-[15px] mb-0.5">{title}</h4>
                <p className="text-[13px] text-slate-500 leading-snug">{text}</p>
            </div>
        </div>
    );
}
