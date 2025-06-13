// 🔄 Handles POST requests to /api/revised-critique
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseClient } from "@/utils/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      personality = "Nova",
      transcript = "",
      fileType = "video/mp4",
      duration = null, // Use null instead of 0 to enable fallback logic
    } = body;

    // ✅ Validate input
    if (!userEmail || !transcript) {
      console.error("❌ Missing userEmail or transcript:", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // 🔍 Fetch user profile data
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("platform, ad_type, tone")
      .eq("user_email", userEmail)
      .single();

    if (error) {
      console.warn("⚠️ Supabase profile fetch error:", error.message);
    }

    const platform = profile?.platform || "social media";
    const adType = profile?.ad_type || "generic";
    const tone = profile?.tone || "neutral";
    const readableFileType = fileType?.replace("video/", "") || "video";

    // 🧠 Build revised-specific prompt
    const prompt = `
You are ${personality}, an expert AI assistant who critiques *revised* video ads with thoughtful insight and clear advice.

🛠️ Ad context:
- Platform: ${platform}
- Brand type: ${adType}
- Tone of brand: "${tone}"
- Format: ${readableFileType}
- Duration: ${duration ? `${duration} seconds` : "short-form"}

🎧 Transcript:
"${transcript}"

🎯 Task:
Analyze the *revised* ad and answer:
- Is it a clear improvement from a generic version?
- What are 2–3 noticeable improvements?
- What still needs work?
- Are the message, pacing, and emotional impact better?
- Provide 2 specific suggestions to finalize the ad.

Be helpful, encouraging, and constructive.
    `.trim();

    console.log("🧠 Final revised prompt:", prompt);

    // 🧠 Send to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert ad critique assistant." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (err: any) {
    console.error("❌ Revised critique error:", err?.message || err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
