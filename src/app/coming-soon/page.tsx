// File: app/coming-soon/page.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/join-public-waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      toast.success("🎉 You're on the early access list!");
      setJoined(true);
    } else {
      toast.error("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">
        Fix My Ad is growing into something bigger.
      </h1>
      <p className="max-w-2xl text-gray-400 text-lg mb-8">
        A streamlined suite built for individuals, marketing teams, and
        forward-thinking employers. Built for results, not overhead.
      </p>

      <div className="grid gap-6 max-w-3xl w-full mb-12">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">
            📦 For Solo Creators & Founders
          </h2>
          <p className="text-gray-400">
            Automate ad testing, get instant feedback, and scale your campaigns
            without the agency bill.
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">🤝 For Marketing Teams</h2>
          <p className="text-gray-400">
            Augment your workflow with creative insights, A/B testing, and smart
            suggestions powered by AI.
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">
            💼 For Employers & Startups
          </h2>
          <p className="text-gray-400">
            Cut the bloat — equip your team with self-serve tools that get
            campaigns moving faster.
          </p>
        </div>
      </div>

      {!joined ? (
        <div className="w-full max-w-md flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Joining..." : "Get Early Access"}
          </Button>
        </div>
      ) : (
        <p className="text-green-400 mt-4">
          You're signed up for early access!
        </p>
      )}
    </div>
  );
}
