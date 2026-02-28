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
        <div className="w-full bg-[var(--card)] rounded-[32px] shadow-sm border border-[var(--card-border)] overflow-hidden transition-colors duration-300">
            <div className="px-6 pt-6 pb-6">

                {/* Top Row: XP left — Avatar right (settings) */}
                <div className="flex items-center justify-between mb-6">

                    {/* XP Badge - Left */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-800/50 dark:to-amber-900/30 flex items-center justify-center ring-1 ring-amber-200/50 dark:ring-amber-700/50">
                            <Trophy className="w-5 h-5 text-amber-500" fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-[var(--foreground)] leading-tight tracking-tight">{xp.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-none">XP Totali</span>
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
                            className="w-9 h-9 rounded-full bg-slate-100/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center backdrop-blur-sm group"
                            title="Ricomincia il Tour"
                        >
                            <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                        </button>
                        <button
                            onClick={() => navigate('/profile/settings')}
                            data-onboarding="profile-settings"
                            className="rounded-full ring-2 ring-[var(--card-border)] hover:ring-amber-400 transition-all active:scale-95"
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

                {/* Name & Email - Left aligned */}
                <div>
                    <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">{nickname}</h1>
                    <p className="text-[13px] text-[var(--foreground)] opacity-50 font-medium truncate">
                        {user?.email}
                    </p>
                </div>

            </div>
        </div>
    );
}
