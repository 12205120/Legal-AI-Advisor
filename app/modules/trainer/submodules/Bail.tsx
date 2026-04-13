"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import { useGesture } from "../../../components/ui/GestureContext";
import { getBailApplications, saveBailApplication, deleteBailApplication, BailApplication } from "../../../lib/bail_store";
import { LegalService } from "../../../lib/legal_service";

interface BailData {
  bailType: string;
  reason: string;
  draftTemplate: string;
  error?: string;
}

const BAIL_GROUNDS = [
  "New Law: BNSS Section 479 (Half-term Served)",
  "New Law: First-time Offender (1/3rd term)",
  "No prior criminal record",
  "Permanent resident of jurisdiction",
  "Health/Medical grounds (Emergency)",
  "Investigation is complete",
  "Willing to surrender passport",
  "Offence is bailable per BNSS Schedule I",
];

export default function Bail() {
  const [tab, setTab] = useState<"new" | "vault">("new");

  // Form fields
  const [applicantName, setApplicantName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [firNumber, setFirNumber] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [charges, setCharges] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [selectedGrounds, setSelectedGrounds] = useState<string[]>([]);

  // Result
  const [loading, setLoading] = useState(false);
  const [bailResult, setBailResult] = useState<BailData | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // Vault
  const [vault, setVault] = useState<BailApplication[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);

  // Gesture Signature System
  const { cursorX, cursorY, isPinching, isActive } = useGesture();
  const [isSigning, setIsSigning] = useState(false);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [placedSignature, setPlacedSignature] = useState<{ x: number; y: number; data: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draftAreaRef = useRef<HTMLDivElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Gesture Drawing Effect
  useEffect(() => {
    if (!isSigning || !isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isPinching) {
      const rect = canvas.getBoundingClientRect();
      const x = cursorX - rect.left;
      const y = cursorY - rect.top;
      if (lastPosRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#10b981"; // Emerald color for signature
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      lastPosRef.current = { x, y };
    } else {
      lastPosRef.current = null;
    }
  }, [cursorX, cursorY, isPinching, isSigning, isActive]);

  // Gesture Placing Effect
  useEffect(() => {
    if (!placingSignature || !isActive) return;
    if (isPinching) {
      const rect = draftAreaRef.current?.getBoundingClientRect();
      if (rect && cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom) {
        setPlacedSignature({
          data: signatureDataUrl!,
          x: cursorX - rect.left,
          y: cursorY - rect.top,
        });
        setPlacingSignature(false);
      }
    }
  }, [isPinching, cursorX, cursorY, placingSignature, signatureDataUrl, isActive]);

  // Fallback Mouse Drawing
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isActive) return; // Gesture has priority
    if (e.buttons !== 1) {
      lastPosRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (lastPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    lastPosRef.current = { x, y };
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL("image/png"));
      setIsSigning(false);
      setPlacingSignature(true);
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureDataUrl(null);
    setPlacedSignature(null);
  };

  const handleDraftClick = (e: React.MouseEvent) => {
    if (!placingSignature || isActive) return; // Ignore if gesture is active
    const rect = e.currentTarget.getBoundingClientRect();
    setPlacedSignature({
      data: signatureDataUrl!,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setPlacingSignature(false);
  };

  useEffect(() => {
    setVault(getBailApplications());
  }, [tab]);

  const toggleGround = (g: string) =>
    setSelectedGrounds((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const handleSuggestBail = async () => {
    if (!caseDescription.trim() || !applicantName.trim() || !idNumber.trim()) return;
    setLoading(true);
    setBailResult(null);
    setDraftContent("");
    setSavedMsg("");

    const groundsText = selectedGrounds.length
      ? `\n\nGrounds for bail: ${selectedGrounds.join(", ")}`
      : "";

    try {
      const data = await LegalService.suggestBail(
        applicantName,
        idNumber,
        `${caseDescription}${groundsText}\nFIR: ${firNumber}, Charges: ${charges}`
      );
      
      if (!data) throw new Error("Backend AI Failed");
      setBailResult(data);
      if (data.draftTemplate) setDraftContent(data.draftTemplate);
    } catch (error) {
      console.warn("Bail suggestion failed, using hybrid fallback...");
      const fallbackBailType = charges.includes("Murder") || charges.includes("302") ? "Regular Bail (Sec 480 BNSS)" : "Anticipatory Bail (Sec 482 BNSS)";
      const draft = `IN THE COURT OF SESSIONS / HIGH COURT \n\nIN THE MATTER OF:\n${applicantName} ... APPLICANT\nVS.\nTHE STATE ... RESPONDENT\n\nFIR NO: ${firNumber || "N/A"}\nCHARGES: ${charges || "N/A"}\n\nBAIL APPLICATION UNDER SECTION 480/482 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS)\n\nMOST RESPECTFULLY SHOWETH:\n1. That the applicant is innocent and falsely implicated.\n2. That the applicant satisfies the conditions under the new BNSS rules.\n3. Grounds: ${selectedGrounds.join(", ") || "General innocence"}\n\nPRAYER:\nRelease on bail as per BNSS provisions.\n\nADVOCATE FOR APPLICANT`;
      setBailResult({ 
        bailType: fallbackBailType, 
        reason: "Offline BNSS Fallback: Evaluation based on key legal identifiers. Applicant meets standard criteria under BNSS Chapter XXXV.", 
        draftTemplate: draft
      });
      setDraftContent(draft);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = () => {
    if (!bailResult || bailResult.error || !draftContent) return;
    saveBailApplication({
      applicantName,
      idNumber,
      firNumber,
      policeStation,
      charges,
      caseDescription,
      bailType: bailResult.bailType,
      reason: bailResult.reason,
      draftTemplate: draftContent,
    });
    setSavedMsg("✅ Saved to Bail Vault!");
    setVault(getBailApplications());
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const downloadPDF = (content: string) => {
    const doc = new jsPDF();
    const margin = 15;
    const maxLineWidth = 180;
    const fontSize = 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(content, maxLineWidth);
    let y = margin;
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += (fontSize * 1.5) / doc.internal.scaleFactor;
    }
    doc.save("Bail_Application_Draft.pdf");
  };

  // Overlay component rendered within return
  // so we can access variables.

  const selectedVault = vault.find((a) => a.id === selectedVaultId) ?? null;

  return (
    <div className="bg-black/40 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(242,28,28,0.15)] relative overflow-hidden">
      
      {/* Signature Canvas Overlay */}
      {isSigning && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="text-red-400 font-mono text-sm tracking-widest uppercase mb-4 animate-pulse">
            Gesture Mode: Pinch to Sign Document
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="border-2 border-red-500/50 rounded-2xl bg-white/5 cursor-crosshair shadow-[0_0_30px_rgba(242,28,28,0.2)]"
            onMouseMove={handleCanvasMouseMove}
          />
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleClearSignature}
              className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
            >
              Clear
            </button>
            <button
              onClick={() => setIsSigning(false)}
              className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSignature}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(242,28,28,0.4)]"
            >
              Done & Place
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 tracking-widest uppercase flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            BNSS Bail Intelligence
          </h2>
          <p className="text-white/50 text-sm mt-1">Draft, generate & present bail applications in Indian courts.</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-2">
          {["new", "vault"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as "new" | "vault")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all ${
                tab === t
              ? "bg-red-500/20 border border-red-400 text-red-300"
                  : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "new" ? "📝 New Application" : `🗄 Vault (${vault.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── NEW APPLICATION TAB ── */}
      {tab === "new" && (
        <div className="space-y-6">
          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Applicant Full Name", val: applicantName, set: setApplicantName, ph: "e.g., Rajesh Kumar" },
              { label: "ID Number (Aadhaar/PAN/Passport)", val: idNumber, set: setIdNumber, ph: "e.g., AADHAAR 1234 5678 9012" },
              { label: "FIR Number (if known)", val: firNumber, set: setFirNumber, ph: "e.g., FIR No. 142/2024" },
              { label: "Police Station", val: policeStation, set: setPoliceStation, ph: "e.g., Lajpat Nagar PS, Delhi" },
            ].map((field) => (
              <div key={field.label} className="relative group">
                <label className="text-xs text-red-400/70 tracking-widest uppercase font-semibold block mb-1">{field.label}</label>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
                <input
                  type="text"
                  placeholder={field.ph}
                  className="relative w-full p-3 bg-gray-900/80 border border-red-500/30 rounded-xl text-white focus:outline-none focus:border-red-400 transition-all font-mono text-sm"
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="relative group">
            <label className="text-xs text-red-400/70 tracking-widest uppercase font-semibold block mb-1">Charges (IPC/BNS Sections)</label>
            <input
              type="text"
              placeholder="e.g., BNS 101 (Murder), IPC 420 (Cheating)"
              className="w-full p-3 bg-gray-900/80 border border-red-500/30 rounded-xl text-white focus:outline-none focus:border-red-400 transition-all font-mono text-sm"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
            />
          </div>

          <div className="relative group">
            <label className="text-xs text-red-400/70 tracking-widest uppercase font-semibold block mb-1">Full Case Description</label>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
            <textarea
              rows={4}
              placeholder="Describe the case, circumstances of arrest, and key facts..."
              className="relative w-full p-3 bg-gray-900/80 border border-red-500/30 rounded-xl text-white focus:outline-none focus:border-red-400 transition-all font-mono text-sm resize-none"
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
            />
          </div>

          {/* Grounds for Bail */}
          <div>
            <label className="text-xs text-emerald-400/70 tracking-widest uppercase font-semibold block mb-2">Grounds for Bail (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {BAIL_GROUNDS.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGround(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                    selectedGrounds.includes(g)
                      ? "bg-red-500/20 border-red-400 text-red-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {selectedGrounds.includes(g) ? "✓ " : ""}{g}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSuggestBail}
              disabled={loading}
              className="relative group overflow-hidden rounded-xl p-[1px] w-56"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative h-full flex items-center justify-center bg-black px-6 py-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
                <span className="text-white font-semibold flex items-center gap-2 tracking-wider">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Generating Draft...</>
                  ) : (
                    <>⚖ Generate Bail Draft</>
                  )}
                </span>
              </div>
            </button>
          </div>

          {/* Result */}
          {bailResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
              {bailResult.error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-mono text-center">
                  SYSTEM ERROR: {bailResult.error}
                </div>
              ) : (
                <>
                  {/* Recommendation Card */}
                  <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-start">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-red-800" />
                    <div className="md:w-1/3 flex-shrink-0">
                      <div className="inline-flex px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-widest uppercase rounded mb-3">
                        Recommended Action
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-white">{bailResult.bailType}</h3>
                    </div>
                    <div className="md:w-2/3 pl-0 md:pl-6 md:border-l border-white/10">
                      <h4 className="text-sm text-yellow-400 uppercase tracking-widest font-semibold mb-2">Legal Rationale</h4>
                      <p className="text-white/80 leading-relaxed text-sm">{bailResult.reason}</p>
                    </div>
                  </div>

                  {/* Draft Editor */}
                  <div className="p-6 bg-gray-900/50 border border-gray-700/50 rounded-2xl">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                      <h4 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Bail Draft (Editable)
                      </h4>
                      <div className="flex gap-2">
                        {!signatureDataUrl && (
                          <button
                            onClick={() => setIsSigning(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-300 text-sm font-semibold rounded-lg transition-colors"
                          >
                            ✒️ Sign
                          </button>
                        )}
                        {signatureDataUrl && placingSignature && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-300 text-sm font-semibold rounded-lg animate-pulse">
                            📍 Pinch/Click to Place
                          </div>
                        )}
                        {signatureDataUrl && placedSignature && (
                          <button
                            onClick={() => { setPlacedSignature(null); setSignatureDataUrl(null); }}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-300 text-sm font-semibold rounded-lg transition-colors"
                          >
                            ❌ Clear Signature
                          </button>
                        )}
                        {savedMsg ? (
                          <span className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm rounded-lg">{savedMsg}</span>
                        ) : (
                          <button
                            onClick={handleSaveToVault}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            🗄 Save to Vault
                          </button>
                        )}
                        <button
                          onClick={() => downloadPDF(draftContent)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-red-500/20"
                        >
                          ⬇ Export PDF
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      ref={draftAreaRef}
                      className="relative w-full rounded-xl overflow-hidden border border-white/10 group focus-within:border-emerald-500/50"
                      onClick={handleDraftClick}
                      style={{ cursor: placingSignature ? "crosshair" : "text" }}
                    >
                      <textarea
                        className="w-full h-96 p-4 bg-black/60 text-white/90 font-mono text-sm leading-relaxed outline-none resize-none"
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                      />
                      
                      {placedSignature && (
                        <div
                          className="absolute pointer-events-none drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          style={{
                            left: placedSignature.x - 75, // Adjust for centering (assuming ~150px signature width)
                            top: placedSignature.y - 40,  // Adjust height centering
                          }}
                        >
                          <img 
                            src={placedSignature.data} 
                            alt="Signature" 
                            className="w-[150px] object-contain opacity-90 mix-blend-screen"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VAULT TAB ── */}
      {tab === "vault" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[400px]">
          {/* List */}
          <div className="md:col-span-1 space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {vault.length === 0 ? (
              <div className="text-center text-white/30 text-sm p-8 border border-white/5 rounded-2xl">
                <div className="text-4xl mb-3">🗄</div>
                No bail applications saved yet.<br />Generate one and click "Save to Vault".
              </div>
            ) : (
              vault.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedVaultId(app.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedVaultId === app.id
                      ? "bg-red-500/15 border-red-400/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="text-emerald-300 font-semibold text-sm">{app.applicantName}</div>
                  <div className="text-white/50 text-xs mt-1">{app.bailType}</div>
                  <div className="text-white/30 text-xs">{new Date(app.createdAt).toLocaleDateString("en-IN")}</div>
                  {app.firNumber && <div className="text-white/30 text-xs">FIR: {app.firNumber}</div>}
                </div>
              ))
            )}
          </div>

          {/* Detail */}
          <div className="md:col-span-2">
            {!selectedVault ? (
              <div className="h-full flex items-center justify-center text-white/20 text-sm border border-white/5 rounded-2xl">
                ← Select an application to view
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedVault.applicantName}</h3>
                    <p className="text-red-400 text-sm">{selectedVault.bailType}</p>
                    {selectedVault.charges && <p className="text-white/40 text-xs mt-1">Charges: {selectedVault.charges}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadPDF(selectedVault.draftTemplate)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      ⬇ PDF
                    </button>
                    <button
                      onClick={() => {
                        deleteBailApplication(selectedVault.id);
                        setVault(getBailApplications());
                        setSelectedVaultId(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-700/30 hover:bg-red-600/40 border border-red-500/30 text-red-400 text-sm font-semibold rounded-lg transition-colors"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl">
                  <div className="text-xs text-yellow-400 uppercase tracking-widest font-semibold mb-1">Legal Rationale</div>
                  <p className="text-white/70 text-sm leading-relaxed">{selectedVault.reason}</p>
                </div>

                <textarea
                  className="w-full h-72 p-4 bg-black/60 border border-white/10 rounded-xl text-white/80 font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-y"
                  value={selectedVault.draftTemplate}
                  readOnly
                />

                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
                  <p className="text-cyan-400 text-xs font-semibold tracking-wider">
                    💡 Go to <span className="font-bold">Trainer → Virtual Court Bench</span> to present this bail application to the judge during a live session.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
