import React, { useState } from 'react';
import { X, Copy, Check, Users, Trophy, Gift } from 'lucide-react';
import { useReferral } from '@/hooks/useReferral';

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
    const {
        referralCode,
        referralLink,
        referralCount,
        priorityLevel,
        loading,
        copyLink,
        shareVia,
        nativeShare,
    } = useReferral();

    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        const success = await copyLink();
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        const shared = await nativeShare();
        if (!shared) {
            handleCopy();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Bottom Sheet Modal */}
            <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
                <div className="bg-[var(--card)] rounded-t-3xl shadow-2xl max-w-lg mx-auto border-t border-[var(--card-border)]">

                    {/* Handle Bar */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-[var(--card-border)] rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="px-6 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00B1FF] to-[#0099e6] rounded-2xl flex items-center justify-center">
                                <Gift className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Invita amici</h2>
                                <p className="text-sm text-[var(--muted-foreground)]">Sali in cima alla lista!</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-[var(--background)] rounded-full hover:opacity-70 transition-opacity"
                        >
                            <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-8 space-y-5">

                        {/* Referral Link */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[var(--muted-foreground)]">Il tuo link personale</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 font-mono text-sm text-[var(--foreground)] truncate">
                                    {loading ? 'Caricamento...' : referralLink}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    disabled={loading}
                                    className="p-3 bg-[#00B1FF] hover:bg-[#0099e6] text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-blue-500/20"
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Share Options */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[var(--muted-foreground)]">Condividi via</label>
                            <div className="grid grid-cols-4 gap-3">

                                {/* WhatsApp */}
                                <button
                                    onClick={() => shareVia('whatsapp')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors active:scale-95"
                                >
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">WhatsApp</span>
                                </button>

                                {/* Telegram */}
                                <button
                                    onClick={() => shareVia('telegram')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors active:scale-95"
                                >
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">Telegram</span>
                                </button>

                                {/* Email */}
                                <button
                                    onClick={() => shareVia('email')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--background)] hover:bg-[var(--card-border)] transition-colors active:scale-95"
                                >
                                    <div className="w-10 h-10 bg-[var(--muted-foreground)] rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">Email</span>
                                </button>

                                {/* Altro */}
                                <button
                                    onClick={handleShare}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors active:scale-95"
                                >
                                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="18" cy="5" r="3" />
                                            <circle cx="6" cy="12" r="3" />
                                            <circle cx="18" cy="19" r="3" />
                                            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                                            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">Altro</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats — Il tuo impatto */}
                        <div className="bg-[var(--background)] rounded-2xl p-4 space-y-3 border border-[var(--card-border)]">
                            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                Il tuo impatto
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[var(--card)] rounded-xl p-3 text-center border border-[var(--card-border)]">
                                    <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[var(--foreground)]">
                                        <Users className="w-5 h-5 text-[#00B1FF]" />
                                        {loading ? '-' : referralCount}
                                    </div>
                                    <div className="text-xs text-[var(--muted-foreground)] mt-1">Amici iscritti</div>
                                </div>
                                <div className="bg-[var(--card)] rounded-xl p-3 text-center border border-[var(--card-border)]">
                                    <div className="text-2xl font-bold text-[var(--foreground)]">
                                        {loading ? '-' : priorityLevel}
                                    </div>
                                    <div className="text-xs text-[var(--muted-foreground)] mt-1">Posizione</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer text */}
                        <p className="text-center text-xs text-[var(--muted-foreground)] pb-2">
                            Più amici inviti, più sali in lista. <br />
                            Sarai tra i primi ad accedere!
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
