/**
 * @file useReferral.ts
 * @description Referral system hook for waitlist priority and sharing.
 *
 * This hook manages the user's referral code and provides sharing utilities.
 * Users who refer others get higher priority on the waitlist.
 *
 * ## Data Provided
 *
 * | Field          | Description                                |
 * |----------------|--------------------------------------------|
 * | `referralCode` | User's unique code (from `profiles.referral_code`) |
 * | `referralLink` | Full shareable URL with code as query param |
 * | `referralCount`| Number of successful referrals             |
 * | `priorityLevel`| Percentile ranking (Top 10%, 25%, 50%)     |
 *
 * ## Share Methods
 *
 * | Method        | Platform                          |
 * |---------------|-----------------------------------|
 * | `copyLink`    | Copy to clipboard                 |
 * | `shareVia`    | WhatsApp, Telegram, Email (web)   |
 * | `nativeShare` | iOS/Android native share sheet    |
 *
 * ## Priority Calculation
 *
 * Users are ranked by referral count. Percentiles are calculated against
 * all users to determine priority tier for access.
 *
 * @example
 * ```tsx
 * import { useReferral } from '@/hooks/useReferral';
 *
 * function ReferralPage() {
 *   const { referralLink, referralCount, nativeShare, copyLink } = useReferral();
 *
 *   return (
 *     <div>
 *       <p>You've referred {referralCount} friends!</p>
 *       <button onClick={nativeShare}>Share</button>
 *       <button onClick={copyLink}>Copy Link</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ReferralStats {
    referralCode: string;
    referralLink: string;
    referralCount: number;
    priorityLevel: string;
    loading: boolean;
    error: string | null;
}

export function useReferral() {
    const { user } = useAuth();
    const [stats, setStats] = useState<ReferralStats>({
        referralCode: '',
        referralLink: '',
        referralCount: 0,
        priorityLevel: '',
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!user?.id) {
            setStats(prev => ({ ...prev, loading: false }));
            return;
        }

        fetchReferralStats();
    }, [user?.id]);

    const fetchReferralStats = async () => {
        if (!user?.id) return;

        try {
            // Get current user's referral data
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('referral_code, referral_count, waitlist_joined_at')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            // Calculate priority level based on referral count
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: usersAhead } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('referral_count', profile.referral_count || 0);

            const percentile = totalUsers && usersAhead !== null
                ? Math.round(((totalUsers - usersAhead) / totalUsers) * 100)
                : 50;

            const priorityLevel = percentile <= 10
                ? 'Top 10%'
                : percentile <= 25
                    ? 'Top 25%'
                    : percentile <= 50
                        ? 'Top 50%'
                        : 'In lista';

            const referralCode = profile.referral_code || '';
            const baseUrl = 'https://idoneo.ai';

            setStats({
                referralCode,
                referralLink: `${baseUrl}/?ref=${referralCode}`,
                referralCount: profile.referral_count || 0,
                priorityLevel,
                loading: false,
                error: null,
            });
        } catch (err: any) {
            console.error('Error fetching referral stats:', err);
            setStats(prev => ({
                ...prev,
                loading: false,
                error: err.message,
            }));
        }
    };

    const copyLink = async () => {
        if (stats.referralLink) {
            await navigator.clipboard.writeText(stats.referralLink);
            return true;
        }
        return false;
    };

    const shareVia = (channel: 'whatsapp' | 'telegram' | 'email') => {
        const message = encodeURIComponent(
            `🎓 Sto preparando il mio prossimo concorso con Idoneo! Unisciti anche tu: ${stats.referralLink}`
        );

        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${message}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent('🎓 Sto preparando il mio prossimo concorso con Idoneo! Unisciti anche tu:')}`,
            email: `mailto:?subject=${encodeURIComponent('Preparati al concorso con Idoneo!')}&body=${message}`,
        };

        window.open(urls[channel], '_blank');
    };

    const nativeShare = async () => {
        const title = 'Idoneo - Preparati al concorso';
        const text = '🎓 Sto preparando il mio prossimo concorso con Idoneo! Unisciti anche tu:';
        const url = stats.referralLink;

        if (Capacitor.isNativePlatform()) {
            try {
                await Share.share({
                    title,
                    text,
                    url,
                    dialogTitle: 'Invita amici su Idoneo',
                });
                return true;
            } catch (err) {
                console.error('Error sharing', err);
                return false;
            }
        } else if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url,
                });
                return true;
            } catch {
                return false;
            }
        }
        return false;
    };

    return {
        ...stats,
        copyLink,
        shareVia,
        nativeShare,
        refresh: fetchReferralStats,
    };
}
