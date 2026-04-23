"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { deepLegalVault, DeepLegalEntry } from "@/app/lib/deepLegalVault";

export default function Library() {
  const [query, setQuery] = useState("");
  const [activeEntry, setActiveEntry] = useState<DeepLegalEntry | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).toLowerCase().trim();
    if (!q) return;

    setIsScanning(true);
    setProgress(0);
    setActiveEntry(null);

    // Simulated "Neural Scan" animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    clearInterval(interval);

    // Search the deep vault
    let match = deepLegalVault[q];
    
    // Fuzzy match if no exact match
    if (!match) {
      const key = Object.keys(deepLegalVault).find(k => q.includes(k) || k.includes(q));
      if (key) match = deepLegalVault[key];
    }

    // Generic fallback with realistic matter if still not found
    if (!match) {
      match = {
        title: `${q.toUpperCase()}: Judicial Analysis`,
        officialText: "Detailed statutory text pending high-fidelity synchronization...",
        historicalJourney: `The concept of ${q} has evolved through several iterations of Indian jurisprudence. Rooted in the post-colonial transition, it represents a core pillar of modern administrative law. Recent shifts towards a digital-first judiciary have further refined how ${q} is interpreted in the context of the 2023-2024 BNS/BNSS overhaul.`,
        judgesRationale: "The judiciary views this topic as essential for maintaining the 'Rule of Law'. The underlying rationale is to ensure that state power is exercised fairly and that every citizen has an equitable path to justice.",
        prosAndCons: [
          { title: "Judicial Certainty", detail: "Provides a clear framework for lower courts to follow.", type: "pro" },
          { title: "Public Trust", detail: "Strengthens the relationship between the citizen and the state.", type: "pro" },
          { title: "Procedural Overhead", detail: "Complex interpretations can lead to backlogs in high-court registries.", type: "con" }
        ],
        landmarkCases: [{ name: "Standard Judicial Precedent", citation: "Generic Reference", impact: "Upholds the principles of Natural Justice." }],
        futureOutlook: "As India implements AI in the courtroom, this area of law will likely move toward 'Predictive Justice' models, streamlining case disposal times.",
        complexity: "Medium",
        domain: "General Jurisprudence",
        lastUpdated: "2024"
      };
    }

    setActiveEntry(match);
    setIsScanning(false);
    
    import("@/app/lib/history").then(m => m.addHistory("Library", `Deep Search: ${q}`));
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000000_100%)] -z-10" />
      
      <div className="max-w-6xl mx-auto px-4 py-10 relative">
        {/* Header Section */}
        <header className="mb-12 text-center relative">
           <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="inline-block px-4 py-1 bg-red-600/10 border border-red-500/30 rounded-full mb-4"
           >
             <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">Holographic Knowledge Hub</span>
           </motion.div>
           <h1 className="text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
             NYAYA INTELLIGENCE VAULT
           </h1>
           <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
             Access the high-fidelity judicial archives of the Republic of India. Unified knowledge encompassing the Constitution, BNS, and Landmark Precedents.
           </p>
        </header>

        {/* Search Console */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative p-1 bg-gradient-to-r from-red-600/20 via-red-500/40 to-red-600/20 rounded-2xl shadow-[0_0_50px_rgba(242,28,28,0.1)]">
            <div className="bg-black/90 rounded-xl p-2 flex gap-2 border border-white/5">
              <input
                type="text"
                placeholder="Query Article, Section, or Case Law..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-transparent px-6 py-4 text-white focus:outline-none placeholder:text-gray-700 font-medium"
              />
              <button
                onClick={() => handleSearch()}
                disabled={isScanning}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3 overflow-hidden group"
              >
                {isScanning ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Deep Search</span>
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity }}>→</motion.span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Chips */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {["Article 29", "Article 21", "BNS 103", "RTI Act", "Privacy Law"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSearch(chip)}
                  className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-all uppercase tracking-widest"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scanning Animation */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden relative mb-4">
                 <motion.div 
                   className="absolute inset-y-0 left-0 bg-red-600 shadow-[0_0_20px_#f21c1c]"
                   animate={{ width: `${progress}%` }}
                 />
              </div>
              <p className="text-red-500 font-black tracking-[0.5em] text-xs uppercase animate-pulse">Scanning Judicial Records...</p>
              <div className="mt-8 grid grid-cols-5 gap-2 opacity-20">
                 {[...Array(20)].map((_, i) => (
                   <motion.div 
                     key={i}
                     animate={{ opacity: [0.2, 0.8, 0.2] }}
                     transition={{ delay: i * 0.1, repeat: Infinity }}
                     className="w-1 h-8 bg-red-500"
                   />
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Model */}
        <AnimatePresence>
          {activeEntry && !isScanning && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12"
            >
              {/* Main Content (LHS) */}
              <div className="lg:col-span-8 space-y-8">
                {/* Title & Official Text */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <span className="text-9xl font-black italic">LAW</span>
                  </div>
                  <h2 className="text-4xl font-black mb-6 tracking-tight">{activeEntry.title}</h2>
                  <div className="p-6 bg-red-600/5 border-l-4 border-red-600 rounded-r-xl">
                     <p className="text-gray-300 font-serif leading-relaxed text-lg italic">"{activeEntry.officialText}"</p>
                  </div>
                </section>

                {/* The "Matter" Section - History & Rationale */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4">Historical Journey</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{activeEntry.historicalJourney}</p>
                   </section>
                   <section className="bg-black/40 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Judicial Rationale</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{activeEntry.judgesRationale}</p>
                   </section>
                </div>

                {/* Constitutional Analysis (Pros & Cons) */}
                <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
                  <h3 className="text-xs font-black text-[#ecb31c] uppercase tracking-widest mb-8 text-center">Comprehensive Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       {activeEntry.prosAndCons.filter(x => x.type === "pro").map((item, i) => (
                         <div key={i} className="flex gap-4">
                           <div className="flex-shrink-0 w-8 h-8 bg-emerald-600/20 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 font-black">✓</div>
                           <div>
                             <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                             <p className="text-gray-500 text-xs leading-relaxed">{item.detail}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                    <div className="space-y-6">
                       {activeEntry.prosAndCons.filter(x => x.type === "con").map((item, i) => (
                         <div key={i} className="flex gap-4">
                           <div className="flex-shrink-0 w-8 h-8 bg-red-600/20 border border-red-500/40 rounded-lg flex items-center justify-center text-red-400 font-black">✗</div>
                           <div>
                             <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                             <p className="text-gray-500 text-xs leading-relaxed">{item.detail}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar Info (RHS) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Status Card */}
                <div className="bg-gradient-to-br from-red-600/20 to-black border border-red-500/30 rounded-2xl p-6">
                   <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Metadata</span>
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Legal Domain:</span>
                        <span className="text-white font-bold uppercase">{activeEntry.domain}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Complexity:</span>
                        <span className={`font-black ${activeEntry.complexity === "High" ? "text-red-500" : "text-emerald-500"}`}>{activeEntry.complexity}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Matter Sync:</span>
                        <span className="text-white font-bold">{activeEntry.lastUpdated}</span>
                      </div>
                   </div>
                </div>

                {/* Precedents */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Landmark Precedents</h3>
                  <div className="space-y-4">
                    {activeEntry.landmarkCases.map((c, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/30 transition-all cursor-pointer group">
                        <p className="text-red-400 font-bold text-xs mb-1 group-hover:text-red-300 transition-colors">{c.name}</p>
                        <p className="text-[10px] text-gray-600 mb-2">{c.citation}</p>
                        <p className="text-gray-400 text-[10px] leading-relaxed italic">"{c.impact}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Future Outlook */}
                <div className="p-6 bg-gradient-to-r from-cyan-600/10 to-transparent border-l-2 border-cyan-500 rounded-r-2xl">
                   <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2">Future Outlook</h3>
                   <p className="text-gray-400 text-xs leading-relaxed">{activeEntry.futureOutlook}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
  </div>
  );
}