// 📦 Handles POST requests to /api/critique using the Next.js App Router
import { NextRequest, NextResponse } from "next/server";

// 📡 Imports the OpenAI SDK to send prompts
import OpenAI from "openai";

// 🗄️ Supabase client factory for database access (server-side)
import { createSupabaseClient } from "@/utils/supabase/server";

// 🔑 Initialize OpenAI instance using your secret API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🚀 Handles POST requests to this route
export async function POST(req: NextRequest) {
  // Parse the request body — expects userEmail and optional personality
  const body = await req.json();
  const { userEmail, personality = "Nova" } = body;

  // 🔌 Create a Supabase client to fetch user preferences
  const supabase = createSupabaseClient();

  // 🔍 Query the user's saved survey data from the user_profiles table
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("platform, ad_type, tone")
    .eq("user_email", userEmail)
    .single();

  // ✅ Provide fallback values if the user hasn’t completed the survey
  const platform = profile?.platform || "social media";
  const adType = profile?.ad_type || "generic";
  const tone = profile?.tone || "neutral";

  // ✍️ Build the AI prompt using the selected personality and survey preferences
  const prompt = `
You're a ${personality}, an expert in ad critique and optimization.

This is a ${platform} video ad for a ${adType} brand.
The tone of the brand is "${tone}".

Please review the video based on structure, engagement, and clarity.
Provide:
- 3 strengths
- 3 weaknesses
- 3 specific improvements
`;

  // 🤖 Send the constructed prompt to OpenAI GPT-4o for a response
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert ad critique assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // 📤 Return the AI’s response to the frontend
  return NextResponse.json({ result: res.choices[0].message.content });
}
