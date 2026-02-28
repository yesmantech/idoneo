import React from 'react';
import { User } from '@supabase/supabase-js';
import { Trophy, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface ProfileIdentityCardProps {
    user: User | null;
    profile: any;
    xp?: number;
}

export default function ProfileIdentityCard({ user, profile, xp = 0 }: ProfileIdentityCardProps) {
    const navigate = useNavigate();

    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;

    return (
        <div className="flex items-center justify-between py-2">

            {/* XP Pill - As requested: icon in style of photo, text on single line */}
            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-[#1A1A1A] p-1.5 pr-5 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">

                {/* Icon wrapper styling from the reference photo */}
                <div className="w-9 h-9 rounded-[10px] bg-amber-100 dark:bg-[#5C3000] flex items-center justify-center shadow-inner">
                    <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="currentColor" strokeLinejoin="round" />
                </div>

                {/* Text on a single line: "XP 370" */}
                <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-[12px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-widest">XP</span>
                    <span className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-none">{xp.toLocaleString()}</span>
                </div>

            </div>

            {/* Right side: Reset Tour + Avatar (Settings) */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('idoneo_onboarding_') || key === 'idoneo_welcome_shown') {
                                localStorage.removeItem(key);
                            }
                        });
                        window.location.href = '/';
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1A1A1A] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm group"
                    title="Ricomincia il Tour"
                >
                    <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                </button>
                <button
                    onClick={() => navigate('/profile/settings')}
                    data-onboarding="profile-settings"
                    className="rounded-full ring-2 ring-slate-200 dark:ring-white/10 hover:ring-amber-400 dark:hover:ring-amber-500 transition-all active:scale-95 shadow-sm"
                    title="Impostazioni"
                >
                    <UserAvatar
                        src={avatarUrl}
                        name={nickname}
                        size="md"
                    />
                </button>
            </div>

        </div>
    );
}
