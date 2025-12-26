import React from 'react';
import { User } from '@supabase/supabase-js';
import { Leaf, Crown, Share2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileIdentityCardProps {
    user: User | null;
    profile: any;
}

export default function ProfileIdentityCard({ user, profile }: ProfileIdentityCardProps) {
    const navigate = useNavigate();
    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;
    // Mock plan for now
    const isPro = false;

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: 'Idoneo',
                text: 'Mettiti alla prova con i quiz di Idoneo!',
                url: window.location.origin,
            }).catch(console.error);
        } else {
            alert("Condivisione in arrivo!");
        }
    };

    return (
        <div className="relative flex flex-col items-center pt-0 pb-4 px-4 w-full">

            {/* Action Buttons - Corner Positioned, Top Aligned with Avatar */}
            <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none">
                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/50 flex items-center justify-center transition-all hover:bg-white active:scale-95 shadow-sm pointer-events-auto"
                >
                    <Share2 className="w-5 h-5 text-slate-700" />
                </button>

                {/* Settings Button */}
                <button
                    onClick={() => navigate('/profile/settings')}
                    className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/50 flex items-center justify-center transition-all hover:bg-white active:scale-95 shadow-sm pointer-events-auto"
                >
                    <Settings className="w-5 h-5 text-slate-700" />
                </button>
            </div>

            {/* Avatar - Starts at top to align with buttons */}
            <div className="relative mb-3">
                <div className="w-24 h-24 rounded-[32px] bg-slate-100 shadow-sm relative overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center text-4xl">👤</span>
                    )}
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-0.5 right-0.5 p-1 bg-[#F5F5F7] rounded-full">
                    <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2px] border-[#F5F5F7] flex items-center justify-center">
                    </div>
                </div>
            </div>

            {/* Identity */}
            <h1 className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight text-center">
                {nickname}
            </h1>
            <p className="text-[13px] text-slate-500 font-medium mb-3 text-center max-w-[240px]">
                {user?.email}
            </p>

            {/* Plan Pill - Minimal */}
            <div className={`
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all
                ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 shadow-sm border border-slate-100'}
            `}>
                {isPro ? (
                    <>
                        <Crown className="w-3 h-3" />
                        <span>Pro Plan</span>
                    </>
                ) : (
                    <>
                        <Leaf className="w-3 h-3 text-emerald-500" />
                        <span>Free Plan</span>
                    </>
                )}
            </div>
        </div>

    );
}
