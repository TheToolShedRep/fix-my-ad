import { Suspense } from "react";
import SurveyClient from "./SurveyClient";

export default function SurveyPage() {
  return (
    <Suspense
      fallback={<div className="text-white p-6">Loading survey...</div>}
    >
      <SurveyClient />
    </Suspense>
  );
}
