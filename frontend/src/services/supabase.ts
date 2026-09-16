import { createClient } from "@supabase/supabase-js";

// Fallback to placeholder strings to prevent application crashes during initial local startup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase credentials missing. Utilizing mock placeholders. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your frontend/.env file to connect to your database."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

