"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase";
import { Search, Trash2, ChevronDown, ChevronRight, Trash } from "lucide-react";
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
  projects?: { name: string }[];
};

type ProjectItem = {
  id: string;
  name: string;
  created_at: string;
};

type SidebarProps = {
  onSelectEntry?: (messages: Message[]) => void;
  onNewChat?: (projectId: string | null) => void;
};

export default function Sidebar({ onSelectEntry, onNewChat }: SidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isProUser, setIsProUser] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const { user } = useUser();

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

  // ✅ Replaces old fetchHistory — handles missing project_name and refresh issues
  const fetchHistory = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { data, error } = await supabase
      .from("chat_history")
      .select(
        `
      id, title, created_at, messages, personality, project_id,
      projects(name)
    `
      )
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    const formatted =
      data?.map((item) => {
        const fallbackName =
          projects.find((p) => p.id === item.project_id)?.name ||
          "Uncategorized";

        return {
          ...item,
          project_name: item.projects?.[0]?.name || fallbackName,
        };
      }) ?? [];

    if (!error) setHistory(formatted);
    else console.error("Error loading history:", error.message);
  };

  const fetchProjects = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (data) {
      setProjects(data);
      const initState: Record<string, boolean> = {};
      data.forEach((p) => (initState[p.name] = true));
      initState["Uncategorized"] = true;
      setExpandedFolders(initState);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchProjects();
  }, [user]);

  const handleDeleteHistory = async (id: string) => {
    await supabase.from("chat_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Delete this folder? Chats will be moved to Uncategorized."))
      return;

    // Move chats to uncategorized
    await supabase
      .from("chat_history")
      .update({ project_id: null })
      .eq("project_id", projectId);

    await supabase.from("projects").delete().eq("id", projectId);
    toast("Project deleted.");
    fetchHistory();
    fetchProjects();
  };

  const handleAssignToProject = async (
    chatId: string,
    projectId: string | null
  ) => {
    const { data, error } = await supabase
      .from("chat_history")
      .update({ project_id: projectId })
      .eq("id", chatId)
      .select();

    if (!error && data?.length) {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === chatId
            ? {
                ...item,
                project_id: projectId,
                project_name:
                  projects.find((p) => p.id === projectId)?.name ||
                  "Uncategorized",
              }
            : item
        )
      );
      toast("Moved to project!");
    }
  };

  const handleCreateProject = async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || !newProjectName.trim()) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newProjectName.trim(), user_email: email })
      .select()
      .single();

    if (error) {
      toast("Error creating project");
    } else {
      setNewProjectName("");
      setSelectedProjectId(data.id);
      toast("Project created!");
      fetchProjects();
      onNewChat?.(data.id);
    }
  };
  const filteredResults = history.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByProject = filteredResults.reduce((acc, item) => {
    const project = item.project_name?.trim() || "Uncategorized";
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
      {/* 🔍 Search Bar */}
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
        onClick={() => onNewChat?.(selectedProjectId)}
        className="text-sm text-blue-400 hover:text-blue-200"
      >
        + New Upload
      </button>

      {/* ➕ Project Input */}
      {isProUser && (
        <div>
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
              className="text-sm"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* 📂 Project Folders + History */}
      <ScrollArea className="flex-1 overflow-y-auto pr-1">
        {[...projects.map((p) => p.name), "Uncategorized"].map(
          (projectName) => {
            const project = projects.find((p) => p.name === projectName);
            const projectId = project?.id ?? null;
            const dateGroups = groupedByProject[projectName] || {};
            const isOpen = expandedFolders[projectName];

            return (
              <div
                key={projectName}
                className="mb-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    handleAssignToProject(draggedId, projectId);
                    setDraggedId(null);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <button
                    className="flex items-center gap-1 text-purple-400 font-semibold text-sm"
                    onClick={() =>
                      setExpandedFolders((prev) => ({
                        ...prev,
                        [projectName]: !prev[projectName],
                      }))
                    }
                  >
                    {isOpen ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    {projectName}
                  </button>
                  {project && (
                    <button
                      className="text-gray-500 hover:text-red-500"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete project"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>

                {isOpen &&
                  Object.entries(dateGroups).map(([date, items]) => (
                    <div key={date} className="mb-2">
                      <h3 className="text-xs text-gray-400 mb-1 ml-2">
                        {date}
                      </h3>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-800 group"
                            draggable
                            onDragStart={() => setDraggedId(item.id)}
                          >
                            <button
                              onClick={() => {
                                localStorage.setItem("selectedChatId", item.id);
                                onSelectEntry?.(item.messages);
                              }}
                              className="flex-1 text-left overflow-hidden"
                            >
                              <div className="flex flex-col">
                                <span className="truncate font-medium text-sm">
                                  {item.title
                                    ?.split(" ")
                                    .slice(0, 3)
                                    .join(" ") +
                                    (item.title?.split(" ").length > 3
                                      ? "..."
                                      : "")}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(item.created_at), "h:mm a")}{" "}
                                  · {item.personality}
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
          }
        )}
      </ScrollArea>
    </aside>
  );
}
