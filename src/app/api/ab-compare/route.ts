// /api/ab-compare/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userEmail, personality, original, revised } = await req.json();

    if (!userEmail || !personality || !original || !revised) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const prompt = `
You are ${personality}, an expert ad strategist.

Compare two video ads for clarity, engagement, and effectiveness.

📽️ Ad A (Original)
- File Type: ${original.fileType}
- Duration: ${original.duration} seconds
- Transcript: "${original.transcript}"

📽️ Ad B (Revised)
- File Type: ${revised.fileType}
- Duration: ${revised.duration} seconds
- Transcript: "${revised.transcript}"

🎯 Task:
- Compare strengths and weaknesses
- Which one is more effective and why?
- Give a recommendation on which ad performs better

Keep it sharp, insightful, and based only on the transcript content.
    `.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert ad critique assistant." },
        { role: "user", content: prompt },
      ],
    });

    const result = response.choices[0]?.message.content;
    return NextResponse.json({ result });
  } catch (err) {
    console.error("❌ A/B Compare API error:", err);
    return NextResponse.json(
      { error: "Failed to process A/B comparison." },
      { status: 500 }
    );
  }
}
