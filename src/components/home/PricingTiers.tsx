"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import UpgradeButton from "../UpgradeButton";

const handleTryProClick = async () => {
  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Failed to start Stripe checkout.");
    }
  } catch (err) {
    console.error("Stripe checkout error:", err);
    alert("Something went wrong. Please try again.");
  }
};

export default function PricingTiers() {
  const { user } = useUser();

  return (
    <section className="max-w-6xl mx-auto my-12 px-4">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Tier */}
        <div className="border rounded-lg p-6 bg-gray-900 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Free</h2>
            <ul className="text-gray-300 text-base space-y-2 mb-6">
              <li>✔ 30s ad critique</li>
              <li>✔ 1 follow-up question</li>
              <li>✔ Nova AI personality only</li>
            </ul>
            <p className="text-white text-3xl font-bold mb-4">$0</p>
          </div>
          <SignUpButton mode="redirect" fallbackRedirectUrl="/survey">
            <Button variant="outline" className="w-full text-lg">
              Sign Up Free
            </Button>
          </SignUpButton>
        </div>

        {/* Pro Tier */}
        <div className="border rounded-lg p-6 bg-gray-800 border-purple-500 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pro</h2>
            <ul className="text-gray-300 text-base space-y-2 mb-6">
              <li>✔ 60s ad uploads</li>
              <li>✔ Unlimited follow-ups</li>
              <li>✔ All AI personalities</li>
              <li>✔ A/B testing & re-critiques</li>
              <li>✔ Project folders</li>
            </ul>
            <p className="text-white text-3xl font-bold mb-4">$10/mo</p>
          </div>
          <UpgradeButton className="w-full text-lg bg-purple-600 hover:bg-purple-700" />
        </div>

        {/* Coming Soon */}
        <div className="border border-blue-700 bg-gray-900 rounded-lg p-6 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-blue-400">
              🚀 Coming Soon: Pro Marketing Suite
            </h2>
            <p className="text-gray-300 mb-4 max-w-xs text-sm leading-relaxed">
              Fix My Ad is evolving into a full-stack marketing assistant —
              everything you'd need if you are a marketing team, all in one
              tool.
            </p>
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              <li>Campaign planning & performance tools</li>
              <li>AI-powered script & headline generation</li>
              <li>Trend & competitor analysis</li>
              <li>Automated A/B testing pipelines</li>
              <li>Audience feedback analysis</li>
              <li>Collaboration features for teams</li>
              <li>Per-seat pricing for agencies & teams</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            Join now to lock in early access and future perks.
          </p>
        </div>
      </div>
    </section>
  );
}
