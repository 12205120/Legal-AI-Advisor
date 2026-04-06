"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AnimatedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none perspective-[1200px]">
      {/* Dynamic 3D Layered Wave Distortions */}
      <motion.div
        animate={{
          rotateX: [60, 65, 60],
          rotateZ: [0, 5, 0, -5, 0],
          y: [-50, -100, -50],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[200vw] h-[200vh] -left-[50vw] -top-[50vh]"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0, 234, 255, 0.1) 40px, rgba(0, 234, 255, 0.1) 42px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(176, 38, 255, 0.1) 40px, rgba(176, 38, 255, 0.1) 42px)",
          transformOrigin: "center 70%",
          boxShadow: "inset 0 0 400px #000",
        }}
      />
      
      {/* Floating 3D Glowing Orbs / Geometric Solids */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -300 - Math.random() * 200, 0],
            rotateX: [0, 360],
            rotateY: [0, 360],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
          className="absolute rounded-full mix-blend-screen"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            width: `${100 + Math.random() * 200}px`,
            height: `${100 + Math.random() * 200}px`,
            background: `radial-gradient(circle, ${i % 2 === 0 ? "rgba(0,255,255,0.4)" : "rgba(157,0,255,0.4)"} 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
        />
      ))}

      {/* Graphical Data Flow Lines */}
      <motion.div
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(135deg, transparent 40%, rgba(57, 255, 20, 0.3) 50%, transparent 60%)",
          backgroundSize: "200% 200%",
        }}
      />
    </div>
  );
}