import { describe, it, expect, vi, beforeEach } from 'vitest';
import { xpService } from './xpService';
import { supabase } from '@/lib/supabaseClient';

// Helper to create a chainable mock
const createSupabaseMock = (responseData: any = null, error: any = null) => {
    const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: responseData, error }),
        insert: vi.fn().mockResolvedValue({ error }),
        update: vi.fn().mockReturnThis(), // Returns builder for chaining .eq()
        maybeSingle: vi.fn().mockResolvedValue({ data: responseData, error }),
    };
    // Make queryBuilder thenable for update/insert if awaited directly
    (queryBuilder as any).then = (resolve: any) => resolve({ data: responseData, error });
    return queryBuilder;
};

// Start Mocking
vi.mock('@/lib/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
    }
}));

describe('xpService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserXp', () => {
        it('calculates level correctly for 0 XP', async () => {
            // Mock profile response for total_xp
            const profileQuery = createSupabaseMock({ total_xp: 0 });
            // Mock season query (will be called but we focus on level here)
            const seasonQuery = createSupabaseMock(null); // No active season or no xp

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'profiles') return profileQuery as any;
                if (table === 'leaderboard_seasons') return createSupabaseMock({ id: 's1' }) as any;
                if (table === 'user_xp') return createSupabaseMock({ xp: 0 }) as any;
                return createSupabaseMock() as any;
            });

            const stats = await xpService.getUserXp('user-1');
            expect(stats.currentLevel).toBe(1); // 0 / 100 + 1
            expect(stats.nextLevelProgress).toBe(0);
        });

        it('calculates level correctly for 250 XP', async () => {
            // Level 1 = 0-99
            // Level 2 = 100-199
            // Level 3 = 200-299
            // 250 XP should be Level 3. Progress: (250-200)/(300-200) = 50%

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'profiles') return createSupabaseMock({ total_xp: 250 }) as any;
                if (table === 'leaderboard_seasons') return createSupabaseMock({ id: 's1' }) as any;
                if (table === 'user_xp') return createSupabaseMock({ xp: 50 }) as any;
                return createSupabaseMock() as any;
            });

            const stats = await xpService.getUserXp('user-1');
            expect(stats.currentLevel).toBe(3);
            expect(stats.nextLevelProgress).toBe(50);
            expect(stats.totalXp).toBe(250);
        });
    });

    describe('awardXpForAttempt', () => {
        it('does not award XP if already awarded', async () => {
            // Mock attempt fetching returning xp_awarded: true
            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'quiz_attempts') return createSupabaseMock({
                    answers: [],
                    xp_awarded: true,
                    correct: 10
                }) as any;
                return createSupabaseMock() as any;
            });

            const amount = await xpService.awardXpForAttempt('att-1', 'user-1');
            expect(amount).toBe(0);
            expect(supabase.rpc).not.toHaveBeenCalled();
            expect(supabase.from('xp_events').insert).not.toHaveBeenCalled();
        });

        it('awards XP for fresh attempt', async () => {
            // Create a specific builder instance we can inspect
            const builder = createSupabaseMock({
                answers: [],
                xp_awarded: false,
                correct: 5
            });

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'quiz_attempts') {
                    // Return the SAME builder instance for both select and update calls
                    return builder as any;
                }
                if (table === 'leaderboard_seasons') return createSupabaseMock({ id: 's1' }) as any;
                if (table === 'xp_events') return createSupabaseMock(null) as any;
                return createSupabaseMock() as any;
            });

            vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

            const amount = await xpService.awardXpForAttempt('att-1', 'user-1');

            expect(amount).toBe(5);

            // Check Profile Increment
            expect(supabase.rpc).toHaveBeenCalledWith('increment_profile_xp', {
                p_user_id: 'user-1',
                p_amount: 5
            });

            // Check Season Increment
            expect(supabase.rpc).toHaveBeenCalledWith('upsert_user_xp', {
                p_user_id: 'user-1',
                p_season_id: 's1',
                p_amount: 5
            });

            // Check Update attempt
            // Since we reuse the builder, we can check calls on it
            expect(builder.update).toHaveBeenCalledWith({ xp_awarded: true });
        });
    });
});
