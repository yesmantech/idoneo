const { createClient } = require('@supabase/supabase-js');
const url = "https://yansgitqqrcovwukvpfm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NDk3NywiZXhwIjoyMDc5NjUwOTc3fQ.mO21DyDC66vPCHK_TIT_okhXbIfVhs--BxDyGA0TYt8";
const supabase = createClient(url, key);

(async () => {
  // get a random question that has NO explanation
  const { data: q } = await supabase.from('questions').select('id, text, options, correct_option').is('explanation', null).limit(1).single();
  
  if (!q) { console.log('No questions without explanation found'); return; }
  
  console.log("Found question to test:", q.id);
  const correctOptionText = q.options[q.correct_option];
  
  const { data, error } = await supabase.functions.invoke('generate-explanation', {
      body: {
          questionId: q.id,
          questionText: q.text,
          correctAnswer: correctOptionText || q.correct_option
      }
  });
  
  console.log("Edge Function Response:", data, error);
  
  // verify DB
  const { data: verifyQ } = await supabase.from('questions').select('explanation').eq('id', q.id).single();
  console.log("DB Explanation after invoke:", verifyQ.explanation ? "SAVED SUCCESSFULLY" : "NULL (FAILED TO SAVE)");
})();
