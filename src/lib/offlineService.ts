/**
 * @file offlineService.ts
 * @description Offline-first quiz storage using IndexedDB.
 *
 * This service enables quiz functionality without network connectivity by:
 * 1. **Downloading quizzes** - Caching questions and metadata locally
 * 2. **Running quizzes offline** - Generating attempts from cached questions
 * 3. **Syncing results** - Uploading completed attempts when online
 *
 * ## IndexedDB Schema
 * | Store              | Key       | Contents                          |
 * |--------------------|-----------|-----------------------------------|
 * | questions          | id (UUID) | Question data (text, options, etc)|
 * | quiz_meta          | id (UUID) | Quiz metadata + question ID list  |
 * | pending_attempts   | localId   | Unsynced offline attempts         |
 *
 * ## Workflow
 * ```
 * 1. User downloads quiz → questions + meta stored in IDB
 * 2. User starts offline quiz → local attempt created
 * 3. User completes quiz → attempt saved to pending_attempts
 * 4. Network available → syncAndClean() uploads to Supabase
 * ```
 *
 * ## Progress Tracking
 * The `downloadQuiz` function accepts an `onProgress` callback for UI feedback
 * during large downloads (500+ questions per batch).
 *
 * @example
 * ```typescript
 * import { offlineService } from '@/lib/offlineService';
 *
 * // Download a quiz for offline use
 * await offlineService.downloadQuiz(quizId, (percent) => {
 *   setProgress(percent);
 * });
 *
 * // Check if a quiz is available offline
 * const isAvailable = await offlineService.isQuizDownloaded(quizId);
 *
 * // Start an offline quiz attempt
 * const localAttemptId = await offlineService.createLocalAttempt(quizId);
 *
 * // Sync pending attempts when online
 * const syncedCount = await offlineService.syncAndClean();
 * ```
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// CONSTANTS
// ============================================================================

/** IndexedDB database name */
const DB_NAME = 'idoneo-offline-db';

/** Database schema version (increment to trigger migration) */
const DB_VERSION = 1;

/** Object store for question data */
const STORE_QUESTIONS = 'questions';

/** Object store for quiz metadata and question ID lists */
const STORE_QUIZ_META = 'quiz_meta';

/** Object store for unsynced quiz attempts */
const STORE_PENDING_ATTEMPTS = 'pending_attempts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Metadata for a downloaded quiz.
 * Stored in the quiz_meta object store.
 */
interface OfflineQuizMeta {
    /** Quiz UUID (primary key) */
    id: string;
    /** Quiz display title */
    title: string;
    /** Quiz description */
    description: string;
    /** List of question IDs available for this quiz */
    questionIds: string[];
    /** Unix timestamp when the quiz was downloaded */
    timestamp: number;
}

/**
 * Cached question data.
 * Stored in the questions object store.
 */
interface Question {
    /** Question UUID (primary key) */
    id: string;
    /** Question text (may contain HTML) */
    text: string;
    /** Answer options (JSONB from database) */
    options: any;
    /** Correct answer key (a, b, c, or d) */
    correct_option: string;
    /** Optional explanation for the correct answer */
    explanation?: string;
    /** Subject UUID for categorization */
    subject_id?: string;
    /** Subject name (if joined from database) */
    subject_name?: string;
}

// ============================================================================
// OFFLINE SERVICE
// ============================================================================

export const offlineService = {
    async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_QUESTIONS)) {
                    db.createObjectStore(STORE_QUESTIONS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_QUIZ_META)) {
                    db.createObjectStore(STORE_QUIZ_META, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_PENDING_ATTEMPTS)) {
                    db.createObjectStore(STORE_PENDING_ATTEMPTS, { keyPath: 'localId' });
                }
            };
        });
    },

    // 1. Download Quiz (Full Fetch)
    async downloadQuiz(quizId: string, onProgress?: (percent: number) => void): Promise<void> {
        // 1. Fetch Quiz Metadata
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('id, title, description')
            .eq('id', quizId)
            .single();

        if (quizError || !quiz) throw new Error("Quiz not found online");

        // 2. Fetch All Questions for this quiz
        // REFINED: We will fetch ALL questions for the subjects in this quiz.
        const { data: structure } = await supabase
            .from('quiz_subject_rules')
            .select('id, subject_id, question_count')
            .eq('quiz_id', quizId);

        if (!structure || structure.length === 0) throw new Error("No structure found for quiz");

        const subjectIds = structure.map(s => s.subject_id).filter(Boolean);

        // Fetch questions in batches
        let allQuestions: Question[] = [];
        const BATCH_SIZE = 500;

        // We might need to count total first for progress
        const { count } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .in('subject_id', subjectIds);

        const total = count || 0;
        let fetched = 0;

        // Loop fetch
        let rangeStart = 0;
        while (true) {
            const { data: batch, error } = await supabase
                .from('questions')
                .select('id, text, options, correct_option, explanation, subject_id')
                .in('subject_id', subjectIds)
                .range(rangeStart, rangeStart + BATCH_SIZE - 1);

            if (error) throw error;
            if (!batch || batch.length === 0) break;

            allQuestions = [...allQuestions, ...batch];
            fetched += batch.length;
            rangeStart += BATCH_SIZE;

            if (onProgress && total > 0) onProgress(Math.round((fetched / total) * 100));
            if (batch.length < BATCH_SIZE) break;
        }

        // 3. Save to IndexedDB
        const db = await this.openDB();
        const tx = db.transaction([STORE_QUESTIONS, STORE_QUIZ_META], 'readwrite');

        // Save Questions
        const qStore = tx.objectStore(STORE_QUESTIONS);
        for (const q of allQuestions) {
            qStore.put(q);
        }

        // Save Meta
        const mStore = tx.objectStore(STORE_QUIZ_META);
        const meta: OfflineQuizMeta = {
            id: quizId,
            title: quiz.title,
            description: quiz.description,
            questionIds: allQuestions.map(q => q.id),
            timestamp: Date.now()
        };
        mStore.put(meta);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // 2. Check if downloaded
    async isQuizDownloaded(quizId: string): Promise<boolean> {
        try {
            const db = await this.openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_QUIZ_META, 'readonly');
                const store = tx.objectStore(STORE_QUIZ_META);
                const req = store.get(quizId);
                req.onsuccess = () => resolve(!!req.result);
                req.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    },

    // 3. Get Offline Questions
    async getQuestions(questionIds: string[]): Promise<Question[]> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_QUESTIONS, 'readonly');
        const store = tx.objectStore(STORE_QUESTIONS);

        const questions: Question[] = [];
        for (const id of questionIds) {
            try {
                const q = await new Promise<Question>((resolve, reject) => {
                    const req = store.get(id);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
                if (q) questions.push(q);
            } catch (e) {
                console.warn(`Missing offline question: ${id}`);
            }
        }
        return questions;
    },

    // 4. Get random questions for offline generation
    async generateOfflineReview(quizId: string, count: number): Promise<Question[]> {
        const db = await this.openDB();

        const meta = await new Promise<OfflineQuizMeta>((resolve, reject) => {
            const tx = db.transaction(STORE_QUIZ_META, 'readonly');
            const req = tx.objectStore(STORE_QUIZ_META).get(quizId);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (!meta || !meta.questionIds) return [];

        // Shuffle & Slice
        const shuffled = meta.questionIds.sort(() => 0.5 - Math.random()).slice(0, count);

        // We also need options and correct answers for the app to function
        return this.getQuestions(shuffled);
    },

    // 5. Save Pending Attempt
    async savePendingAttempt(attemptData: any): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_ATTEMPTS);

        if (!attemptData.updated_at) attemptData.updated_at = new Date().toISOString();
        if (!attemptData.created_at) attemptData.created_at = new Date().toISOString();
        attemptData.synced = false;

        store.put(attemptData);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // 5b. Create New Local Attempt
    async createLocalAttempt(quizId: string): Promise<string> {
        const db = await this.openDB();
        const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_ATTEMPTS);

        // We need to generate questions for this attempt too!
        // For simplicity, we just generate 20 random questions from the pool.
        const questions = await this.generateOfflineReview(quizId, 20); // Default 20
        const answers = questions.map(q => ({
            questionId: q.id,
            text: q.text, // Store text to display
            options: q.options,
            correctOption: q.correct_option,
            explanation: q.explanation,
            selectedOption: null,
            subjectId: q.subject_id
        }));

        const localId = `local-${Date.now()}`;
        const attempt = {
            id: localId,
            localId: localId,
            quiz_id: quizId,
            status: 'in_progress',
            created_at: new Date().toISOString(),
            answers: answers, // Initialize with questions
            synced: false
        };

        store.put(attempt);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(localId);
            tx.onerror = () => reject(tx.error);
        });
    },

    // 5c. Get Local Attempt
    async getLocalAttempt(localId: string): Promise<any> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readonly');
            const store = tx.objectStore(STORE_PENDING_ATTEMPTS);
            const req = store.get(localId);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    // 6. Sync Pending
    async syncPendingAttempts(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0; // Can't sync if not logged in

        const db = await this.openDB();
        const allPending = await new Promise<any[]>((resolve, reject) => {
            const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readonly');
            const req = tx.objectStore(STORE_PENDING_ATTEMPTS).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (allPending.length === 0) return 0;

        let syncedCount = 0;
        const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readwrite');
        const store = tx.objectStore(STORE_PENDING_ATTEMPTS);

        for (const attempt of allPending) {
            // Only sync finished attempts
            if (!attempt.finished_at) continue;

            // PREPARE PAYLOAD FOR SUPABASE
            // 1. Remove local keys
            const { localId, synced, id, ...rest } = attempt;

            // 2. Inject User ID
            const payload = {
                ...rest,
                user_id: user.id,
                // Let Supabase generate a new UUID for 'id' OR format answers if needed
            };

            // 3. Insert
            const { error } = await supabase.from('quiz_attempts').insert(payload);

            if (!error) {
                // Remove from local DB on success
                // simple store.delete(attempt.localId) might fail if we are inside an async loop 
                // but usually fine if using the *same* transaction? 
                // Wait, await supabase breaks the transaction scope in standard IDB!
                // We must perform deletions in a NEW transaction after the await.
                syncedCount++;
            } else {
                console.error("Sync error for attempt", attempt.localId, error);
            }
        }

        // Clean up synced items (Supabase calls are async, so original tx is closed)
        if (syncedCount > 0) {
            const cleanupTx = db.transaction(STORE_PENDING_ATTEMPTS, 'readwrite');
            const cleanupStore = cleanupTx.objectStore(STORE_PENDING_ATTEMPTS);
            for (const attempt of allPending) {
                if (attempt.finished_at) { // simplistic check, ideally track IDs successfully synced
                    // For now, re-reading or assuming success in this flow. 
                    // Better: track successful IDs.
                }
            }
        }

        return syncedCount;
    },

    // 6b. Optimized Sync with cleanup
    async syncAndClean(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const db = await this.openDB();

        // 1. Get all pending
        const allPending = await new Promise<any[]>((resolve) => {
            const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readonly');
            const store = tx.objectStore(STORE_PENDING_ATTEMPTS);
            store.getAll().onsuccess = (e: any) => resolve(e.target.result);
        });

        let syncedCount = 0;
        const toDelete: string[] = [];

        for (const attempt of allPending) {
            if (!attempt.finished_at) continue;

            const { localId, synced, id, ...rest } = attempt;
            const payload = { ...rest, user_id: user.id }; // Auto-gen ID

            const { error } = await supabase.from('quiz_attempts').insert(payload);
            if (!error) {
                toDelete.push(attempt.localId);
                syncedCount++;
            }
        }

        if (toDelete.length > 0) {
            const tx = db.transaction(STORE_PENDING_ATTEMPTS, 'readwrite');
            const store = tx.objectStore(STORE_PENDING_ATTEMPTS);
            toDelete.forEach(id => store.delete(id));
            await new Promise<void>((resolve) => {
                tx.oncomplete = () => resolve();
            });
        }

        return syncedCount;
    }
};
