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

            {/* XP Pill — Tier S with custom icon */}
            <div className="flex items-center gap-1.5 bg-[#422006] pl-1 pr-3.5 py-1 rounded-2xl">
                <img
                    src="/icons/xp-icon.png"
                    alt="XP"
                    className="w-8 h-8 rounded-lg"
                    draggable={false}
                />
                <span className="text-[17px] font-bold text-[#F59E0B] leading-none">{xp.toLocaleString()}</span>
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
