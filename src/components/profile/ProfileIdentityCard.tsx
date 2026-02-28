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

/**
 * Custom XP icon - typographic logo rendered as a mini square badge
 * to visually match the 🔥 icon weight in the Duolingo reference.
 */
function XPIcon() {
    return (
        <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
        >
            <span
                className="font-black text-white select-none"
                style={{
                    fontSize: '11px',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
            >
                XP
            </span>
        </div>
    );
}

export default function ProfileIdentityCard({ user, profile, xp = 0 }: ProfileIdentityCardProps) {
    const navigate = useNavigate();

    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;

    return (
        <div className="flex items-center justify-between py-2">

            {/* XP Pill — Duolingo streak-style */}
            <div
                className="flex items-center gap-2 rounded-full"
                style={{
                    background: 'linear-gradient(135deg, #451A03 0%, #3B1600 100%)',
                    padding: '5px 14px 5px 5px',
                    boxShadow: '0 2px 8px rgba(69, 26, 3, 0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
                    border: '1px solid rgba(245, 158, 11, 0.12)',
                }}
            >
                <XPIcon />
                <span
                    className="font-black text-[#F59E0B] select-none"
                    style={{ fontSize: '17px', lineHeight: 1, letterSpacing: '-0.3px' }}
                >
                    {xp.toLocaleString()}
                </span>
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
