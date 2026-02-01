/**
 * @file accountService.ts
 * @description User account management and deletion service.
 *
 * This service handles account-level operations, primarily focused on
 * secure account deletion for Apple App Store compliance (Guideline 5.1.1).
 *
 * ## Account Deletion Process
 *
 * 1. **Avatar Cleanup**: Delete user's avatar from Supabase Storage
 * 2. **Database Deletion**: Call `delete_user_account` RPC function
 * 3. **Session Cleanup**: Sign out the user
 *
 * ## Data Cascade
 *
 * The `delete_user_account` database function triggers CASCADE deletion of:
 * - `profiles` - User profile data
 * - `quiz_attempts` - All quiz history
 * - `user_xp` - XP records
 * - `user_badges` - Earned badges
 * - `concorso_leaderboard` - Leaderboard entries
 * - `xp_events` - XP transaction history
 * - `friendships` - Social connections
 *
 * ## Security
 *
 * The RPC function verifies the calling user can only delete their own account
 * via RLS policies and `auth.uid()` matching.
 *
 * @example
 * ```typescript
 * import { deleteUserAccount } from '@/lib/accountService';
 *
 * const handleDelete = async () => {
 *   const result = await deleteUserAccount();
 *   if (result.success) {
 *     // Redirect to home
 *   } else {
 *     showError(result.error);
 *   }
 * };
 * ```
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DeleteAccountResult {
    success: boolean;
    error?: string;
}

/**
 * Deletes the current user's account and all associated data.
 * 
 * This function:
 * 1. Deletes the user's avatar from storage (if exists)
 * 2. Calls the secure database function to delete the user
 * 3. Signs out the user
 * 
 * All related data is automatically deleted via ON DELETE CASCADE:
 * - profiles, user_xp, concorso_leaderboard, user_badges, xp_events, friendships, user_quiz_stats
 */
export async function deleteUserAccount(): Promise<DeleteAccountResult> {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Utente non autenticato' };
        }

        // Step 1: Try to delete avatar from storage
        try {
            // List user's avatar files
            const { data: avatarFiles } = await supabase.storage
                .from('avatars')
                .list('', {
                    search: user.id
                });

            if (avatarFiles && avatarFiles.length > 0) {
                const filesToDelete = avatarFiles.map(f => f.name);
                await supabase.storage.from('avatars').remove(filesToDelete);
            }
        } catch (storageError) {
            // Continue even if storage deletion fails
            console.warn('Could not delete avatar:', storageError);
        }

        // Step 2: Call the secure database function to delete the user
        const { error: deleteError } = await supabase.rpc('delete_user_account');

        if (deleteError) {
            console.error('Delete account error:', deleteError);
            return {
                success: false,
                error: 'Impossibile eliminare l\'account. Riprova più tardi.'
            };
        }

        // Step 3: Sign out (session is now invalid anyway)
        await supabase.auth.signOut();

        return { success: true };

    } catch (error) {
        console.error('Unexpected error during account deletion:', error);
        return {
            success: false,
            error: 'Si è verificato un errore imprevisto.'
        };
    }
}
