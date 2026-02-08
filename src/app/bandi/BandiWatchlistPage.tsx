import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUserSavedBandi, unsaveBando, Bando } from '@/lib/bandiService';
import BandoCard from '@/components/bandi/BandoCard';
import BandiEmptyState from '@/components/bandi/BandiEmptyState';
import { BandoCardSkeletonList } from '@/components/bandi/BandoSkeleton';
import { useAuth } from '@/context/AuthContext';

export default function BandiWatchlistPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bandi, setBandi] = useState<Bando[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'attivi' | 'chiusi'>('attivi');

    useEffect(() => {
        if (user) {
            loadSavedBandi();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadSavedBandi = async () => {
        setLoading(true);
        const data = await fetchUserSavedBandi();
        setBandi(data);
        setLoading(false);
    };

    const handleUnsave = async (bandoId: string) => {
        const success = await unsaveBando(bandoId);
        if (success) {
            setBandi(prev => prev.filter(b => b.id !== bandoId));
        }
    };

    // Filter by active/closed
    const now = new Date();
    const activeBandi = bandi.filter(b => new Date(b.deadline) > now);
    const closedBandi = bandi.filter(b => new Date(b.deadline) <= now);

    // Sort active by deadline (closest first)
    const sortedActive = [...activeBandi].sort((a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

    // Group active by urgency
    const closingThisWeek = sortedActive.filter(b => (b.days_remaining ?? 0) <= 7);
    const closingLater = sortedActive.filter(b => (b.days_remaining ?? 0) > 7);

    const displayBandi = activeTab === 'attivi' ? sortedActive : closedBandi;

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Accedi per salvare i bandi
                    </h2>
                    <p className="text-slate-500 mb-4">Crea un account per salvare i bandi e ricevere notifiche.</p>
                    <Link to="/login" className="text-emerald-500 font-medium">
                        Accedi
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">I Miei Bandi</h1>
                    </div>
                    <Link
                        to="/bandi/notifications"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>

                {/* Tabs */}
                <div className="px-4 pb-4">
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('attivi')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'attivi'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Attivi ({activeBandi.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('chiusi')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'chiusi'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Chiusi ({closedBandi.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
                {loading ? (
                    <BandoCardSkeletonList count={4} />
                ) : displayBandi.length === 0 ? (
                    <BandiEmptyState type="no-saved" />
                ) : (
                    <div className="space-y-6">
                        {/* Closing this week section */}
                        {activeTab === 'attivi' && closingThisWeek.length > 0 && (
                            <section>
                                <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    🔥 In scadenza questa settimana
                                </h2>
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {closingThisWeek.map((bando, i) => (
                                            <motion.div
                                                key={bando.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ delay: i * 0.05 }}
                                                layout
                                            >
                                                <BandoCard
                                                    bando={bando}
                                                    isSaved={true}
                                                    onSaveToggle={() => handleUnsave(bando.id)}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}

                        {/* Later section */}
                        {activeTab === 'attivi' && closingLater.length > 0 && (
                            <section>
                                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                                    Prossimamente
                                </h2>
                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {closingLater.map((bando, i) => (
                                            <motion.div
                                                key={bando.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ delay: i * 0.05 }}
                                                layout
                                            >
                                                <BandoCard
                                                    bando={bando}
                                                    isSaved={true}
                                                    onSaveToggle={() => handleUnsave(bando.id)}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}

                        {/* Closed tab */}
                        {activeTab === 'chiusi' && (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {closedBandi.map((bando, i) => (
                                        <motion.div
                                            key={bando.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ delay: i * 0.05 }}
                                            layout
                                        >
                                            <BandoCard
                                                bando={bando}
                                                isSaved={true}
                                                onSaveToggle={() => handleUnsave(bando.id)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
