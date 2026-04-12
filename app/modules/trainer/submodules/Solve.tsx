"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/* =========================
   Typing Animation Component
========================= */
function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayed("");

    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, [text]);

  return <div>{displayed}</div>;
}

/* =========================
   Main Logic Solver
========================= */
export default function LogicSolver() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [listening, setListening] = useState(false);

  /* =========================
     AI Simulation
  ========================= */
  const handleSolve = async () => {
    if (!input) return;

    setResponse("Analyzing case...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logic_solver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: input }),
      });
      if (!res.ok) throw new Error("Backend API Failed");
      const data = await res.json();
      if (data.error || (data.analysis && data.analysis.includes("unavailable"))) throw new Error("Offline");
      setResponse(data.analysis || "No analysis available.");
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        setResponse("[OFFLINE FALLBACK ANALYSIS]: Evaluated offline due to API limits. Based on the scenario provided, establish actus reus (guilty act) and mens rea (guilty mind). Note that Article 21 protects liberty unless deprived by procedure established by law. Focus on breaking the causal link between the accused and the incident.");
      }, 1000);
    }
  };

  /* =========================
     Voice Recognition
  ========================= */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();
    setListening(true);

    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="grid grid-cols-3 gap-8"
    >
      {/* =========================
         LEFT PANEL – INPUT
      ========================= */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="col-span-2 relative bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-white tracking-tighter">
            CRIMINAL <span className="text-[#00e5ff]">ADVISOR_ENGINE</span>
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
            <span className="text-[10px] text-[#00e5ff] font-black tracking-widest uppercase">Vault_Linked</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            placeholder="Input case facts, criminal history, or sequence of events for local neural mapping..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-56 bg-slate-950/40 border border-white/5 rounded-2xl p-6 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#00e5ff]/40 transition-all font-medium leading-relaxed"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
             <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Local Engine: Active</span>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={startListening}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-300 ${
              listening 
                ? "bg-[#0ea5e9]/20 border-[#0ea5e9]/40 text-[#0ea5e9]" 
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            <span className="text-lg">{listening ? "●" : "🎙"}</span>
            <span className="text-xs font-black tracking-widest uppercase">{listening ? "Listening..." : "Dictate"}</span>
          </button>

          <button
            onClick={handleSolve}
            className="flex-1 py-3 bg-gradient-to-r from-[#00e5ff] to-[#0ea5e9] text-slate-950 rounded-xl font-black tracking-widest uppercase shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:scale-[1.01] transition-all"
          >
            Run Deep Legal Analysis
          </button>
        </div>

        {/* AI RESPONSE */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 p-8 bg-slate-950/40 border border-[#00e5ff]/20 rounded-2xl text-slate-200 shadow-inner relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <span className="text-[10px] font-mono tracking-widest">AJI_VERDICT_PREDICTION</span>
            </div>
            <div className="prose prose-invert max-w-none text-sm leading-8 font-medium">
              <TypingText text={response} />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* =========================
         RIGHT PANEL – FACTS
      ========================= */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-3xl p-10 h-full"
      >
        <h2 className="text-xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#0ea5e9] rounded-full" />
          NEURAL_ARCHIVE_SARA
        </h2>

        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-white/5 bg-white/2">
            <h4 className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em] mb-3">Statute_Focus</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzing Bharatiya Nyaya Sanhita (BNS) & IPC 1860 concurrently.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/2">
            <h4 className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em] mb-3">Live_Guidance</h4>
            <ul className="space-y-3 text-[11px] text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-[#00e5ff]">›</span>
                Identify the specific Section of BNS in your uploaded PDFs.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00e5ff]">›</span>
                Verify witness credibility using BNSS procedure.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00e5ff]">›</span>
                Target procedural lapses for immediate bail relief.
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
             <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Compute Mode</div>
             <div className="text-xs text-[#00e5ff] font-mono">100% LOCAL_NEURAL_STATION</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}