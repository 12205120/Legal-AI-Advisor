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
    <div className="w-64 bg-black/60 backdrop-blur-xl border-r border-cyan-500/20 p-6">
      <h1 className="text-2xl font-bold text-cyan-400 mb-10 tracking-widest">
        NYAYA AI
      </h1>

      {items.map((item) => {
        const isHovered = hoveredItem === item.id;
        const isActiveTab = active === item.id;

        return (
          <div
            id={`sidebar-item-${item.id}`}
            data-gesture-id={`sidebar-${item.id}`}
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`p-3 mb-3 rounded-xl cursor-pointer transition-all duration-300 ${
              isActiveTab
                ? "bg-cyan-500/20 border border-cyan-400 shadow-lg shadow-cyan-500/20"
                : isHovered
                ? "bg-cyan-500/10 border border-cyan-500/40 shadow-md shadow-cyan-500/10 scale-[1.02]"
                : "hover:bg-white/5 border border-transparent"
            }`}
            style={
              isHovered
                ? { boxShadow: "0 0 20px rgba(0,255,255,0.2)" }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className={isActiveTab ? "text-cyan-300 font-semibold" : "text-white/80"}>
                {item.label.replace(/^.+\s/, "")}
              </span>
              {isHovered && !isActiveTab && (
                <span className="ml-auto text-[9px] text-cyan-400 font-bold tracking-widest animate-pulse">
                  PINCH
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Gesture mode indicator in sidebar */}
      {isActive && (
        <div className="mt-8 p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="text-[9px] text-cyan-500 tracking-widest font-bold mb-1">GESTURE MODE</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
            <span className="text-[10px] text-white/50">Point + Pinch to navigate</span>
          </div>
        </div>
      )}
    </div>
  );
}