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
  const [chat, setChat] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [followup, setFollowup] = useState("");
  const [followupCount, setFollowupCount] = useState(0); // 🔒 Track follow-ups for free users
  const { user } = useUser();
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

  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [revisedPreviewUrl, setRevisedPreviewUrl] = useState<string | null>(
    null
  );
  const [revisedResponse, setRevisedResponse] = useState<string | null>(null);

  // ✅ Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ✅ Restore chat from history
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

  // ✅ Pro check on mount
  useEffect(() => {
    const check = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (email) setIsProUser(await checkProAccess(email));
    };
    check();
  }, [user]);

  const handleFeedback = async (
    message: string,
    feedback: "thumbs_up" | "thumbs_down"
  ) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || feedbackGiven[message]) return;

    const title =
      chat
        .findLast((m) => m.role === "ai")
        ?.content.split("\n")[0]
        .slice(0, 100) || "Untitled";

    const { error } = await supabase.from("chat_feedback").insert({
      user_email: email,
      message,
      personality: selectedPersonality,
      feedback,
      title,
    });

    if (!error) {
      setFeedbackGiven((prev) => ({ ...prev, [message]: feedback }));
      toast("Feedback submitted", { description: "Thanks!" });
    }
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followup.trim()) return;

    // 🔒 Enforce limit for free users
    if (!isProUser && followupCount >= 1) {
      alert("Upgrade to Pro to ask unlimited follow-up questions.");
      return;
    }

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
            .join("\n\n")}\nFollow-up: ${followup}`,
        }),
      });

      const data = await res.json();
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", content: data.result };
        return updated;
      });

      const email = user?.primaryEmailAddress?.emailAddress;
      if (email) {
        await supabase.from("chat_history").insert({
          user_email: email,
          personality: selectedPersonality,
          title: data.result.split("\n")[0].slice(0, 100),
          messages: [
            ...chat,
            userMessage,
            { role: "ai", content: data.result },
          ],
        });
      }

      // ✅ Track follow-ups for free users
      setFollowupCount((prev) => prev + 1);
    } catch (err) {
      console.error("Follow-up error:", err);
      alert("Could not get a response.");
    } finally {
      setIsLoading(false);
    }
  };

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

        // body: JSON.stringify({
        //   prompt: `Please analyze this ad using the "${selectedPersonality}" personality.`,
        // }),
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

      // await supabase.from("chat_history").insert({
      //   user_email: email,
      //   personality: selectedPersonality,
      //   title,
      //   messages: [userMessage, aiMessage],
      // });
      const { data: inserted, error } = await supabase
        .from("chat_history")
        .insert({
          user_email: email,
          personality: selectedPersonality,
          title,
          messages: [...chat, userMessage, aiMessage], // or revisedMessage + aiMessage
        })
        .select("id")
        .single();

      if (inserted?.id) {
        localStorage.setItem("selectedChatId", inserted.id); // ✅ Store for session restore
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
        setFollowupCount(0); // ✅ Reset follow-up count
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

        {/* Personality Selector (locked for free users) */}
        <div className="mt-6 w-full max-w-md space-y-2">
          <label className="block text-sm text-gray-300 font-medium">
            Choose AI Personality:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(personalities).map(([key, value]) => {
              const isLocked = key !== "Nova" && !isProUser;
              return (
                <button
                  key={key}
                  onClick={() =>
                    !isLocked && setSelectedPersonality(key as Personality)
                  }
                  disabled={isLocked}
                  className={`p-2 rounded border text-left text-sm transition ${
                    selectedPersonality === key
                      ? "border-purple-500 bg-purple-900"
                      : "border-gray-700 bg-gray-800"
                  } ${
                    isLocked
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:border-purple-400"
                  }`}
                  title={isLocked ? "Upgrade to Pro to unlock" : ""}
                >
                  <div className="font-bold flex items-center gap-1">
                    {key} {isLocked && "🔒"}
                  </div>
                  <p className="text-xs text-gray-400">{value.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Media preview */}
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

        {/* 🧠 Show Analyze Button only when file is uploaded and no chat yet */}
        {file && chat.length === 0 && !revisedResponse && (
          <Button
            className="mt-4"
            disabled={isLoading}
            onClick={handleInitialAnalyze}
          >
            {isLoading ? "Analyzing..." : "Continue to Analyze"}
          </Button>
        )}

        {/* AI Response Section */}
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
                        isUser ? "bg-blue-600" : "bg-gray-800"
                      }`}
                    >
                      {msg.content}
                      {!isUser && (
                        <div className="flex gap-2 mt-1 items-center">
                          <button
                            onClick={() =>
                              handleFeedback(msg.content, "thumbs_up")
                            }
                            disabled={!!feedback}
                          >
                            <ThumbsUp size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleFeedback(msg.content, "thumbs_down")
                            }
                            disabled={!!feedback}
                          >
                            <ThumbsDown size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setIsGeneratingAudio(true);
                              speakWithOpenAIStream({
                                text: msg.content,
                                voice: personalities[selectedPersonality].voice,
                                onStart: () => setAudioUrl(null),
                                onEnd: () => setIsGeneratingAudio(false),
                                setUrl: (url) => setAudioUrl(url),
                              });
                            }}
                            disabled={isGeneratingAudio}
                          >
                            <Volume2 size={18} />
                          </button>
                          {audioUrl && (
                            <a href={audioUrl} download="tts.mp3">
                              <Download size={18} />
                            </a>
                          )}
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(msg.content)
                            }
                          >
                            <Clipboard size={18} />
                          </button>

                          {/* Spinner shown during TTS playback */}
                          {/* {isGeneratingAudio && (
                            <svg
                              className="animate-spin h-4 w-4 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              ></path>
                            </svg>
                          )} */}

                          {isGeneratingAudio && (
                            <span className="text-xs text-gray-400 ml-2 animate-pulse">
                              Processing...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Follow-up input */}
            <form
              onSubmit={handleFollowupSubmit}
              className="mt-4 w-full max-w-xl"
            >
              <input
                type="text"
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                placeholder="Ask a follow-up..."
                className="w-full px-4 py-2 rounded border border-gray-700 bg-gray-800 text-white placeholder-gray-400"
              />
              <Button className="mt-2 w-full" disabled={isLoading}>
                {isLoading ? "Thinking..." : "Ask"}
              </Button>
            </form>
          </>
        )}
        {/* ✅ 👇 Place this block RIGHT HERE */}
        {isProUser && chat.length > 0 && !revisedResponse && (
          <div className="mt-6 w-full max-w-md pb-5">
            <label className="block mb-2 text-sm text-gray-300">
              Upload Revised Ad here!
            </label>
            <input
              type="file"
              accept=".mp4,.gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setRevisedFile(file);
                setRevisedPreviewUrl(URL.createObjectURL(file));
              }}
              className="text-sm text-gray-200"
            />
            {revisedPreviewUrl && (
              <Button
                className="mt-2"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  const email = user?.primaryEmailAddress?.emailAddress;
                  if (!email) return alert("Please log in.");
                  try {
                    const res = await fetch("/api/critique", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },

                      body: JSON.stringify({
                        prompt: `Please analyze this ad using the "${selectedPersonality}" personality.`,
                      }),
                    });
                    const data = await res.json();
                    // setRevisedResponse(data.result);
                    const revisedMessage: Message = {
                      role: "user",
                      content:
                        "This is a revised version of the ad. Please reanalyze it.",
                    };

                    const aiMessage: Message = {
                      role: "ai",
                      content: data.result,
                    };

                    setRevisedResponse(data.result);
                    setChat((prev) => [...prev, revisedMessage, aiMessage]);
                  } catch (err) {
                    console.error("Re-critique failed:", err);
                    alert("Something went wrong.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {isLoading ? "Analyzing..." : "Analyze Revised Ad"}
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
