import Image from "next/image";
import styles from "./page.module.css";
import { Button } from "@/components/ui/button";
import UpgradeButton from "@/components/UpgradeButton";

export default function Home() {
  return (
    <main className="h-screen flex items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold">Tailwind is working ✅</h1>
      <Button>Analyze My Ad</Button>

      <h1 className="text-2xl font-bold">Fix My Ad</h1>
      <UpgradeButton />
    </main>
  );
}
