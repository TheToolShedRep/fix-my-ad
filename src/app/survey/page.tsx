"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (from === "pro-upgrade") {
      setShowPrompt(true);
    }
  }, [from]);

  const skipSurvey = () => router.push("/upload");

  return (
    <div className="p-6 text-white">
      {showPrompt && (
        <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg mb-6">
          <p className="mb-2 text-yellow-300 font-medium">
            🎯 To get the best results from Fix My Ad, take 1 minute to answer a
            few quick questions.
          </p>
          <div className="flex gap-3">
            <Button onClick={skipSurvey} variant="outline">
              Skip for Now
            </Button>
            <Button onClick={() => setShowPrompt(false)}>Take Survey</Button>
          </div>
        </div>
      )}

      {/* 🔽 Your survey form goes here */}
    </div>
  );
}
