import React from 'react';
import { User } from '@supabase/supabase-js';
import { Leaf, Crown } from 'lucide-react';

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
        <div className="relative -mt-20 mb-8 mx-2 z-20">
            <div className="bg-white rounded-[32px] p-6 pb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center flex flex-col items-center border border-white/50">

                {/* Avatar */}
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-[28px] p-1 bg-white shadow-sm">
                        <div className="w-full h-full rounded-[24px] overflow-hidden bg-slate-100 relative">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-4xl">👤</span>
                            )}
                        </div>
                    </div>
                    {/* Status Dot */}
                    <div className="absolute bottom-1 -right-1 p-1 bg-white rounded-full">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Identity */}
                <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
                    {nickname}
                </h1>
                <p className="text-[13px] text-slate-500 font-medium mb-5 truncate max-w-[240px]">
                    {user?.email}
                </p>

                {/* Plan Pill */}
                <div className={`
                    inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all
                    ${isPro ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}
                `}>
                    {isPro ? (
                        <>
                            <Crown className="w-3.5 h-3.5" />
                            <span>Pro Plan</span>
                        </>
                    ) : (
                        <>
                            <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Free Plan</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
