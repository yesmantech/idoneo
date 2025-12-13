import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Gift, UserPlus } from 'lucide-react';
import ReferralModal from '@/components/referral/ReferralModal';

interface Friend {
    id: string;
    nickname: string;
    avatar_url: string | null;
    created_at: string;
}

interface FriendsBlockProps {
    userId: string;
}

export default function FriendsBlock({ userId }: FriendsBlockProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReferralModal, setShowReferralModal] = useState(false);

    useEffect(() => {
        async function fetchFriends() {
            if (!userId) return;
            try {
                // Fetch users who were referred by the current user
                // The 'referred_by' column stores the referrer's UUID
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, nickname, avatar_url, created_at')
                    .eq('referred_by', userId)
                    .order('created_at', { ascending: false })
                    .limit(50); // Increased limit to 50

                if (error) throw error;
                setFriends(data || []);
            } catch (err) {
                console.error('Error fetching friends:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchFriends();
    }, [userId]);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">I tuoi Amici</h3>
                {friends.length > 0 && (
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="text-sm font-bold text-[#00B1FF] hover:text-[#0099e6] transition-colors"
                    >
                        Invita
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="flex gap-4 items-center animate-pulse">
                            <div className="w-10 h-10 bg-slate-100 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : friends.length === 0 ? (
                // Empty State with CTA
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-[#E0F2FE] flex items-center justify-center mb-3">
                        <Users className="w-7 h-7 text-[#00B1FF]" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-4 px-4">
                        Non hai ancora invitato nessuno. <br />
                        Invita i tuoi amici e scala la classifica!
                    </p>
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="px-6 py-3 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
                    >
                        <Gift className="w-4 h-4" />
                        Invita Amici
                    </button>
                </div>
            ) : (
                // Friends List
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {friends.map(friend => (
                        <div key={friend.id} className="flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100">
                                {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.nickname} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg">👤</span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                    {friend.nickname || 'Utente'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Iscritto il {new Date(friend.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            <ReferralModal
                isOpen={showReferralModal}
                onClose={() => setShowReferralModal(false)}
            />
        </div>
    );
}
