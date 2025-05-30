"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WaitlistForm() {
  // Get current user from Clerk
  const { user } = useUser();

  // Local state for email (used if user is not signed in)
  const [email, setEmail] = useState("");

  // Loading and success state
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  // Handle form submission
  const handleSubmit = async () => {
    // Determine which email to use: user-supplied or Clerk user email
    const finalEmail = email || user?.primaryEmailAddress?.emailAddress;

    // If neither is present, show error
    if (!finalEmail) {
      toast.error("Please enter a valid email.");
      return;
    }

    // Build payload with email and (optional) user ID
    const payload = {
      email: finalEmail,
      user_id: user?.id || null,
    };

    console.log("📤 Submitting payload:", payload);

    setLoading(true);

    // Choose the correct endpoint depending on auth status
    const endpoint = user ? "/api/join-waitlist" : "/api/join-public-waitlist";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("🎉 You're on the list!");
        setJoined(true);
      } else {
        toast.error("Something went wrong. Try again.");
      }
    } catch (error) {
      console.error("Join waitlist error:", error);
      toast.error("Failed to connect. Try again later.");
    }

    setLoading(false);
  };

  // Show confirmation if already joined
  if (joined) {
    return (
      <p className="text-green-400 mt-2">You're signed up for early access!</p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      {/* Show email input if not signed in */}
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
