"use client";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="mb-4">
        <strong>Last updated:</strong> [Insert Date]
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. What This Tool Does
      </h2>
      <p className="mb-4">
        Fix My Ad uses AI to help you analyze and improve short-form video ads.
        We don’t guarantee results — it’s a tool, not magic. You make the final
        call.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Fair Use</h2>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>Free users can access limited features.</li>
        <li>Pro users get extended access.</li>
        <li>
          Don’t abuse the system, spam it, or try to reverse-engineer how it
          works.
        </li>
        <li>We may throttle, suspend, or revoke access if there’s abuse.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. AI Output</h2>
      <p className="mb-4">
        AI is not perfect. It can miss things or be occasionally wrong. Use your
        judgment. We’re not liable for any financial losses or ad performance
        based on AI suggestions.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Payments</h2>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>Paid plans are billed through Stripe.</li>
        <li>Subscriptions renew automatically unless you cancel.</li>
        <li>No refunds unless there's a system-level error on our end.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Account Data</h2>
      <p className="mb-4">
        You’re responsible for the security of your login and account. If you
        suspect unauthorized access, let us know immediately.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Changes</h2>
      <p>
        We may update these terms. We’ll post any changes here, and by
        continuing to use the service, you agree to the updates.
      </p>
    </div>
  );
}
