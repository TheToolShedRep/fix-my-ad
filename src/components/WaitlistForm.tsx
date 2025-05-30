// File: components/WaitlistSignup.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WaitlistForm() {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const payload = {
    email: user?.primaryEmailAddress?.emailAddress,
    user_id: user?.id,
  };

  console.log("📤 Submitting payload:", payload);

  const handleSubmit = async () => {
    if (!(email || user?.primaryEmailAddress?.emailAddress)) {
      toast.error("Please enter a valid email.");
      return;
    }

    const finalEmail = email || user?.primaryEmailAddress?.emailAddress;
    if (!finalEmail) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);
    const targetEmail = user?.primaryEmailAddress?.emailAddress || email;
    const endpoint = user ? "/api/join-waitlist" : "/api/join-public-waitlist";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });

    if (res.ok) {
      toast.success("🎉 You're on the list!");
      setJoined(true);
    } else {
      toast.error("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  if (joined) {
    return (
      <p className="text-green-400 mt-2">You're signed up for early access!</p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      {!user && (
        <Input
          type="email"
          placeholder="Enter your email"
          className="w-full sm:w-2/3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
      >
        {loading ? "Joining..." : "Join Waitlist"}
      </Button>
    </div>
  );
}
