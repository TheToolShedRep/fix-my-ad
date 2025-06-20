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
"""${transcript}"""

🎯 Task:
1. Identify 3 clear **strengths** of this ad.
2. Point out 3 potential **weaknesses** or **red flags**. Watch for:
   - Manipulative or guilt-tripping language
   - False urgency ("Only today!", "Hurry now!")
   - Exaggerated promises
   - Inappropriate humor or cultural insensitivity
   - Missing clarity or call-to-action (CTA)
3. Give 3 **actionable suggestions** to improve performance or clarity.
4. Return a labeled array of any risky phrases as:
RedFlags: ["Example 1", "Example 2"]

Use direct, helpful, and concise language.
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

    // 🧠 Step 2: Ask GPT to extract risky/red flag phrases
    const redFlagRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You're a legal and compliance assistant. Your job is to find potentially misleading, risky, or non-compliant phrases in ad copy. Return only a JSON array of the exact risky phrases. Do NOT explain. Only output the array.`,
        },
        {
          role: "user",
          content: transcript || finalPrompt, // Fallback if transcript missing
        },
      ],
    });

    let redFlags: string[] = [];
    try {
      const jsonMatch =
        redFlagRes.choices[0].message.content?.match(/\[([\s\S]*?)\]/);
      if (jsonMatch) redFlags = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.warn("⚠️ Failed to parse redFlags from GPT:", err);
    }

    // 📤 Return result back to frontend
    return NextResponse.json({
      result: res.choices[0].message.content,
      redFlags,
    });
  } catch (error: any) {
    // 🚨 Handle unexpected errors
    console.error("❌ /api/critique error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
