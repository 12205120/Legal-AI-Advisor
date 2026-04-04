"use client";
import { useState, useEffect } from "react";
import { useGesture } from "../../components/ui/GestureContext";
import Solve from "./submodules/Solve";
import Generator from "./submodules/Generator";
import Library from "./submodules/Library";
import Assessment from "./submodules/Assessment";
import Virtual from "./submodules/Virtual";

export default function TrainerModule() {
  const [active, setActive] = useState("generator");
  const { cursorX, cursorY, isPinching, isActive } = useGesture();

  const tabs = [
    { id: "generator", label: "📄 Scenario Generator" },
    { id: "logic", label: "🧠 Logic Solver" },
    { id: "library", label: "📚 Library AI" },
    { id: "assessment", label: "📝 Assessment" },
    { id: "court", label: "⚖ Virtual Court Bench" },
  ];

  // Gesture-based hover detection for tabs
  const getHoveredTab = () => {
    if (!isActive) return null;
    for (const tab of tabs) {
      const el = document.getElementById(`trainer-tab-${tab.id}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        cursorX >= rect.left &&
        cursorX <= rect.right &&
        cursorY >= rect.top &&
        cursorY <= rect.bottom
      ) {
        return tab.id;
      }
    }
    return null;
  };

  const hoveredTab = isActive ? getHoveredTab() : null;

  // Pinch to switch tab
  useEffect(() => {
    if (!isActive || !isPinching) return;
    const hovered = getHoveredTab();
    if (hovered && hovered !== active) {
      setActive(hovered);
    }
  }, [isPinching, isActive, cursorX, cursorY]);

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex gap-3 flex-wrap">
        {tabs.map((tab) => {
          const isHovered = hoveredTab === tab.id;
          const isActiveTab = active === tab.id;

          return (
            <button
              id={`trainer-tab-${tab.id}`}
              data-gesture-id={`trainer-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-5 py-2.5 rounded-xl border transition-all duration-300 relative ${
                isActiveTab
                  ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 text-cyan-300"
                  : isHovered
                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-200 scale-105"
                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
              }`}
              style={
                isHovered
                  ? { boxShadow: "0 0 18px rgba(0,255,255,0.25)" }
                  : undefined
              }
            >
              {tab.label}
              {isHovered && !isActiveTab && (
                <span className="absolute -top-2 -right-1 text-[8px] bg-cyan-500 text-black font-bold px-1.5 py-0.5 rounded-full tracking-wider">
                  PINCH
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-8">
        {active === "generator" && <Generator />}
        {active === "logic" && <Solve />}
        {active === "library" && <Library />}
        {active === "assessment" && <Assessment />}
        {active === "court" && <Virtual />}
      </div>
    </div>
  );
}