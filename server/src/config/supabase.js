const { createClient } = require("@supabase/supabase-js");

// 1. យក Supabase URL និង Service Role Key ពី Env Variables
const supabaseUrl = process.env.SUPABASE_URL;
// ប្រើ Service Role Key ជាចម្បង បើគ្មានទេប្រើ Anon Key ជា Fallback
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Warning: Supabase URL or Key is missing in environment variables!");
}

// 2. បង្កើត Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 3. កំណត់ BUCKET ឈ្មោះ "day-life-media" (ឬតាម Env)
const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

module.exports = { supabase, BUCKET };