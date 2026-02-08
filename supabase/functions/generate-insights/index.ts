// supabase/functions/generate-insights/index.ts
// Supabase Edge Function for AI-powered analytics insights
// Deploy with: supabase functions deploy generate-insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsData {
    quizStats: {
        quizId: string;
        title: string;
        totalAttempts: number;
        completedAttempts: number;
        successfulAttempts: number;
        completionRate: number;
        successRate: number;
    }[];
    userStats: {
        totalUsers: number;
        activeStreaks: number;
        streakPercentage: number;
    };
    contentStats: {
        totalQuestions: number;
        totalSubjects: number;
        lowCoverageSubjects: { name: string; count: number }[];
    };
    recentTrends: {
        newUsersLast7Days: number;
        attemptsLast7Days: number;
    };
}

async function generateAIInsights(data: AnalyticsData, openaiKey: string): Promise<any[]> {
    const systemPrompt = `Sei un analista esperto di piattaforme e-learning per la preparazione ai concorsi pubblici italiani. 
Analizza i dati forniti e genera insight azionabili in italiano.

Per ogni insight, fornisci:
- title: titolo breve e incisivo
- description: spiegazione del problema/opportunità
- recommendation: azione specifica da intraprendere
- priority: "high", "medium", o "low"
- trend: "up" (positivo) o "down" (negativo) o null
- insight_type: "conversion", "content_gap", "trend", o "alert"

Rispondi SOLO con un array JSON valido, senza markdown o altro testo.`;

    const userPrompt = `Analizza questi dati della piattaforma IDONEO:

## Quiz Performance
${data.quizStats.map(q =>
        `- "${q.title}": ${q.totalAttempts} tentativi, ${q.completionRate.toFixed(1)}% completamento, ${q.successRate.toFixed(1)}% successo`
    ).join('\n')}

## Engagement Utenti
- Utenti totali: ${data.userStats.totalUsers}
- Utenti con streak 3+ giorni: ${data.userStats.activeStreaks} (${data.userStats.streakPercentage.toFixed(1)}%)

## Contenuti
- Domande totali: ${data.contentStats.totalQuestions}
- Materie totali: ${data.contentStats.totalSubjects}
- Materie con poche domande (<20): ${data.contentStats.lowCoverageSubjects.map(s => `${s.name} (${s.count})`).join(', ') || 'Nessuna'}

## Trend Recenti (ultimi 7 giorni)
- Nuovi utenti: ${data.recentTrends.newUsersLast7Days}
- Quiz tentati: ${data.recentTrends.attemptsLast7Days}

Genera 3-5 insight prioritari basati su questi dati. Concentrati su problemi critici e opportunità di miglioramento.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI API error:", error);
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || "[]";

    // Parse JSON response
    try {
        // Remove potential markdown code blocks
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanContent);
    } catch (e) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid AI response format");
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get API keys from environment
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!openaiKey) {
            throw new Error("OPENAI_API_KEY not configured");
        }

        // Create Supabase admin client
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        // =========================================================================
        // Gather Analytics Data
        // =========================================================================

        // 1. Quiz Performance Stats
        const { data: quizAttempts } = await supabase
            .from("quiz_attempts")
            .select(`
        id,
        finished_at,
        is_idoneo,
        quiz_id,
        quizzes (title)
      `)
            .limit(2000);

        const quizStatsMap: Record<string, any> = {};
        (quizAttempts || []).forEach((attempt: any) => {
            const quizId = attempt.quiz_id;
            const title = attempt.quizzes?.title || "Unknown";

            if (!quizStatsMap[quizId]) {
                quizStatsMap[quizId] = { quizId, title, total: 0, completed: 0, success: 0 };
            }
            quizStatsMap[quizId].total++;
            if (attempt.finished_at) quizStatsMap[quizId].completed++;
            if (attempt.is_idoneo) quizStatsMap[quizId].success++;
        });

        const quizStats = Object.values(quizStatsMap)
            .filter((q: any) => q.total >= 5)
            .map((q: any) => ({
                quizId: q.quizId,
                title: q.title,
                totalAttempts: q.total,
                completedAttempts: q.completed,
                successfulAttempts: q.success,
                completionRate: q.total > 0 ? (q.completed / q.total) * 100 : 0,
                successRate: q.completed > 0 ? (q.success / q.completed) * 100 : 0,
            }))
            .slice(0, 10); // Top 10 for context window

        // 2. User Stats
        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });

        const { count: activeStreaks } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("streak_current", 3);

        // 3. Content Stats
        const { count: totalQuestions } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true });

        const { data: subjects } = await supabase
            .from("subjects")
            .select("id, name");

        // Get question counts per subject
        const { data: questionCounts } = await supabase
            .from("questions")
            .select("subject_id");

        const subjectCounts: Record<string, number> = {};
        (questionCounts || []).forEach((q: any) => {
            if (q.subject_id) {
                subjectCounts[q.subject_id] = (subjectCounts[q.subject_id] || 0) + 1;
            }
        });

        const lowCoverageSubjects = (subjects || [])
            .map((s: any) => ({ name: s.name, count: subjectCounts[s.id] || 0 }))
            .filter((s: any) => s.count < 20 && s.count > 0)
            .slice(0, 5);

        // 4. Recent Trends
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: newUsersLast7Days } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString());

        const { count: attemptsLast7Days } = await supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .gte("created_at", sevenDaysAgo.toISOString());

        // Compile analytics data
        const analyticsData: AnalyticsData = {
            quizStats,
            userStats: {
                totalUsers: totalUsers || 0,
                activeStreaks: activeStreaks || 0,
                streakPercentage: totalUsers ? ((activeStreaks || 0) / totalUsers) * 100 : 0,
            },
            contentStats: {
                totalQuestions: totalQuestions || 0,
                totalSubjects: subjects?.length || 0,
                lowCoverageSubjects,
            },
            recentTrends: {
                newUsersLast7Days: newUsersLast7Days || 0,
                attemptsLast7Days: attemptsLast7Days || 0,
            },
        };

        // =========================================================================
        // Generate AI Insights
        // =========================================================================

        const aiInsights = await generateAIInsights(analyticsData, openaiKey);

        // =========================================================================
        // Save insights to database
        // =========================================================================

        // Deactivate old AI-generated insights
        await supabase
            .from("admin_insights")
            .update({ is_active: false })
            .eq("is_active", true)
            .like("metadata->>source", "ai%");

        // Insert new insights with AI source marker
        const insightsToInsert = aiInsights.map((insight: any) => ({
            insight_type: insight.insight_type || "trend",
            priority: insight.priority || "medium",
            title: insight.title,
            description: insight.description,
            recommendation: insight.recommendation || null,
            trend: insight.trend || null,
            metadata: { source: "ai_openai", generated_at: new Date().toISOString() },
            is_active: true,
            expires_at: null,
        }));

        const { data: savedInsights, error: insertError } = await supabase
            .from("admin_insights")
            .insert(insightsToInsert)
            .select();

        if (insertError) {
            console.error("Failed to save insights:", insertError);
            throw new Error(`Database error: ${insertError.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                insights: savedInsights,
                analytics: analyticsData,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
