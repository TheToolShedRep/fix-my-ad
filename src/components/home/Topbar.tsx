"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-950 text-white">
      <Link href="/" className="text-xl font-bold tracking-wide">
        FMA
      </Link>

      <div className="space-x-4">
        <SignedOut>
          <SignInButton mode="redirect" fallbackRedirectUrl="/upload">
            <Button variant="ghost">Sign In</Button>
          </SignInButton>

          <SignUpButton mode="redirect" fallbackRedirectUrl="/survey">
            <Button>Sign Up</Button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <Link href="/upload">
            <Button>Dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </header>
  );
}
