"use client";

import { useUser, UserButton } from "@clerk/nextjs";

export default function HeaderClient() {
  const { user, isLoaded } = useUser();

  // Don’t render anything until user is loaded
  if (!isLoaded || !user) return null;

  return (
    <header className="flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-gray-950 text-white">
      <div className="flex items-center gap-3">
        {/* User avatar */}
        <img
          src={user.imageUrl}
          alt="User avatar"
          className="w-8 h-8 rounded-full"
        />

        {/* Display full name or email */}
        <span className="text-sm text-gray-300">
          {user.fullName || user.primaryEmailAddress?.emailAddress}
        </span>
      </div>

      {/* Sign-out dropdown */}
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}
