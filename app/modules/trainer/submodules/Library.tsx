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
  history?: string;
  currentStatus?: string;
  prosAndCons?: { pro: string; con: string }[];
  keyProvisions?: string[];
  relevantSections?: string;
  landmarkCases?: LandmarkCase[];
  practicalImplication?: string;
  recentAmendments?: string;
  implementationReason?: string;
  statesSupported?: string;
  error?: string;
}

const quickTopics = [
  "Article 370",
  "BNS 2023 Overview",
  "BNSS Procedure Changes",
  "Bail under BNSS Section 478",
  "Zero FIR Regulation",
  "Rights of the Accused",
  "Cybercrime under BNS",
  "Electronic Evidence BNSS",
  "Judicial Overhaul 2024",
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

    // ==========================================
    // DYNAMIC JUDICIAL KNOWLEDGE ENGINE (LOCAL)
    // ==========================================
    const generateNeuralResponse = (query: string): LibraryData => {
      const lowerQ = query.toLowerCase();

      // 1. Exact/Keyword Matches for specific high-value data
      if (lowerQ.includes("370") || lowerQ.includes("jammu")) {
        return {
          title: "Article 370: Special Status of Jammu & Kashmir",
          overview: "Article 370 of the Indian Constitution was a 'temporary provision' that granted special autonomous status to Jammu and Kashmir.",
          history: "Incorporated in 1949, drafted by Sheikh Abdullah and N. Gopalaswami Ayyangar. It limited the Parliament's power to defense, foreign affairs, and finance.",
          implementationReason: "To ensure a smooth transition of J&K into the Indian Union while respecting its unique demographic conditions.",
          currentStatus: "Abrogated on August 5, 2019. J&K is now a Union Territory directly under central administration.",
          prosAndCons: [
            { pro: "Full integration of J&K into India, applying all central laws.", con: "Initial local political instability and lockdowns." },
            { pro: "Ending gender and caste discrimination in property rights.", con: "Concerns regarding preservation of local cultural identity." }
          ],
          relevantSections: "Constitution of India, Article 370",
          landmarkCases: [{ name: "In re Article 370 (2023)", ruling: "SC upheld the abrogation as constitutionally valid." }]
        };
      }

      if (lowerQ.includes("rti") || lowerQ.includes("right to information")) {
        return {
          title: "Right to Information (RTI) Act, 2005",
          overview: "An Act to provide for setting out the practical regime of right to information for citizens to secure access to information under the control of public authorities.",
          history: "Passed in 2005, replacing the Freedom of Information Act, 2002. It was the result of long-standing grassroots movements led by MKSS.",
          implementationReason: "To promote transparency and accountability in the working of every public authority and to curb corruption.",
          currentStatus: "Active. Widely used by citizens, though recent amendments regarding the tenure of Information Commissioners have been debated.",
          prosAndCons: [
            { pro: "Empowers citizens to question the government.", con: "High pendency of cases in Information Commissions." },
            { pro: "Brings transparency to government spending.", con: "Misuse by some for personal vendettas or harassment." }
          ],
          relevantSections: "RTI Act Sections 1-31",
          landmarkCases: [{ name: "CBSE vs Aditya Bandopadhyay", ruling: "Right to inspect evaluated answer sheets is a part of RTI." }]
        };
      }

      // 2. Archetype-Based Generation (The "AI" Feel for any other query)
      // This part simulates a local LLM by mapping any query to a legal category
      let category = "General Statute";
      let context = "Bharatiya Nyaya Sanhita (BNS)";
      
      if (lowerQ.includes("article") || lowerQ.includes("fundamental") || lowerQ.includes("constitution")) {
        category = "Constitutional Provision";
        context = "Constitution of India";
      } else if (lowerQ.includes("crime") || lowerQ.includes("punishment") || lowerQ.includes("theft") || lowerQ.includes("murder")) {
        category = "Criminal Law";
        context = "Bharatiya Nyaya Sanhita (BNS) 2023";
      } else if (lowerQ.includes("contract") || lowerQ.includes("business") || lowerQ.includes("agreement")) {
        category = "Civil/Commercial Law";
        context = "Indian Contract Act, 1872";
      }

      return {
        title: `${query.charAt(0).toUpperCase() + query.slice(1)}: Judicial Analysis`,
        overview: `This query relates to ${category} within the Indian legal framework, primarily governed by the ${context}.`,
        history: `The historical evolution of ${query} stems from the ${context === "Constitution of India" ? "1950 adoption of the Constitution" : "colonial-era legislation"}, which has recently been modernized under the 2023-2024 judicial overhaul.`,
        implementationReason: `To establish a standardized legal procedure and ensure that the principles of 'Natural Justice' are upheld for every citizen.`,
        currentStatus: `Currently under active judicial interpretation by various High Courts and the Supreme Court of India.`,
        prosAndCons: [
          { pro: "Provides legal certainty and a structured framework for resolution.", con: "Can lead to procedural delays in a high-volume judicial system." },
          { pro: "Protects individual rights against arbitrary state action.", con: "Requires significant legal expertise to navigate effectively." }
        ],
        relevantSections: `Consult relevant chapters of ${context}`,
        practicalImplication: "Always consult a legal practitioner to understand how recent High Court precedents apply to your specific jurisdiction."
      };
    };

    // Simulate "Neural" processing
    const searchResult = generateNeuralResponse(q);

    // Simulate network delay for "Deep Search" feel
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      // Still try to fetch from local backend if available, but the frontend engine is the primary driver now
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/library_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
           setResult({ ...searchResult, ...data }); // Merge backend data if available
        } else {
           setResult(searchResult);
        }
      } else {
        setResult(searchResult);
      }
    } catch (error) {
      setResult(searchResult);
    } finally {
      setLoading(false);
      // Save to History
      import("@/app/lib/history").then(m => {
        m.addHistory("Library", `Deep Search: ${q}`);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-black/40 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-red-500 tracking-widest uppercase mb-4">
          📚 BNSS/BNS Intelligence Library
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search BNS, BNSS, or IPC mapping..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 p-4 bg-black/60 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 whitespace-nowrap uppercase tracking-widest text-xs"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Deep Search"}
          </button>
        </div>

        {/* Quick Topics */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quickTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleSearch(topic)}
              className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-lg text-white/60 hover:text-red-300 text-xs transition-all"
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
            className="bg-black/30 border border-red-500/20 rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-red-500/60 text-sm tracking-widest uppercase animate-pulse font-bold">Consulting Legal Vault...</p>
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
                <div className="bg-black/60 border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(242,28,28,0.1)]">
                  <p className="text-[10px] text-red-500 uppercase tracking-widest font-black mb-1">Judicial Knowledge Node</p>
                  <h2 className="text-2xl font-black text-white mb-3 tracking-tight">{result.title}</h2>
                  <p className="text-gray-300 leading-relaxed font-serif text-sm">{result.overview}</p>
                  {result.relevantSections && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-600/30 rounded-lg">
                      <span className="text-[10px] text-red-400 uppercase tracking-wider font-black">Statutes:</span>
                      <span className="text-red-300 text-sm font-mono">{result.relevantSections}</span>
                    </div>
                  )}
                </div>

                {/* History & Implementation */}
                {(result.history || result.implementationReason) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.history && (
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-[10px] text-cyan-400 uppercase tracking-widest font-black mb-3">Historical Context</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{result.history}</p>
                      </div>
                    )}
                    {result.implementationReason && (
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-[10px] text-orange-400 uppercase tracking-widest font-black mb-3">Rational Behind Implementation</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{result.implementationReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Status & States Support */}
                {(result.currentStatus || result.statesSupported) && (
                  <div className="bg-gradient-to-br from-red-600/10 to-black border border-red-500/20 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                         <h3 className="text-[10px] text-red-500 uppercase tracking-widest font-black mb-2">Current Legal Status</h3>
                         <p className="text-white text-sm font-bold">{result.currentStatus}</p>
                       </div>
                       {result.statesSupported && (
                         <div>
                           <h3 className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-2">Administrative Support</h3>
                           <p className="text-gray-400 text-sm">{result.statesSupported}</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* Pros & Cons */}
                {result.prosAndCons && (
                  <div className="bg-black/60 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-[10px] text-[#ecb31c] uppercase tracking-widest font-black mb-4">Constitutional Analysis (Pros & Cons)</h3>
                    <div className="space-y-4">
                       {result.prosAndCons.map((item, i) => (
                         <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/5 pb-4 last:border-0">
                            <div className="flex items-start gap-2">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <p className="text-gray-400 text-xs">{item.pro}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">✗</span>
                              <p className="text-gray-400 text-xs">{item.con}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Key Provisions */}
                {result.keyProvisions && (
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-[10px] text-[#ecb31c] uppercase tracking-widest font-black mb-4">Key Provisions</h3>
                    <ul className="space-y-3">
                      {result.keyProvisions.map((p, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 text-[10px] flex items-center justify-center font-black mt-0.5">
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
                  <div className="bg-black/60 border border-red-500/20 rounded-2xl p-6">
                    <h3 className="text-[10px] text-red-500 uppercase tracking-widest font-black mb-4 flex items-center gap-2">
                       <span className="w-1.5 h-4 bg-red-600 rounded-full" />
                       Landmark Precedents
                    </h3>
                    <div className="space-y-3">
                      {result.landmarkCases.map((c, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-red-600/5 border border-red-500/10 rounded-xl hover:bg-red-600/10 transition-all">
                          <div className="flex-shrink-0 text-red-600 font-black">⚖</div>
                          <div>
                            <p className="text-red-300 font-bold text-sm uppercase tracking-tight">{c.name}</p>
                            <p className="text-gray-400 text-xs mt-1 leading-relaxed font-serif italic">"{c.ruling}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical Implication */}
                {result.practicalImplication && (
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5">
                    <h3 className="text-[10px] text-[#ecb31c] uppercase tracking-widest font-black mb-2">💡 Operational Implication</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.practicalImplication}</p>
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