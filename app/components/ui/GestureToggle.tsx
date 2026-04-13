"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "./GestureContext";

export default function GestureToggle() {
  const { isActive, setGestureActive, gesture } = useGesture();
  const [showInfo, setShowInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;


  const handleToggle = () => {
    if (!isActive) {
      setShowInfo(true);
      setTimeout(() => setShowInfo(false), 4000);
    }
    setGestureActive(!isActive);
  };

  return (
    <>
      {/* ── Floating Toggle Button ───────────────────────────────────────── */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 left-6 z-[9997] flex items-center gap-2.5 select-none"
        style={{
          background: isActive
            ? "linear-gradient(135deg, rgba(242,28,28,0.15), rgba(0,0,0,0.4))"
            : "rgba(0,0,0,0.7)",
          border: isActive ? "1.5px solid rgba(242,28,28,0.6)" : "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: "10px 18px",
          boxShadow: isActive
            ? "0 0 24px rgba(242,28,28,0.35), inset 0 0 10px rgba(242,28,28,0.08)"
            : "0 4px 20px rgba(0,0,0,0.5)",
          backdropFilter: "blur(16px)",
          cursor: "pointer",
          color: isActive ? "#ecb31c" : "rgba(255,255,255,0.6)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.12em",
          fontFamily: "monospace",
          transition: "all 0.3s",
        }}
      >
        {/* Status dot */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isActive ? "#ecb31c" : "rgba(255,255,255,0.25)",
            boxShadow: isActive ? "0 0 8px #ecb31c" : "none",
            display: "inline-block",
            flexShrink: 0,
          }}
          className={isActive ? "animate-pulse" : ""}
        />
        <span style={{ fontSize: 16 }}>👋</span>
        <span>{isActive ? "GESTURE ON" : "GESTURE MODE"}</span>

        {/* Active gesture indicator */}
        {isActive && gesture !== "NONE" && (
          <span
            style={{
              background: "rgba(242,28,28,0.15)",
              border: "1px solid rgba(242,28,28,0.3)",
              borderRadius: 6,
              padding: "1px 6px",
              fontSize: 9,
              color: "#ecb31c",
            }}
          >
            {gesture}
          </span>
        )}
      </motion.button>

      {/* ── Tutorial Toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-24 left-6 z-[9997] pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.92)",
              border: "1px solid rgba(242,28,28,0.3)",
              borderRadius: 14,
              padding: "14px 18px",
              maxWidth: 280,
              boxShadow: "0 0 30px rgba(242,28,28,0.15)",
            }}
          >
            <div
              style={{
                color: "#ecb31c",
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: "0.15em",
                marginBottom: 10,
                fontFamily: "monospace",
              }}
            >
              ✋ GESTURE CONTROLS ACTIVE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: "👆", label: "Point", desc: "Move cursor" },
                { icon: "🤏", label: "Pinch & hold", desc: "Click element" },
                { icon: "✋", label: "Open palm", desc: "Pause / no action" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>
                      {item.label}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginLeft: 6 }}>
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
