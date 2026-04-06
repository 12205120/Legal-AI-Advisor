"use client";
import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export default function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Generate 40 unique particles
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    xStart: Math.random() * 100,
    yStart: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    color: i % 3 === 0 ? "#00eaff" : i % 3 === 1 ? "#b026ff" : "#39ff14",
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden perspective-[800px] z-0">
      {/* Dense vibrant volumetric glow clusters */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-[800px] h-[800px] bg-[#00eaff]/20 rounded-full blur-[150px] absolute -top-[200px] -left-[200px] mix-blend-screen"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="w-[1000px] h-[1000px] bg-[#b026ff]/20 rounded-full blur-[200px] absolute -bottom-[300px] -right-[300px] mix-blend-screen"
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