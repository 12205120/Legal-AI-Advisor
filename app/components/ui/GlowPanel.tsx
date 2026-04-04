import React from "react";

export default function GlowPanel({
  children,
  color = "cyan",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative bg-black/40 backdrop-blur-xl border border-${color}-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,255,0.1)] ${className}`}
    >
      {children}
    </div>
  );
}
