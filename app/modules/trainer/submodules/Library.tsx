"use client";
import { useState } from "react";

export default function Library() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");

  const handleSearch = async () => {
    if (!query) return;
    
    setResult("Searching Judicial AI Library...");
    try {
      const res = await fetch(`http://127.0.0.1:8000/library/${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data.content || "No results found for your query.");
    } catch (error) {
       console.error(error);
       setResult("Unable to connect to the Digital Library.");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* Search Panel */}
      <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
        <h2 className="text-xl text-cyan-400 mb-4 tracking-widest">
          Judicial AI Library
        </h2>

        <input
          type="text"
          placeholder="Search any Indian Law..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 bg-black/40 border border-white/10 rounded-xl focus:border-cyan-400 outline-none"
        />

        <button
          onClick={handleSearch}
          className="mt-4 px-6 py-2 bg-cyan-500/20 border border-cyan-400 rounded-xl hover:bg-cyan-500/30 transition"
        >
          Search
        </button>

        {result && (
          <div className="mt-6 p-4 bg-black/40 border border-purple-500/30 rounded-xl text-white/80">
            {result}
          </div>
        )}
      </div>

      {/* State Visual Panel */}
      <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <h2 className="text-lg text-purple-400 mb-4">
          State Interpretation Graph
        </h2>

        <div className="space-y-4">
          {[
            { state: "Delhi", value: 80 },
            { state: "Maharashtra", value: 65 },
            { state: "Karnataka", value: 50 },
            { state: "Tamil Nadu", value: 70 },
          ].map((item) => (
            <div key={item.state}>
              <div className="text-sm text-white/70 mb-1">
                {item.state}
              </div>
              <div className="w-full bg-black/30 rounded-full h-3">
                <div
                  className="bg-cyan-400 h-3 rounded-full"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}