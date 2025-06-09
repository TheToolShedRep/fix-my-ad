// 📁 File: /api/ab-compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      personality = "Nova",
      originalTranscript,
      revisedTranscript,
      originalGif,
      revisedGif,
      originalDuration,
      revisedDuration,
      originalFileType,
      revisedFileType,
    } = body;

    if (!userEmail || !originalTranscript || !revisedTranscript) {
      console.error("❌ Missing required fields:", body);
      return NextResponse.json(
        { error: "Missing input data" },
        { status: 400 }
      );
    }

    const prompt = `
You are ${personality}, a master of ad critique and optimization.

Two video ads have been submitted for A/B testing.

🅰️ Original Ad:
- File type: ${originalFileType || "unknown"}
- Duration: ${originalDuration || "unknown"} seconds
- Transcript: ${originalTranscript}

🅱️ Revised Ad:
- File type: ${revisedFileType || "unknown"}
- Duration: ${revisedDuration || "unknown"} seconds
- Transcript: ${revisedTranscript}

🔍 TASK:
Compare these two ads on:
- Engagement
- Clarity
- Emotional or persuasive impact

Clearly state:
- Strengths of each
- Weaknesses of each
- Which one performs better and why
- 2 suggestions for improving the weaker version

${originalGif ? `Optional GIF preview of original: ${originalGif}` : ""}
${revisedGif ? `Optional GIF preview of revised: ${revisedGif}` : ""}
    `.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a sharp, honest AI ad tester." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (err) {
    console.error("❌ A/B Compare API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
