import HeroSection from "@/components/home/HeroSection";
import PricingTiers from "@/components/home/PricingTiers";
import CallToAction from "@/components/home/CallToAction";
import Topbar from "@/components/home/Topbar";
import Menu from "@/components/home/Menu";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <Topbar />
      <Menu />
      <HeroSection />
      <PricingTiers />
      <CallToAction />
      <Footer />
    </main>
  );
}
