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
      if (!response.ok) throw new Error("Backend API Failed");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setScenario(data);
    } catch (error) {
      console.error("Failed to generate scenario:", error);
      setTimeout(() => {
        setScenario({
          caseTitle: "State vs Simulated Participant (Offline)",
          caseNumber: "CR-202X-00" + Math.floor(Math.random() * 99),
          court: "Virtual Court (Offline Mode)",
          accusedName: "John Doe (Simulated)",
          victimName: "Jane Smith (Simulated)",
          sections: "Relevant Sections of " + selectedLaw,
          summary: "[OFFLINE FALLBACK]: The AI API is currently unreachable. This is a simulated offline scenario. The accused is formally charged under the legal domain of " + selectedLaw + " pending further investigation.",
          prosecution: "The prosecution argues that the provided evidence clearly establishes fault beyond a reasonable doubt, relying on circumstantial factors.",
          defense: "The defense vehemently opposes the charges, citing lack of direct evidence and procedural irregularities.",
          keyEvidence: "- Exhibit A: Cyber logs\n- Exhibit B: Witness testimony\n- Exhibit C: Forensic report",
          charges: "Multiple simulated charges under " + selectedLaw,
        });
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Controls */}
      <div className="bg-black/40 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 flex flex-col sm:flex-row gap-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)]">
        <div className="flex-1 space-y-2">
           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Legal Domain</label>
           <select
             value={selectedLaw}
             onChange={(e) => setSelectedLaw(e.target.value)}
             className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500/40 transition-all font-bold appearance-none cursor-pointer"
           >
             <option value="">Select Indian Law Domain...</option>
             {indianLaws.map((law) => (
               <option key={law} value={law}>{law}</option>
             ))}
           </select>
        </div>
        <div className="flex flex-col justify-end">
          <button
            onClick={generateScenario}
            disabled={loading || !selectedLaw}
            className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-800 disabled:opacity-30 text-white font-black rounded-xl transition-all shadow-[0_0_30px_rgba(242,28,28,0.2)] hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-xs"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                MAPPING...
              </span>
            ) : "⚡ Initialize Judicial Mapping"}
          </button>
        </div>
      </div>

      {/* Output */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-black/20 border border-white/5 rounded-3xl p-20 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin shadow-[0_0_20px_rgba(242,28,28,0.1)]" />
            <div className="text-center">
               <p className="text-red-500 text-xs font-black tracking-[0.3em] uppercase animate-pulse">Neural_Drafting_Sequence</p>
               <p className="text-gray-600 text-[10px] mt-2 font-mono uppercase">Local GPU Inference: Llama3-8B</p>
            </div>
          </motion.div>
        )}

        {scenario && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", damping: 20 }}
          >
            {scenario.error ? (
              <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl text-red-400 text-center font-black tracking-widest text-xs">
                {scenario.error}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Case Header */}
                <div className="bg-black/60 backdrop-blur-3xl border border-red-500/15 rounded-3xl p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] -mr-32 -mt-32" />
                  <div className="flex flex-wrap items-start justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded">JUDICIAL_SYSTEM_BNSS</span>
                         <span className="text-[10px] text-gray-500 font-mono italic">{scenario.caseNumber}</span>
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tighter max-w-2xl leading-none uppercase">{scenario.caseTitle}</h2>
                      <div className="flex items-center gap-4 text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><span className="text-red-500">📍</span> {scenario.court}</span>
                      </div>
                    </div>
                    <div className="p-6 bg-black/60 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center min-w-[180px]">
                      <p className="text-[9px] text-[#ecb31c] uppercase tracking-[0.2em] font-black mb-2">Legal_Statutes</p>
                      <p className="text-white font-mono text-xs text-center leading-relaxed">{scenario.sections}</p>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 space-y-6">
                      {/* Case Summary */}
                      <div className="bg-black/40 border border-white/5 rounded-3xl p-8 relative">
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> FACTUAL_NARRATIVE
                        </div>
                        <p className="text-gray-200 text-base leading-8 font-medium italic opacity-90">{scenario.summary}</p>
                      </div>

                      {/* Arguments */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8">
                          <h3 className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-6 flex items-center gap-2">
                            <span className="w-1 h-3 bg-emerald-500" /> Prosecution
                          </h3>
                          <div className="text-slate-300 text-xs leading-7 font-medium whitespace-pre-line">{scenario.prosecution}</div>
                        </div>
                        <div className="bg-[#ecb31c]/5 border border-[#ecb31c]/20 rounded-3xl p-8">
                          <h3 className="text-[10px] text-[#ecb31c] uppercase tracking-widest font-black mb-6 flex items-center gap-2">
                            <span className="w-1 h-3 bg-[#ecb31c]" /> Defense
                          </h3>
                          <div className="text-gray-300 text-xs leading-7 font-medium whitespace-pre-line">{scenario.defense}</div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      {/* Parties Vertical */}
                      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 space-y-6">
                        <div>
                          <p className="text-[9px] text-orange-400 uppercase tracking-widest font-black mb-2 opacity-60">Prime_Accused</p>
                          <p className="text-lg font-black text-white tracking-tight leading-none">{scenario.accusedName}</p>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[9px] text-[#00e5ff] uppercase tracking-widest font-black mb-2 opacity-60">Complainant_Party</p>
                          <p className="text-lg font-black text-white tracking-tight leading-none">{scenario.victimName}</p>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2 opacity-60">Status</p>
                          <p className="text-[10px] font-mono text-emerald-400 uppercase">Neural_Mapping_Complete</p>
                        </div>
                      </div>

                      {/* Evidence */}
                      <div className="bg-slate-950/40 border border-[#00e5ff]/10 rounded-3xl p-8 overflow-hidden relative">
                        <h3 className="text-[10px] text-[#00e5ff] uppercase tracking-[0.2em] font-black mb-6">Evidence_Locker</h3>
                        <div className="text-slate-400 text-[11px] leading-6 font-mono whitespace-pre-line">
                           {scenario.keyEvidence}
                        </div>
                      </div>
                   </div>
                </div>

                {/* Formal Charges Full Width */}
                <div className="bg-black/40 border border-red-500/10 rounded-3xl p-8">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4">Drafted_Charges</h3>
                  <p className="text-gray-200 text-xs font-mono border-l-2 border-red-600 pl-6 py-2 leading-relaxed">{scenario.charges}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}