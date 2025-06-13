// 📁 File: app/api/revised-critique/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      personality = "Nova",
      originalTranscript,
      revisedTranscript,
      gifUrl,
      duration,
      fileType = "video/mp4",
    } = body;

    if (!userEmail || !originalTranscript || !revisedTranscript) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("platform, ad_type, tone")
      .eq("user_email", userEmail)
      .single();

    const platform = profile?.platform || "social media";
    const adType = profile?.ad_type || "generic";
    const tone = profile?.tone || "neutral";
    const readableFileType = fileType.replace("video/", "");

    const prompt = `
You are ${personality}, an expert ad analyst comparing an original ad with a revised version.

🛠️ Context:
- Platform: ${platform}
- Ad type: ${adType}
- Tone: ${tone}
- Format: ${readableFileType}
- Duration: ${duration ? `${duration} seconds` : "short-form"}

📽️ Original Ad Transcript:
"${originalTranscript}"

📽️ Revised Ad Transcript:
"${revisedTranscript}"

🎯 Task:
Analyze how the revised ad improved (or failed to improve) upon the original. Provide:
- 3 notable improvements
- 3 things that still need work
- A final summary judgment on whether the revised ad is better overall

${gifUrl ? `Optional preview: ${gifUrl}` : ""}
    `.trim();

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

    return NextResponse.json({ result: res.choices[0].message.content });
  } catch (err: any) {
    console.error("❌ /api/revised-critique error:", err?.message || err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
