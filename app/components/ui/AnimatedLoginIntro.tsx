"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Fingerprint, Shield, Cpu } from "lucide-react";

interface AnimatedLoginIntroProps {
  onComplete: () => void;
}

export default function AnimatedLoginIntro({ onComplete }: AnimatedLoginIntroProps) {
  const [step, setStep] = useState(0); // 0: loading, 1: loaded/waiting for input, 2: exiting

  useEffect(() => {
    // Simulate initial loading sequence
    const timer = setTimeout(() => setStep(1), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setStep(2);
    setTimeout(() => {
      onComplete();
    }, 1500); // Wait for exit animation
  };

  return (
    <AnimatePresence>
      {step < 2 && (
        <motion.div
          key="intro-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
          style={{ perspective: "1200px" }}
        >
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#f21c1c] rounded-full blur-[120px] opacity-20"
            />
          </div>

          {/* Grid lines */}
          <div
            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(242, 28, 28, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 28, 28, 0.2) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              transform: "rotateX(60deg) scale(2) translateY(20%)",
              transformOrigin: "bottom center",
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* 3D Holographic Core */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-12 transform-gpu" style={{ transformStyle: "preserve-3d" }}>
              
              {/* Outer Ring 1 */}
              <motion.div
                animate={{ rotateX: 360, rotateY: 180, rotateZ: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-[#f21c1c]/40 shadow-[0_0_30px_rgba(242,28,28,0.3)]"
                style={{ transformStyle: "preserve-3d" }}
              />
              
              {/* Outer Ring 2 */}
              <motion.div
                animate={{ rotateX: -360, rotateY: 360, rotateZ: -180 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-slate-500/50"
                style={{ transformStyle: "preserve-3d" }}
              />

              {/* Inner Glowing Core */}
              <motion.div
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-12 bg-gradient-to-tr from-[#f21c1c]/20 to-black rounded-full shadow-[0_0_50px_rgba(242,28,28,0.6)] backdrop-blur-md border border-[#f21c1c]/50 flex items-center justify-center"
              >
                <Scale className="w-16 h-16 text-[#f21c1c] drop-shadow-[0_0_15px_rgba(242,28,28,1)]" />
              </motion.div>

              {/* Orbiting particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ rotateZ: 360 }}
                  transition={{ duration: 5 + i * 2, repeat: Infinity, ease: "linear", delay: i }}
                  className="absolute inset-0 flex items-start justify-center origin-center pointer-events-none"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] -mt-1" />
                </motion.div>
              ))}
            </div>

            {/* Typography & Status */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-center mb-10 space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                NYAYA <span className="text-[#f21c1c] drop-shadow-[0_0_15px_rgba(242,28,28,0.8)]">AI</span>
              </h1>
              
              <div className="h-6 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div
                      key="initializing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-[#f21c1c] font-mono text-sm tracking-widest"
                    >
                      <Cpu className="w-4 h-4 animate-pulse" />
                      ESTABLISHING NEURAL LINK...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-green-500 font-mono text-sm tracking-widest drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                    >
                      <Shield className="w-4 h-4" />
                      SYSTEM READY FOR AUTHENTICATION
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Auth Button */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: step === 1 ? 1 : 0.8, opacity: step === 1 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="relative group"
            >
              {/* Outer button glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#f21c1c] to-red-900 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
              
              <button
                onClick={handleLogin}
                disabled={step !== 1}
                className="relative flex items-center gap-3 px-8 py-4 bg-black/80 border border-[#f21c1c]/50 rounded-lg text-white font-mono tracking-[0.2em] uppercase overflow-hidden backdrop-blur-sm transition-all hover:border-[#f21c1c] hover:shadow-[0_0_30px_rgba(242,28,28,0.4)] disabled:cursor-not-allowed"
              >
                {/* Scan line effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-[#f21c1c]/10 to-transparent -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                
                <Fingerprint className="w-6 h-6 text-[#f21c1c]" />
                <span className="relative z-10">Initialize Access</span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
