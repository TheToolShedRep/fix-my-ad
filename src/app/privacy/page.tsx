"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">
        <strong>Last updated:</strong> [Insert Date]
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. What We Collect</h2>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>
          Email & login info (to create your account and verify Pro access).
        </li>
        <li>Ad content (only what you upload or paste — used for analysis).</li>
        <li>
          Usage data (like how often you use features — to improve the tool).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. What We Don’t Do</h2>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>We don’t sell your data.</li>
        <li>We don’t use your uploaded content to train external AI models.</li>
        <li>
          We don’t share your personal info with advertisers or third parties.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Who Can See My Stuff?
      </h2>
      <p className="mb-4">
        Only you can see your uploaded content and feedback. We store this
        securely using Supabase.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Cookies</h2>
      <p className="mb-4">
        We use basic cookies to keep you logged in and make the app work. No
        tracking cookies or ads.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Payments</h2>
      <p className="mb-4">
        All payments are handled securely via Stripe. We don’t store your credit
        card info.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Delete Your Data</h2>
      <p className="mb-4">
        Want to leave? Email us or use the built-in account removal feature
        (coming soon). We’ll delete your account and data within 7 days.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Questions?</h2>
      <p>Email us anytime at [your support email]</p>
    </div>
  );
}
