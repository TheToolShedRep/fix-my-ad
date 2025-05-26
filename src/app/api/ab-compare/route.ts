import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { userEmail, personality, fileType } = await req.json();

    if (!userEmail || !personality || !fileType) {
      // To improve debugging for missing or invalid fields
      console.error("❌ Missing fields:", { userEmail, personality, fileType });

      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = `You are an ad expert. A user has submitted two ads for comparison.
Compare the original and revised ad (assume content is available) based on engagement, clarity, and impact.
Provide a short summary of the differences and recommend which ad performs better, using the "${personality}" personality style.
Note: File type provided is ${fileType}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0]?.message.content;

    return NextResponse.json({ result });
  } catch (err) {
    console.error("A/B Compare API error:", err);
    return NextResponse.json(
      { error: "Failed to process A/B comparison." },
      { status: 500 }
    );
  }
}
