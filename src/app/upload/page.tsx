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
  Echo: {
    description:
      "You mirror the tone of the ad and respond with cultural sensitivity.",
    voice: "echo",
  },
  Sage: {
    description: "You're a poetic creative who speaks in metaphor and rhythm.",
    voice: "sage",
  },
  Alloy: {
    description: "You're a no-nonsense technical expert with sharp insights.",
    voice: "alloy",
  },
  Onyx: {
    description: "You're bold and captivating — like a movie trailer voice.",
    voice: "onyx",
  },
} as const;

type Personality = keyof typeof personalities;
type Message = { role: "user" | "ai"; content: string };

// 🧠 Track current audio playback instance
let currentAudio: HTMLAudioElement | null = null;

// ✅ New working audio function (no MediaSource)
async function speakWithOpenAIStream({
  text,
  voice,
  speed = 1,
  setUrl,
  onStart,
  onEnd,
}: {
  text: string;
  voice: string;
  speed?: number;
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
      body: JSON.stringify({ text, voice, speed }),
    });

    if (!res.ok || !res.body) {
      console.error("TTS request failed");
      alert("TTS generation failed.");
      onEnd?.();
      return;
    }

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
    console.error("Audio playback error:", err);
    alert("TTS playback error.");
    onEnd?.();
  }
}

function UploadPageContent({
  chat,
  setChat,
  file,
  setFile,
  previewUrl,
  setPreviewUrl,
  followup,
  setFollowup,
}: {
  chat: Message[];
  setChat: React.Dispatch<React.SetStateAction<Message[]>>;
  file: File | null;
  setFile: (file: File | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  followup: string;
  setFollowup: (val: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>(
    {}
  );
  const [selectedPersonality, setSelectedPersonality] =
    useState<Personality>("Nova");
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { user } = useUser();
  const [isProUser, setIsProUser] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ✅ Check Supabase on mount to see if the user has Pro access
  useEffect(() => {
    const fetchPro = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (email) {
        const result = await checkProAccess(email);
        setIsProUser(result);
      }
    };
    fetchPro();
  }, [user]);

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

  const handleFeedback = async (
    message: string,
    feedback: "thumbs_up" | "thumbs_down"
  ) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || feedbackGiven[message]) return;

    const latestAiMessage = chat.findLast((m) => m.role === "ai")?.content;
    const title = latestAiMessage?.split("\n")[0].slice(0, 100) || "Untitled";

    const { error } = await supabase.from("chat_feedback").insert({
      user_email: email,
      message,
      personality: selectedPersonality,
      feedback,
      title,
    });

    if (!error) {
      setFeedbackGiven((prev) => ({ ...prev, [message]: feedback }));
      toast("Feedback submitted", { description: "Thanks for your feedback!" });
    }
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followup.trim()) return;
    setIsLoading(true);
    const userMessage: Message = { role: "user", content: followup };
    setChat((prev) => [...prev, userMessage, { role: "ai", content: "..." }]);
    setFollowup("");

    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${personalities[selectedPersonality].description}\n${chat
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n\n")}\nFollow-up question: ${followup}`,
        }),
      });
      const data = await res.json();
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", content: data.result };
        return updated;
      });

      const email = user?.primaryEmailAddress?.emailAddress;
      const title = data.result.split("\n")[0].slice(0, 100);
      if (email) {
        await supabase.from("chat_history").insert({
          user_email: email,
          personality: selectedPersonality,
          title,
          messages: [
            ...chat,
            userMessage,
            { role: "ai", content: data.result },
          ],
        });
      }
    } catch (err) {
      console.error("Follow-up failed:", err);
      alert("Could not answer your question.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-950 text-white px-4">
      <h1 className="text-3xl font-bold mt-6 mb-4">Upload an Ad</h1>

      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-600 rounded-lg p-10 w-full max-w-md text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <p>
          {isDragActive
            ? "Drop it here..."
            : "Drag & drop an MP4 or GIF here, or click to select."}
        </p>
      </div>

      <div className="mt-4 w-full max-w-sm sm:max-w-md space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Choose an AI Personality:
        </label>
        {/* <select
          value={selectedPersonality}
          onChange={(e) =>
            setSelectedPersonality(e.target.value as Personality)
          }
          className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {Object.keys(personalities).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select> */}

        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(personalities).map(([key, value]) => {
            const isLocked = key !== "Nova" && !isProUser;

            return (
              <button
                key={key}
                onClick={() =>
                  !isLocked && setSelectedPersonality(key as Personality)
                }
                disabled={isLocked}
                className={`text-left p-2 rounded border text-sm transition ${
                  selectedPersonality === key
                    ? "border-purple-500 bg-purple-900"
                    : "border-gray-700 bg-gray-800"
                } ${
                  isLocked
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:border-purple-400"
                }`}
                title={isLocked ? "Upgrade to Pro to use this personality" : ""}
              >
                <div className="font-bold flex items-center gap-1">
                  {key} {isLocked && "🔒"}
                </div>
                <p className="text-xs text-gray-400">{value.description}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 italic leading-snug">
          {personalities[selectedPersonality].description}
        </p>
      </div>

      {previewUrl && (
        <div className="mt-6">
          {file?.type === "video/mp4" ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-w-sm sm:max-w-md rounded-lg"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-w-sm sm:max-w-md rounded-lg"
            />
          )}
        </div>
      )}

      {file && chat.length === 0 && (
        <Button
          className="mt-4"
          disabled={isLoading}
          onClick={async () => {
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
              const aiMessage: Message = { role: "ai", content: data.result };
              setChat([userMessage, aiMessage]);

              const title = data.result.split("\n")[0].slice(0, 100);
              await supabase.from("chat_history").insert({
                user_email: email,
                personality: selectedPersonality,
                title,
                messages: [userMessage, aiMessage],
              });
            } catch (err) {
              console.error("Critique failed:", err);
              alert("Something went wrong.");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              Analyzing...
            </div>
          ) : (
            "Continue to Analyze"
          )}
        </Button>
      )}

      {chat.length > 0 && (
        <>
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
                      {
                        user: "bg-blue-600 text-white rounded-br-none",
                        ai: "bg-gray-800 text-white rounded-bl-none",
                      }[msg.role]
                    }`}
                  >
                    {msg.content}

                    {msg.role === "ai" && (
                      <div className="flex gap-2 mt-1 ml-1 items-center">
                        <button
                          onClick={() =>
                            handleFeedback(msg.content, "thumbs_up")
                          }
                          disabled={!!feedback}
                          className={`transition p-1 rounded-full ${
                            feedback === "thumbs_up"
                              ? "text-green-400"
                              : "text-gray-400 hover:text-green-400"
                          }`}
                        >
                          <ThumbsUp
                            size={20}
                            fill={
                              feedback === "thumbs_up" ? "currentColor" : "none"
                            }
                          />
                        </button>

                        <button
                          onClick={() =>
                            handleFeedback(msg.content, "thumbs_down")
                          }
                          disabled={!!feedback}
                          className={`transition p-1 rounded-full ${
                            feedback === "thumbs_down"
                              ? "text-red-400"
                              : "text-gray-400 hover:text-red-400"
                          }`}
                        >
                          <ThumbsDown
                            size={20}
                            fill={
                              feedback === "thumbs_down"
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>

                        <button
                          onClick={() => {
                            setIsGeneratingAudio(true);
                            speakWithOpenAIStream({
                              text: msg.content,
                              voice: personalities[selectedPersonality].voice,
                              onStart: () => {
                                setSpeaking(true);
                                setAudioUrl(null);
                              },
                              onEnd: () => {
                                setSpeaking(false);
                                setIsGeneratingAudio(false);
                              },
                              setUrl: (url) => setAudioUrl(url),
                            });
                          }}
                          className="transition p-1 rounded-full text-gray-400 hover:text-blue-400"
                          title="Read aloud"
                        >
                          <Volume2 size={20} />
                        </button>

                        {audioUrl && (
                          <a
                            href={audioUrl}
                            download="tts.mp3"
                            className="p-1 text-gray-400 hover:text-green-400 transition"
                            title="Download audio"
                          >
                            <Download size={18} />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            toast("Copied to clipboard");
                          }}
                          className="p-1 text-gray-400 hover:text-blue-400 transition"
                          title="Copy response"
                        >
                          <Clipboard size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleFollowupSubmit}
            className="mt-6 w-full max-w-xl"
          >
            <input
              type="text"
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="w-full px-4 py-2 rounded border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
            />
            <Button className="mt-2 w-full" disabled={isLoading}>
              {isLoading ? "Thinking..." : "Ask"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function UploadPage() {
  const [chat, setChat] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followup, setFollowup] = useState("");
  const { user } = useUser();

  // ✅ Restore chat from localStorage on mount
  useEffect(() => {
    const restoreChat = async () => {
      const selectedId = localStorage.getItem("selectedChatId");
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!selectedId || !email) return;

      const { data, error } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("id", selectedId)
        .eq("user_email", email)
        .single();

      if (error) {
        console.error("Failed to restore chat:", error);
        return;
      }

      if (data?.messages) {
        setChat(data.messages);
      }
    };

    restoreChat();
  }, [user]);

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
        localStorage.removeItem("selectedChatId");
      }}
    >
      <UploadPageContent
        chat={chat}
        setChat={setChat}
        file={file}
        setFile={setFile}
        previewUrl={previewUrl}
        setPreviewUrl={setPreviewUrl}
        followup={followup}
        setFollowup={setFollowup}
      />
    </DashboardLayout>
  );
}
