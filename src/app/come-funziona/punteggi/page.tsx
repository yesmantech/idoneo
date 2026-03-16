"use client";

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '@/components/ui/BackButton';
import {
    Trophy, Target, Layers, FileText, Zap,
    CheckCircle2, Clock, Shield, Star, BarChart3
} from 'lucide-react';

// =============================================================================
// COME FUNZIONA PAGE — unified Punteggio + XP tabs
// This is a real route so #root handles scroll — works on iOS Capacitor.
// =============================================================================

export default function PunteggiPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'prep' | 'xp'>(
        searchParams.get('tab') === 'xp' ? 'xp' : 'prep'
    );

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--card-border)] pt-safe">
                <div className="h-14 px-4 flex items-center gap-4 max-w-3xl mx-auto">
                    <BackButton onClick={() => navigate(-1)} />
                    <h1 className="text-lg font-bold">Come Funziona</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-5 py-6 space-y-8">

                {/* Segmented Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-[#111] rounded-[14px] relative border border-slate-200 dark:border-slate-700">
                    <motion.div
                        layoutId="pageTabIndicator"
                        className="absolute inset-y-1 bg-white dark:bg-slate-700 rounded-[10px] shadow-sm z-0"
                        initial={false}
                        animate={{ left: activeTab === 'prep' ? '4px' : '50%', width: 'calc(50% - 4px)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                    <button
                        onClick={() => setActiveTab('prep')}
                        className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold text-center transition-colors ${activeTab === 'prep' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        Punteggio
                    </button>
                    <button
                        onClick={() => setActiveTab('xp')}
                        className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold text-center transition-colors ${activeTab === 'xp' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        XP e Classifiche
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'prep' ? (
                        <PrepContent key="prep" />
                    ) : (
                        <XPContent key="xp" />
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

// ─── Prep Content ────────────────────────────────────────────────────────────
function PrepContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto text-cyan-500 mb-2">
                    <Target className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-[var(--foreground)]">Punteggio di Preparazione</h2>
                <p className="text-[var(--foreground)] opacity-50 font-medium leading-relaxed">
                    Misuriamo la tua preparazione da 0 a 100 con la formula: (Volume + Copertura + Costanza) × Accuratezza.
                </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#111]/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-mono text-center text-[var(--foreground)] opacity-70">
                    Score = (V×33% + C×33% + R×33%) × Accuratezza
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">I 3 Fattori + Moltiplicatore</h3>
                <InfoCard icon={<Layers className="w-5 h-5" />} title="Volume" subtitle="Domande Totali (33.33%)" text="Misura quante domande hai affrontato rispetto alla banca dati. Più ti alleni, più sale." color="cyan" />
                <InfoCard icon={<FileText className="w-5 h-5" />} title="Copertura" subtitle="Banca Dati (33.33%)" text="Quante domande diverse hai visto. Premia chi esplora tutta la banca dati invece di ripetere sempre le stesse." color="purple" />
                <InfoCard icon={<Zap className="w-5 h-5" />} title="Costanza" subtitle="Affidabilità (33.33%)" text="Quanto sono stabili i tuoi risultati nelle ultime 10 simulazioni. Meno varianza = più affidabilità. Decade se non ti alleni per 30 giorni." color="amber" />
                <InfoCard icon={<CheckCircle2 className="w-5 h-5" />} title="Accuratezza" subtitle="Moltiplicatore (×0.00 – ×1.00)" text="Media pesata delle ultime 10 simulazioni — le più recenti contano di più. Se migliori, il punteggio sale più velocemente." color="emerald" />
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wider pl-1">Esempi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
                        <div className="font-bold text-[var(--foreground)] mb-1">Utente Principiante</div>
                        <div className="text-[13px] text-[var(--foreground)] opacity-50">Pochi quiz ma 100% corretti → <span className="text-amber-500 font-bold">Punteggio Medio-Basso</span> (Manca volume e copertura)</div>
                    </div>
                    <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--card-border)] shadow-sm">
                        <div className="font-bold text-[var(--foreground)] mb-1">Utente Esperto</div>
                        <div className="text-[13px] text-[var(--foreground)] opacity-50">Tanti quiz, 85% corretti, attivo oggi → <span className="text-emerald-500 font-bold">Punteggio Alto</span></div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── XP Content ──────────────────────────────────────────────────────────────
function XPContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
        >
            <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500 mb-2">
                    <Trophy className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-[var(--foreground)]">XP e Classifiche</h2>
                <p className="text-[var(--foreground)] opacity-50 font-medium leading-relaxed">
                    Gli XP premiano il tuo impegno quotidiano. Scala la <strong>Gold League</strong> sfidando gli altri utenti ogni due settimane.
                </p>
            </div>

            <div className="space-y-4">
                <InfoCard icon={<Zap className="w-5 h-5" />} title="Come guadagni XP" subtitle="1 Risposta = 1 XP" text="Ottieni un punto esperienza per ogni risposta corretta, sia nelle simulazioni ufficiali che nelle prove personalizzate." color="amber" />
                <InfoCard icon={<Clock className="w-5 h-5" />} title="Stagioni da 14 giorni" subtitle="Reset periodico" text="La classifica si azzera ogni due settimane. Questo dà a tutti, anche ai nuovi arrivati, la possibilità di vincere la lega." color="blue" />
                <InfoCard icon={<Shield className="w-5 h-5" />} title="XP Totali vs Stagionali" subtitle="Cosa rimane?" text="I tuoi XP totali non scadono mai e rimangono nel tuo profilo. Solo il punteggio valido per la classifica viene resettato." color="emerald" />
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Star className="w-32 h-32" />
                </div>
                <h3 className="text-lg font-bold mb-4 relative z-10">XP vs Punteggio</h3>
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

// ─── Shared InfoCard ─────────────────────────────────────────────────────────
function InfoCard({ icon, title, subtitle, text, color }: { icon: React.ReactNode; title: string; subtitle: string; text: string; color: string }) {
    const bgColors: Record<string, string> = {
        cyan: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500',
        amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500',
        purple: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500',
        blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500',
    };
    return (
        <div className="bg-[var(--card)] p-5 rounded-[20px] shadow-sm border border-[var(--card-border)] flex gap-4 transition-colors">
            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${bgColors[color] || bgColors.cyan}`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-[var(--foreground)] text-[16px]">{title}</h4>
                <div className="text-xs font-bold text-[var(--foreground)] opacity-40 uppercase tracking-wide mb-2">{subtitle}</div>
                <p className="text-[13px] text-[var(--foreground)] opacity-60 leading-relaxed font-medium">{text}</p>
            </div>
        </div>
    );
}
