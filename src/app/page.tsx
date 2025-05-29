// app/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function HomeRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkSurvey = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;

      const { data, error } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_email", email)
        .maybeSingle();

      if (error) {
        console.error("🔴 Survey check error:", error);
        return;
      }

      if (!data) {
        console.log("🛑 No survey found. Redirecting to /survey");
        router.replace("/survey");
      } else {
        console.log("✅ Survey found. Redirecting to /upload");
        router.replace("/upload");
      }
    };

    checkSurvey();
  }, [user, isLoaded]);

  return (
    <main className="h-screen flex items-center justify-center text-white">
      <p>Redirecting...</p>
    </main>
  );
}
