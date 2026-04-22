"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import FuturisticLayout from "./components/layout/FuturisticLayout";
import TrainerModule from "./modules/trainer/TrainerModule";
import Mapper from "./modules/trainer/submodules/Mapper";
import Bail from "./modules/trainer/submodules/Bail";
import ProfileModule from "./modules/profile/ProfileModule";
import AnimatedLoginIntro from "./components/ui/AnimatedLoginIntro";

export default function Home() {
  const [activeTab, setActiveTab] = useState("trainer");
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const hasSession = localStorage.getItem("nyaya_user");
    if (hasSession) {
      setShowIntro(false);
    }
  }, []);

  return (
    <>
      {showIntro && <AnimatedLoginIntro onComplete={() => setShowIntro(false)} />}
      <FuturisticLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full h-full"
      >
        {activeTab === "trainer" && (
          <>
            <div className="mb-14 relative">
              <div className="absolute -left-8 top-0 bottom-0 w-1 bg-[#f21c1c]/40 rounded-full" />
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none mb-4 uppercase">
                JUDICIAL <span className="text-[#f21c1c]">INTELLIGENCE</span>
              </h1>
              <div className="flex items-center gap-4 text-[10px] tracking-[0.3em] font-black text-slate-500 uppercase mb-6">
                <span>Protocol: AI_SARA_v2</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Security: High</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Node: {activeTab.toUpperCase()}</span>
              </div>
              <p className="text-slate-400 max-w-2xl leading-relaxed text-lg font-medium">
                The world's most advanced legal operating system. 
                Full-spectrum case analysis, court simulation, and cross-statute mapping 
                powered by local Neural Compute.
              </p>
            </div>
            <Suspense fallback={<div className="text-red-500/50 animate-pulse text-xs tracking-widest uppercase">Loading Module...</div>}>
              <TrainerModule />
            </Suspense>
          </>
        )}
        
        {activeTab === "mapper" && <Mapper />}
        {activeTab === "bail" && <Bail />}
        {activeTab === "profile" && <ProfileModule />}
        
      </motion.div>
    </FuturisticLayout>
    </>
  );
}