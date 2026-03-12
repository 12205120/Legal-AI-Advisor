"use client";
import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AnimatedGrid from "../ui/AnimatedGrid";
import FloatingParticles from "../ui/FloatingParticles";

export default function FuturisticLayout({
  children,
  activeTab,
  setActiveTab
}: {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <AnimatedGrid />
      <FloatingParticles />

      <div className="relative z-10 flex h-screen">
        <Sidebar active={activeTab} setActive={setActiveTab} />
        <div className="flex-1 flex flex-col backdrop-blur-xl bg-white/5 border-l border-cyan-500/20">
          <Topbar />
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}