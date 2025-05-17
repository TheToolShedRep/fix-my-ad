// src/lib/auth.ts
import { createSupabaseClient } from "@/utils/supabase/server";

/**
 * Returns true if the user is currently a Pro subscriber
 */
export async function isProUser(email: string): Promise<boolean> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("pro_users")
    .select("is_active")
    .eq("user_email", email)
    .single();

  return !!data?.is_active;
}
