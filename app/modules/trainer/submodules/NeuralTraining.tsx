"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import HologramCard from "../../../components/ui/HologramCard";

export default function NeuralTraining() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    chunks: number;
    documents: string[];
  } | null>(null);
  const [message, setMessage] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/vault_status");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch vault status");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage("Initializing Neural Indexing... (This may take a minute for large files)");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload_training_pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setMessage(data.message);
        fetchStatus();
      } else {
        setMessage("Training failed: " + data.message);
      }
    } catch (e) {
      setMessage("Connection error. Ensure backend is running.");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in">
      <div className="space-y-6">
        <HologramCard className="border-[#00e5ff]/30">
          <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">
            VAKALAT <span className="text-[#00e5ff]">TRAINING CENTER</span>
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Upload Indian legal statutes (BNS, BSA, IPC, CrPC) in PDF format. 
            The Neural Engine will chunk, embed, and map the legal logic into your local vault.
          </p>

          <div className="relative group p-10 border-2 border-dashed border-white/10 rounded-2xl bg-white/2 hover:bg-[#00e5ff]/5 hover:border-[#00e5ff]/40 transition-all duration-500 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-4 text-[#00e5ff]/60 group-hover:scale-110 transition-transform">📄</span>
              <p className="text-slate-300 font-bold tracking-wide">
                {file ? file.name : "Drop BNS/BSA PDF here"}
              </p>
              <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest">
                PDF format only • Max 50MB recommended
              </p>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full mt-6 py-4 rounded-xl font-black tracking-[0.2em] transition-all duration-500 ${
              !file || loading
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-[#00e5ff] to-[#0ea5e9] text-slate-950 shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:scale-[1.02]"
            }`}
          >
            {loading ? "LEARNING_IN_PROGRESS..." : "START_NEURAL_MAPPING"}
          </button>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl text-[11px] font-mono border ${
                message.includes("Successfully") 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-[#00e5ff]/10 border-[#00e5ff]/20 text-slate-300"
              }`}
            >
              <span className="opacity-40 mr-2">{">"}</span> {message}
            </motion.div>
          )}
        </HologramCard>

        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Training Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5">
              <div className="text-[9px] text-slate-500 uppercase mb-1">Total Chunks</div>
              <div className="text-2xl font-black text-[#00e5ff] font-mono">
                {status?.chunks || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5">
              <div className="text-[9px] text-slate-500 uppercase mb-1">Knowledge Density</div>
              <div className="text-2xl font-black text-white font-mono">
                {status?.chunks ? (status.chunks / 50).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-8 rounded-3xl border border-white/5 bg-slate-900/60 backdrop-blur-xl h-full">
          <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            VIRTUAL_LAW_LIBRARY
          </h2>
          
          <div className="space-y-3">
            {status?.documents?.length ? (
              status.documents.map((doc, i) => (
                <div key={i} className="group p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg">⚖️</div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#00e5ff] transition-colors">{doc}</div>
                    <div className="text-[9px] text-slate-500 font-mono">STATUS: INDEXED_OPTIMAL</div>
                  </div>
                  <div className="ml-auto text-[9px] text-[#0ea5e9] font-black">100%</div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <div className="text-4xl mb-4">📭</div>
                <div className="text-xs font-bold uppercase tracking-widest">No legal acts trained yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
