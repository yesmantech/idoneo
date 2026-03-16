import { useState, useEffect } from 'react';
import { Bell, Settings } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
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
            <div className="bg-white dark:bg-black sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800 pt-safe">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <BackButton />
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">I Miei Bandi</h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 pb-4">
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#111] rounded-2xl">
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
                                <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <img src="/icons/flame-red.png" alt="" className="w-4 h-4 object-contain" /> In scadenza questa settimana
                                </h2>
                                <div className="space-y-3">
                                    <style>{`@keyframes bandoIn { from { opacity: 0; transform: translate3d(0,12px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }`}</style>
                                    {closingThisWeek.map((bando, i) => (
                                        <div
                                            key={bando.id}
                                            style={{ animation: `bandoIn 0.3s ease ${i * 0.04}s both` }}
                                        >
                                            <BandoCard
                                                bando={bando}
                                                isSaved={true}
                                                onSaveToggle={() => handleUnsave(bando.id)}
                                            />
                                        </div>
                                    ))}
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
                                    {closingLater.map((bando, i) => (
                                        <div
                                            key={bando.id}
                                            style={{ animation: `bandoIn 0.3s ease ${i * 0.04}s both` }}
                                        >
                                            <BandoCard
                                                bando={bando}
                                                isSaved={true}
                                                onSaveToggle={() => handleUnsave(bando.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Closed tab */}
                        {activeTab === 'chiusi' && (
                            <div className="space-y-3">
                                {closedBandi.map((bando, i) => (
                                    <div
                                        key={bando.id}
                                        style={{ animation: `bandoIn 0.3s ease ${i * 0.04}s both` }}
                                    >
                                        <BandoCard
                                            bando={bando}
                                            isSaved={true}
                                            onSaveToggle={() => handleUnsave(bando.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
