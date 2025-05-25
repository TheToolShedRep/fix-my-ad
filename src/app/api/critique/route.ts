// 📦 Handles POST requests to /api/critique using the Next.js App Router
import { NextRequest, NextResponse } from "next/server";

// 📡 OpenAI SDK to send prompts
import OpenAI from "openai";

// 🗄️ Supabase client (server-side) factory
import { createSupabaseClient } from "@/utils/supabase/server";

// 🔑 Initialize OpenAI with your secret API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🚀 POST handler for /api/critique
export async function POST(req: NextRequest) {
  try {
    // ✅ Make sure the OpenAI API key is present
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    // 📥 Parse request body
    const body = await req.json();
    const { userEmail, personality = "Nova", prompt: directPrompt } = body;

    // 🚨 If no userEmail or direct prompt is provided, throw an error
    if (!userEmail && !directPrompt) {
      return NextResponse.json(
        { error: "Missing userEmail or prompt" },
        { status: 400 }
      );
    }

    let finalPrompt = directPrompt;

    // 🔄 If userEmail is provided and no directPrompt, build one using survey preferences
    if (!directPrompt && userEmail) {
      const supabase = createSupabaseClient();

      // 🧠 Fetch user preferences from Supabase
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("platform, ad_type, tone")
        .eq("user_email", userEmail)
        .single();

      // 🛟 Provide fallback values if survey not filled out
      const platform = profile?.platform || "social media";
      const adType = profile?.ad_type || "generic";
      const tone = profile?.tone || "neutral";

      // ✍️ Build a structured AI prompt
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

    // 🤖 Send the prompt to OpenAI GPT-4o
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

    // 🧾 Safely extract the response content
    const output = res.choices?.[0]?.message?.content;
    if (!output) throw new Error("No response from OpenAI");

    // 📤 Return the result to the frontend
    return NextResponse.json({ result: output });
  } catch (err) {
    // ❌ Catch and log any server-side error
    console.error("❌ /api/critique error:", err);
    return NextResponse.json({ error: "Failed to analyze." }, { status: 500 });
  }
}
