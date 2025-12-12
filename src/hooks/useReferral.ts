import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

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
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://idoneo.ai';

            setStats({
                referralCode,
                referralLink: `${baseUrl}/waitlist?ref=${referralCode}`,
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
            `🎓 Sto preparando il mio prossimo concorso con Idoneo! Iscriviti anche tu alla waitlist: ${stats.referralLink}`
        );

        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${message}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(stats.referralLink)}&text=${encodeURIComponent('🎓 Sto preparando il mio prossimo concorso con Idoneo! Iscriviti anche tu alla waitlist:')}`,
            email: `mailto:?subject=${encodeURIComponent('Preparati al concorso con Idoneo!')}&body=${message}`,
        };

        window.open(urls[channel], '_blank');
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Idoneo - Preparati al concorso',
                    text: '🎓 Sto preparando il mio prossimo concorso con Idoneo! Iscriviti anche tu alla waitlist:',
                    url: stats.referralLink,
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
