"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      xStart: Math.random() * 100,
      yStart: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10,
      color: i % 3 === 0 ? "#00e5ff" : i % 3 === 1 ? "#0ea5e9" : "#38bdf8",
    }));
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background ambient light */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="w-[800px] h-[800px] bg-[#00e5ff]/15 rounded-full blur-[150px] absolute -top-[200px] -left-[200px] mix-blend-screen"
      />
      <motion.div
        animate={{ opacity: [0.05, 0.2, 0.05] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-[1000px] h-[1000px] bg-[#0ea5e9]/10 rounded-full blur-[200px] absolute -bottom-[300px] -right-[300px] mix-blend-screen"
      />

      {/* 3D Flowing Mathematical Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.xStart}vw`,
            top: `${p.yStart}vh`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}`,
          }}
          animate={{
            x: [0, Math.sin(p.id) * 400, Math.cos(p.id) * -300, 0],
            y: [0, Math.cos(p.id) * 400, Math.sin(p.id) * -300, 0],
            z: [0, Math.random() * 600 - 300, 0], // True 3D depth shifting
            opacity: [0, 1, 1, 0],
            scale: [0, Math.random() * 2 + 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}