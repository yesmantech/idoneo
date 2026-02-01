import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streakService } from './streakService';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from './analytics';

// Mock Dependencies
vi.mock('@/lib/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
    }
}));

vi.mock('@/lib/analytics', () => ({
    analytics: {
        track: vi.fn(),
    }
}));

// Mock Date to control "Today"
const realDate = Date;

describe('streakService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.Date = realDate;
    });

    const mockDate = (isoDate: string) => {
        const fixedDate = new Date(isoDate);
        global.Date = class extends realDate {
            constructor(...args: any[]) {
                super(...args as any);
                if (args.length > 0) {
                    return new realDate(...args as any);
                }
                return fixedDate;
            }

            static now() {
                return fixedDate.getTime();
            }
        } as any;
    };

    const setupProfile = (lastActiveAt: string | null, currentStreak: number) => {
        const builder: any = {};

        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockReturnValue(builder);
        builder.single = vi.fn().mockResolvedValue({
            data: {
                streak_current: currentStreak,
                streak_max: currentStreak,
                last_active_at: lastActiveAt
            },
            error: null
        });
        builder.update = vi.fn().mockReturnValue(builder);

        builder.then = (resolve: any) => resolve({ error: null });

        vi.mocked(supabase.from).mockReturnValue(builder);
        return builder;
    };

    it('resets streak to 1 if user missed yesterday', async () => {
        // Today = Jan 3
        mockDate('2025-01-03T12:00:00Z');

        // User Last Active = Jan 1 (Missed Jan 2)
        // Streak was 10
        const builder = setupProfile('2025-01-01T10:00:00Z', 10);

        const result = await streakService.checkAndUpdateStreak('user-1');

        expect(result?.streak).toBe(1);
        expect(result?.isBroken).toBe(true);
        expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
            streak_current: 1
        }));
    });

    it('increments streak if user was active yesterday', async () => {
        // Today = Jan 3
        mockDate('2025-01-03T12:00:00Z');

        // User Last Active = Jan 2
        // Streak was 10
        const builder = setupProfile('2025-01-02T10:00:00Z', 10);

        const result = await streakService.checkAndUpdateStreak('user-1');

        expect(result?.streak).toBe(11);
        expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
            streak_current: 11
        }));
    });

    it('maintains streak if user already active today', async () => {
        // Today = Jan 3
        mockDate('2025-01-03T18:00:00Z');

        // User Last Active = Jan 3
        const builder = setupProfile('2025-01-03T10:00:00Z', 11);

        const result = await streakService.checkAndUpdateStreak('user-1');

        expect(result?.streak).toBe(11);
        expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
            streak_current: 11
        }));
    });
});
