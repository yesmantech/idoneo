import React, { useState, useEffect, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    Heart,
    ExternalLink,
    MapPin,
    Users,
    Calendar,
    GraduationCap,
    Clock,
    FileText,
    AlertCircle,
    Building2,
    BookOpen,
    ChevronRight,
    Download,
    Mail,
    Globe,
    Facebook,
    Send,
    ChevronDown,
    ChevronUp,
    Shield
} from 'lucide-react';
import { fetchBandoBySlug, saveBando, unsaveBando, isUserSaved, Bando, EDUCATION_LEVELS } from '@/lib/bandiService';
import BandoSkeleton from '@/components/bandi/BandoSkeleton';
import { useAuth } from '@/context/AuthContext';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

// Lazy load react-markdown
const Markdown = React.lazy(() => import('react-markdown'));

export default function BandoDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [bando, setBando] = useState<Bando | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [expandedDesc, setExpandedDesc] = useState(false);

    useEffect(() => {
        if (slug) loadBando(slug);
    }, [slug]);

    const loadBando = async (bandoSlug: string) => {
        setLoading(true);
        const data = await fetchBandoBySlug(bandoSlug);
        setBando(data);
        if (data && user) {
            setIsSaved(await isUserSaved(data.id));
        }
        setLoading(false);
    };

    const handleSaveToggle = async () => {
        if (!bando || !user) return;
        hapticSuccess();
        const success = isSaved ? await unsaveBando(bando.id) : await saveBando(bando.id);
        if (success) setIsSaved(!isSaved);
    };

    if (loading) return <BandoSkeleton variant="detail" />;
    if (!bando) return <NotFound />;

    const daysRemaining = bando.days_remaining ?? 0;
    const progressPercent = Math.min(100, Math.max(0, ((30 - daysRemaining) / 30) * 100));

    return (
        <div className="min-h-screen bg-white dark:bg-black font-sans pb-32">

            {/* Navbar */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full text-slate-500 dark:text-white/50 active:opacity-60 transition-opacity">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                        Dettagli Concorso
                    </span>
                    <button onClick={handleSaveToggle} className="p-2 -mr-2 rounded-full active:opacity-60 transition-opacity">
                        <Heart className={`w-6 h-6 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-300 dark:text-white/25'}`} />
                    </button>
                </div>
            </div>

            <div className="px-4 py-6 space-y-4 max-w-lg mx-auto relative z-10">

                {/* 1. HERO CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] p-6 text-center"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo */}
                        <div className="w-16 h-16 bg-white dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mb-5 p-2.5 overflow-hidden">
                            {bando.ente?.logo_url ? (
                                <img src={bando.ente.logo_url} className="w-full h-full object-contain" alt="Logo" />
                            ) : (
                                <Shield className="w-8 h-8 text-[#00B1FF]" />
                            )}
                        </div>

                        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                            {bando.title}
                        </h1>
                        <p className="text-[#00B1FF] font-semibold text-sm mb-6">
                            {bando.ente?.name}
                        </p>

                        {/* Date Grid */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <DateBox
                                label="Pubblicato"
                                date={bando.publication_date}
                                color="blue"
                                icon={Calendar}
                            />
                            <DateBox
                                label="Scadenza"
                                date={bando.deadline}
                                color={daysRemaining < 7 ? 'orange' : 'cyan'}
                                icon={Clock}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* 2. LIVE STATUS */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] p-5"
                >
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Stato attuale</p>
                            <div className="flex items-center gap-2">
                                <span className={`flex h-2.5 w-2.5 rounded-full ${daysRemaining > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-slate-900 dark:text-white font-bold text-[15px]">
                                    {daysRemaining > 0 ? `Scade tra ${daysRemaining} giorni` : 'Scaduto'}
                                </span>
                            </div>
                        </div>
                        <span className="text-2xl font-black text-slate-200 dark:text-white/[0.06]">
                            {progressPercent.toFixed(0)}%
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2.5 bg-white dark:bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${daysRemaining > 7 ? 'bg-[#00B1FF]' : 'bg-amber-500'}`}
                        />
                    </div>
                </motion.div>

                {/* 3. INFO GRID */}
                <div className="grid grid-cols-3 gap-2.5">
                    <InfoTile
                        icon={BookOpen}
                        label="Categoria"
                        value={bando.category?.name}
                        delay={0.15}
                        color="text-[#8B5CF6]"
                        bg="bg-[#8B5CF6]/10"
                    />
                    <InfoTile
                        icon={GraduationCap}
                        label="Titolo"
                        value={bando.education_level?.filter(l => l !== 'Nessuno').join(', ') || 'Nessun titolo richiesto'}
                        delay={0.2}
                        color="text-[#00B1FF]"
                        bg="bg-[#00B1FF]/10"
                    />
                    <InfoTile
                        icon={MapPin}
                        label="Luogo"
                        value={bando.city || bando.province || 'Nazionale'}
                        delay={0.25}
                        color="text-amber-500"
                        bg="bg-amber-500/10"
                    />
                </div>

                {/* 4. EXPANDABLE DESCRIPTION */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="bg-slate-50 dark:bg-[#1C1C1E] rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Descrizione</h3>
                    <div className={`relative overflow-hidden transition-all duration-500 ease-ios ${expandedDesc ? 'max-h-[2000px]' : 'max-h-32'}`}>
                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-white/50 text-[15px] leading-relaxed">
                            <Suspense fallback={<div className="animate-pulse h-24 bg-white dark:bg-white/[0.04] rounded-xl w-full" />}>
                                <Markdown
                                    components={{
                                        h1: ({ ...props }) => <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-2" {...props} />,
                                        h2: ({ ...props }) => <h4 className="text-base font-bold text-slate-800 dark:text-white/80 mt-5 mb-2" {...props} />,
                                        h3: ({ ...props }) => <h5 className="text-sm font-bold text-slate-800 dark:text-white/70 mt-4 mb-1" {...props} />,
                                        ul: ({ ...props }) => <ul className="list-disc pl-5 space-y-1 my-2 marker:text-[#00B1FF]" {...props} />,
                                        ol: ({ ...props }) => <ol className="list-decimal pl-5 space-y-1 my-2 marker:text-[#00B1FF]" {...props} />,
                                        li: ({ ...props }) => <li className="pl-1" {...props} />,
                                        p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                        strong: ({ ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                        a: ({ ...props }) => <a className="text-[#00B1FF] hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
                                    }}
                                >
                                    {(bando.description || bando.short_description || '').replace(/^## Descrizione\s*/i, '')}
                                </Markdown>
                            </Suspense>
                        </div>
                        {!expandedDesc && (
                            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-slate-50 dark:from-[#1C1C1E] to-transparent" />
                        )}
                    </div>
                    <button
                        onClick={() => setExpandedDesc(!expandedDesc)}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-[#00B1FF] font-semibold text-sm rounded-xl transition-colors"
                    >
                        {expandedDesc ? 'Mostra meno' : 'Leggi tutto'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedDesc ? 'rotate-180' : ''}`} />
                    </button>
                </motion.div>

                {/* 5. CONTACTS & LINKS */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="space-y-2.5"
                >
                    {bando.application_url && (
                        <ActionRow
                            icon={Globe} label="Vai al sito ufficiale"
                            href={bando.application_url} highlight
                        />
                    )}

                    {bando.documents?.find(d => d.type === 'bando') && (
                        <ActionRow
                            icon={Download} label="Scarica Bando PDF"
                            href={bando.documents.find(d => d.type === 'bando')?.file_url || '#'}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                        <ActionCard icon={Mail} label="Invia PEC" href={`mailto:${bando.ente?.website || ''}`} />
                        <ActionCard icon={Share2} label="Condividi" onClick={() => {
                            if (navigator.share) navigator.share({ title: bando.title, url: window.location.href });
                        }} />
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

// ------------------------------
// iOS-NATIVE COMPONENTS
// ------------------------------

function DateBox({ label, date, color, icon: Icon }: { label: string, date?: string, color: 'cyan' | 'blue' | 'orange', icon: any }) {
    if (!date) return null;
    const d = new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    const colors = {
        cyan: 'bg-[#00B1FF]/10 text-[#00B1FF]',
        blue: 'bg-[#00B1FF]/10 text-[#00B1FF]',
        orange: 'bg-amber-500/10 text-amber-500'
    };

    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl ${colors[color]}`}>
            <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-sm">
                {d}
            </span>
        </div>
    );
}

function InfoTile({ icon: Icon, label, value, delay, color, bg }: { icon: any, label: string, value?: string, delay: number, color: string, bg: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] text-center h-full min-h-[130px]"
        >
            <div className="flex-1 flex flex-col items-center justify-start pt-1">
                <div className={`w-11 h-11 rounded-[14px] ${bg} ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                    {value || '-'}
                </p>
            </div>
        </motion.div>
    );
}

function ActionRow({ icon: Icon, label, href, highlight }: { icon: any, label: string, href: string, highlight?: boolean }) {
    return (
        <a
            href={href} target="_blank" rel="noopener"
            className={`flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] active:opacity-80
                ${highlight
                    ? 'bg-[#00B1FF] text-white'
                    : 'bg-slate-50 dark:bg-[#1C1C1E] text-slate-700 dark:text-white'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-bold text-[15px]">{label}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-40" />
        </a>
    );
}

function ActionCard({ icon: Icon, label, href, onClick }: { icon: any, label: string, href?: string, onClick?: () => void }) {
    const Component = href ? 'a' : 'button';
    return (
        <Component
            href={href} onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] active:opacity-80 active:scale-[0.98] transition-all"
        >
            <Icon className="w-5 h-5 text-slate-400 dark:text-white/30" />
            <span className="text-xs font-bold text-slate-600 dark:text-white/50">{label}</span>
        </Component>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bando non trovato 😔</h2>
            <Link to="/bandi" className="text-[#00B1FF] font-bold hover:underline">Torna alla lista</Link>
        </div>
    );
}
