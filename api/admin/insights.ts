import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // Collect DB Analytics
        const { data: quizAttempts } = await supabase
            .from("quiz_attempts")
            .select('id, finished_at, is_idoneo, quiz_id, quizzes (title)')
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
                title: q.title,
                totalAttempts: q.total,
                completionRate: q.total > 0 ? (q.completed / q.total) * 100 : 0,
                successRate: q.completed > 0 ? (q.success / q.completed) * 100 : 0,
            }))
            .slice(0, 10);

        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        const { count: activeStreaks } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("streak_current", 3);
        const { count: totalQuestions } = await supabase.from("questions").select("*", { count: "exact", head: true });
        const { data: subjects } = await supabase.from("subjects").select("id, name");
        const { data: questionCounts } = await supabase.from("questions").select("subject_id");

        const subjectCounts: Record<string, number> = {};
        (questionCounts || []).forEach((q: any) => {
            if (q.subject_id) subjectCounts[q.subject_id] = (subjectCounts[q.subject_id] || 0) + 1;
        });

        const lowCoverageSubjects = (subjects || [])
            .map((s: any) => ({ name: s.name, count: subjectCounts[s.id] || 0 }))
            .filter((s: any) => s.count < 20 && s.count > 0)
            .slice(0, 5);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: newUsersLast7Days } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString());
        const { count: attemptsLast7Days } = await supabase.from("quiz_attempts").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString());

        const userPrompt = `Analizza questi dati della piattaforma IDONEO:
        
## Quiz Performance
${quizStats.map(q => `- "${q.title}": ${q.totalAttempts} tentativi, ${q.completionRate.toFixed(1)}% completamento, ${q.successRate.toFixed(1)}% successo`).join('\n')}

## Engagement Utenti
- Utenti totali: ${totalUsers}
- Utenti con streak 3+ giorni: ${activeStreaks} (${totalUsers ? ((activeStreaks || 0) / totalUsers * 100).toFixed(1) : 0}%)

## Contenuti
- Domande totali: ${totalQuestions}
- Materie totali: ${subjects?.length}
- Materie con poche domande (<20): ${lowCoverageSubjects.map(s => `${s.name} (${s.count})`).join(', ') || 'Nessuna'}

## Trend Recenti (ultimi 7 giorni)
- Nuovi utenti: ${newUsersLast7Days}
- Quiz tentati: ${attemptsLast7Days}

Genera 3-5 insight prioritari basati su questi dati. Concentrati su problemi critici e opportunità di miglioramento.`;

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: `Sei un analista esperto di piattaforme e-learning per la preparazione ai concorsi pubblici italiani. 
Analizza i dati forniti e genera insight azionabili in italiano.

Per ogni insight, fornisci:
- title: titolo breve e incisivo
- description: spiegazione del problema/opportunità
- recommendation: azione specifica da intraprendere
- priority: "high", "medium", o "low"
- trend: "up" (positivo) o "down" (negativo) o null
- insight_type: "conversion", "content_gap", "trend", o "alert"

Rispondi SOLO con un array JSON valido (nessun markdown o codeblock). Esempio:
[{"title": "...", "description": "...", "recommendation": "...", "priority": "high", "trend": "down", "insight_type": "alert"}]`,
            prompt: userPrompt,
        });

        const parsedInsights = JSON.parse(text.trim());

        // Deactivate old AI insights
        await supabase.from("admin_insights").update({ is_active: false }).eq("is_active", true).like("metadata->>source", "ai%");

        // Insert new ones
        const insightsToInsert = parsedInsights.map((insight: any) => ({
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

        const { data: savedInsights, error: insertError } = await supabase.from("admin_insights").insert(insightsToInsert).select();

        if (insertError) throw new Error(`Database error: ${insertError.message}`);

        return new Response(JSON.stringify({ success: true, insights: savedInsights }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 200,
        });

    } catch (error: any) {
        console.error('API Error /admin/insights:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
