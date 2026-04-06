import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://legal-ai-advisor-phi.vercel.app"),
  title: "Nyaya AI | Advanced Virtual Legal Courtroom & AI Advocate",
  description: "Nyaya AI is an advanced Indian legal simulation platform. Train your advocacy skills, debate with AI lawyers, experience a virtual supreme court, and query an infinite legal library built on fast neural networks.",
  keywords: ["Nyaya AI", "Virtual Courtroom", "Indian Legal AI", "AI Lawyer Simulator", "Law Student Training", "Supreme Court Simulation", "Legal Tech India"],
  openGraph: {
    title: "Nyaya AI | The Virtual Courtroom",
    description: "Train your law skills against the lightning-fast Nyaya AI engine.",
    url: "https://legal-ai-advisor-phi.vercel.app",
    siteName: "Nyaya AI",
    images: [{ url: "/sara-human.jpg", width: 800, height: 600 }],
    type: "website",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
