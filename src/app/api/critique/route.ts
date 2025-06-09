// 🔄 Handles POST requests to /api/critique
import { NextRequest, NextResponse } from "next/server";

// 🤖 OpenAI SDK to send prompts
import OpenAI from "openai";

// 🗄️ Supabase client factory for server-side access
import { createSupabaseClient } from "@/utils/supabase/server";

// 🔐 Initialize OpenAI client using secret key from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🚀 POST handler — builds prompt and sends it to OpenAI
export async function POST(req: NextRequest) {
  try {
    // 📥 Parse request body fields
    const body = await req.json();
    const {
      userEmail, // required for survey-based prompt building
      personality = "Nova", // chosen AI tone
      prompt: directPrompt, // optional custom prompt override
      transcript = "", // transcript from /convert
      fileType = "video/mp4", // video format (e.g. video/mp4 or image/gif)
      gifUrl = "", // preview image/gif url (optional)
      duration = null, // duration in seconds (optional)
    } = body;

    // 🧱 Validate required input
    if (!userEmail && !directPrompt) {
      console.error("❌ Missing userEmail or prompt in body:", body);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let finalPrompt = directPrompt;

    // 🧠 If no custom prompt, generate one using survey + metadata
    if (!directPrompt && userEmail) {
      const supabase = createSupabaseClient();

      // 🗂️ Fetch user's survey profile (platform, ad_type, tone)
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("platform, ad_type, tone")
        .eq("user_email", userEmail)
        .single();

      // Set defaults if no profile found
      const platform = profile?.platform || "social media";
      const adType = profile?.ad_type || "generic";
      const tone = profile?.tone || "neutral";
      const readableFileType = fileType?.replace("video/", "") || "video";

      // 🧠 Build dynamic GPT prompt combining survey, transcript, and metadata
      finalPrompt = `
You are ${personality}, an expert AI assistant who critiques video ads with clarity, strategy, and actionable insight.

🛠️ Ad context:
- Platform: ${platform}
- Brand type: ${adType}
- Tone of brand: "${tone}"
- Format: ${readableFileType}
- Duration: ${duration ? `${duration} seconds` : "short-form"}

🎧 Transcript:
"${transcript}"

🎯 Task:
Provide:
- 3 clear strengths
- 3 weaknesses or potential issues
- 3 specific improvement tips

Be honest and helpful. Mention if the ad is missing a CTA, clarity, or emotional impact.

${gifUrl ? `Optional preview: ${gifUrl}` : ""}
      `.trim();
    }

    console.log("🧠 Final prompt:", finalPrompt);

    // 📡 Send prompt to OpenAI Chat model (GPT-4o)
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

    // 📤 Return result back to frontend
    return NextResponse.json({ result: res.choices[0].message.content });
  } catch (error: any) {
    // 🚨 Handle unexpected errors
    console.error("❌ /api/critique error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
