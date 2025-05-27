"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

// 🧠 Message structure
type Message = { role: "user" | "ai"; content: string };

// 🧠 Supabase row structure
type HistoryItem = {
  id: string;
  title: string;
  created_at: string;
  personality: string;
  messages: Message[];
  projects?: { name: string }[];
  project_id?: string | null;
  project_name?: string;
};

// 🧠 Project row structure
type ProjectItem = {
  id: string;
  name: string;
  created_at: string;
};

// 🧠 Sidebar props
type SidebarProps = {
  onSelectEntry?: (messages: Message[]) => void;
  onNewChat?: () => void;
};

export default function Sidebar({ onSelectEntry, onNewChat }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isProUser, setIsProUser] = useState(false);
  const { user } = useUser();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
    null
  );

  // ✅ Check if user is Pro
  useEffect(() => {
    const checkProStatus = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data, error } = await supabase
        .from("pro_users")
        .select("is_active")
        .eq("user_email", email)
        .single();

      if (data?.is_active) {
        setIsProUser(true);
      } else {
        console.error("Error checking pro status:", error?.message);
      }
    };

    checkProStatus();
  }, [user]);

  // ✅ Fetch all chat history
  const fetchHistory = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { data, error } = await supabase
      .from("chat_history")
      .select("id, title, created_at, messages, personality, projects(name)")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading history:", error.message);
    } else {
      const formatted: HistoryItem[] =
        data?.map((item) => ({
          ...item,
          project_name: item.projects?.[0]?.name || "Uncategorized",
        })) ?? [];
      setHistory(formatted);
    }
  };

  // ✅ Fetch all standalone projects
  const fetchProjects = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error.message);
    } else {
      setProjects(data || []);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchProjects();
  }, [user]);

  // 🔄 Delete handler
  const handleDeleteHistory = async (id: string) => {
    const { error } = await supabase.from("chat_history").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete history:", error);
      return;
    }
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // ➕ Project creation
  const handleCreateProject = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { error } = await supabase.from("projects").insert({
      user_email: email,
      name: newProjectName.trim(),
    });

    if (error) {
      console.error("Error creating project:", error.message);
      alert("Could not create project.");
    } else {
      setNewProjectName("");
      toast("Project created!", {
        description: "You can now assign uploads to it.",
      });
      fetchProjects(); // ✅ Refresh project list
    }
  };

  // 🔍 Filtered search
  const filteredResults = history.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 📁 Group by project > date
  const groupedByProject = filteredResults.reduce((acc, item) => {
    const project = item.project_name || "Uncategorized";
    const date = parseISO(item.created_at);
    const dateKey = isToday(date)
      ? "Today"
      : isYesterday(date)
      ? "Yesterday"
      : format(date, "MMMM d, yyyy");

    if (!acc[project]) acc[project] = {};
    if (!acc[project][dateKey]) acc[project][dateKey] = [];
    acc[project][dateKey].push(item);

    return acc;
  }, {} as Record<string, Record<string, HistoryItem[]>>);

  const allProjectNames = [
    ...new Set([
      ...projects.map((p) => p.name),
      ...Object.keys(groupedByProject),
    ]),
  ];

  return (
    <aside className="w-full sm:w-64 h-screen flex flex-col bg-gray-900 text-white border-r border-gray-700 p-4 space-y-6">
      {/* 🔍 Search Bar */}
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

      {/* ➕ Upload Button */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onNewChat?.()}
          className="text-sm text-blue-400 hover:text-blue-200"
        >
          + New Upload
        </button>
      </div>

      {/* ➕ Project Creator (Pro users only) */}
      {isProUser && (
        <div className="mt-2">
          <label className="block text-xs text-gray-400 mb-1">
            New Project
          </label>
          <div className="flex gap-2 items-center">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="text-sm bg-gray-800 border-gray-600"
            />
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="text-sm px-3 py-1"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* 📜 History Grouped by Project > Date */}
      <ScrollArea className="flex-1 overflow-y-auto pr-1">
        {allProjectNames.map((projectName) => {
          const dateGroups = groupedByProject[projectName] || {};
          return (
            <div key={projectName} className="mb-6">
              <h2 className="text-sm text-purple-400 font-bold mb-2">
                {projectName}
              </h2>
              {Object.keys(dateGroups).length === 0 ? (
                <p className="text-xs text-gray-500 ml-2">No uploads yet</p>
              ) : (
                Object.entries(dateGroups).map(([date, items]) => (
                  <div key={date} className="mb-3">
                    <h3 className="text-xs text-gray-400 mb-1">{date}</h3>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 rounded-md hover:bg-gray-800 group"
                        >
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
                                  ? item.title
                                      .split(" ")
                                      .slice(0, 3)
                                      .join(" ") +
                                    (item.title.split(" ").length > 3
                                      ? "..."
                                      : "")
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
                ))
              )}
            </div>
          );
        })}
      </ScrollArea>
    </aside>
  );
}
