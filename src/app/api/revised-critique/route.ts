// app/api/revised-critique/route.ts
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
      fileType = "video",
      duration = 0,
    } = body;

    if (!userEmail || !transcript) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createSupabaseClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("platform, ad_type, tone")
      .eq("user_email", userEmail)
      .single();

    const platform = profile?.platform || "social media";
    const adType = profile?.ad_type || "generic";
    const tone = profile?.tone || "neutral";

    const prompt = `
You are ${personality}, an expert AI assistant who critiques *revised* ads.

🛠️ Ad context:
- Platform: ${platform}
- Brand type: ${adType}
- Tone: "${tone}"
- Format: ${fileType}
- Duration: ${duration} seconds

🎧 Transcript:
"${transcript}"

🎯 Task:
Evaluate the revised ad:
- Did it improve over a generic version?
- Strengths, flaws, clarity, emotional impact
- Any areas still needing improvement?

Be helpful, encouraging, and constructive.
    `.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert ad critique assistant." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ Revised critique error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
