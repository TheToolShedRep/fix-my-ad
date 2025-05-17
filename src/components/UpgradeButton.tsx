"use client";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function UpgradeButton() {
  const { user } = useUser();

  const handleCheckout = async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user?.primaryEmailAddress?.emailAddress,
      }),
    });

    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url; // ✅ Redirects to Stripe Checkout
    } else {
      alert("Failed to create checkout session.");
    }
  };

  return (
    <Button onClick={handleCheckout} className="mt-4">
      Upgrade to Pro
    </Button>
  );
}
