"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileModule() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isHitting, setIsHitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Handle the Gavel Hit
  const handleGavelHit = () => {
    setIsHitting(true);
    setTimeout(() => {
      setShowForm(true);
    }, 400); // Timing of the "Blast"
  };

  return (
    <div className="relative min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!isAuthorized ? (
          <motion.div 
            key="login-gate"
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full flex flex-col lg:flex-row items-center justify-around gap-10"
          >
            {/* LEFT: THE GAVEL ANIMATION */}
            <div className="relative flex flex-col items-center">
              <motion.div
                animate={isHitting ? { rotate: [0, -45, 0] } : { rotate: 0 }}
                transition={{ duration: 0.4, ease: "easeIn" }}
                onAnimationComplete={() => isHitting && console.log("Impact!")}
                className="cursor-pointer"
                onClick={handleGavelHit}
              >
                <div className="text-8xl filter drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">🔨</div>
              </motion.div>
              <div className="w-32 h-4 bg-slate-800 rounded-full mt-2 shadow-inner" />
              <p className="mt-4 text-cyan-400 font-bold tracking-[0.3em] animate-pulse">
                STRIKE TO ENTER COURT
              </p>
            </div>

            {/* RIGHT: THE LION CAPITAL / FORM BLAST */}
            <div className="relative w-[400px] h-[400px] flex items-center justify-center">
              {!showForm ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isHitting ? { 
                    scale: [1, 1.5, 1.2], 
                    filter: ["grayscale(1)", "grayscale(0)", "brightness(2)"],
                    opacity: 1 
                  } : { opacity: 0.5, scale: 1 }}
                  className="text-9xl opacity-20"
                >
                  🦁 {/* Representing the Lion Capital */}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, filter: "blur(20px)", scale: 0 }}
                  animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                  className="bg-white/5 backdrop-blur-3xl border border-cyan-500/30 p-8 rounded-[40px] w-full shadow-[0_0_100px_rgba(6,182,212,0.2)]"
                >
                  <h2 className="text-2xl text-white font-bold mb-6 tracking-widest text-center">AUTHENTICATION</h2>
                  <div className="space-y-4">
                    <input type="text" placeholder="JUDICIAL ID" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-cyan-400" />
                    <input type="password" placeholder="PASSCODE" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-cyan-400" />
                    <button 
                      onClick={() => setIsAuthorized(true)}
                      className="w-full py-4 bg-cyan-500 text-black font-black rounded-2xl hover:bg-white transition-colors"
                    >
                      LOGIN TO SYSTEM
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ADVANCED PROFILE SECTION */
          <motion.div 
            key="profile-dashboard"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 p-6"
          >
            {/* User Bio Card */}
            <div className="bg-slate-900/50 border border-white/10 p-8 rounded-[40px] flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-4 border-cyan-400 p-1 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-4xl">👤</div>
              </div>
              <h3 className="text-xl font-bold text-white tracking-widest">ADV. MASTER</h3>
              <p className="text-cyan-400/60 text-xs">Senior Counsel • Supreme Court</p>
              
              <div className="mt-8 w-full space-y-2">
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>SYSTEM REPUTATION</span>
                  <span>98%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "98%" }} className="h-full bg-cyan-400" />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {[
                { label: "Cases Won", val: "142", color: "text-green-400" },
                { label: "Legal Accuracy", val: "99.2%", color: "text-cyan-400" },
                { label: "AI Debate Rank", val: "#04", color: "text-purple-400" },
                { label: "Hours Logged", val: "1,240", color: "text-orange-400" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-[30px] flex flex-col justify-center">
                  <span className="text-white/40 text-[10px] uppercase tracking-tighter">{stat.label}</span>
                  <span className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
              
              {/* Activity Map (Placeholder) */}
              <div className="col-span-2 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 p-6 rounded-[30px] h-32">
                 <h4 className="text-[10px] text-white/60 mb-2 uppercase">Neural Connectivity Activity</h4>
                 <div className="flex items-end gap-1 h-12">
                   {[...Array(20)].map((_, i) => (
                     <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
                   ))}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}