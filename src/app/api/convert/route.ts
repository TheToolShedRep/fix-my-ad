// ✅ app/api/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "video/mp4" ? ".mp4" : ".gif";
    const filename = `${uuidv4()}${ext}`;

    // 🔼 Upload to Supabase 'uploads' bucket
    const { data, error } = await supabaseServer.storage
      .from("uploads")
      .upload(`videos/${filename}`, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error.message);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const publicUrl = supabaseServer.storage
      .from("uploads")
      .getPublicUrl(`videos/${filename}`).data.publicUrl;

    console.log("✅ File uploaded:", publicUrl);

    // 🧪 Mock output (next step: run Whisper + FFmpeg)
    return NextResponse.json({
      transcript: "Sample transcript text",
      duration: 10,
      gifUrl: publicUrl, // Replace with real gif output later
    });
  } catch (err) {
    console.error("❌ convert API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
