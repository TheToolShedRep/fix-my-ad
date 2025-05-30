import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // or your actual import path
import { createSupabaseClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("📥 Received waitlist POST:", body);

  try {
    const { email, user_id } = await req.json();

    if (!email || !user_id) {
      console.warn("❌ Missing email or user_id:", { email, user_id });
      return NextResponse.json(
        { error: "Missing email or user_id" },
        { status: 400 }
      );
    }
    const supabase = createSupabaseClient();

    // const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("waitlist")
      .insert({ email, user_id });

    if (error) {
      console.error("❌ Supabase insert error:", error);
      return NextResponse.json(
        { error: "Insert failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Unhandled error in /join-waitlist:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
