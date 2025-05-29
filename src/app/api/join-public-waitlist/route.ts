import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const supabase = createSupabaseClient();

  const { error } = await supabase.from("public_waitlist").insert({ email });

  if (error) {
    console.error("Public waitlist insert error:", error);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
