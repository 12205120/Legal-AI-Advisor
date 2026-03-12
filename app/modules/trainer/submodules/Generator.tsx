"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const indianLaws = [
  "Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS)",
  "Code of Criminal Procedure (CrPC) / BNSS",
  "Indian Contract Act",
  "Constitution of India",
  "Companies Act",
  "Cyber Law (IT Act)",
  "Family Law (Hindu Marriage Act)",
  "Negotiable Instruments Act",
  "Prevention of Corruption Act",
];

interface ScenarioData {
  caseTitle?: string;
  caseNumber?: string;
  court?: string;
  accusedName?: string;
  victimName?: string;
  sections?: string;
  summary?: string;
  prosecution?: string;
  defense?: string;
  keyEvidence?: string;
  charges?: string;
  error?: string;
}

export default function Generator() {
  const [selectedLaw, setSelectedLaw] = useState("");
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateScenario = async () => {
    if (!selectedLaw) return;
    setLoading(true);
    setScenario(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/generate_scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ law: selectedLaw }),
      });
      const data = await response.json();
      setScenario(data);
    } catch (error) {
      console.error("Failed to generate scenario:", error);
      setScenario({ error: "Failed to connect to the backend AI engine." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 flex flex-col sm:flex-row gap-4">
        <select
          value={selectedLaw}
          onChange={(e) => setSelectedLaw(e.target.value)}
          className="flex-1 bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-400 transition"
        >
          <option value="">Select Indian Law Domain...</option>
          {indianLaws.map((law) => (
            <option key={law} value={law}>{law}</option>
          ))}
        </select>
        <button
          onClick={generateScenario}
          disabled={loading || !selectedLaw}
          className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : "⚡ Generate Case"}
        </button>
      </div>

      {/* Output */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-black/30 border border-cyan-500/20 rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-cyan-400/60 text-sm tracking-widest uppercase animate-pulse">AI Drafting Case Files...</p>
          </motion.div>
        )}

        {scenario && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {scenario.error ? (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center">
                {scenario.error}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Case Header */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-500/30 rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1">Case File</p>
                      <h2 className="text-2xl font-bold text-white">{scenario.caseTitle}</h2>
                      <p className="text-white/50 text-sm mt-1">{scenario.caseNumber} · {scenario.court}</p>
                    </div>
                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Charges Under</p>
                      <p className="text-red-300 font-mono text-sm">{scenario.sections}</p>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1">Accused</p>
                    <p className="text-white font-semibold">{scenario.accusedName}</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1">Victim / Complainant</p>
                    <p className="text-white font-semibold">{scenario.victimName}</p>
                  </div>
                </div>

                {/* Case Summary */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                  <h3 className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2">Case Summary</h3>
                  <p className="text-white/80 leading-relaxed font-serif">{scenario.summary}</p>
                </div>

                {/* Formal Charges */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                  <h3 className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2">Formal Charges</h3>
                  <p className="text-white/80 leading-relaxed">{scenario.charges}</p>
                </div>

                {/* Arguments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5">
                    <h3 className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">⚔ Prosecution Arguments</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{scenario.prosecution}</p>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-5">
                    <h3 className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">🛡 Defense Arguments</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{scenario.defense}</p>
                  </div>
                </div>

                {/* Key Evidence */}
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">🔍 Key Evidence</h3>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{scenario.keyEvidence}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}