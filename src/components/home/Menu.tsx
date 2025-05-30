"use client";

import Link from "next/link";

export default function Menu() {
  return (
    <header className="w-full px-6 py-4 flex justify-between items-center bg-gray-950 text-white border-b border-gray-800">
      <div className="text-xl font-bold">FMA</div>

      <nav className="space-x-4 text-sm sm:text-base">
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <Link href="/coming-soon" className="hover:underline">
          Coming Soon
        </Link>
        <Link href="/upload" className="hover:underline">
          Dashboard
        </Link>
      </nav>
    </header>
  );
}
