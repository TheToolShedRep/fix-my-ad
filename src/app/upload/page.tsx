"use client";

import { useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Download,
  Clipboard,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { checkProAccess } from "@/lib/checkProAccess";

const personalities = {
  Nova: {
    description: "You're a wise and encouraging ad guide.",
    voice: "nova",
  },
  Echo: { description: "You mirror the tone of the ad...", voice: "echo" },
  Sage: { description: "You speak in poetic metaphor...", voice: "sage" },
  Alloy: { description: "You give sharp technical insight.", voice: "alloy" },
  Onyx: {
    description: "You sound like a movie trailer narrator.",
    voice: "onyx",
  },
} as const;

type Personality = keyof typeof personalities;
type Message = { role: "user" | "ai"; content: string };

let currentAudio: HTMLAudioElement | null = null;

async function speakWithOpenAIStream({
  text,
  voice,
  setUrl,
  onStart,
  onEnd,
}: {
  text: string;
  voice: string;
  setUrl?: (url: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = "";
      currentAudio.load();
      currentAudio = null;
    }
    onStart?.();

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok || !res.body) throw new Error("TTS failed");
    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    setUrl?.(url);

    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      currentAudio = null;
      onEnd?.();
    };
    await audio.play();
  } catch (err) {
    console.error("Audio error:", err);
    alert("TTS error.");
    onEnd?.();
  }
}

export default function UploadPage() {
  const { user } = useUser();

  // 🧠 Core state
  const [chat, setChat] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followup, setFollowup] = useState("");
  const [followupCount, setFollowupCount] = useState(0);
  const [isProUser, setIsProUser] = useState(false);
  const [selectedPersonality, setSelectedPersonality] =
    useState<Personality>("Nova");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>(
    {}
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🧪 Other UI
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [revisedPreviewUrl, setRevisedPreviewUrl] = useState<string | null>(
    null
  );
  const [revisedResponse, setRevisedResponse] = useState<string | null>(null);
  const [abTestFile, setABTestFile] = useState<File | null>(null);
  const [abPreviewUrl, setABPreviewUrl] = useState<string | null>(null);
  const [abResponse, setABResponse] = useState<string | null>(null);

  // 🗂️ Projects
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // ✅ Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ✅ Restore chat
  useEffect(() => {
    const restoreChat = async () => {
      const selectedId = localStorage.getItem("selectedChatId");
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!selectedId || !email) return;
      const { data } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("id", selectedId)
        .eq("user_email", email)
        .single();
      if (data?.messages) setChat(data.messages);
    };
    restoreChat();
  }, [user]);

  // ✅ Check Pro
  useEffect(() => {
    const check = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (email) setIsProUser(await checkProAccess(email));
    };
    check();
  }, [user]);

  // ✅ Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_email", email);

      if (error) {
        console.error("Error loading projects:", error.message);
      } else {
        setProjects(data || []);
      }
    };

    fetchProjects();
  }, [user]);

  // ✅ Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const uploadedFile = acceptedFiles[0];
      if (!uploadedFile) return;
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
    },
    accept: { "video/mp4": [".mp4"], "image/gif": [".gif"] },
    multiple: false,
    maxFiles: 1,
  });

  // ✅ Analyze handler
  const handleInitialAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      alert("Please log in to analyze your ad.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: email,
          personality: selectedPersonality,
          fileType: file.type === "video/mp4" ? "video" : "gif",
        }),
      });

      const data = await res.json();

      const userMessage: Message = {
        role: "user",
        content: "Please analyze this ad.",
      };

      const aiMessage: Message = {
        role: "ai",
        content: data.result,
      };

      setChat([userMessage, aiMessage]);

      const title = data.result.split("\n")[0].slice(0, 100);

      const { data: inserted, error } = await supabase
        .from("chat_history")
        .insert({
          user_email: email,
          personality: selectedPersonality,
          title,
          messages: [userMessage, aiMessage],
          project_id: selectedProjectId, // ✅ Assign project
        })
        .select("id")
        .single();

      if (inserted?.id) {
        localStorage.setItem("selectedChatId", inserted.id);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Something went wrong while analyzing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      onSelectEntry={(messages) => {
        setChat(messages);
        setFile(null);
        setPreviewUrl(null);
        setFollowup("");
      }}
      onNewChat={() => {
        setChat([]);
        setFile(null);
        setPreviewUrl(null);
        setFollowup("");
        setFollowupCount(0);
        localStorage.removeItem("selectedChatId");
      }}
    >
      <div className="min-h-screen flex flex-col items-center px-4 bg-gray-950 text-white">
        <h1 className="text-3xl font-bold mt-6 mb-4">Upload an Ad</h1>

        {/* Upload box */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-600 rounded-lg p-10 w-full max-w-md text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          <p>
            {isDragActive
              ? "Drop it here..."
              : "Drag & drop or click to upload a GIF or MP4"}
          </p>
        </div>

        {/* Project selector */}
        <div className="w-full max-w-md mt-4">
          <label className="block text-sm text-gray-300 mb-1">
            Assign to Project:
          </label>
          <select
            className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600"
            value={selectedProjectId || ""}
            onChange={(e) =>
              setSelectedProjectId(
                e.target.value === "" ? null : e.target.value
              )
            }
          >
            <option value="">Uncategorized</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Analyze button */}
        {file && chat.length === 0 && !revisedResponse && (
          <Button
            className="mt-6"
            disabled={isLoading}
            onClick={handleInitialAnalyze}
          >
            {isLoading ? "Analyzing..." : "Continue to Analyze"}
          </Button>
        )}

        {/* You can continue with the rest of your chat UI here... */}
      </div>
    </DashboardLayout>
  );
}
