"use client";
import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AnimatedGrid from "../ui/AnimatedGrid";
import FloatingParticles from "../ui/FloatingParticles";
import { GestureProvider } from "../ui/GestureContext";
import GestureController from "../ui/GestureController";
import GestureCursor from "../ui/GestureCursor";
import GestureToggle from "../ui/GestureToggle";
import GestureOnboarding from "../ui/GestureOnboarding";

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
    <GestureProvider>
      {/* Gesture engine — invisible, handles camera + inference */}
      <GestureController />
      {/* Neon cursor + PiP camera overlay */}
      <GestureCursor />
      {/* Gesture mode toggle button */}
      <GestureToggle />
      {/* Animated onboarding demo for new users */}
      <GestureOnboarding />

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
    </GestureProvider>
  );
}