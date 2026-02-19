import React, { useState } from 'react';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { friendService, FriendProfile } from '@/lib/friendService';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface AddFriendModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onRequestSent: () => void;
}

export default function AddFriendModal({ isOpen, onClose, currentUserId, onRequestSent }: AddFriendModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FriendProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [rateLimitError, setRateLimitError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length < 3) return;

        setSearching(true);
        try {
            const users = await friendService.searchUsers(query, currentUserId);
            // Filter out users who are already friends? 
            // For now, simple search. The service handles duplicate request check but UI might show them.
            setResults(users);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (friendId: string) => {
        setRateLimitError(null);
        const { error } = await friendService.sendRequest(currentUserId, friendId);

        if (error) {
            if (typeof error === 'string' && error.includes('limite')) {
                setRateLimitError(error);
            } else {
                // Generic error handling if needed, presently silent or logged
                console.error(error);
            }
            return;
        }

        setSentIds(prev => new Set(prev).add(friendId));
        onRequestSent();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Aggiungi Amico</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {rateLimitError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span>🚫 {rateLimitError}</span>
                    </div>
                )}

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cerca per nickname..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 transition-all font-medium placeholder:text-slate-400"
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                </form>

                {/* Results List */}
                <div className="max-h-60 overflow-y-auto space-y-3 min-h-[100px]">
                    {searching ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-sm">Ricerca in corso...</p>
                        </div>
                    ) : results.length > 0 ? (
                        results.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex-shrink-0">
                                        <UserAvatar src={user.avatar_url} name={user.nickname} size="md" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{user.nickname}</p>
                                        <p className="text-xs text-slate-400">Utente Idoneo</p>
                                    </div>
                                </div>

                                {sentIds.has(user.id) ? (
                                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Inviata
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleSendRequest(user.id)}
                                        className="p-2 bg-[#00B1FF] rounded-lg text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : query.length >= 3 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p>Nessun utente trovato con questo nome.</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <p>Scrivi almeno 3 caratteri per cercare.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
