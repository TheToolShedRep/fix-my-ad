// app/api/performance-predict/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, transcript, platform, adType, tone, duration } = body;

    if (!userEmail || !transcript) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `
You're an AI ad strategist. Based on the ad transcript, predict how this ad might perform and why. Provide:

1. Strengths (platform-specific)
2. Weaknesses or risks
3. Suggestions to improve engagement
4. Estimated performance tier: 🔻 Poor | ⚠️ Moderate | ✅ Good | 🔥 High Potential

Ad Context:
- Platform: ${platform}
- Brand Type: ${adType}
- Tone: ${tone}
- Duration: ${duration} seconds

Transcript:
"${transcript}"

Respond as a clear, helpful strategist — not a generic chatbot.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert AI ad strategist." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({
      result: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("❌ Prediction error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
