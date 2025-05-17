// ✅ File: src/app/api/tts/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "nova", speed = 1 } = await req.json();

    if (!text || !voice) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice.toLowerCase(), // ✅ Important: lowercase!
        speed,
        response_format: "mp3", // ✅ safest option
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI TTS error:", error);
      return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("TTS route crashed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
