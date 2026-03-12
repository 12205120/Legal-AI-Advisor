"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LandmarkCase {
  name: string;
  ruling: string;
}

interface LibraryData {
  title?: string;
  overview?: string;
  keyProvisions?: string[];
  relevantSections?: string;
  landmarkCases?: LandmarkCase[];
  practicalImplication?: string;
  recentAmendments?: string;
  error?: string;
}

const quickTopics = [
  "Right to Bail in India",
  "Article 21 Right to Life",
  "IPC Section 302 Murder",
  "Cybercrime under IT Act",
  "Domestic Violence Act",
  "POCSO Act",
  "GST and Tax Laws",
  "Intellectual Property Rights",
  "Consumer Protection Act",
  "Insolvency and Bankruptcy Code",
];

export default function Library() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/library_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ error: "Unable to connect to the AI Legal Library." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-black/40 border border-cyan-500/20 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cyan-400 tracking-widest uppercase mb-4">
          📚 AI Legal Knowledge Library
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search any Indian law, act, right, or legal concept..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 p-4 bg-black/60 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Search"}
          </button>
        </div>

        {/* Quick Topics */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quickTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleSearch(topic)}
              className="px-3 py-1.5 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 rounded-lg text-white/60 hover:text-cyan-300 text-xs transition-all"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-black/30 border border-cyan-500/20 rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-cyan-400/60 text-sm tracking-widest uppercase animate-pulse">Consulting Legal Archives...</p>
          </motion.div>
        )}

        {/* Result */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            {result.error ? (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center">
                {result.error}
              </div>
            ) : (
              <>
                {/* Title & Overview */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 rounded-2xl p-6">
                  <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1">Legal Article</p>
                  <h2 className="text-2xl font-bold text-white mb-3">{result.title}</h2>
                  <p className="text-white/70 leading-relaxed font-serif">{result.overview}</p>
                  {result.relevantSections && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">Sections:</span>
                      <span className="text-cyan-300 text-sm font-mono">{result.relevantSections}</span>
                    </div>
                  )}
                </div>

                {/* Key Provisions */}
                {result.keyProvisions && (
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-4">Key Provisions</h3>
                    <ul className="space-y-2">
                      {result.keyProvisions.map((p, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] flex items-center justify-center font-bold mt-0.5">
                            {i + 1}
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Landmark Cases */}
                {result.landmarkCases && result.landmarkCases.length > 0 && (
                  <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-[10px] text-purple-400 uppercase tracking-widest font-bold mb-4">⚖ Landmark Cases</h3>
                    <div className="space-y-3">
                      {result.landmarkCases.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                          <div className="flex-shrink-0 text-purple-400 mt-0.5">📋</div>
                          <div>
                            <p className="text-purple-300 font-semibold text-sm">{c.name}</p>
                            <p className="text-white/60 text-xs mt-0.5">{c.ruling}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical Implication */}
                {result.practicalImplication && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5">
                    <h3 className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">💡 Practical Implication</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{result.practicalImplication}</p>
                  </div>
                )}

                {/* Recent Amendments */}
                {result.recentAmendments && (
                  <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-5">
                    <h3 className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-2">🔄 Recent Amendments</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{result.recentAmendments}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}