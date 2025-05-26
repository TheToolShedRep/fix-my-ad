// ✅ Fully restored and enhanced upload/page.tsx

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

  const [chat, setChat] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPersonality, setSelectedPersonality] =
    useState<Personality>("Nova");
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>(
    {}
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ Project selector state
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    checkProAccess(email).then(setIsProUser);

    supabase
      .from("projects")
      .select("id, name")
      .eq("user_email", email)
      .then(({ data, error }) => {
        if (error) console.error("Error loading projects:", error);
        else setProjects(data || []);
      });
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

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

  const handleInitialAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

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
      const title = data.result.split("\n")[0].slice(0, 100);

      const userMessage: Message = {
        role: "user",
        content: "Please analyze this ad.",
      };
      const aiMessage: Message = { role: "ai", content: data.result };

      setChat([userMessage, aiMessage]);

      await supabase.from("chat_history").insert({
        user_email: email,
        personality: selectedPersonality,
        title,
        messages: [userMessage, aiMessage],
        project_id: selectedProjectId, // ✅ Save project
      });

      toast("Analysis complete!", { description: "Your critique is ready." });
    } catch (err) {
      console.error("Analyze error:", err);
      alert("Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen px-4 py-6 flex flex-col items-center text-white bg-gray-950">
        <h1 className="text-2xl font-bold mb-4">Upload an Ad</h1>

        {/* Upload box */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-600 rounded-lg p-10 w-full max-w-md text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          <p>
            {isDragActive
              ? "Drop it here..."
              : "Drag or click to upload a GIF or MP4"}
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
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
          >
            <option value="">Uncategorized</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4">
            {file?.type === "video/mp4" ? (
              <video
                src={previewUrl}
                controls
                className="max-w-md rounded-lg"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-md rounded-lg"
              />
            )}
          </div>
        )}

        {/* Analyze button */}
        {file && chat.length === 0 && (
          <Button
            className="mt-6"
            onClick={handleInitialAnalyze}
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Continue to Analyze"}
          </Button>
        )}

        {/* Chat bubble view */}
        <div className="mt-6 w-full max-w-xl space-y-4">
          {chat.map((msg, index) => {
            const isUser = msg.role === "user";
            const feedback = feedbackGiven[msg.content];
            return (
              <div
                key={index}
                className={`flex flex-col ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                <span className="text-xs text-gray-400 mb-1">
                  {isUser ? "You" : selectedPersonality}
                </span>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm whitespace-pre-line ${
                    isUser ? "bg-blue-600" : "bg-gray-800"
                  }`}
                >
                  {msg.content}
                  {!isUser && (
                    <div className="flex gap-2 mt-1 items-center">
                      <button
                        onClick={() =>
                          speakWithOpenAIStream({
                            text: msg.content,
                            voice: personalities[selectedPersonality].voice,
                            setUrl: setAudioUrl,
                            onStart: () => setIsGeneratingAudio(true),
                            onEnd: () => setIsGeneratingAudio(false),
                          })
                        }
                        disabled={isGeneratingAudio}
                      >
                        <Volume2 size={18} />
                      </button>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(msg.content)
                        }
                      >
                        <Clipboard size={18} />
                      </button>
                      {audioUrl && (
                        <a href={audioUrl} download="tts.mp3">
                          <Download size={18} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </div>
    </DashboardLayout>
  );
}
