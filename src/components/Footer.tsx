// File: components/Footer.tsx
"use client";

import Link from "next/link";
import { FaTiktok, FaInstagram, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-10 px-4 border-t border-gray-800 mt-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Left - Logo and origin */}
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Fix My Ad</h2>
          <p className="text-sm">
            Built by Akhirah Strong in Atlanta, GA. Part of the ToolShed suite.
          </p>
        </div>

        {/* Center - Navigation */}
        <div className="flex flex-col gap-2">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/upload" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/coming-soon" className="hover:text-white">
            Coming Soon
          </Link>
        </div>

        {/* Right - Social Icons */}
        <div className="flex items-start gap-4">
          <a href="#" aria-label="TikTok" className="hover:text-white">
            <FaTiktok size={20} />
          </a>
          <a href="#" aria-label="Instagram" className="hover:text-white">
            <FaInstagram size={20} />
          </a>
          <a href="#" aria-label="X / Twitter" className="hover:text-white">
            <FaXTwitter size={20} />
          </a>
        </div>
      </div>

      {/* Top: Links */}
      <div className="flex justify-center space-x-6 mt-10">
        <Link href="/terms" className="hover:text-white transition">
          Terms and Conditions
        </Link>
        <Link href="/privacy" className="hover:text-white transition">
          Privacy Policy
        </Link>
      </div>

      {/* Bottom - Copyright */}
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>
          © {new Date().getFullYear()} The ToolShed. All rights reserved. Built
          in Atlanta by Akhirah Strong.
        </p>
      </div>
    </footer>
  );
}
