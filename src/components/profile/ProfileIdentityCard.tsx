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

            {/* XP Badge - Exact Reference Match */}
            <div className="flex items-center gap-3.5 bg-[#141414] pl-2 pr-6 py-2 rounded-[22px] border border-white/5">

                {/* Custom Trophy Icon Wrapper */}
                <div className="w-11 h-11 rounded-[14px] bg-[#5C3000] flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                    {/* Inner glow/highlight for depth */}
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-white/5 rounded-t-[14px]"></div>

                    {/* Custom SVG Trophy matching reference shape */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-sm">
                        {/* Trophy Bowl */}
                        <path d="M2.5 7C2.5 5.89543 3.39543 5 4.5 5H19.5C20.6046 5 21.5 5.89543 21.5 7V8C21.5 10.7614 19.2614 13 16.5 13H7.5C4.73858 13 2.5 10.7614 2.5 8V7Z" fill="#F59E0B" />
                        {/* Trophy Base/Stand Lines */}
                        <path d="M12 13V18" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M7 19L12 14" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M17 19L12 14" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Trophy Base Platform */}
                        <path d="M6 20C6 19.4477 6.44772 19 7 19H17C17.5523 19 18 19.4477 18 20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20Z" fill="#F59E0B" />
                    </svg>
                </div>

                {/* Text Section: Number Top, Label Bottom */}
                <div className="flex flex-col justify-center">
                    <span className="text-[20px] font-black text-white leading-none tracking-tight mb-0.5">{xp.toLocaleString()}</span>
                    <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-wider leading-none">XP TOTALI</span>
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
