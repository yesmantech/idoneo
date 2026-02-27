const { createClient } = require('@supabase/supabase-js');
const url = "https://yansgitqqrcovwukvpfm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbnNnaXRxcXJjb3Z3dWt2cGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3NDk3NywiZXhwIjoyMDc5NjUwOTc3fQ.mO21DyDC66vPCHK_TIT_okhXbIfVhs--BxDyGA0TYt8";
const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase.from('questions').select('id, explanation').not('explanation', 'is', null).limit(5);
  console.log("Error:", error);
  console.log("Data:", data);
})();
