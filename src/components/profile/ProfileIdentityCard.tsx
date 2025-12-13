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
        <div className="flex flex-col items-center pt-2 pb-8 px-4">

            {/* Avatar - Slightly larger, cleaner */}
            <div className="relative mb-5">
                <div className="w-28 h-28 rounded-[36px] bg-slate-100 shadow-sm relative overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center text-4xl">👤</span>
                    )}
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-1 right-1 p-1 bg-[#F5F5F7] rounded-full">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-[#F5F5F7] flex items-center justify-center">
                    </div>
                </div>
            </div>

            {/* Identity */}
            <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight text-center">
                {nickname}
            </h1>
            <p className="text-[14px] text-slate-500 font-medium mb-6 text-center max-w-[240px]">
                {user?.email}
            </p>

            {/* Plan Pill - Minimal */}
            <div className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all
                ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 shadow-sm border border-slate-100'}
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

    );
}
