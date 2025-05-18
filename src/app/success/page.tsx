// 📁 src/app/success/page.tsx
export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="text-3xl font-bold mb-4">✅ Success!</h1>
      <p className="text-lg mb-6 text-gray-300">
        Thank you! Your Pro subscription is now active.
      </p>
      <a
        href="/upload"
        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
      >
        Go to Upload
      </a>
    </div>
  );
}
