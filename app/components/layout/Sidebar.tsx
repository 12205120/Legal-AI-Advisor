"use client";
import { useEffect } from "react";
import { useGesture } from "../ui/GestureContext";

export default function Sidebar({
  active,
  setActive
}: {
  active: string;
  setActive: (tab: string) => void;
}) {
  const { cursorX, cursorY, isPinching, isActive } = useGesture();

  const items = [
    { id: "trainer", label: "⚖ Trainer", icon: "⚖" },
    { id: "mapper", label: "🗺 Mapper", icon: "🗺" },
    { id: "bail", label: "🔓 Bail", icon: "🔓" },
    { id: "profile", label: "👤 Profile", icon: "👤" },
  ];

  // Gesture-based hover detection: find which item the cursor overlaps
  const getHoveredItem = () => {
    if (!isActive) return null;
    for (const item of items) {
      const el = document.getElementById(`sidebar-item-${item.id}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        cursorX >= rect.left &&
        cursorX <= rect.right &&
        cursorY >= rect.top &&
        cursorY <= rect.bottom
      ) {
        return item.id;
      }
    }
    return null;
  };

  const hoveredItem = isActive ? getHoveredItem() : null;

  // When pinching over a sidebar item, navigate to it
  useEffect(() => {
    if (!isActive || !isPinching) return;
    const hovered = getHoveredItem();
    if (hovered && hovered !== active) {
      setActive(hovered);
    }
  }, [isPinching, isActive, cursorX, cursorY]);

  return (
    <div className="w-72 bg-black/80 backdrop-blur-3xl border-r border-red-600/20 p-8 flex flex-col">
      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f21c1c] to-[#ecb31c] mb-12 tracking-tighter">
        NYAYA_AI
      </h1>

      <div className="space-y-4 flex-1">
        {items.map((item) => {
          const isHovered = hoveredItem === item.id;
          const isActiveTab = active === item.id;

          return (
            <div
              id={`sidebar-item-${item.id}`}
              data-gesture-id={`sidebar-${item.id}`}
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-500 overflow-hidden ${
                isActiveTab
                  ? "bg-[#f21c1c]/10 border border-[#f21c1c]/30 shadow-[0_0_20px_rgba(242,28,28,0.15)]"
                  : isHovered
                  ? "bg-white/5 border border-white/10 translate-x-1"
                  : "bg-transparent border border-transparent"
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <span className={`text-xl transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                <span className={`text-sm tracking-wide transition-colors duration-300 ${
                  isActiveTab ? "text-[#f21c1c] font-bold" : isHovered ? "text-white" : "text-slate-400"
                }`}>
                  {item.label.split(" ").slice(1).join(" ").toUpperCase()}
                </span>
                
                {isHovered && !isActiveTab && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#f21c1c] animate-ping" />
                )}
              </div>
              
              {isActiveTab && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f21c1c] shadow-[0_0_15px_#f21c1c]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Gesture mode status display */}
      <div className={`mt-auto p-4 rounded-xl border transition-all duration-500 ${
        isActive 
          ? "border-[#f21c1c]/20 bg-[#f21c1c]/5" 
          : "border-white/5 bg-white/2"
      }`}>
        <div className={`text-[10px] tracking-[0.2em] font-black mb-2 ${
          isActive ? "text-[#f21c1c]" : "text-slate-500"
        }`}>
          {isActive ? "SYSTEM_ACTIVE" : "GESTURE_IDLE"}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isActive ? "bg-[#ecb31c] animate-pulse" : "bg-slate-700"
          }`} />
          <div className="text-[10px] text-slate-400 font-mono uppercase">
            {isActive ? "Link Established" : "Awaiting Input"}
          </div>
        </div>
      </div>
    </div>
  );
}