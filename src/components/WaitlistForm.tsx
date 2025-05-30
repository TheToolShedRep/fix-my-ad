"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WaitlistForm() {
  const { user } = useUser(); // ✅ Clerk session
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  // 🔒 Skip form entirely if logged in
  if (user) return null;

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
      toast.success("🎉 You're on the waitlist!");
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
      <Input
        type="email"
        placeholder="Enter your email"
        className="w-full sm:w-2/3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
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
