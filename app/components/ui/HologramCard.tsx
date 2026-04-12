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
      className={`relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] group hover:border-[#00e5ff]/30 transition-all duration-500 ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#00e5ff]/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <div className="w-16 h-1 bg-[#00e5ff]/50 rounded-full" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
