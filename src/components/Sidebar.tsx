// 📁 File: src/components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase";
import { Search, Trash2 } from "lucide-react";

// 🧠 Message structure
type Message = { role: "user" | "ai"; content: string };

// 🧠 Supabase row structure
type HistoryItem = {
  id: string;
  title: string;
  created_at: string;
  personality: string;
  messages: Message[];
};

// 🧠 Sidebar props
type SidebarProps = {
  onSelectEntry?: (messages: Message[]) => void;
  onNewChat?: () => void;
};

export default function Sidebar({ onSelectEntry, onNewChat }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useUser();

  // 🔄 Delete a history item from Supabase and state
  const handleDeleteHistory = async (id: string) => {
    console.log("Deleting:", id);
    const { error } = await supabase.from("chat_history").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete history item:", error);
      return;
    }
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // 📦 Load history from Supabase when the user is available
  useEffect(() => {
    const fetchHistory = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data, error } = await supabase
        .from("chat_history")
        .select("id, title, created_at, messages, personality")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) console.error("Error loading history:", error.message);
      else setHistory(data || []);
    };

    fetchHistory();
  }, [user]);

  // 🔍 Filter history items by search query
  const filteredResults = history.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 📅 Group history items by creation date
  const grouped = filteredResults.reduce(
    (acc: Record<string, HistoryItem[]>, item) => {
      const date = parseISO(item.created_at);
      const key = isToday(date)
        ? "Today"
        : isYesterday(date)
        ? "Yesterday"
        : format(date, "MMMM d, yyyy");

      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  return (
    <aside className="w-full sm:w-64 h-screen flex flex-col bg-gray-900 text-white border-r border-gray-700 p-4 space-y-6">
      {/* 🔍 Search input toggle */}
      <div className="flex items-center justify-between">
        {showSearch && (
          <Input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm bg-gray-800 border-gray-600 flex-1"
          />
        )}

        <button
          className="ml-2 text-gray-400 hover:text-white"
          onClick={() => setShowSearch((prev) => !prev)}
        >
          <Search size={18} />
        </button>
      </div>

      {/* ➕ New Upload button */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onNewChat?.()}
          className="text-sm text-blue-400 hover:text-blue-200"
        >
          + New Upload
        </button>
      </div>

      {/* 📜 Grouped chat history list */}
      <ScrollArea className="flex-1 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-4">
            <h2 className="text-xs text-gray-400 mb-1">{date}</h2>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 rounded-md hover:bg-gray-800 group mb-3"
                >
                  {/* 🧠 Main clickable button to select chat */}
                  <button
                    onClick={() => {
                      localStorage.setItem("selectedChatId", item.id);
                      onSelectEntry?.(item.messages);
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="flex flex-col w-full overflow-hidden">
                      <span
                        className="truncate font-medium text-sm"
                        title={item.title}
                      >
                        {item.title
                          ? item.title.split(" ").slice(0, 3).join(" ") +
                            (item.title.split(" ").length > 3 ? "..." : "")
                          : "Untitled"}
                      </span>
                      <span className="text-xs text-gray-400 truncate mt-0.5">
                        {format(new Date(item.created_at), "h:mm a")} ·{" "}
                        <span
                          className={`ai-title personality-${item.personality.toLowerCase()}`}
                        >
                          {item.personality}
                        </span>
                      </span>
                    </div>
                  </button>
                  {/* 🗑️ Delete icon button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chat?"))
                        handleDeleteHistory(item.id);
                    }}
                    className="text-gray-500 hover:text-red-500 transition opacity-15 hover:opacity-100 mr-2"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
