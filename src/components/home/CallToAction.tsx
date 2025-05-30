"use client";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignUpButton,
} from "@clerk/nextjs";
// ("use client");
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CallToAction() {
  const router = useRouter();

  return (
    <section className="bg-gray-900 text-white py-16 px-4 mt-20 rounded-lg shadow-lg">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Start Fixing Your Ads Today
        </h2>
        <p className="text-gray-300 text-lg">
          Join free to analyze your first ad — no credit card needed. Upgrade
          anytime to unlock Pro features.
        </p>

        <SignedOut>
          <SignUpButton mode="redirect" fallbackRedirectUrl="/survey">
            <Button className="text-lg px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition">
              Get Started Free
            </Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <Button
            className="text-lg px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
            onClick={() => router.push("/upload")}
          >
            Go to Dashboard
          </Button>
        </SignedIn>
      </div>
    </section>
  );
}
