"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "./GestureContext";


const STORAGE_KEY = "nyaya_gesture_demo_seen";

// ── Animated hand demonstration slides ──────────────────────────────────────

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  duration: number; // ms per slide
  animation: React.ReactNode;
}

function AnimatedHandPoint({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Hand SVG */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: 80 }}
      >
        👆
      </motion.div>
      {/* Trail dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.6, 0], y: [0, -40 - i * 16] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: i * 0.18 }}
          style={{
            position: "absolute",
            width: 8 - i * 2,
            height: 8 - i * 2,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
            top: "30%",
          }}
        />
      ))}
      {/* Cursor ring following the hand */}
      <motion.div
        animate={{ x: [40, 0, -40, 0, 40], y: [-30, -50, -30, -10, -30] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          boxShadow: `0 0 16px ${color}88`,
          opacity: 0.9,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      </motion.div>
    </div>
  );
}

function AnimatedHandPinch({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <motion.div
        animate={{ scale: [1, 0.85, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: 72 }}
      >
        🤏
      </motion.div>
      {/* Ripple waves radiating out */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.33, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            boxShadow: `0 0 10px ${color}55`,
          }}
        />
      ))}
      {/* Click flash */}
      <motion.div
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

function AnimatedHandPalm({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <motion.div
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
        style={{ fontSize: 80 }}
      >
        ✋
      </motion.div>
      {/* Freeze/pause rings */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
          style={{
            position: "absolute",
            width: 80 + i * 30,
            height: 80 + i * 30,
            borderRadius: "50%",
            border: `1.5px dashed ${color}`,
            opacity: 0.4,
          }}
        />
      ))}
      <div style={{ position: "absolute", bottom: 8, fontSize: 11, color, fontWeight: 700, letterSpacing: "0.15em", fontFamily: "monospace", opacity: 0.8 }}>
        PAUSED
      </div>
    </div>
  );
}

function AnimatedNavigation({ color }: { color: string }) {
  const tabs = ["Trainer", "Mapper", "Bail", "Profile"];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % tabs.length);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col gap-2 items-start" style={{ width: 160 }}>
      {/* "Cursor" */}
      <motion.div
        animate={{ y: activeIdx * 44 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          position: "absolute",
          left: -8,
          top: 8,
          width: 140,
          height: 36,
          borderRadius: 10,
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 16px ${color}66`,
          background: `${color}11`,
        }}
      />
      {tabs.map((tab, i) => (
        <motion.div
          key={tab}
          animate={{ color: i === activeIdx ? color : "rgba(255,255,255,0.4)" }}
          style={{
            paddingLeft: 12,
            fontSize: 13,
            fontWeight: i === activeIdx ? 700 : 400,
            letterSpacing: "0.08em",
            height: 36,
            display: "flex",
            alignItems: "center",
            fontFamily: "monospace",
          }}
        >
          {tab}
        </motion.div>
      ))}
      {/* Pinch indicator */}
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.0, repeat: Infinity }}
        style={{ position: "absolute", right: -50, top: activeIdx * 44 + 8, fontSize: 20 }}
      >
        🤏
      </motion.div>
    </div>
  );
}

// ── Main Onboarding Component ────────────────────────────────────────────────

export default function GestureOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isActive } = useGesture();

  // Only run on client
  useEffect(() => { setIsMounted(true); }, []);


  const slides: Slide[] = [
    {
      id: "welcome",
      title: "✋ Touchless Control",
      subtitle: "Control NYAYA AI with just your hand — no mouse needed",
      color: "#00ffff",
      duration: 3000,
      animation: <AnimatedHandPoint color="#00ffff" />,
    },
    {
      id: "point",
      title: "👆 Point to Move",
      subtitle: "Extend your index finger — the neon cursor follows your fingertip",
      color: "#00ffff",
      duration: 3500,
      animation: <AnimatedHandPoint color="#00ffff" />,
    },
    {
      id: "pinch",
      title: "🤏 Pinch to Click",
      subtitle: "Bring your thumb and index finger together for 0.6s to click any button",
      color: "#ff00ff",
      duration: 3500,
      animation: <AnimatedHandPinch color="#ff00ff" />,
    },
    {
      id: "palm",
      title: "✋ Palm to Pause",
      subtitle: "Open all five fingers flat — pauses gesture detection",
      color: "#ffa500",
      duration: 3000,
      animation: <AnimatedHandPalm color="#ffa500" />,
    },
    {
      id: "navigate",
      title: "⚡ Navigate Instantly",
      subtitle: "Point at any sidebar tab or button, then pinch — done!",
      color: "#a855f7",
      duration: 4000,
      animation: <AnimatedNavigation color="#a855f7" />,
    },
  ];

  // Show on first visit or when gesture mode first activates
  useEffect(() => {
    if (!isActive) return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && !dismissed) {
      setIsOpen(true);
    }
  }, [isActive, dismissed]);

  // Auto-advance slides
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (slide < slides.length - 1) {
        setSlide((s) => s + 1);
      }
    }, slides[slide].duration);
    return () => clearTimeout(timer);
  }, [slide, isOpen, slides.length]);

  const handleClose = () => {
    setIsOpen(false);
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const currentSlide = slides[slide];

  // Don't render on server
  if (!isMounted) return null;

  return (
    <>
      {/* ── Onboarding Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              style={{
                background: "rgba(0,0,0,0.95)",
                border: `1.5px solid ${currentSlide.color}44`,
                borderRadius: 28,
                padding: "40px 48px",
                maxWidth: 520,
                width: "90%",
                boxShadow: `0 0 60px ${currentSlide.color}22, 0 25px 80px rgba(0,0,0,0.7)`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Background glow */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: `radial-gradient(ellipse at 50% 0%, ${currentSlide.color}08 0%, transparent 65%)`,
              }} />

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-8">
                {slides.map((s, i) => (
                  <motion.button
                    key={s.id}
                    onClick={() => setSlide(i)}
                    animate={{ scale: i === slide ? 1 : 0.7, opacity: i === slide ? 1 : 0.35 }}
                    style={{
                      width: i === slide ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === slide ? currentSlide.color : "rgba(255,255,255,0.3)",
                      border: "none",
                      cursor: "pointer",
                      transition: "width 0.3s",
                    }}
                  />
                ))}
              </div>

              {/* Animation area */}
              <div className="flex justify-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.35 }}
                  >
                    {currentSlide.animation}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id + "_text"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.h2
                    style={{
                      color: currentSlide.color,
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      marginBottom: 10,
                      fontFamily: "monospace",
                    }}
                  >
                    {currentSlide.title}
                  </motion.h2>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
                    {currentSlide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress bar */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 28, overflow: "hidden" }}>
                <motion.div
                  key={`${slide}-progress`}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: currentSlide.duration / 1000, ease: "linear" }}
                  style={{ height: "100%", background: currentSlide.color, borderRadius: 2 }}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handleClose}
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    cursor: "pointer",
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                  }}
                >
                  SKIP →
                </button>

                <div className="flex gap-3">
                  {slide > 0 && (
                    <button
                      onClick={() => setSlide(s => s - 1)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10,
                        padding: "8px 18px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "monospace",
                        letterSpacing: "0.08em",
                      }}
                    >
                      ← BACK
                    </button>
                  )}
                  {slide < slides.length - 1 ? (
                    <button
                      onClick={() => setSlide(s => s + 1)}
                      style={{
                        background: `${currentSlide.color}22`,
                        border: `1px solid ${currentSlide.color}66`,
                        borderRadius: 10,
                        padding: "8px 22px",
                        color: currentSlide.color,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        boxShadow: `0 0 12px ${currentSlide.color}33`,
                      }}
                    >
                      NEXT →
                    </button>
                  ) : (
                    <button
                      onClick={handleClose}
                      style={{
                        background: `${currentSlide.color}22`,
                        border: `1px solid ${currentSlide.color}66`,
                        borderRadius: 10,
                        padding: "8px 22px",
                        color: currentSlide.color,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        boxShadow: `0 0 16px ${currentSlide.color}44`,
                      }}
                    >
                      START ✓
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "Replay Demo" button (shown after dismissal) ─────────────────── */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setSlide(0); setIsOpen(true); }}
          className="fixed z-[9997]"
          style={{
            bottom: 6,
            left: 180,
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "6px 14px",
            color: "rgba(255,255,255,0.4)",
            fontSize: 10,
            cursor: "pointer",
            fontFamily: "monospace",
            letterSpacing: "0.1em",
            backdropFilter: "blur(12px)",
          }}
        >
          ▶ HOW TO USE
        </motion.button>
      )}
    </>
  );
}
