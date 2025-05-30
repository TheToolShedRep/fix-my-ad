import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignedOut } from "@clerk/nextjs";
import HeaderClient from "@/components/HeaderClient";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fix My Ad",
  description: "Instant AI feedback on short-form ads",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-gray-950 text-white`}
        >
          {/* Only show header if NOT signed in */}
          <SignedOut>
            <HeaderClient />
          </SignedOut>

          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
