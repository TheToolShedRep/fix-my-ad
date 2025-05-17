// 📁 src/components/layouts/DashboardLayout.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
  onSelectEntry,
  onNewChat,
}: {
  children: React.ReactNode;
  onSelectEntry?: (messages: any[]) => void;
  onNewChat?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex flex-col sm:flex-row h-screen">
      {/* 🔘 Mobile Menu Button */}
      <div className="sm:hidden p-4 flex justify-between items-center bg-gray-950 border-b border-gray-800">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white flex items-center gap-2"
        >
          <Menu size={20} />
          <span className="font-medium">Menu</span>
        </button>
      </div>

      {/* 🧭 Sidebar (mobile = overlay, desktop = static) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-64 bg-gray-900 h-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onSelectEntry={onSelectEntry} onNewChat={onNewChat} />
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="hidden sm:block sm:w-64 sm:flex-shrink-0 bg-gray-900 border-r border-gray-800">
        <Sidebar onSelectEntry={onSelectEntry} onNewChat={onNewChat} />
      </div>

      {/* 🧠 Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-950">{children}</main>
    </div>
  );
}
