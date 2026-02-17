import React, { useState, useEffect } from 'react';
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
        <div className="min-h-screen bg-canvas-light dark:bg-slate-950 font-sans pb-32">

            {/* Navbar (Glass) */}
            <div className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 data-[scrolled=true]:shadow-soft transition-all">
                <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 dark:hover:text-white transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent">
                        Dettagli Concorso
                    </span>
                    <button onClick={handleSaveToggle} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                        <Heart className={`w-6 h-6 transition-colors ${isSaved ? 'fill-semantic-error text-semantic-error' : 'text-slate-400'}`} />
                    </button>
                </div>
            </div>

            <div className="px-4 py-6 space-y-6 max-w-lg mx-auto relative z-10">

                {/* 1. HERO CARD (Tier S: Gradient Mesh + Squircle) */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="relative overflow-hidden rounded-[32px] bg-slate-900 border border-white/10 shadow-2xl p-6 text-center group"
                >
                    {/* Animated Mesh Gradients */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/20 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-brand-cyan/30 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-purple/20 blur-[80px] rounded-full -ml-20 -mb-20 group-hover:bg-brand-purple/30 transition-all duration-700" />

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo Squircle */}
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            className="w-20 h-20 bg-white rounded-[22px] flex items-center justify-center shadow-card mb-5 p-3 overflow-hidden"
                        >
                            {bando.ente?.logo_url ? (
                                <img src={bando.ente.logo_url} className="w-full h-full object-contain" alt="Logo" />
                            ) : (
                                <Shield className="w-10 h-10 text-brand-blue" />
                            )}
                        </motion.div>

                        <motion.h1
                            layoutId={`bando-title-${bando.id}`}
                            className="text-2xl font-bold text-white mb-2 leading-tight"
                        >
                            {bando.title}
                        </motion.h1>
                        <p className="text-brand-cyan font-medium text-sm mb-6 bg-brand-cyan/10 px-3 py-1 rounded-full border border-brand-cyan/20">
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
                                color={daysRemaining < 7 ? 'orange' : 'cyan'} // Urgency colors
                                icon={Clock}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* 2. LIVE STATUS (Floating Progress) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative rounded-[24px] bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-5 shadow-sm"
                >
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Stato attuale</p>
                            <div className="flex items-center gap-2">
                                <span className={`flex h-3 w-3 rounded-full ${daysRemaining > 0 ? 'bg-semantic-success animate-pulse' : 'bg-semantic-error'}`} />
                                <span className="text-slate-900 dark:text-white font-bold text-lg">
                                    {daysRemaining > 0 ? `Scade tra ${daysRemaining} giorni` : 'Scaduto'}
                                </span>
                            </div>
                        </div>
                        <span className="text-2xl font-black text-slate-200 dark:text-white/10">
                            {progressPercent.toFixed(0)}%
                        </span>
                    </div>
                    {/* Progress Bar with Gradient */}
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full shadow-[0_0_10px_rgba(6,214,211,0.5)] bg-gradient-to-r ${daysRemaining > 7 ? 'from-brand-blue to-brand-cyan' : 'from-brand-orange to-semantic-error'
                                }`}
                        />
                    </div>
                </motion.div>

                {/* 3. INFO GRID (Glass Cards) */}
                <div className="grid grid-cols-3 gap-3">
                    <InfoTile
                        icon={BookOpen}
                        label="Categoria"
                        value={bando.category?.name}
                        delay={0.2}
                        color="text-brand-purple"
                        bg="bg-brand-purple/10"
                    />
                    <InfoTile
                        icon={GraduationCap}
                        label="Titolo"
                        value={bando.education_level && EDUCATION_LEVELS.find(l => l.value === bando.education_level?.[0])?.label}
                        delay={0.3}
                        color="text-brand-blue"
                        bg="bg-brand-blue/10"
                    />
                    <InfoTile
                        icon={MapPin}
                        label="Luogo"
                        value={bando.city || bando.province || 'Nazionale'}
                        delay={0.4}
                        color="text-brand-orange"
                        bg="bg-brand-orange/10"
                    />
                </div>

                {/* 4. EXPANDABLE DESCRIPTION */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[24px] p-6 border border-slate-200 dark:border-white/5"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Descrizione</h3>
                    <div className={`relative overflow-hidden transition-all duration-500 ease-ios ${expandedDesc ? 'max-h-[1000px]' : 'max-h-32'}`}>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
                            {bando.description || bando.short_description}
                        </p>
                        {!expandedDesc && (
                            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
                        )}
                    </div>
                    <button
                        onClick={() => setExpandedDesc(!expandedDesc)}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-brand-blue font-semibold text-sm hover:bg-brand-blue/5 rounded-xl transition-colors"
                    >
                        {expandedDesc ? 'Mostra meno' : 'Leggi tutto'}
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedDesc ? 'rotate-180' : ''}`} />
                    </button>
                </motion.div>

                {/* 5. CONTACTS & LINKS (Combined for cleanliness) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="space-y-3"
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

                    <div className="grid grid-cols-2 gap-3">
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
// TIER S COMPONENTS
// ------------------------------

function DateBox({ label, date, color, icon: Icon }: { label: string, date?: string, color: 'cyan' | 'blue' | 'orange', icon: any }) {
    if (!date) return null;
    const d = new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    const colors = {
        cyan: 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan',
        blue: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
        orange: 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange'
    };

    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${colors[color]}`}>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-white font-bold text-sm bg-slate-900/40 px-2 py-1 rounded-lg w-full text-center">
                {d}
            </span>
        </div>
    );
}

function InfoTile({ icon: Icon, label, value, delay, color, bg }: { icon: any, label: string, value?: string, delay: number, color: string, bg: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 shadow-soft text-center h-full min-h-[140px]"
        >
            <div className="flex-1 flex flex-col items-center justify-start pt-2">
                <div className={`w-12 h-12 rounded-[18px] ${bg} ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
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
            className={`flex items-center justify-between p-4 rounded-[24px] border transition-all active:scale-[0.98]
                ${highlight
                    ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20'
                    : 'bg-white dark:bg-slate-800/50 text-slate-700 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-bold">{label}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-70" />
        </a>
    );
}

function ActionCard({ icon: Icon, label, href, onClick }: { icon: any, label: string, href?: string, onClick?: () => void }) {
    const Component = href ? 'a' : 'button';
    return (
        <Component
            href={href} onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
            <Icon className="w-6 h-6 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
        </Component>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen bg-canvas-light dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bando non trovato 😔</h2>
            <Link to="/bandi" className="text-brand-blue font-bold hover:underline">Torna alla lista</Link>
        </div>
    );
}
