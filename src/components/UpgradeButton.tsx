"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

export default function UpgradeButton() {
  const { user } = useUser();
  const router = useRouter();
  const [surveyExists, setSurveyExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSurvey = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data, error } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_email", email)
        .maybeSingle();

      setSurveyExists(!!data?.id);
    };

    if (user) checkSurvey();
  }, [user]);

  const handleUpgrade = async () => {
    if (surveyExists === false) {
      router.push("/survey?from=pro-upgrade");
      return;
    }

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user?.primaryEmailAddress?.emailAddress,
      }),
    });

    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert("Stripe checkout session failed.");
    }
  };

  return (
    <Button onClick={handleUpgrade} className="mt-4">
      Get Pro!
    </Button>
  );
}
