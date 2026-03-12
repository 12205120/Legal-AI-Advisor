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
      const res = await fetch("http://127.0.0.1:8000/logic_solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: input }),
      });
      const data = await res.json();
      setResponse(data.analysis || "No analysis available.");
    } catch (error) {
      console.error(error);
      setResponse("AI system temporarily unavailable. Check connection.");
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
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="col-span-2 relative bg-white/5 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,255,255,0.15)]"
      >
        <h2 className="text-2xl text-cyan-300 mb-6 tracking-widest">
          ⚖ Case Logic Analyzer
        </h2>

        <textarea
          placeholder="Describe your case scenario here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-44 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-400 transition-all"
        />

        <div className="flex gap-4 mt-5">
          <button
            onClick={startListening}
            className="px-5 py-2 bg-purple-500/20 border border-purple-400 rounded-xl hover:bg-purple-500/30 transition shadow-lg shadow-purple-500/20"
          >
            {listening ? "🎙 Listening..." : "🎙 Speak Case"}
          </button>

          <button
            onClick={handleSolve}
            className="px-6 py-2 bg-cyan-500/20 border border-cyan-400 rounded-xl hover:bg-cyan-500/30 transition shadow-lg shadow-cyan-500/20"
          >
            Analyze Case
          </button>
        </div>

        {/* AI RESPONSE */}
        {response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-8 p-5 bg-black/40 border border-purple-400/30 rounded-2xl text-white/80 shadow-inner"
          >
            <TypingText text={response} />
          </motion.div>
        )}
      </motion.div>

      {/* =========================
         RIGHT PANEL – FACTS
      ========================= */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-white/5 backdrop-blur-2xl border border-purple-400/20 rounded-3xl p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
      >
        <h2 className="text-xl text-purple-300 mb-6 tracking-widest">
          📚 Legal Knowledge Matrix
        </h2>

        <ul className="space-y-4 text-sm text-white/70">
          <li>⚖ Article 14 – Equality before law</li>
          <li>🛡 Article 21 – Right to life & liberty</li>
          <li>🧠 Mens Rea – Guilty intention</li>
          <li>📜 Natural Justice Principles</li>
          <li>📌 Burden of Proof on prosecution</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}