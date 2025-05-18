// app/(landing)/page.tsx

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-6">Fix My Ad</h1>
      <p className="text-lg max-w-xl mx-auto mb-8">
        Upload your short-form ads (TikTok, Reels, GIFs) and get instant
        AI-powered feedback.
      </p>
      <a
        href="/upload"
        className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold"
      >
        Try It Free
      </a>
    </div>
  );
}
