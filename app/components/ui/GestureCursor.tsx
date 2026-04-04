"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "./GestureContext";

/** Safe client-side-only hook: returns false on SSR, true after mount */
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

const gestureLabels: Record<string, string> = {
  POINT: "👆 POINTING",
  PINCH: "🤏 PINCHING — CLICK",
  PALM: "✋ PALM — PAUSED",
  FIST: "✊ FIST",
  NONE: "",
};

const gestureColors: Record<string, string> = {
  POINT: "#00ffff",
  PINCH: "#ff00ff",
  PALM: "#ffa500",
  FIST: "#ffffff",
  NONE: "#00ffff",
};

// ── Hand SVG that mirrors actual hand geometry ────────────────────────────
function HandIcon({ color, gesture }: { color: string; gesture: string }) {
  const isPinching = gesture === "PINCH";
  const isPalm = gesture === "PALM";

  return (
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
      {/* Palm */}
      <ellipse cx="14" cy="26" rx="10" ry="9" fill={`${color}33`} stroke={color} strokeWidth="1.2" />
      {/* Thumb */}
      <line x1="4" y1="24" x2="isPinching ? 10 : 1" y2="isPinching ? 14 : 18"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Index finger — always up (pointer) */}
      <line x1="10" y1="18" x2="10" y2={isPinching ? "12" : "4"} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Middle */}
      <line x1="14" y1="17" x2="14" y2={isPalm ? "3" : "8"} stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Ring */}
      <line x1="18" y1="18" x2="18" y2={isPalm ? "4" : "9"} stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Pinky */}
      <line x1="22" y1="21" x2="22" y2={isPalm ? "8" : "13"} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Thumb tip dot for pinch */}
      {isPinching && <circle cx="10" cy="12" r="3" fill={color} opacity="0.9" />}
    </svg>
  );
}

export default function GestureCursor() {
  const { cursorX, cursorY, gesture, isPinching, isActive, pipStream, confidence } = useGesture();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [handDetected, setHandDetected] = useState(false);
  const [winWidth, setWinWidth] = useState(1200);
  const isMounted = useIsMounted();

  const color = gestureColors[gesture] || "#00ffff";

  // Capture window width safely on client only
  useEffect(() => {
    const update = () => setWinWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Track hand detection state
  useEffect(() => {
    setHandDetected(gesture !== "NONE" && confidence > 0);
  }, [gesture, confidence]);

  // Attach the shared camera stream from GestureController to PiP video
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (pipStream.current && videoRef.current) {
        videoRef.current.srcObject = pipStream.current;
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [isActive, pipStream]);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isActive]);

  // Don't render anything until client has hydrated
  if (!isMounted || !isActive) return null;

  return (
    <>
      {/* ── Virtual Neon Cursor ──────────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none fixed z-[9999] top-0 left-0"
        animate={{ x: cursorX - 28, y: cursorY - 28 }}
        transition={{ type: "spring", stiffness: 550, damping: 32 }}
      >
        {/* Outer pulsing ring */}
        <motion.div
          animate={{
            scale: isPinching ? [1, 2.2, 1] : handDetected ? [1, 1.08, 1] : 1,
            opacity: isPinching ? [1, 0.3, 1] : 1,
          }}
          transition={{
            duration: isPinching ? 0.35 : 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `2.5px solid ${color}`,
            boxShadow: `0 0 28px 6px ${color}88, 0 0 60px 12px ${color}33, inset 0 0 16px ${color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Hand icon in center */}
          <HandIcon color={color} gesture={gesture} />
        </motion.div>

        {/* Inner bright dot */}
        <motion.div
          animate={{ scale: isPinching ? [1, 1.6, 1] : 1 }}
          transition={{ duration: 0.3, repeat: isPinching ? Infinity : 0 }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 14px 4px ${color}`,
          }}
        />

        {/* Crosshair lines */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 72, height: 1.5, background: `linear-gradient(90deg, transparent, ${color}99, transparent)` }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 1.5, height: 72, background: `linear-gradient(180deg, transparent, ${color}99, transparent)` }} />

        {/* Pinch ripple effect */}
        {isPinching && (
          <motion.div
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: `2px solid ${color}`,
            }}
          />
        )}
      </motion.div>

      {/* ── Gesture Label Badge ──────────────────────────────────────────── */}
      <AnimatePresence>
        {gesture !== "NONE" && gestureLabels[gesture] && (
          <motion.div
            key={gesture}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: Math.min(cursorX + 38, winWidth - 200),
              top: cursorY - 20,
              background: "rgba(0,0,0,0.9)",
              border: `1px solid ${color}66`,
              color,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "5px 12px",
              borderRadius: 10,
              boxShadow: `0 0 16px ${color}55, 0 4px 20px rgba(0,0,0,0.5)`,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
            }}
          >
            {gestureLabels[gesture]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "No hand detected" scanning indicator ───────────────────────── */}
      <AnimatePresence>
        {!handDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-[9998]"
            style={{
              bottom: 200,
              right: 12,
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "6px 14px",
              color: "rgba(255,255,255,0.5)",
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(0,255,255,0.5)", display: "inline-block" }}
            />
            SCANNING FOR HAND…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PiP Camera Feed ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-24 right-4 z-[9998] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: 240,
          height: 180,
          border: `1.5px solid ${handDetected ? "rgba(0,255,255,0.6)" : "rgba(0,255,255,0.25)"}`,
          boxShadow: handDetected
            ? "0 0 30px rgba(0,255,255,0.3)"
            : "0 0 15px rgba(0,255,255,0.1)",
          background: "#000",
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {/* Skeleton canvas overlay */}
        <canvas
          id="gesture-pip-canvas"
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Hand detected glow overlay */}
        {handDetected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
              border: `1px solid ${color}33`,
            }}
          />
        )}

        {/* LIVE / DETECTING badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none"
          style={{ background: "rgba(0,0,0,0.75)", padding: "3px 8px", borderRadius: 7, border: "1px solid rgba(0,255,255,0.3)" }}>
          <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ff", display: "inline-block" }} />
          <span style={{ color: "#0ff", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", fontFamily: "monospace" }}>
            {handDetected ? "HAND DETECTED" : "GESTURE CAM"}
          </span>
        </div>

        {/* Gesture type pill */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <motion.div
            key={gesture}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              background: "rgba(0,0,0,0.85)",
              border: `1px solid ${color}77`,
              color,
              fontSize: 9,
              padding: "3px 10px",
              borderRadius: 7,
              fontWeight: 700,
              letterSpacing: "0.12em",
              fontFamily: "monospace",
              boxShadow: handDetected ? `0 0 8px ${color}44` : "none",
            }}
          >
            {handDetected ? `✋ ${gesture}` : "SCANNING…"}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
