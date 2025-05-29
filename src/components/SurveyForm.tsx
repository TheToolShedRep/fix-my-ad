import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@clerk/nextjs";

export default function SurveyForm() {
  const [form, setForm] = useState({ platform: "", ad_type: "", tone: "" });
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    const { error } = await supabase.from("user_profiles").upsert({
      user_email: email,
      ...form,
    });

    if (error) {
      console.error("Failed to save survey:", error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <select
        required
        onChange={(e) => setForm({ ...form, platform: e.target.value })}
        className="w-full p-2 rounded bg-gray-800 text-white"
      >
        <option value="">Platform</option>
        <option value="TikTok">TikTok</option>
        <option value="Instagram">Instagram</option>
        <option value="YouTube">YouTube</option>
      </select>

      <input
        type="text"
        placeholder="Ad type (beauty, fashion, etc.)"
        onChange={(e) => setForm({ ...form, ad_type: e.target.value })}
        className="w-full p-2 rounded bg-gray-800 text-white"
        required
      />

      <input
        type="text"
        placeholder="Tone (fun, serious, elegant...)"
        onChange={(e) => setForm({ ...form, tone: e.target.value })}
        className="w-full p-2 rounded bg-gray-800 gray-900"
        required
      />

      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded w-full"
      >
        Save Preferences
      </button>
    </form>
  );
}
