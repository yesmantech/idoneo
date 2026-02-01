/**
 * @file friendService.ts
 * @description Social/friend system for user connections.
 *
 * This service manages the friend system, including:
 * - User search by nickname
 * - Friend request lifecycle (send, accept, reject)
 * - Friend list with pending requests
 *
 * ## Friend Sources
 *
 * Users can be "friends" through two mechanisms:
 * 1. **Referrals**: Users who signed up with someone's referral code
 * 2. **Manual Friendships**: Explicit friend requests via the `friendships` table
 *
 * ## Request States
 *
 * | Status     | Description                              |
 * |------------|------------------------------------------|
 * | `pending`  | Request sent, awaiting acceptance        |
 * | `accepted` | Both users are friends                   |
 * | `rejected` | Request was declined (cannot re-request) |
 * | `referral` | Virtual status for referred users        |
 *
 * ## Database Schema
 *
 * The `friendships` table uses two user ID columns:
 * - `user_id`: The user who initiated the request
 * - `friend_id`: The user receiving the request
 *
 * @example
 * ```typescript
 * import { friendService } from '@/lib/friendService';
 *
 * // Search for users
 * const results = await friendService.searchUsers('marco', currentUserId);
 *
 * // Send friend request
 * await friendService.sendRequest(currentUserId, friendId);
 *
 * // Get all friends and pending requests
 * const { friends, pendingReceived } = await friendService.getFriendsAndRequests(userId);
 * ```
 */

import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Friend profile data for display.
 */
export interface FriendProfile {
    /** User UUID */
    id: string;
    /** Display name */
    nickname: string;
    /** Profile picture URL */
    avatar_url: string | null;
    /** When the friendship/referral was created */
    created_at: string;
    /** Relationship status */
    status?: 'accepted' | 'pending' | 'referral';
    /** Friendship record ID (for accept/reject actions) */
    friendship_id?: string;
    /** True if current user sent the request */
    is_requester?: boolean;
}

// ============================================================================
// FRIEND SERVICE
// ============================================================================

export const friendService = {
    /**
     * Search for users by nickname.
     * Excludes the current user.
     */
    async searchUsers(query: string, currentUserId: string): Promise<FriendProfile[]> {
        if (!query || query.length < 3) return [];

        const { data, error } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url, created_at')
            .ilike('nickname', `%${query}%`)
            .neq('id', currentUserId)
            .limit(10);

        if (error) {
            console.error('Search error:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Send a friend request
     */
    async sendRequest(currentUserId: string, friendId: string) {
        // Check if already exists
        const { data: existing } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`)
            .single();

        if (existing) {
            if (existing.status === 'rejected') {
                // Optional: Allow re-requesting?
                return { error: 'Request previously rejected.' };
            }
            return { error: 'Friendship already exists or is pending.' };
        }

        const { error } = await supabase
            .from('friendships')
            .insert({
                user_id: currentUserId,
                friend_id: friendId,
                status: 'pending'
            });

        return { error };
    },

    /**
     * Accept a friend request
     */
    async acceptRequest(friendshipId: string) {
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', friendshipId);
        return { error };
    },

    /**
     * Reject/Cancel a friend request
     */
    async removeFriendship(friendshipId: string) {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', friendshipId);
        return { error };
    },

    /**
     * Get ALL friends (Referrals + Accepted Friendships)
     * Also returns Pending Requests separately? No, let's mix them or return object.
     */
    async getFriendsAndRequests(userId: string): Promise<{
        friends: FriendProfile[],
        pendingReceived: FriendProfile[],
        pendingSent: FriendProfile[]
    }> {
        // 1. Get Referrals (Legacy Friends)
        const { data: referrals } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url, created_at')
            .eq('referred_by', userId)
            .order('created_at', { ascending: false });

        const referralFriends: FriendProfile[] = (referrals || []).map(r => ({ ...r, status: 'referral' }));

        // 2. Get Friendships (Accepted & Pending)
        // We need to know who is who
        const { data: friendships } = await supabase
            .from('friendships')
            .select(`
                id,
                status,
                user_id,
                friend_id,
                created_at,
                sender:profiles!user_id(id, nickname, avatar_url),
                receiver:profiles!friend_id(id, nickname, avatar_url)
            `)
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        const accepted: FriendProfile[] = [];
        const pendingReceived: FriendProfile[] = [];
        const pendingSent: FriendProfile[] = [];

        friendships?.forEach((f: any) => {
            const isSender = f.user_id === userId;
            const otherUser = isSender ? f.receiver : f.sender;

            // Should not happen if DB integrity holds, but handled
            if (!otherUser) return;

            const profile: FriendProfile = {
                id: otherUser.id,
                nickname: otherUser.nickname,
                avatar_url: otherUser.avatar_url,
                created_at: f.created_at,
                friendship_id: f.id,
                status: f.status,
                is_requester: isSender
            };

            if (f.status === 'accepted') {
                accepted.push(profile);
            } else if (f.status === 'pending') {
                if (isSender) {
                    pendingSent.push(profile);
                } else {
                    pendingReceived.push(profile);
                }
            }
        });

        // 3. Merge Referred + Accepted (Avoid duplicates if logic changes later)
        // Current logic: Referrals are one-way in DB, but we treat them as friends.
        // If a referral is ALSO a manual friend, we prefer the 'friend' entry? 
        // Or just de-dupe.

        const friendMap = new Map<string, FriendProfile>();

        // Add referrals first
        referralFriends.forEach(f => friendMap.set(f.id, f));

        // Add accepted (overwrites referral if exists, which gives it a 'friendship_id' allowing management)
        accepted.forEach(f => friendMap.set(f.id, f));

        return {
            friends: Array.from(friendMap.values()),
            pendingReceived,
            pendingSent
        };
    }
};
