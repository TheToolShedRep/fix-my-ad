"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Menu() {
  return (
    <header className="w-full px-6 py-4 flex justify-between items-center bg-gray-950 text-white border-b border-gray-800">
      {/* Navigation */}
      <nav className="space-x-4 flex items-center">
        <Link href="/upload" className="hover:underline">
          Upload
        </Link>
        <Link href="/pricing" className="hover:underline">
          Pricing
        </Link>
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <UserButton />
      </nav>
    </header>
  );
}
