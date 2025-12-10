import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read Env manually to avoid dotenv dependency
const envPath = path.resolve(process.cwd(), ".env.local");
let envContent = "";
try {
    envContent = fs.readFileSync(envPath, "utf8");
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const url = getEnv("VITE_SUPABASE_URL");
const key = getEnv("VITE_SUPABASE_ANON_KEY");

console.log("URL:", url);
// Partially hide key log
console.log("KEY Found:", !!key);

if (!url || !key) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    console.log("Checking 'questions' table for 'explanation' column...");

    // 1. Check if column exists by selecting it
    const { data, error } = await supabase.from("questions").select("id, explanation").limit(1);

    if (error) {
        console.error("❌ ERROR: Query failed. This likely means the 'explanation' column DOES NOT exist.");
        console.error("Supabase Error:", error.message);
        console.log("\nACTION REQUIRED: Run the migration 'supabase/migrations/20241210_questions_explanation.sql'.");
    } else {
        console.log("✅ SUCCESS: 'explanation' column exists!");
        console.log("Sample Row:", data[0] || "No rows found");

        // 2. Try to update a question (if any exist)
        if (data && data.length > 0) {
            const id = data[0].id;
            console.log(`\nAttempting to set test explanation on Question ID: ${id}...`);
            const { error: updateError } = await supabase
                .from("questions")
                .update({ explanation: "<p><strong>Test Explanation</strong>: This was added by the verification script.</p>" })
                .eq("id", id);

            if (updateError) {
                console.error("Update Error:", updateError);
            } else {
                console.log("✅ Update Success! Question now has an explanation.");
                console.log("You can now verify this in the app.");
            }
        } else {
            console.log("No questions found to update.");
        }
    }
}

run();
