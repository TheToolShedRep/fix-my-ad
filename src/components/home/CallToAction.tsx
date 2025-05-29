"use client";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CallToAction() {
  const router = useRouter();

  return (
    <section className="text-center mt-12 space-y-6 px-4">
      <h2 className="text-3xl sm:text-4xl font-bold">
        Start Fixing Your Ads Today
      </h2>
      <p className="text-gray-400 text-lg max-w-xl mx-auto">
        Join free to analyze your first ad — no credit card needed. Upgrade
        anytime to unlock Pro features.
      </p>

      <SignedOut>
        <Button
          className="text-lg px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
          onClick={() =>
            RedirectToSignIn({
              afterSignInUrl: "/upload",
              afterSignUpUrl: "/survey",
            })
          }
        >
          Get Started Free
        </Button>
      </SignedOut>

      <SignedIn>
        <Button
          className="text-lg px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
          onClick={() => router.push("/upload")}
        >
          Go to Dashboard
        </Button>
      </SignedIn>
    </section>
  );
}
