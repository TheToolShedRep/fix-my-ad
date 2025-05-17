// 📁 src/utils/supabase/client.ts

import { createClient } from "@supabase/supabase-js";

// ✅ Create a frontend-safe Supabase client using anon key
// ✅ This should ONLY be used in API routes or server components

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key = secure
  );
}
