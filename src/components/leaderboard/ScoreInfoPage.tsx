import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Layers, Clock, FileText, CheckCircle2, AlertTriangle, Trophy, Star, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ScoreInfoPageProps {
    onBack: () => void;
    initialTab?: 'prep' | 'xp';
}

export default function ScoreInfoPage({ onBack, initialTab = 'prep' }: ScoreInfoPageProps) {
    const [activeTab, setActiveTab] = useState<'prep' | 'xp'>(initialTab);

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex-none px-4 py-4 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg text-slate-900">Come funziona</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto bg-canvas-light">
                <div className="p-5 max-w-lg mx-auto pb-20">

                    {/* Tabs / Segmented Control */}
                    <div className="flex p-1 bg-slate-100 rounded-[14px] mb-8 relative">
                        {/* Active Tab Indicator */}
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-y-1 bg-white rounded-[10px] shadow-sm z-0"
                            initial={false}
                            animate={{
                                left: activeTab === 'prep' ? '4px' : '50%',
                                width: 'calc(50% - 4px)',
                                x: activeTab === 'xp' ? '0%' : '0%' // Adjust if needed but left/width is easier
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />

                        <button
                            onClick={() => setActiveTab('prep')}
                            className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold text-center transition-colors ${activeTab === 'prep' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            Punteggio
                        </button>
                        <button
                            onClick={() => setActiveTab('xp')}
                            className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold text-center transition-colors ${activeTab === 'xp' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            XP e Classifiche
                        </button>
                    </div>

                    {/* Content Switch */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'prep' ? (
                            <PrepContent key="prep" />
                        ) : (
                            <XPContent key="xp" />
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}

function PrepContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            {/* Hero */}
            <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto text-cyan-500 mb-2">
                    <Target className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Punteggio di Preparazione</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Misuriamo la tua preparazione da 0 a 100 basandoci sui quiz svolti, la qualità delle risposte e la costanza.
                </p>
            </div>

            {/* Factors */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">I 4 Fattori</h3>

                <InfoCard
                    icon={<Layers className="w-5 h-5" />}
                    title="Volume di Quiz"
                    subtitle="Il fattore principale (45%)"
                    text="Più domande diverse affronti, più il sistema ha dati per valutarti. I punteggi alti richiedono un volume consistente."
                    color="cyan"
                />

                <InfoCard
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    title="Accuracy"
                    subtitle="Precisione (30%)"
                    text="È la tua percentuale di risposte corrette. Il sistema pesa maggiormente le risposte date recentemente."
                    color="emerald"
                />

                <InfoCard
                    icon={<Clock className="w-5 h-5" />}
                    title="Recenza"
                    subtitle="Costanza (15%)"
                    text="Se non ti alleni da tempo, il punteggio scende. Per mantenerlo alto, devi esercitarti con regolarità."
                    color="amber"
                />

                <InfoCard
                    icon={<FileText className="w-5 h-5" />}
                    title="Copertura"
                    subtitle="Profondità (10%)"
                    text="Premia chi esplora tutta la banca dati invece di ripetere sempre le stesse domande."
                    color="purple"
                />
            </div>

            {/* Reliability Note */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span>Affidabilità del punteggio</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Se hai svolto pochi quiz (meno di 50-100), il tuo punteggio sarà limitato perché i dati non sono sufficienti per una stima affidabile. Continua ad allenarti per sbloccare il tuo vero potenziale!
                </p>
            </div>

            {/* Examples */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">Esempi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="font-bold text-slate-900 mb-1">Utente Principiante</div>
                        <div className="text-[13px] text-slate-500">Pochi quiz ma 100% corretti → <span className="text-amber-500 font-bold">Punteggio Medio-Basso</span> (Manca volume)</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="font-bold text-slate-900 mb-1">Utente Esperto</div>
                        <div className="text-[13px] text-slate-500">Tanti quiz, 85% corretti, attivo oggi → <span className="text-emerald-500 font-bold">Punteggio Alto</span></div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}

function XPContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            {/* Hero */}
            <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500 mb-2">
                    <Trophy className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">XP e Classifiche</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Gli XP premiano il tuo impegno quotidiano. Scala la <strong>Gold League</strong> sfidando gli altri utenti ogni due settimane.
                </p>
            </div>

            <div className="space-y-4">
                <InfoCard
                    icon={<Zap className="w-5 h-5" />}
                    title="Come guadagni XP"
                    subtitle="1 Risposta = 1 XP"
                    text="Ottieni un punto esperienza per ogni risposta corretta, sia nelle simulazioni ufficiali che nelle prove personalizzate."
                    color="amber"
                />

                <InfoCard
                    icon={<Clock className="w-5 h-5" />}
                    title="Stagioni da 14 giorni"
                    subtitle="Reset periodico"
                    text="La classifica si azzera ogni due settimane. Questo dà a tutti, anche ai nuovi arrivati, la possibilità di vincere la lega."
                    color="blue"
                />

                <InfoCard
                    icon={<Shield className="w-5 h-5" />}
                    title="XP Totali vs Stagionali"
                    subtitle="Cosa rimane?"
                    text="I tuoi XP totali non scadono mai e rimangono nel tuo profilo. Solo il punteggio valido per la classifica viene resettato."
                    color="emerald"
                />
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Star className="w-32 h-32" />
                </div>
                <h3 className="text-lg font-bold mb-2 relative z-10">XP vs Punteggio</h3>
                <div className="space-y-4 relative z-10">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">XP (Punti Esperienza)</div>
                        <p className="text-sm font-medium text-slate-200">Misurano <strong>quanto ti alleni</strong>. Premiano la quantità e la costanza.</p>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Punteggio (0-100)</div>
                        <p className="text-sm font-medium text-slate-200">Misura <strong>quanto sei bravo</strong> in uno specifico concorso. Premia la qualità.</p>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}

function InfoCard({ icon, title, subtitle, text, color }: { icon: React.ReactNode, title: string, subtitle: string, text: string, color: string }) {
    const bgColors: Record<string, string> = {
        cyan: 'bg-cyan-50 text-cyan-500',
        emerald: 'bg-emerald-50 text-emerald-500',
        amber: 'bg-amber-50 text-amber-500',
        purple: 'bg-indigo-50 text-indigo-500',
        blue: 'bg-blue-50 text-blue-500'
    };

    return (
        <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100/80 flex gap-4">
            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${bgColors[color] || bgColors.cyan}`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 text-[16px]">{title}</h4>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{subtitle}</div>
                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                    {text}
                </p>
            </div>
        </div>
    );
}

