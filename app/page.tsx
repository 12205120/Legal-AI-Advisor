"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FuturisticLayout from "./components/layout/FuturisticLayout";
import TrainerModule from "./modules/trainer/TrainerModule";
import Mapper from "./modules/trainer/submodules/Mapper";
import Bail from "./modules/trainer/submodules/Bail";

export default function Home() {
  const [activeTab, setActiveTab] = useState("trainer");

  return (
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
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-cyan-300 tracking-widest">
                ⚖ NYAYA AI – Judicial Intelligence System
              </h1>
              <p className="text-white/60 mt-4 max-w-2xl">
                Ultra Futuristic Legal Operating System.
                Train. Debate. Analyze. Simulate Court.
                Powered by Artificial Judicial Intelligence.
              </p>
            </div>
            <TrainerModule />
          </>
        )}
        
        {activeTab === "mapper" && <Mapper />}
        {activeTab === "bail" && <Bail />}
        {activeTab === "profile" && <div className="text-white">Profile Module Coming Soon</div>}
        
      </motion.div>
    </FuturisticLayout>
  );
}