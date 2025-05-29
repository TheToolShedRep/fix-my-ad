"use client";

import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function PricingTiers() {
  return (
    <section className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto my-12">
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
        <SignUpButton
          mode="redirect"
          fallbackRedirectUrl="/survey?from=pro-upgrade"
        >
          <Button className="w-full text-lg bg-purple-600 hover:bg-purple-700">
            Try Pro
          </Button>
        </SignUpButton>
      </div>
    </section>
  );
}
