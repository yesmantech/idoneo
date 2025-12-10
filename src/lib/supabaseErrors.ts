import { PostgrestError } from '@supabase/supabase-js';

/**
 * User-friendly error messages for Supabase errors (Italian)
 */
const ERROR_MESSAGES: Record<string, string> = {
    // RLS / Permission errors
    'PGRST301': 'Non hai i permessi per accedere a questa risorsa.',
    'PGRST116': 'Risorsa non trovata o accesso negato.',
    '42501': 'Permesso negato. Effettua il login e riprova.',

    // Auth errors
    'invalid_credentials': 'Email o password non validi.',
    'email_not_confirmed': 'Conferma la tua email prima di accedere.',
    'user_not_found': 'Utente non trovato.',

    // Generic
    'PGRST204': 'Nessun risultato trovato.',
    '23505': 'Questo elemento esiste già.',
    '23503': 'Impossibile eliminare: è collegato ad altri dati.',

    // Network
    'FetchError': 'Errore di connessione. Controlla la rete.',
};

const DEFAULT_MESSAGE = 'Si è verificato un errore. Riprova più tardi.';

export interface ParsedError {
    message: string;
    code: string | null;
    isPermissionError: boolean;
    isNotFoundError: boolean;
    isNetworkError: boolean;
}

/**
 * Parse a Supabase error into a user-friendly format
 */
export function parseSupabaseError(error: PostgrestError | Error | unknown): ParsedError {
    if (!error) {
        return {
            message: DEFAULT_MESSAGE,
            code: null,
            isPermissionError: false,
            isNotFoundError: false,
            isNetworkError: false,
        };
    }

    // PostgrestError
    if (typeof error === 'object' && 'code' in error) {
        const pgError = error as PostgrestError;
        const code = pgError.code || '';

        const isPermissionError = ['42501', 'PGRST301', 'PGRST116'].includes(code);
        const isNotFoundError = code === 'PGRST204' || code === 'PGRST116';

        return {
            message: ERROR_MESSAGES[code] || pgError.message || DEFAULT_MESSAGE,
            code,
            isPermissionError,
            isNotFoundError,
            isNetworkError: false,
        };
    }

    // Standard Error
    if (error instanceof Error) {
        const isNetworkError = error.name === 'FetchError' ||
            error.message.includes('fetch') ||
            error.message.includes('network');

        return {
            message: isNetworkError ? ERROR_MESSAGES['FetchError'] : (error.message || DEFAULT_MESSAGE),
            code: null,
            isPermissionError: false,
            isNotFoundError: false,
            isNetworkError,
        };
    }

    return {
        message: DEFAULT_MESSAGE,
        code: null,
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: false,
    };
}

/**
 * Get a simple user-friendly message from an error
 */
export function getErrorMessage(error: unknown): string {
    return parseSupabaseError(error).message;
}

/**
 * Check if error is a permission/RLS error
 */
export function isPermissionError(error: unknown): boolean {
    return parseSupabaseError(error).isPermissionError;
}

/**
 * Log error to console with context (for debugging)
 */
export function logError(context: string, error: unknown): void {
    const parsed = parseSupabaseError(error);
    console.error(`[${context}] ${parsed.code || 'UNKNOWN'}: ${parsed.message}`, error);
}
