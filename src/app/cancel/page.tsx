// 📁 src/app/cancel/page.tsx
export default function CancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="text-3xl font-bold mb-4">❌ Payment Canceled</h1>
      <p className="text-lg mb-6 text-gray-300">
        Your subscription was not completed. You can try again anytime.
      </p>
      <a
        href="/upload"
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
      >
        Return to Upload
      </a>
    </div>
  );
}
