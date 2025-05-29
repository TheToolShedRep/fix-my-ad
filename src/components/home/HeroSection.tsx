export default function HeroSection() {
  return (
    <section
      className="relative bg-cover bg-center text-white min-h-[60vh] flex items-center justify-center px-6"
      style={{
        backgroundImage: "url('./images/hero-bg.png')",
      }}
    >
      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">
          Fix Your Ad. Grow Your Brand.
        </h1>
        <p className="text-gray-300 mb-8">
          Get instant AI feedback on your short-form ads. Improve conversions,
          clarity, and creativity — in seconds.
        </p>
      </div>
    </section>
  );
}
