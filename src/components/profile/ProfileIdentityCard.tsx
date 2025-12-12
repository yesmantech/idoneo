import React from 'react';
import { User } from '@supabase/supabase-js';

interface ProfileIdentityCardProps {
    user: User | null;
    profile: any;
    onSettingsClick: () => void;
    onShareClick?: () => void;
}

export default function ProfileIdentityCard({ user, profile, onSettingsClick, onShareClick }: ProfileIdentityCardProps) {
    const nickname = profile?.nickname || 'Utente';
    const avatarUrl = profile?.avatar_url;
    // Mock plan for now
    const isPro = false;

    return (
        <div className="bg-white rounded-card shadow-soft p-6 flex flex-col items-center relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-900 to-slate-800" />

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button
                    onClick={onShareClick}
                    className="p-2 rounded-squircle bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105"
                    title="Condividi profilo"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                </button>
                <button
                    onClick={onSettingsClick}
                    className="p-2 rounded-squircle bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105"
                    title="Impostazioni"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
            </div>

            {/* Avatar */}
            <div className="relative mb-4 mt-8">
                <div className="w-28 h-28 rounded-squircle overflow-hidden border-4 border-white shadow-card bg-white z-10 relative">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-canvas-light text-text-tertiary text-5xl">
                            👤
                        </div>
                    )}
                </div>
                {/* Status Indicator */}
                <div className="absolute -bottom-2 -right-2 z-20 bg-semantic-success w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm" title="Online">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>

            {/* Identity */}
            <h1 className="text-2xl font-black text-text-primary mb-1 text-center">{nickname}</h1>
            <div className="flex items-center gap-2 mb-4 text-center">
                <span className="text-sm font-medium text-text-secondary">{user?.email}</span>
            </div>

            {/* Plan Badge */}
            <div className={`w-full py-2 rounded-pill text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 ${isPro
                ? 'bg-gradient-to-r from-brand-orange/10 to-brand-orange/20 text-brand-orange border-brand-orange/20'
                : 'bg-canvas-light text-text-tertiary border-transparent'
                }`}>
                {isPro ? (
                    <><span>👑</span> Pro Plan</>
                ) : (
                    <><span>🌱</span> Free Plan</>
                )}
            </div>
        </div>
    );
}
