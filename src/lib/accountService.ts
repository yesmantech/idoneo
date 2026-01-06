/**
 * Account Deletion Service
 * 
 * Handles secure account deletion for Apple App Store compliance.
 * Apple requires apps to allow users to delete their accounts (Guideline 5.1.1)
 */

import { supabase } from './supabaseClient';

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
