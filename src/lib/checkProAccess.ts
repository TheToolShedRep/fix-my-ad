// ✅ Supabase Pro checker for client-side use

import { createClient } from "@supabase/supabase-js";

/**
 * Checks if the given user email has active Pro status in the Supabase 'pro_users' table.
 * @param email The user's email address
 * @returns boolean true if the user is Pro
 */
export async function checkProAccess(email: string): Promise<boolean> {
  if (!email) return false;

  // 🔑 Initialize Supabase client using public keys
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🔍 Query for Pro status
  const { data, error } = await supabase
    .from("pro_users")
    .select("is_active")
    .eq("user_email", email)
    .eq("is_active", true)
    .maybeSingle();

  // ⚠️ Log error and return false on failure
  if (error) {
    console.error("❌ Supabase error checking Pro status:", error.message);
    return false;
  }

  // ✅ Return true only if record found and is_active is true
  return !!data;
}
