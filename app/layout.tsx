import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SDE Tracker: Java Edition | Striver SDE Sheet Companion",
  description: "Mission control for Striver's SDE Sheet (180+ problems). Local-first persistence, 3-tier progressive hints, 10-second rapid logging, automated spaced repetition, and Gemini 2.5 Flash AI coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-[#000000] text-[#ededed] font-sans antialiased min-h-screen selection:bg-zinc-800 selection:text-white`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
