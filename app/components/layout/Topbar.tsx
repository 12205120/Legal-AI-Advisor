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
    <div className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#00e5ff] font-black tracking-widest">NYAYA_NETWORK</span>
          <span className="text-white/40 text-[9px] font-mono uppercase">Node: {nodeId}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Engine Status: Optimal</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.1)]">
          JD
        </div>
      </div>
    </div>
  );
}