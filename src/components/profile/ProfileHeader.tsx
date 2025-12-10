import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { xpService, UserXpStats } from '@/lib/xpService';

interface ProfileHeaderProps {
    user: User | null;
    profile: any;
    onSettingsClick: () => void;
    onShareClick?: () => void;
}

export default function ProfileHeader({ user, profile, onSettingsClick, onShareClick }: ProfileHeaderProps) {
    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;
    // Mock plan for now, or fetch from profile if available
    const isPro = false;

    const [xpStats, setXpStats] = useState<UserXpStats | null>(null);

    useEffect(() => {
        if (user) {
            xpService.getUserXp(user.id).then(setXpStats);
        }
    }, [user]);

    return (
        <div className="flex flex-col items-center pt-8 pb-6 px-4">
            {/* Top Right Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={onShareClick}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Condividi profilo"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                </button>
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Impostazioni"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
            </div>

            {/* Avatar */}
            <div className="relative mb-4 group">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-xl bg-white">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 text-5xl">
                            👤
                        </div>
                    )}
                </div>
                {/* Level Badge */}
                {xpStats && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-violet-600 to-indigo-500 w-10 h-10 rounded-xl border-4 border-slate-50 flex items-center justify-center shadow-lg text-white font-black text-sm z-10" title={`Level ${xpStats.currentLevel}`}>
                        {xpStats.currentLevel}
                    </div>
                )}
            </div>

            {/* Identity */}
            <h1 className="text-2xl font-black text-slate-800 mb-1">{nickname}</h1>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-slate-400">{user?.email}</span>
            </div>

            {/* XP Bar */}
            {xpStats && (
                <div className="w-full max-w-[200px] mb-4 group relative cursor-help">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <span>XP {xpStats.totalXp}</span>
                        <span>Lvl {xpStats.currentLevel + 1}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-1000"
                            style={{ width: `${xpStats.nextLevelProgress}%` }}
                        />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded-lg py-1 px-2 -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                        Stagione: {xpStats.seasonXp} XP
                    </div>
                </div>
            )}

            {/* Plan Badge */}
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${isPro
                ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 border-orange-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                {isPro ? 'Pro Plan' : 'Free Plan'}
            </div>
        </div>
    );
}
