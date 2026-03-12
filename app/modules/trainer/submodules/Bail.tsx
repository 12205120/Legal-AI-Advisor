"use client";
import { useState } from "react";
import jsPDF from "jspdf";

interface BailData {
  bailType: string;
  reason: string;
  draftTemplate: string;
  error?: string;
}

export default function Bail() {
  const [caseDescription, setCaseDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [bailResult, setBailResult] = useState<BailData | null>(null);
  const [draftContent, setDraftContent] = useState("");

  const handleSuggestBail = async () => {
    if (!caseDescription.trim()) return;
    
    setLoading(true);
    setBailResult(null);
    setDraftContent("");

    try {
      const res = await fetch("http://127.0.0.1:8000/suggest_bail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_description: caseDescription }),
      });
      const data = await res.json();
      setBailResult(data);
      if (data.draftTemplate) {
        setDraftContent(data.draftTemplate);
      }
    } catch (error) {
      console.error(error);
      setBailResult({ error: "Failed to connect to Neural Engine for bail suggestion." } as any);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const maxLineWidth = 180;
    const fontSize = 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    
    const textLines = doc.splitTextToSize(draftContent, maxLineWidth);
    
    let y = margin;
    for (let i = 0; i < textLines.length; i++) {
        if (y > 280) { // Check if we need a new page
            doc.addPage();
            y = margin;
        }
        doc.text(textLines[i], margin, y);
        y += (fontSize * 1.5) / doc.internal.scaleFactor; // Add line height
    }
    
    doc.save("Bail_Application_Draft.pdf");
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all duration-500">
      
      {/* Header section */}
      <div className="mb-8 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 tracking-widest uppercase flex items-center gap-3">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Automated Bail Drafting System
        </h2>
        <p className="text-white/60 text-sm mt-2">Submit case parameters for AI analysis. System will recommend optimal bail strategy and generate an editable legal draft.</p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-10">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <textarea
            rows={4}
            placeholder="Enter full case details, charges (IPC/BNS), and circumstances..."
            className="relative w-full p-4 bg-gray-900/80 border border-emerald-500/30 rounded-xl text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono resize-none"
            value={caseDescription}
            onChange={(e) => setCaseDescription(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleSuggestBail}
            disabled={loading}
            className="relative group overflow-hidden rounded-xl p-[1px] w-48"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
            <div className="relative h-full flex items-center justify-center bg-black px-6 py-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
              <span className="text-white font-semibold flex items-center gap-2 tracking-wider">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    Request Bail
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {bailResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
          {bailResult.error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-center">
              SYSTEM ERROR: {bailResult.error}
            </div>
          ) : (
            <>
              {/* Judicial Recommendation */}
              <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-start">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-teal-600"></div>
                
                <div className="md:w-1/3 flex-shrink-0">
                  <div className="inline-flex px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase rounded mb-3">
                    Recommended Action
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-white">{bailResult.bailType}</h3>
                </div>
                
                <div className="md:w-2/3 pl-0 md:pl-6 md:border-l border-white/10">
                  <h4 className="text-sm text-teal-300 uppercase tracking-widest font-semibold mb-2">Legal Rationale</h4>
                  <p className="text-white/80 leading-relaxed text-sm md:text-base">
                    {bailResult.reason}
                  </p>
                </div>
              </div>

              {/* Editable Draft Area */}
              <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-2xl relative">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Generated Draft Editor
                  </h4>
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export PDF
                  </button>
                </div>

                <textarea
                  className="w-full h-96 p-4 bg-black/60 border border-white/10 rounded-xl text-white/90 font-mono text-sm leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-y"
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
