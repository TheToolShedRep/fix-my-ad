export default function PricingTiers() {
  return (
    <section className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto my-12">
      <div className="border rounded-lg p-6 bg-gray-900">
        <h2 className="text-xl font-semibold mb-2">Free</h2>
        <ul className="text-gray-300 text-sm space-y-1 mb-4">
          <li>✔ 30s ad critique</li>
          <li>✔ 1 follow-up question</li>
          <li>✔ Nova AI personality only</li>
        </ul>
        <p className="text-white text-2xl font-bold">$0</p>
      </div>

      <div className="border rounded-lg p-6 bg-gray-800 border-purple-500">
        <h2 className="text-xl font-semibold mb-2">Pro</h2>
        <ul className="text-gray-300 text-sm space-y-1 mb-4">
          <li>✔ 60s ad uploads</li>
          <li>✔ Unlimited follow-ups</li>
          <li>✔ All AI personalities</li>
          <li>✔ A/B testing & re-critiques</li>
          <li>✔ Project folders</li>
        </ul>
        <p className="text-white text-2xl font-bold">$10/mo</p>
      </div>
    </section>
  );
}
