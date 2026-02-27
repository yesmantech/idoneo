import { supabase } from "@/lib/supabaseClient";

export type AITelemetryEventType =
    | 'session_recommended'
    | 'session_started'
    | 'session_completed'
    | 'insight_viewed'
    | 'question_explained'
    | 'bando_queried';

export const aiTelemetryService = {
    /**
     * Log an AI-related event to the database.
     * @param userId The ID of the user. Cannot be null.
     * @param eventType The type of AI event.
     * @param sessionData Any related JSON metadata for the event (e.g. recommended subtopics, duration).
     */
    async logEvent(userId: string, eventType: AITelemetryEventType, sessionData: any = {}) {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('ai_telemetry_logs')
                .insert([{
                    user_id: userId,
                    event_type: eventType,
                    session_data: sessionData
                }]);

            if (error) {
                console.error("Failed to log AI telemetry event:", error);
            }
        } catch (err) {
            console.error("Exception in logEvent:", err);
        }
    }
};
