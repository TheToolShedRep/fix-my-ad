// File: app/about/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";

export default function AboutPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16 text-white">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-4">About Fix My Ad</h1>
      <p className="text-lg text-gray-300 mb-10">
        Fix My Ad is part of <strong>The ToolShed</strong> — an upcoming suite
        of tools crafted to support lean marketing teams, solo creators, and
        entrepreneurs looking to grow without the overhead of a full agency.
      </p>

      {/* Founder Bio */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">
          👋 Built by Akhirah Strong (aka Ahky)
        </h2>
        <p className="text-gray-400 leading-relaxed">
          I'm an indie developer based in Atlanta, GA with a passion for turning
          ideas into tools that actually work. Fix My Ad started as a side
          project and grew out of the realization that many creators and teams
          are overloaded with bloated tools or stuck outsourcing everything to
          expensive agencies. I built this to simplify ad optimization — to make
          it accessible, fast, and actually helpful.
        </p>
      </div>

      {/* Mission */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">🎯 Mission</h2>
        <p className="text-gray-300">
          Empower creators and teams to market smarter, faster, and with clarity
          — without needing a full agency.
        </p>
      </div>

      {/* Supporting Quote */}
      <div className="mb-12 border-l-4 border-blue-600 pl-4 italic text-gray-400">
        “The very best startup ideas tend to have three things in common:
        they’re something the founders themselves want, that they themselves can
        build, and that few others realize are worth doing.”
        <br />
        <span className="block mt-2 font-semibold text-white">
          — Paul Graham
        </span>
      </div>

      {/* Who it's for */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-2">Who This is For</h2>
        <p className="text-gray-400">
          Whether you're a solo creator, a scrappy marketing team, or a busy
          brand manager — Fix My Ad helps you do more with less. It's designed
          to support modern teams that move fast and individuals who wear
          multiple hats.
        </p>
      </div>

      {/* Socials */}
      <div className="flex items-center gap-4 mt-8">
        <SocialIcon name="Twitter" icon={<FaTwitter />} href="#" />
        <SocialIcon name="LinkedIn" icon={<FaLinkedin />} href="#" />
        <SocialIcon name="YouTube" icon={<FaYoutube />} href="#" />
        {/* Add more social links as needed */}
      </div>
    </section>
  );
}

// Social icon component (reusable)
function SocialIcon({
  name,
  icon,
  href,
}: {
  name: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 hover:text-white transition-colors text-2xl"
      aria-label={name}
    >
      {icon}
    </a>
  );
}
