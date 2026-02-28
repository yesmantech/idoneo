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

            {/* XP Pill - Left (Duolingo-style) */}
            <div className="flex items-center gap-2 bg-amber-950/40 dark:bg-amber-900/30 px-3 py-2 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-amber-900/60 dark:bg-amber-800/50 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-500" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-black text-[var(--foreground)] leading-tight tracking-tight">{xp.toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest leading-none">XP Totali</span>
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
                    className="w-9 h-9 rounded-full bg-slate-100/80 dark:bg-[#1E1E1E] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center"
                    title="Ricomincia il Tour"
                >
                    <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                </button>
                <button
                    onClick={() => navigate('/profile/settings')}
                    data-onboarding="profile-settings"
                    className="rounded-full ring-2 ring-slate-200/50 dark:ring-slate-700/50 hover:ring-amber-400 transition-all active:scale-95"
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
