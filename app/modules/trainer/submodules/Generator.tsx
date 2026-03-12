"use client";
import { useState } from "react";

const indianLaws = [
  "Indian Penal Code (IPC)",
  "Code of Criminal Procedure (CrPC)",
  "Indian Contract Act",
  "Constitution of India",
  "Companies Act",
  "Cyber Law (IT Act)",
];

export default function Generator() {
  const [selectedLaw, setSelectedLaw] = useState("");
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);

  const generateScenario = async () => {
    if (!selectedLaw) return;

    setLoading(true);
    setScenario("");

    try {
      const response = await fetch("http://127.0.0.1:8000/generate_scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ law: selectedLaw }),
      });
      const data = await response.json();
      setScenario(data.scenario);
    } catch (error) {
      console.error("Failed to generate scenario:", error);
      setScenario("Failed to connect to the backend AI engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      
      {/* Selection Panel */}
      <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl text-cyan-400 mb-6 tracking-widest">
          Law Selection Engine
        </h2>

        <select
          value={selectedLaw}
          onChange={(e) => setSelectedLaw(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-cyan-400 transition"
        >
          <option value="">Select Indian Law</option>
          {indianLaws.map((law) => (
            <option key={law} value={law}>
              {law}
            </option>
          ))}
        </select>

        <button
          onClick={generateScenario}
          className="mt-6 w-full py-3 bg-purple-500/20 border border-purple-400 rounded-xl hover:bg-purple-500/30 transition shadow-lg shadow-purple-500/20"
        >
          {loading ? "Generating..." : "Generate Scenario"}
        </button>
      </div>

      {/* Output Panel */}
      <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl text-purple-400 mb-6 tracking-widest">
          AI Scenario Output
        </h2>

        {!scenario && !loading && (
          <div className="text-white/40 italic">
            Awaiting law selection...
          </div>
        )}

        {loading && (
          <div className="animate-pulse text-cyan-300">
            AI forging legal scenario...
          </div>
        )}

        {scenario && (
          <div className="p-4 bg-black/40 border border-cyan-500/30 rounded-xl text-white/80 leading-relaxed">
            {scenario}
          </div>
        )}
      </div>
    </div>
  );
}