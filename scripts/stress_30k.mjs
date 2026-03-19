import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yansgitqqrcovwukvpfm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NDk3NywiZXhwIjoyMDc5NjUwOTc3fQ.mO21DyDC66vPCHK_TIT_okhXbIfVhs--BxDyGA0TYt8';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const timer = () => { const s = Date.now(); return () => Date.now() - s; };

async function blastTest(name, fn, total, batchSize) {
    const allTimes = [];
    let ok = 0, fail = 0, errors = new Map();
    const wall = timer();

    for (let i = 0; i < total; i += batchSize) {
        const count = Math.min(batchSize, total - i);
        const results = await Promise.allSettled(Array.from({ length: count }, () => fn()));
        results.forEach(r => {
            if (r.status === 'fulfilled') { ok++; allTimes.push(r.value); }
            else { 
                fail++; 
                const msg = r.reason?.message?.slice(0, 80) || 'unknown';
                errors.set(msg, (errors.get(msg) || 0) + 1);
            }
        });
        process.stdout.write(`\r   ${ok + fail}/${total} (${ok}✅ ${fail}❌)`);
    }

    const wallMs = wall();
    allTimes.sort((a, b) => a - b);
    const avg = allTimes.length ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) : 0;
    const p50 = allTimes[Math.floor(allTimes.length * 0.5)] || 0;
    const p95 = allTimes[Math.floor(allTimes.length * 0.95)] || 0;
    const p99 = allTimes[Math.floor(allTimes.length * 0.99)] || 0;
    const max = allTimes[allTimes.length - 1] || 0;
    const rps = Math.round(ok / (wallMs / 1000));

    console.log(`\n\n📊 ${name}`);
    console.log(`   ✅ ${ok}  ❌ ${fail}  (${((fail/(ok+fail))*100).toFixed(2)}% error)`);
    console.log(`   ⏱️  Avg: ${avg}ms  P50: ${p50}ms  P95: ${p95}ms  P99: ${p99}ms  Max: ${max}ms`);
    console.log(`   📈 ${rps} req/s in ${(wallMs/1000).toFixed(1)}s`);
    if (errors.size > 0) {
        console.log(`   ⚠️  Error types:`);
        errors.forEach((count, msg) => console.log(`      - ${msg} (×${count})`));
    }
    return { ok, fail, rps, avg, p95, p99, max, wallMs };
}

async function testQuiz() {
    const t = timer();
    const { error } = await supabase.from('quizzes').select('id, title').limit(10);
    if (error) throw error;
    return t();
}
async function testLeaderboard() {
    const t = timer();
    const { error } = await supabase.from('concorso_leaderboard').select('user_id, score').order('score', { ascending: false }).limit(20);
    if (error) throw error;
    return t();
}
async function testProfiles() {
    const t = timer();
    const { error } = await supabase.from('profiles').select('id, nickname').limit(10);
    if (error) throw error;
    return t();
}
async function testQuestions() {
    const t = timer();
    const { error } = await supabase.from('questions').select('id, text').limit(20);
    if (error) throw error;
    return t();
}

async function main() {
    console.log('🔥🔥🔥 EXTREME STRESS TEST — 30.000 req/s target 🔥🔥🔥');
    console.log('=========================================================');
    console.log(`Ora: ${new Date().toLocaleString('it-IT')}`);
    console.log(`Batch size: 3000 concurrent (× 10 batches = 30.000 per endpoint)\n`);

    const r1 = await blastTest('Quiz List', testQuiz, 30000, 3000);
    const r2 = await blastTest('Leaderboard', testLeaderboard, 30000, 3000);
    const r3 = await blastTest('Profili', testProfiles, 30000, 3000);
    const r4 = await blastTest('Domande', testQuestions, 30000, 3000);

    const all = [r1, r2, r3, r4];
    const totalReqs = all.reduce((a, r) => a + r.ok + r.fail, 0);
    const totalFail = all.reduce((a, r) => a + r.fail, 0);
    const peakRps = Math.max(...all.map(r => r.rps));

    console.log('\n\n=========================================================');
    console.log('📋 RIEPILOGO — 120.000 richieste');
    console.log('=========================================================');
    console.log(`   Totale: ${totalReqs} richieste`);
    console.log(`   Errori: ${totalFail} (${((totalFail/totalReqs)*100).toFixed(2)}%)`);
    console.log(`   Peak throughput: ${peakRps} req/s`);
    
    if (totalFail === 0) console.log('\n   🟢 STABILE — 0 errori');
    else if (totalFail / totalReqs < 0.01) console.log('\n   🟡 OK — error rate < 1%');
    else if (totalFail / totalReqs < 0.05) console.log('\n   🟠 ATTENZIONE — error rate < 5%');
    else console.log('\n   🔴 CRITICO — error rate > 5%');
    console.log('\n🏁 Done!\n');
}

main().catch(console.error);
