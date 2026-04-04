import React from "react";

export default function HologramCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative bg-cyan-500/5 backdrop-blur-2xl border border-cyan-500/20 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,255,255,0.1)] overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-500/5 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
