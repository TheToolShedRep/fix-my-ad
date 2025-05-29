"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-6 pt-20">
      {/* 🌟 Hero */}
      <section className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-4">Fix My Ad</h1>
        <p className="text-gray-400 text-lg">
          AI-powered critiques to help you improve your ads, convert better, and
          save time.
        </p>

        <div className="mt-8">
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="text-lg px-6 py-3">Get Started Free</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Button className="text-lg px-6 py-3">Get Started Free</Button>
          </SignedIn>
        </div>
      </section>

      {/* 💸 Pricing Tiers */}
      <section className="mt-24 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: "Free",
            price: "$0/mo",
            description: "Basic access to upload and receive one follow-up.",
            features: [
              "Upload 30s ads",
              "One follow-up question",
              "Use 'Nova' personality",
            ],
          },
          {
            name: "Pro",
            price: "$12/mo",
            description: "Advanced access with extra features and longer ads.",
            features: [
              "Upload 60s ads",
              "Unlimited follow-ups",
              "All AI personalities",
              "A/B testing",
              "Re-critique mode",
            ],
          },
          {
            name: "Team",
            price: "Coming Soon",
            description: "Multiple seats, team folders, and usage reporting.",
            features: [
              "All Pro features",
              "Team folders",
              "Usage insights",
              "Admin tools",
            ],
          },
        ].map((tier) => (
          <div
            key={tier.name}
            className="border border-gray-700 rounded-lg p-6 bg-gray-900 flex flex-col"
          >
            <h2 className="text-2xl font-semibold mb-1">{tier.name}</h2>
            <p className="text-purple-400 text-xl font-bold">{tier.price}</p>
            <p className="text-sm text-gray-400 mb-4">{tier.description}</p>
            <ul className="text-sm text-gray-300 mb-6 space-y-1">
              {tier.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            {tier.name === "Free" && (
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full mt-auto">
                    Start Free
                  </Button>
                </SignInButton>
              </SignedOut>
            )}
            {tier.name === "Pro" && (
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="w-full mt-auto">Upgrade to Pro</Button>
                </SignInButton>
              </SignedOut>
            )}
            {tier.name === "Team" && (
              <Button
                disabled
                className="w-full mt-auto opacity-50 cursor-not-allowed"
              >
                Coming Soon
              </Button>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
