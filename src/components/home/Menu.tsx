// File: components/Menu.tsx
import Link from "next/link";

export default function Menu() {
  return (
    <nav className="space-x-4 px-6 py-4 border-b border-gray-800 bg-gray-950 text-white">
      <Link href="/about" className="hover:text-blue-400">
        About
      </Link>
      <Link href="/coming-soon" className="hover:text-blue-400">
        Coming Soon
      </Link>
      <Link href="/upload" className="hover:text-blue-400">
        Dashboard
      </Link>
    </nav>
  );
}
