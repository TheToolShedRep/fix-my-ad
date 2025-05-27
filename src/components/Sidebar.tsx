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

type Message = { role: "user" | "ai"; content: string };

type HistoryItem = {
  id: string;
  title: string;
  created_at: string;
  personality: string;
  messages: Message[];
  project_id?: string | null;
  project_name?: string;
};

type ProjectItem = {
  id: string;
  name: string;
  created_at: string;
};

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
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // ✅ Check if user is Pro
  useEffect(() => {
    const checkProStatus = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data } = await supabase
        .from("pro_users")
        .select("is_active")
        .eq("user_email", email)
        .single();

      if (data?.is_active) setIsProUser(true);
    };
    checkProStatus();
  }, [user]);

  // ✅ Fetch chat history
  const fetchHistory = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { data, error } = await supabase
      .from("chat_history")
      .select(
        "id, title, created_at, messages, personality, project_id, projects(name)"
      )
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading history:", error.message);
      return;
    }

    const formatted =
      data?.map((item) => ({
        ...item,
        project_name: item.projects?.[0]?.name || "Uncategorized",
      })) ?? [];

    setHistory(formatted);
  };

  // ✅ Fetch all projects
  const fetchProjects = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    setProjects(data || []);
  };

  useEffect(() => {
    fetchHistory();
    fetchProjects();
  }, [user]);

  // 🗑️ Delete
  const handleDeleteHistory = async (id: string) => {
    await supabase.from("chat_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // ➕ Add project
  const handleCreateProject = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || !newProjectName.trim()) return;

    await supabase.from("projects").insert({
      user_email: email,
      name: newProjectName.trim(),
    });

    setNewProjectName("");
    toast("Project created!");
    fetchProjects();
  };

  // 📁 Reassign chat to a project
  const handleAssignToProject = async (chatId: string, projectId: string) => {
    const { error } = await supabase
      .from("chat_history")
      .update({ project_id: projectId })
      .eq("id", chatId);

    if (!error) {
      await fetchHistory();
      toast("Moved to project.");
    }
  };

  // 🧠 Search + group logic
  const filteredResults = history.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <aside className="w-full sm:w-64 h-screen flex flex-col bg-gray-900 text-white border-r border-gray-700 p-4 space-y-6">
      {/* 🔍 Search */}
      <div className="flex items-center justify-between">
        {showSearch && (
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="text-sm bg-gray-800 border-gray-600 flex-1"
          />
        )}
        <button
          onClick={() => setShowSearch((prev) => !prev)}
          className="ml-2 text-gray-400 hover:text-white"
        >
          <Search size={18} />
        </button>
      </div>

      {/* ➕ New Upload */}
      <button
        onClick={onNewChat}
        className="text-sm text-blue-400 hover:text-blue-200"
      >
        + New Upload
      </button>

      {/* ➕ Project Input */}
      {isProUser && (
        <div className="mt-2">
          <label className="block text-xs text-gray-400 mb-1">
            New Project
          </label>
          <div className="flex gap-2">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="text-sm bg-gray-800 border-gray-600"
            />
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="text-sm"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* 📁 Project folders and history */}
      <ScrollArea className="flex-1 overflow-y-auto pr-1">
        {projects.map((project) => {
          const dateGroups = groupedByProject[project.name] || {};

          return (
            <div
              key={project.id}
              className="mb-6"
              onClick={() => {
                if (draggedId) {
                  handleAssignToProject(draggedId, project.id);
                  setDraggedId(null);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={() => {
                if (draggedId) {
                  handleAssignToProject(draggedId, project.id);
                  setDraggedId(null);
                }
              }}
            >
              <h2 className="text-sm text-purple-400 font-bold mb-2">
                {project.name}
              </h2>

              {Object.entries(dateGroups).map(([date, items]) => (
                <div key={date} className="mb-3">
                  <h3 className="text-xs text-gray-400 mb-1">{date}</h3>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 rounded-md hover:bg-gray-800 group"
                        draggable
                        onDragStart={() => setDraggedId(item.id)}
                      >
                        <button
                          onClick={() => {
                            localStorage.setItem("selectedChatId", item.id);
                            onSelectEntry?.(item.messages);
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="flex flex-col">
                            <span className="truncate font-medium text-sm">
                              {item.title?.split(" ").slice(0, 3).join(" ") +
                                (item.title?.split(" ").length > 3
                                  ? "..."
                                  : "")}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(item.created_at), "h:mm a")} ·{" "}
                              {item.personality}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this chat?"))
                              handleDeleteHistory(item.id);
                          }}
                          className="text-gray-500 hover:text-red-500 opacity-50 hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </ScrollArea>
    </aside>
  );
}
