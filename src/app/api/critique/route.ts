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
  try {
    // 📥 Parse the request body — expects userEmail or prompt
    const body = await req.json();
    const { userEmail, personality = "Nova", prompt: directPrompt } = body;

    // 🧱 Validate input
    if (!userEmail && !directPrompt) {
      console.error("❌ Missing userEmail or prompt in body:", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let finalPrompt = directPrompt;

    // 🧠 If no directPrompt, build prompt from saved survey data
    if (!directPrompt && userEmail) {
      const supabase = createSupabaseClient();
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("platform, ad_type, tone")
        .eq("user_email", userEmail)
        .single();

      const platform = profile?.platform || "social media";
      const adType = profile?.ad_type || "generic";
      const tone = profile?.tone || "neutral";

      finalPrompt = `
You're a ${personality}, an expert in ad critique and optimization.

This is a ${platform} video ad for a ${adType} brand.
The tone of the brand is "${tone}".

Please review the video based on structure, engagement, and clarity.
Provide:
- 3 strengths
- 3 weaknesses
- 3 specific improvements
`;
    }

    console.log("🧠 Sending prompt to OpenAI:", finalPrompt);

    // 🤖 Call OpenAI Chat Completion
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert ad critique assistant.",
        },
        {
          role: "user",
          content: finalPrompt,
        },
      ],
    });

    // 📤 Return the AI’s response to the frontend
    return NextResponse.json({ result: res.choices[0].message.content });
  } catch (error: any) {
    console.error("❌ /api/critique error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
