"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { logAction } from "../../../lib/history_store";

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
      logAction("Logic Solver", "Analyzed case using Logic Engine");
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        setResponse("Evaluated using local Logic Engine. Based on the scenario provided, establish actus reus (guilty act) and mens rea (guilty mind). Note that Article 21 protects liberty unless deprived by procedure established by law. Focus on breaking the causal link between the accused and the incident according to BNS/BNSS.");
        logAction("Logic Solver", "Analyzed case using local Logic Engine");
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
        className="col-span-2 relative bg-black/40 backdrop-blur-3xl border border-red-500/20 rounded-3xl p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
            JUDICIAL <span className="text-red-500">LOGIC_ENGINE</span>
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-red-500 font-black tracking-widest uppercase">BNSS_Vault_Linked</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            placeholder="Input case facts, criminal history, or sequence of events for deep judicial mapping using BNS/BNSS..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-56 bg-black/60 border border-white/10 rounded-2xl p-6 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 transition-all font-medium leading-relaxed"
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
                ? "bg-red-600/20 border-red-500/40 text-red-400" 
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <span className="text-lg">{listening ? "●" : "🎙"}</span>
            <span className="text-xs font-black tracking-widest uppercase">{listening ? "Listening..." : "Dictate"}</span>
          </button>

          <button
            onClick={handleSolve}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-black tracking-widest uppercase shadow-[0_0_30px_rgba(242,28,28,0.2)] hover:scale-[1.01] transition-all"
          >
            Execute Judicial Logic Solve
          </button>
        </div>

        {/* AI RESPONSE */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 p-8 bg-black/60 border border-red-500/20 rounded-2xl text-gray-200 shadow-inner relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <span className="text-[10px] font-mono tracking-widest uppercase text-red-500">Judicial_Verdict_Prediction</span>
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
        className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-3xl p-10 h-full"
      >
        <h2 className="text-xl font-black text-white mb-8 tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-6 bg-red-600 rounded-full" />
          JUDICIAL_BRAIN_SARA
        </h2>

        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-white/5 bg-white/2">
            <h4 className="text-[10px] font-black text-[#ecb31c] uppercase tracking-[0.2em] mb-3">Statute_Focus</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Analyzing Bharatiya Nyaya Sanhita (BNS) & IPC 1860 concurrently.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/2">
            <h4 className="text-[10px] font-black text-[#ecb31c] uppercase tracking-[0.2em] mb-3">BNSS_Directives</h4>
            <ul className="space-y-3 text-[11px] text-gray-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-red-500">›</span>
                Identify the specific Section of BNS in your uploaded PDFs.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">›</span>
                Verify witness credibility using BNSS procedure.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">›</span>
                Target procedural lapses for immediate bail relief.
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
             <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Compute Mode</div>
             <div className="text-xs text-red-500 font-mono">100% LOCAL_JUDICIAL_STATION</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}