// app/survey/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { SurveyModal } from "@/components/survey/SurveyModal";
import { useEffect, useState } from "react";

export default function SurveyPage() {
  const { isLoaded, user } = useUser();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setShow(true); // only show survey once user is fully loaded
    }
  }, [isLoaded, user]);

  if (!show) return null;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📝 Quick Survey</h1>
      <p className="mb-6 text-muted-foreground">
        Help us understand your ad goals so we can give better recommendations.
      </p>
      <SurveyModal />
    </div>
  );
}
