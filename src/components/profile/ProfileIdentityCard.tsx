import React from 'react';
import { User } from '@supabase/supabase-js';

interface ProfileIdentityCardProps {
    user: User | null;
    profile: any;
}

export default function ProfileIdentityCard({ user, profile }: ProfileIdentityCardProps) {
    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;
    // Mock plan for now
    const isPro = false;

    return (
        <div className="bg-white rounded-3xl p-4 flex flex-col items-center relative shadow-xl shadow-slate-200/50 -mt-12 mx-4 mb-6 z-10 border border-slate-50">
            {/* Avatar */}
            <div className="relative mb-3">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl">👤</span>
                    )}
                </div>
                {/* Status Indicator (Green Dot) */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                </div>
            </div>

            {/* Identity */}
            <h1 className="text-lg font-bold text-slate-900 mb-0 text-center leading-tight">{nickname}</h1>
            <p className="text-xs text-slate-400 font-medium mb-3 text-center">{user?.email}</p>

            {/* Plan Badge */}
            <div className={`px-6 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isPro
                ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-500'
                }`}>
                {isPro ? (
                    <><span>👑</span> Pro Plan</>
                ) : (
                    <><span>🌱</span> Free Plan</>
                )}
            </div>
        </div>
    );
}


