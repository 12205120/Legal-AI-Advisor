"use client";
import React, { useEffect, useState } from "react";

export default function Topbar() {
  const [mounted, setMounted] = useState(false);
  const [nodeId, setNodeId] = useState("");

  useEffect(() => {
    setMounted(true);
    setNodeId(Math.floor(Math.random() * 9000 + 1000).toString());
  }, []);

  if (!mounted) return <div className="h-20 border-b border-white/5 bg-slate-950/20" />;

  return (
    <div className="h-20 flex items-center justify-between px-10 border-b border-red-600/10 bg-black/40 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#f21c1c] font-black tracking-widest">NYAYA_NETWORK</span>
          <span className="text-white/40 text-[9px] font-mono uppercase">Node: {nodeId}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ecb31c] animate-pulse" />
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Engine Status: Optimal</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-black border border-[#ecb31c]/50 flex items-center justify-center text-xs font-bold text-[#f21c1c] shadow-[0_0_15px_rgba(242,28,28,0.2)]">
          JD
        </div>
      </div>
    </div>
  );
}