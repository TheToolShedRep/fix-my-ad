// SurveyForm.ts
import { supabase } from "@/utils/supabase";

type SurveyPayload = {
  user_email: string;
  project_id?: string; // optional for global survey
  product_type: string;
  platform: string;
  goal: string;
  notes?: string;
};

export async function upsertSurveyResponse(payload: SurveyPayload) {
  const { data, error } = await supabase
    .from("survey_responses")
    .upsert([payload], {
      onConflict: "user_email,project_id",
    });

  if (error) {
    console.error("❌ Failed to save survey:", error.message);
    throw error;
  }

  return data;
}
