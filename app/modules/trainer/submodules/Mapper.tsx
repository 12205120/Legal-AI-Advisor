"use client";
import { useState } from "react";
import { logAction } from "../../../lib/history_store";

interface MappingData {
  ipcSection: string;
  bnsSection: string;
  crimeName: string;
  punishment: string;
  difference: string;
  error?: string;
}

export default function Mapper() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingResult, setMappingResult] = useState<MappingData | null>(null);

  const handleMapLaw = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setMappingResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/map_law`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Backend API Failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMappingResult(data);
      logAction("Learning", "Mapped law: " + query);
    } catch (error) {
      console.warn("Backend error:", error instanceof Error ? error.message : "Unknown error");
      setTimeout(() => {
        const fakeIpc = query.match(/\d+/) ? query.match(/\d+/)?.[0] : "???";
        setMappingResult({
          ipcSection: "IPC " + fakeIpc,
          bnsSection: "BNS " + (parseInt(fakeIpc || "101") - 20),
          crimeName: "Simulated Offense for " + query,
          punishment: "Simulated punishment up to 3 years or fine.",
          difference: "The BNS consolidates several IPC clauses to streamline prosecution. This response is generated locally due to the AI API being unreachable."
        });
        logAction("Learning", "Mapped law using local engine: " + query);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-red-600/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(242,28,28,0.15)] transition-all duration-500">
      
      {/* Header section */}
      <div className="mb-8 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-600 to-yellow-600 tracking-widest uppercase flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          IPC to BNS Neural Mapper
        </h2>
        <p className="text-white/60 text-sm mt-2">Instantly translate legacy Indian Penal Code sections to the new Bharatiya Nyaya Sanhita equivalents with AI precision.</p>
      </div>

      {/* Input section */}
      <div className="flex gap-4 mb-10">
        <div className="relative flex-1 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-yellow-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <input
            type="text"
            placeholder="Enter IPC section or crime (e.g., 'IPC 302' or 'Theft')"
            className="relative w-full p-4 bg-black/80 border border-red-600/30 rounded-xl text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono placeholder:text-gray-600"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMapLaw()}
          />
        </div>
        
        <button
          onClick={handleMapLaw}
          disabled={loading}
          className="relative group overflow-hidden rounded-xl p-[1px] w-40 flex-shrink-0 active:scale-95 transition-transform"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-yellow-600 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
          <div className="relative h-full flex items-center justify-center bg-black px-4 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
            <span className="text-white font-semibold flex items-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Map Law
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </span>
          </div>
        </button>
      </div>

      {/* Results grid */}
      {mappingResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {mappingResult.error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-center">
              SYSTEM ERROR: {mappingResult.error}
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Top summary card */}
              <div className="p-6 bg-gradient-to-br from-red-900/10 to-red-600/10 border border-red-600/20 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2" />
                  </svg>
                </div>
                
                <p className="text-[#ecb31c] text-sm font-semibold tracking-wider uppercase mb-1">Identified Offense</p>
                <h3 className="text-3xl font-bold text-white mb-2">{mappingResult.crimeName}</h3>
                <p className="text-white/70">{mappingResult.punishment}</p>
              </div>

              {/* Comparative mapping cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                
                {/* Visual connector line for large screens */}
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 border-t-2 border-dashed border-white/20 z-0"></div>
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border border-white/20 items-center justify-center z-10 text-white/50">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                {/* Legacy IPC Card */}
                <div className="p-6 bg-black/40 border border-white/10 rounded-2xl relative">
                  <div className="absolute top-4 right-4 text-xs font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">LEGACY ID</div>
                  <p className="text-gray-500 text-sm font-semibold tracking-wider uppercase mb-2">Indian Penal Code</p>
                  <div className="text-4xl font-mono text-gray-400">{mappingResult.ipcSection}</div>
                </div>

                {/* Modern BNS Card */}
                <div className="p-6 bg-red-950/20 border border-red-600/40 rounded-2xl relative shadow-[0_0_30px_rgba(242,28,28,0.1)]">
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-red-600 to-yellow-600 rounded-r-2xl"></div>
                  <div className="absolute top-4 right-6 text-xs font-bold text-yellow-500 bg-yellow-600/10 border border-yellow-600/20 px-2 py-1 rounded animate-pulse">ACTIVE ID</div>
                  <p className="text-red-500 text-sm font-semibold tracking-wider uppercase mb-2">Bharatiya Nyaya Sanhita</p>
                  <div className="text-4xl font-mono text-white">{mappingResult.bnsSection}</div>
                </div>
              </div>

              {/* Analysis/Difference Section */}
              <div className="mt-6 p-6 bg-black/80 border border-yellow-600/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1.5 bg-yellow-600/20 rounded-md">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-red-500">Constitutional Modification Analysis</h4>
                </div>
                <p className="text-white/80 leading-relaxed text-sm">
                  {mappingResult.difference}
                </p>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
