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
      className={`relative bg-slate-950/20 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all hover:bg-slate-900/30 ${className}`}
    >
      <div className={`absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-${color}-500/40 to-transparent`} />
      {children}
    </div>
  );
}
