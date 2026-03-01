import React, { useEffect, useState } from 'react';
import { Users, Gift, UserPlus, Search, Check, X } from 'lucide-react';
import ReferralModal from '@/components/referral/ReferralModal';
import AddFriendModal from './AddFriendModal';
import { friendService, FriendProfile } from '@/lib/friendService';
import { useReferral } from '@/hooks/useReferral';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface FriendsBlockProps {
    userId: string;
}

export default function FriendsBlock({ userId }: FriendsBlockProps) {
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [pendingReceived, setPendingReceived] = useState<FriendProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Referral Logic (Pre-loading for modal)
    useReferral();

    // Modals
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const handleInvite = () => {
        setShowReferralModal(true);
    };

    const refreshData = async () => {
        if (!userId) return;
        try {
            const { friends: f, pendingReceived: p } = await friendService.getFriendsAndRequests(userId);
            setFriends(f);
            setPendingReceived(p);
        } catch (err) {
            console.error('Error fetching friends:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [userId]);

    const handleAccept = async (friendshipId?: string) => {
        if (!friendshipId) return;
        await friendService.acceptRequest(friendshipId);
        refreshData();
    };

    const handleReject = async (friendshipId?: string) => {
        if (!friendshipId) return;
        await friendService.removeFriendship(friendshipId);
        refreshData();
    };

    return (
        <div className="bg-white dark:bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            {/* Header with TWO actions */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-[var(--foreground)]">I tuoi Amici</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-2 rounded-full bg-slate-100 dark:bg-[#111] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Cerca amici"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    {friends.length > 0 && (
                        <button
                            onClick={handleInvite}
                            className="text-sm font-bold text-[#00B1FF] hover:text-[#0099e6] transition-colors"
                        >
                            Invita
                        </button>
                    )}
                </div>
            </div>

            {/* PENDING REQUESTS SECTION */}
            {pendingReceived.length > 0 && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/20">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-3">Richieste in attesa</h4>
                    <div className="space-y-3">
                        {pendingReceived.map(req => (
                            <div key={req.id} className="flex items-center justify-between bg-white dark:bg-[#111] p-3 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                        <UserAvatar
                                            src={req.avatar_url}
                                            name={req.nickname}
                                            size="sm"
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.nickname}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAccept(req.friendship_id)}
                                        className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.friendship_id)}
                                        className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="flex gap-4 items-center animate-pulse">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-[#111] rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 dark:bg-[#111] rounded w-1/3" />
                                <div className="h-3 bg-slate-100 dark:bg-[#111] rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : friends.length === 0 ? (
                // Empty State — Praktika-style vibrant card
                <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#8B5CF6] via-[#A855F7] to-[#C084FC] px-6 pt-6 pb-5">
                    {/* Decorative blurred orbs */}
                    <div className="absolute -top-6 -left-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-purple-400/20 rounded-full blur-3xl" />

                    {/* 3D-style person + plus icon */}
                    <div className="absolute top-4 right-4 w-16 h-16">
                        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-lg">
                            <circle cx="28" cy="20" r="10" fill="white" fillOpacity="0.85" />
                            <path d="M12 52c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="white" strokeOpacity="0.85" strokeWidth="5" strokeLinecap="round" fill="none" />
                            <circle cx="50" cy="36" r="12" fill="#38BDF8" />
                            <path d="M50 30v12M44 36h12" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>

                    <p className="text-[26px] font-extrabold italic text-white leading-[1.15] mb-1 max-w-[72%]">
                        Condividi Idoneo con i tuoi amici per studiare insieme!
                    </p>
                    <div className="h-4" />

                    <button
                        onClick={handleInvite}
                        className="w-full py-4 bg-white/90 backdrop-blur-sm text-black font-extrabold rounded-full text-[17px] shadow-lg hover:bg-white active:scale-[0.98] transition-all"
                    >
                        Invita amici
                    </button>
                </div>
            ) : (
                // Friends List
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {friends.map(friend => (
                        <div key={friend.id} className="flex gap-4 items-center group">
                            <div className="flex-shrink-0">
                                <UserAvatar
                                    src={friend.avatar_url}
                                    name={friend.nickname}
                                    size="md"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                    {friend.nickname || 'Utente'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {friend.status === 'referral' && (
                                        <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">INVITATO</span>
                                    )}
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Iscritto il {new Date(friend.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <ReferralModal
                isOpen={showReferralModal}
                onClose={() => setShowReferralModal(false)}
            />

            <AddFriendModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                currentUserId={userId}
                onRequestSent={refreshData}
            />
        </div>
    );
}
