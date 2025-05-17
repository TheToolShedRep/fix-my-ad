// 📁 File: src/lib/usage.ts

import { supabase } from "@/utils/supabase";
import { format } from "date-fns";

/**
 * ✅ Checks if the user has remaining usage for a specific type of action.
 *
 * @param type - Either "video_uploads" or "questions_asked"
 * @param email - The user's email address
 * @returns An object indicating if the action is allowed and whether the user is Pro
 */
// export async function checkUsageLimit(
//   type: "video_uploads" | "questions_asked",
//   email: string
// ): Promise<{ allowed: boolean; isPro: boolean }> {
//   const today = format(new Date(), "yyyy-MM-dd");

// 🔍 Fetch today's usage row for this user
//   const { data, error } = await supabase
//     .from("usage_limits")
//     .select(`${type}, is_pro`)
//     .eq("user_email", email)
//     .eq("date", today)
//     .single();

// 🛡 If user is Pro, allow unlimited usage
//   if (data?.is_pro) return { allowed: true, isPro: true };

// 🎯 Define limits for free users
const limits = {
  video_uploads: 1,
  questions_asked: 5,
};

// ✅ Safely get current count without TypeScript errors
//   let currentCount = 0;
//   if (type === "video_uploads") {
//     currentCount = data?.video_uploads ?? 0;
//   } else if (type === "questions_asked") {
//     currentCount = data?.questions_asked ?? 0;
//   }else{
//      // 🚨 This should never happen unless `type` is mistyped or changed in future
//   throw new Error(`Unsupported usage type: ${type}`);
//   }

//   return {
//     allowed: currentCount < limits[type],
//     isPro: false,
//   };
// }

/**
 * 🔁 Increments usage for the given type for today's date.
 * Automatically creates the row if it doesn't exist yet.
 *
 * @param type - Either "video_uploads" or "questions_asked"
 * @param email - The user's email address
 */
export async function incrementUsage(
  type: "video_uploads" | "questions_asked",
  email: string
) {
  const today = format(new Date(), "yyyy-MM-dd");

  // 🧱 Ensure today's row exists (or insert it if not)
  await supabase
    .from("usage_limits")
    .upsert([{ user_email: email, date: today }], {
      onConflict: "user_email, date", // 🚫 Prevent duplicate rows
    });

  // 🔢 Call the stored procedure to increment the correct column
  await supabase.rpc("increment_column", {
    email_input: email,
    date_input: today,
    column_name: type,
  });
}
