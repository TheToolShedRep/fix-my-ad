// ✅ Full working version of upload/page.tsx with all features intact
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
import { useUser, SignedOut } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { checkProAccess } from "@/lib/checkProAccess";
import SurveyModal from "@/components/survey/SurveyModal";
import Topbar from "@/components/home/Topbar";
import { validateVideoDuration } from "@/utils/validateVideoDuration";
import ReactMarkdown from "react-markdown";

// Personalities
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

export default function UploadPage() {
  const { user, isLoaded } = useUser();
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

  // performance metrics
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [platform, setPlatform] = useState("");
  const [adType, setAdType] = useState("");
  const [tone, setTone] = useState("");

  // Revised critique
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [revisedPreviewUrl, setRevisedPreviewUrl] = useState<string | null>(
    null
  );
  const [revisedResponse, setRevisedResponse] = useState<string | null>(null);

  // A/B test
  const [abOriginal, setABOriginal] = useState<File | null>(null);
  const [abRevised, setABRevised] = useState<File | null>(null);

  const [abTestFile, setABTestFile] = useState<File | null>(null);
  const [abPreviewUrl, setABPreviewUrl] = useState<string | null>(null);
  const [abResponse, setABResponse] = useState<string | null>(null);

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [showSurvey, setShowSurvey] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const uploadedFile = acceptedFiles[0];
      if (!uploadedFile) return;

      const maxDuration = isProUser ? 60 : 30;
      const isValid = await validateVideoDuration(uploadedFile, maxDuration);
      if (!isValid) {
        toast("Video too long!", {
          description: `Maximum allowed is ${maxDuration} seconds.`,
        });
        return;
      }

      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
      localStorage.setItem("previewUrl", URL.createObjectURL(uploadedFile));
      localStorage.setItem("previewType", uploadedFile.type);
      // setPreviewUrl(gifUrl);
    },
    accept: { "video/mp4": [".mp4"], "image/gif": [".gif"] },
    multiple: false,
    maxFiles: 1,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    const savedPreviewUrl = localStorage.getItem("previewUrl");
    const savedPreviewType = localStorage.getItem("previewType");

    if (savedPreviewUrl) setPreviewUrl(savedPreviewUrl);
    if (savedPreviewType) {
      setFile({ name: "Restored", type: savedPreviewType } as File);
    }
  }, []);

  useEffect(() => {
    const restoreChat = async () => {
      if (!user || !isLoaded) return;

      const selectedId = localStorage.getItem("selectedChatId");
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!selectedId || !email) return;

      const { data, error } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("id", selectedId)
        .eq("user_email", email)
        .single();

      if (data?.messages) setChat(data.messages);
    };

    restoreChat();
  }, [user, isLoaded]);

  useEffect(() => {
    const check = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (email) setIsProUser(await checkProAccess(email));
    };
    check();
  }, [user]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("platform, ad_type, tone")
        .eq("user_email", email)
        .single();

      setPlatform(profile?.platform || "");
      setAdType(profile?.ad_type || "");
      setTone(profile?.tone || "");
    };

    if (user) fetchProfileData();
  }, [user]);

  useEffect(() => {
    const checkSurveyStatus = async () => {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return;
      const { data } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("user_email", email)
        .maybeSingle();
      if (!data) setShowSurvey(true);
    };
    if (isLoaded && user) checkSurveyStatus();
  }, [isLoaded, user]);

  useEffect(() => {
    const analyzeRevisedAd = async () => {
      if (!revisedFile || !user) return;

      setIsLoading(true);

      try {
        // Step 1: Convert the revised video
        const convertRes = await fetch(
          "https://stripe-webhook-rlg0.onrender.com/convert",
          {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              formData.append("video", revisedFile);
              return formData;
            })(),
          }
        );

        // 🔍 Extra error logging
        if (!convertRes.ok) {
          console.error("❌ /convert failed with status:", convertRes.status);
          const errorText = await convertRes.text();
          console.error("🧾 Error body:", errorText);
          toast("Video conversion failed.");
          return;
        }

        const revisedData = await convertRes.json();

        // Step 2: Send converted data to critique API
        const res = await fetch("/api/revised-critique", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: user?.primaryEmailAddress?.emailAddress,
            personality: selectedPersonality,
            transcript: revisedData.transcript,
            duration: revisedData.duration || 0,
            fileType: revisedFile.type === "video/mp4" ? "video" : "gif",
            gifUrl: revisedData.gifUrl,
          }),
        });

        const data = await res.json();
        setRevisedResponse(data?.result || null);
      } catch (err) {
        console.error("🛑 Revised critique error:", err);
        toast("Revised critique failed.");
      } finally {
        setIsLoading(false);
      }
    };

    analyzeRevisedAd();
  }, [revisedFile, user]);

  const handleABTest = async (originalFile: File, revisedFile: File) => {
    if (!user || !originalFile || !revisedFile) return;
    setIsLoading(true);

    try {
      // 🔁 Upload original
      const originalForm = new FormData();
      originalForm.append("video", originalFile);
      const originalRes = await fetch("http://localhost:3000/convert", {
        method: "POST",
        body: originalForm,
      });
      const originalData = await originalRes.json();

      // 🔁 Upload revised
      const revisedForm = new FormData();
      revisedForm.append("video", revisedFile);
      const revisedRes = await fetch("http://localhost:3000/convert", {
        method: "POST",
        body: revisedForm,
      });

      const revisedData = await revisedRes.json();

      // 🧠 Send both to /api/ab-compare
      const compareRes = await fetch("/api/ab-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user?.primaryEmailAddress?.emailAddress,
          personality: selectedPersonality,
          original: {
            transcript: originalData.transcript,
            duration: originalData.duration,
            fileType: originalData.fileType,
          },
          revised: {
            transcript: revisedData.transcript,
            duration: revisedData.duration,
            fileType: revisedData.fileType,
          },
        }),
      });

      const { result } = await compareRes.json();

      console.log("🐛 A/B API result:", result);
      setABResponse(result || null);

      setChat([{ role: "ai", content: result }]);
      toast.success("✅ A/B test complete!");
    } catch (err) {
      console.error("A/B Test Error:", err);
      toast.error("A/B comparison failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧠 START: handleInitialAnalyze
  const handleInitialAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setChat([]);
    setFollowup("");
    setFollowupCount(0);
    setTranscript(transcript);
    setDuration(duration);

    try {
      const formData = new FormData();
      formData.append("video", file);

      // 1️⃣ Send to backend /convert to get transcript, gif, metadata
      const convertRes = await fetch(
        "https://stripe-webhook-rlg0.onrender.com/convert",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!convertRes.ok) throw new Error("Conversion failed");

      const { transcript, gifUrl, duration, fileType } =
        await convertRes.json();

      // ✅ Show the Supabase-hosted GIF in the preview
      setPreviewUrl(gifUrl);

      localStorage.setItem("previewUrl", gifUrl);
      localStorage.setItem("previewType", file.type);

      // 2️⃣ Send to backend /critique with prompt parts
      const critiqueRes = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user?.primaryEmailAddress?.emailAddress,
          personality: selectedPersonality,
          transcript,
          gifUrl,
          duration,
          fileType,
        }),
      });

      if (!critiqueRes.ok) throw new Error("Critique failed");
      const { result } = await critiqueRes.json();

      // 3️⃣ Set chat response in frontend
      const initialMessage = { role: "ai" as "ai", content: result };
      setChat([initialMessage]);

      // 🧠 Generate a readable title from the AI's 2nd or 3rd line
      const titleFromAI = (() => {
        const lines = result
          ?.split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean);
        const candidates = [lines[1], lines[2]].filter(Boolean);
        const randomLine =
          candidates[Math.floor(Math.random() * candidates.length)];
        return randomLine?.slice(0, 100) || file.name;
      })();

      // 4️⃣ Save to Supabase
      await supabase.from("chat_history").insert({
        user_email: user?.primaryEmailAddress?.emailAddress,
        title: titleFromAI,
        personality: selectedPersonality,
        messages: [initialMessage],
        created_at: new Date().toISOString(),
      });

      toast.success("✅ Analysis complete!");
    } catch (err) {
      console.error("❌ Error in handleInitialAnalyze:", err);
      toast.error("Something went wrong during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧠 END: handleInitialAnalyze

  const validateVideoDuration = async (
    file: File,
    maxSeconds: number
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= maxSeconds);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const speakWithOpenAIStream = async ({
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
  }) => {
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
      toast("TTS playback error.");
      onEnd?.();
    }
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followup.trim()) return;

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

      setFollowupCount((prev) => prev + 1);
    } catch (err) {
      toast("Follow-up failed.");
    } finally {
      setIsLoading(false);
    }
  };

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

  // This handles the prediction
  const handlePerformancePredict = async () => {
    if (!file || !user) return;

    setIsLoading(true);

    try {
      // 🔁 Step 1: Convert video to transcript + metadata
      const formData = new FormData();
      formData.append("video", file);

      const convertRes = await fetch("http://localhost:3000/convert", {
        method: "POST",
        body: formData,
      });

      if (!convertRes.ok) throw new Error("Conversion failed");
      const { transcript, duration } = await convertRes.json();

      // 🔁 Step 2: Send to prediction route
      const predictRes = await fetch("/api/performance-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user?.primaryEmailAddress?.emailAddress,
          transcript,
          platform: "TikTok", // ← use actual user-selected value
          adType: "E-commerce", // ← user-selected
          tone: "Upbeat", // ← user-selected
          duration,
        }),
      });

      if (!predictRes.ok) throw new Error("Prediction failed");
      const { result } = await predictRes.json();

      // Display it in chat or another UI element
      setChat((prev) => [
        ...prev,
        { role: "ai", content: "📊 Predicted Performance:\n\n" + result },
      ]);
      toast.success("Prediction ready!");
    } catch (err) {
      console.error("❌ Prediction error:", err);
      toast.error("Performance prediction failed.");
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
        // localStorage.removeItem("previewUrl");
        localStorage.removeItem("previewType");
      }}
    >
      <div className="min-h-screen flex flex-col items-center px-4 bg-gray-950 text-white">
        {!user && <Topbar />}
        {/* Survey Prompt */}
        <div className="w-full max-w-md bg-purple-900/40 border border-purple-600 text-purple-200 p-4 rounded mb-6">
          <p className="mb-2 text-sm">
            Help us personalize your AI feedback. Take a 1-minute project survey
            before uploading.
          </p>
          <Button
            onClick={() => setShowSurvey(true)}
            className="bg-purple-600 hover:bg-purple-700 w-full"
          >
            🎯 Take Project Survey
          </Button>
          <SurveyModal open={showSurvey} setOpen={setShowSurvey} />
        </div>
        <h1 className="text-3xl font-bold mt-6 mb-4">Upload an Ad</h1>
        {/* Upload Box */}
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
        {/* Personality Selector */}
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
        {/* Preview */}
        {(previewUrl || isLoading) && (
          <div className="mt-4">
            {file?.type === "video/mp4" ? (
              <video
                src={previewUrl || ""}
                controls
                className="max-w-md rounded-lg"
              />
            ) : (
              <img
                src={previewUrl || ""}
                alt="Preview"
                className="max-w-md rounded-lg"
              />
            )}
          </div>
        )}

        {/* Analyze Button */}
        {file && chat.length === 0 && !revisedResponse && (
          <Button
            className="mt-4"
            disabled={isLoading}
            onClick={handleInitialAnalyze}
          >
            {isLoading ? "Analyzing..." : "Continue to Analyze"}
          </Button>
        )}
        {/* Chat */}
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
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
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

            {/* 🔁 Upload Revised Ad and ⚖️ A/B Test Uploads */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-xl">
              {/* Prodiction performance */}
              <Button
                className=" cursor-pointer px-4 py-2 rounded text-center w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading || !file}
                onClick={handlePerformancePredict}
              >
                {isLoading ? "Predicting..." : "📊 Predict Performance"}
              </Button>

              {/* 📤 Ad A (Original for A/B) */}
              <label className="cursor-pointer px-4 py-4 bg-gray-800 rounded hover:bg-gray-700 text-center w-full sm:w-auto">
                📤 Upload Ad A (Original)
                <input
                  type="file"
                  accept="video/mp4,image/gif"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setABOriginal(file);
                  }}
                />
              </label>
              {/* 📥 Ad B (Revised for A/B) */}
              <label className="cursor-pointer px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-center w-full sm:w-auto">
                📥 Upload Ad B (Revised)
                <input
                  type="file"
                  accept="video/mp4,image/gif"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setABRevised(file);
                  }}
                />
              </label>
            </div>

            {/* ⚖️ Run A/B Comparison */}
            <Button
              onClick={() => {
                if (abOriginal && abRevised) {
                  handleABTest(abOriginal, abRevised);
                } else {
                  toast("Please upload both Ad A and Ad B.");
                }
              }}
              className="mt-3 w-full sm:w-auto"
              disabled={!abOriginal || !abRevised || isLoading}
            >
              {isLoading ? "Comparing..." : "⚖️ Run A/B Test"}
            </Button>

            {/* Revised and A/B Uploads [delete]*/}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-xl"></div>

            {/* Follow-up Input */}
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
        {revisedResponse && (
          <div className="mt-6 max-w-xl bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2 text-purple-300">
              🔁 Revised Ad Critique
            </h2>
            <p className="text-sm whitespace-pre-wrap">{revisedResponse}</p>
          </div>
        )}
        {/* A/B Comparison Result */}
        {abResponse && (
          <div className="mt-6 max-w-xl bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2 text-yellow-300">
              🧪 A/B Test Result
            </h2>
            <p className="text-sm whitespace-pre-wrap">{abResponse}</p>
            <p className="text-sm whitespace-pre-wrap">
              {abResponse || "⚠️ No comparison result returned."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
