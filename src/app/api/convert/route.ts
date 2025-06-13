// ✅ app/api/convert/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Just echoing back dummy data for now
    return NextResponse.json({
      transcript: "Sample transcript text",
      duration: 10,
      gifUrl: "/example.gif",
    });
  } catch (err) {
    console.error("❌ convert API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
