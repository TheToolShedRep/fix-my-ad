"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton, SignedOut, SignedIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";
import { RedirectToSignIn } from "@clerk/nextjs";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [checkingSurvey, setCheckingSurvey] = useState(true);

  // ✅ Check survey status once Clerk is loaded and user is signed in
  useEffect(() => {
    const checkSurveyStatus = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data, error } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_email", email)
        .maybeSingle();

      if (error) console.error("❌ Survey check failed:", error);

      if (!data) {
        router.replace("/survey"); // 🚀 Redirect to survey
      } else {
        router.replace("/upload"); // ✅ Go to dashboard
      }
    };

    if (isLoaded && user) {
      checkSurveyStatus();
    } else {
      setCheckingSurvey(false); // Stop showing "Redirecting..." for signed out users
    }
  }, [user, isLoaded, router]);

  // 👤 Show nothing if waiting for redirect
  if (checkingSurvey && user) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Redirecting...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      {/* Hero */}
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Fix Your Ad. Grow Your Brand.
        </h1>
        <p className="text-gray-400 mb-8">
          Get instant AI feedback on your short-form ads. Improve conversions,
          clarity, and creativity — in seconds.
        </p>
      </section>

      {/* Pricing Tiers */}
      <section className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto my-12">
        <div className="border rounded-lg p-6 bg-gray-900">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <ul className="text-gray-300 text-sm space-y-1 mb-4">
            <li>✔ 30s ad critique</li>
            <li>✔ 1 follow-up question</li>
            <li>✔ Nova AI personality only</li>
          </ul>
          <p className="text-white text-2xl font-bold">$0</p>
        </div>

        <div className="border rounded-lg p-6 bg-gray-800 border-purple-500">
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <ul className="text-gray-300 text-sm space-y-1 mb-4">
            <li>✔ 60s ad uploads</li>
            <li>✔ Unlimited follow-ups</li>
            <li>✔ All AI personalities</li>
            <li>✔ A/B testing & re-critiques</li>
            <li>✔ Project folders</li>
          </ul>
          <p className="text-white text-2xl font-bold">$10/mo</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center mt-12 space-y-6 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Start Fixing Your Ads Today
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Join free to analyze your first ad — no credit card needed. Upgrade
          anytime to unlock Pro features.
        </p>

        {/* <SignedOut>
    <SignInButton
      mode="redirect"
      afterSignInUrl="/upload"
      afterSignUpUrl="/survey"
    >
      <Button className="text-lg px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition">
        Get Started Free
      </Button>
    </SignInButton>
  </SignedOut> */}

        <Button
          className="text-lg px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
          onClick={() => {
            RedirectToSignIn({
              afterSignInUrl: "/upload",
              afterSignUpUrl: "/survey",
            });
          }}
        >
          Get Started Free
        </Button>

        <SignedIn>
          <Button
            className="text-lg px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
            onClick={() => router.push("/upload")}
          >
            Go to Dashboard
          </Button>
        </SignedIn>
      </section>
    </main>
  );
}
