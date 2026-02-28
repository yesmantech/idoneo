import React from 'react';
import { User } from '@supabase/supabase-js';
import { RotateCcw } from 'lucide-react';
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

            {/* XP Pill - Compact single row */}
            <div className="flex items-center gap-1.5 bg-amber-900/25 dark:bg-amber-900/30 pl-1.5 pr-3 py-1.5 rounded-full">
                <div className="w-7 h-7 rounded-full bg-amber-900/40 dark:bg-amber-800/50 flex items-center justify-center">
                    <span className="text-[14px] leading-none">🏆</span>
                </div>
                <span className="text-[15px] font-extrabold text-amber-500 tracking-tight">{xp.toLocaleString()}</span>
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
                    <RotateCcw className="w-4 h-4" />
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
