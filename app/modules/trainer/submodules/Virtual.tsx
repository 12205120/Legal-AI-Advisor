"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBailApplications, BailApplication } from "../../../lib/bail_store";

export default function Virtual() {
  // Pre-court setup states
  const [setupPhase, setSetupPhase] = useState(true);
  const [selectedLaw, setSelectedLaw] = useState("CONSTITUTIONAL LAW");
  const [role, setRole] = useState("Victim");
  const [opponent, setOpponent] = useState("AI Sara");
  const [judge, setJudge] = useState("AI Judge");

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  // In-court states
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [scenario, setScenario] = useState("Awaiting case scenario...");
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [saraVideoUrl, setSaraVideoUrl] = useState("");
  const [saraAudioUrl, setSaraAudioUrl] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [liveSubtitleText, setLiveSubtitleText] = useState("");
  const [fullPendingText, setFullPendingText] = useState("");

  // Bail presentation
  const [showBailPanel, setShowBailPanel] = useState(false);
  const [savedBails, setSavedBails] = useState<BailApplication[]>([]);
  const [presentingBailId, setPresentingBailId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const saraAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Lip-sync Typewriter Effect
  useEffect(() => {
    if (!fullPendingText) return;
    let i = 0;
    const chars = fullPendingText.split("");
    setLiveSubtitleText("");
    
    // Average speaking rate: audio length roughly correlates to text. 
    // About 25-40ms per character is standard TTS speed.
    const interval = setInterval(() => {
      if (i < chars.length) {
        setLiveSubtitleText(prev => prev + chars[i]);
        // Avatar mouth opens more on vowels and alphanumeric chars
        const char = chars[i].toLowerCase();
        const triggersMouth = /[aeiouy]/.test(char) ? Math.random() > 0.1 : (/[a-z0-9]/.test(char) ? Math.random() > 0.4 : false);
        setIsAvatarTalking(triggersMouth);
        i++;
      } else {
        clearInterval(interval);
        setIsAvatarTalking(false);
      }
    }, 45); // Adjust for audio sync
    return () => clearInterval(interval);
  }, [fullPendingText]);

  const speakOffline = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.name.includes("Female") || v.name.includes("female") || v.name.includes("Samantha") || v.name.includes("Zira")) || null;
      utterance.pitch = 1.1;
      utterance.rate = 1.05;
      utterance.onstart = () => setFullPendingText(text);
      utterance.onend = () => setIsAvatarTalking(false);
      utterance.onerror = () => setIsAvatarTalking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const indianLaws = [
    "CONSTITUTIONAL LAW",
    "CRIMINAL LAW (IPC/BNS)",
    "CORPORATE LAW",
    "FAMILY LAW",
    "CYBER LAW",
  ];

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleEnterCourt = () => {
    if (opponent === "Human" || judge === "Human") {
      setInviteLink(
        `http://localhost:3000/courtroom/invite_${Math.random().toString(36).substring(7)}`
      );
      setShowLinkModal(true);
    } else {
      startCourtSession();
    }
  };

  const startCourtSession = async () => {
    setShowLinkModal(false);
    setSetupPhase(false);

    // Load bail vault
    setSavedBails(getBailApplications());

    // Setup Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setUserMessage((prev) => (prev + " " + finalTranscript).trim());
        }
      };
      recognition.onerror = () => setMicOn(false);
      recognitionRef.current = recognition;
    }

    setTranscript([
      { role: "SYSTEM", text: `Case proceedings under ${selectedLaw}` },
      {
        role: judge,
        text: `The court is now in session. We will hear the matter regarding ${selectedLaw}. Advocates, you may proceed with opening statements.`,
      },
    ]);

    // Connect WebSocket
    const wsUrl = (
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
    ).replace("http", "ws");
    const ws = new WebSocket(`${wsUrl}/ws/legal_debate`);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({ setup: true, scenario, role })
      );
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          const opponentLabel = role === "Accused" ? "Public Prosecutor" : "Defense Counsel";
          setTranscript((prev) => [...prev, { role: opponentLabel, text: data.message }]);
          setFullPendingText(data.message);
        }
        if (data.url) setSaraVideoUrl(data.url);
        if (data.audio_url) {
          setSaraAudioUrl(data.audio_url);
          // Auto-play audio
          if (saraAudioRef.current) {
            saraAudioRef.current.src = data.audio_url;
            saraAudioRef.current.play().catch(() => {});
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    wsRef.current = ws;
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try { recognitionRef.current?.stop(); } catch (_) {}
    };
  }, []);

  // Fetch Scenario on Law Change (fix: reads summary from ScenarioData)
  useEffect(() => {
    if (!setupPhase) return;
    const fetchScenario = async () => {
      setIsLoadingScenario(true);
      setScenario("Generating scenario...");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/generate_scenario`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ law: selectedLaw }),
          }
        );
        if (!res.ok) throw new Error("Offline");
        const data = await res.json();
        // Backend returns ScenarioData object — build a readable scenario string
        if (data.summary) {
          setScenario(
            `${data.caseTitle ? data.caseTitle + " · " : ""}${data.summary}${
              data.prosecution ? "\n\nProsecution: " + data.prosecution : ""
            }${data.defense ? "\nDefense: " + data.defense : ""}`
          );
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("Scenario generation failed");
        }
      } catch {
        setScenario("[OFFLINE FALLBACK STATE]: The backend AI connection failed. You are currently in an offline simulated courtroom environment. All responses will be handled by the local engine. You are participating in a mock trial for a generic " + selectedLaw + " dispute. Proceed with your arguments.");
      }
      setIsLoadingScenario(false);
    };
    fetchScenario();
  }, [selectedLaw, setupPhase]);

  // Camera toggle
  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {
          setCameraOn(false);
          alert("Could not access camera.");
        });
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [cameraOn]);

  // Mic toggle
  useEffect(() => {
    if (micOn && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (_) {}
    } else if (!micOn && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
  }, [micOn]);

  const sendMessage = () => {
    if (!userMessage.trim()) return;
    setTranscript((prev) => [...prev, { role: "YOU", text: userMessage }]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ query: userMessage }));
    } else {
      const opponentLabel = role === "Accused" ? "Public Prosecutor" : "Defense Counsel";
      const offlineMsg = `I formally object to the opposing counsel's argument. Without further evidence, this claim holds no water under current jurisdiction.`;
      setTimeout(() => {
        setTranscript(prev => [...prev, { role: opponentLabel, text: `[OFFLINE AI] ${offlineMsg}` }]);
        speakOffline(offlineMsg);
      }, 1500);
      setTimeout(() => {
        const judgeMsg = `Objection noted. Counsel, please stick to the facts outlined in the ${selectedLaw} scenario.`;
        setTranscript(prev => [...prev, { role: judge, text: `[OFFLINE JUDGE] ${judgeMsg}` }]);
      }, 5500);
    }
    setUserMessage("");
  };

  // Present bail application in court
  const presentBail = (bail: BailApplication) => {
    const bailText = `[FORMAL BAIL APPLICATION SUBMITTED]\nApplicant: ${bail.applicantName} | ${bail.bailType}\n\n${bail.draftTemplate}`;
    setTranscript((prev) => [
      ...prev,
      { role: "YOU", text: `🗄 PRESENTING BAIL APPLICATION for ${bail.applicantName} (${bail.bailType})` },
    ]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          query: `I am formally presenting a bail application to the court:\n${bail.reason}\n\nThe full bail application has been filed under ${bail.bailType}. Grounds include: ${bail.caseDescription.substring(0, 200)}. Please respond as ${role === "Accused" ? "Public Prosecutor opposing this bail" : "Defense Counsel supporting this bail"}.`,
        })
      );
    } else {
      const opponentLabel = role === "Accused" ? "Public Prosecutor" : "Defense Counsel";
      const offlineMsg = "We oppose this bail application. The applicant is a flight risk and the charges are severe.";
      setTimeout(() => {
        setTranscript(prev => [...prev, { role: opponentLabel, text: `[OFFLINE AI] ${offlineMsg}` }]);
        speakOffline(offlineMsg);
      }, 1500);
      setTimeout(() => {
        const judgeMsg = "I have reviewed the bail application offline. Given the simulated circumstances, bail is conditionally granted.";
        setTranscript(prev => [...prev, { role: judge, text: `[OFFLINE JUDGE] ${judgeMsg}` }]);
      }, 5000);
    }
    setPresentingBailId(bail.id);
    setShowBailPanel(false);
  };

  // ── SETUP PHASE ──────────────────────────────────────────────────────
  if (setupPhase) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="bg-black/60 border border-cyan-500/30 p-10 rounded-3xl w-full max-w-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,255,0.1)]">
          <h2 className="text-3xl text-cyan-400 mb-8 text-center tracking-[0.2em] font-light">
            SUPREME COURT SETUP
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">
                Select Law Focus
              </label>
              <select
                value={selectedLaw}
                onChange={(e) => setSelectedLaw(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white hover:border-cyan-500/50 transition-colors focus:outline-none"
              >
                {indianLaws.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario Preview */}
            <div className="bg-black/40 border border-cyan-500/30 rounded-xl p-4">
              <label className="text-[10px] text-cyan-500 tracking-widest uppercase mb-2 block font-bold flex items-center justify-between">
                <span>Case Scenario (Auto-Generated)</span>
                {isLoadingScenario && (
                  <span className="text-cyan-400/50 flex items-center gap-1">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse inline-block" />
                    Generating...
                  </span>
                )}
              </label>
              <div
                className={`text-sm text-white/80 leading-relaxed font-serif max-h-32 overflow-y-auto pr-2 whitespace-pre-line ${
                  isLoadingScenario ? "animate-pulse opacity-50" : ""
                }`}
              >
                {scenario}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">
                  Your Role
                </label>
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  {["Victim", "Accused"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 p-3 text-sm transition-colors ${
                        role === r
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-black/50 text-white/50 hover:bg-white/5"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">
                  Opposing Counsel
                </label>
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  {["AI Sara", "Human"].map((o) => (
                    <button
                      key={o}
                      onClick={() => setOpponent(o)}
                      className={`flex-1 p-3 text-sm transition-colors ${
                        opponent === o
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-black/50 text-white/50 hover:bg-white/5"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">
                Honorable Judge
              </label>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {["AI Judge", "Human"].map((j) => (
                  <button
                    key={j}
                    onClick={() => setJudge(j)}
                    className={`flex-1 p-3 text-sm transition-colors ${
                      judge === j
                        ? "bg-orange-500/20 text-orange-300"
                        : "bg-black/50 text-white/50 hover:bg-white/5"
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleEnterCourt}
              className="w-full mt-4 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded-xl text-cyan-400 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(0,255,255,0.1)]"
            >
              ⚖ Enter Courtroom
            </button>
          </div>
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {showLinkModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            >
              <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl max-w-md w-full text-center">
                <h3 className="text-xl text-cyan-400 mb-4 tracking-wider">
                  Invite Participants
                </h3>
                <p className="text-white/70 text-sm mb-6">
                  Share this link with human participants to join the proceeding.
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-cyan-300 text-sm mb-6 break-all">
                  {inviteLink}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white transition-colors"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={startCourtSession}
                    className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 transition-colors"
                  >
                    Start Session
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── IN-COURT PHASE ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Hidden audio for Sara's voice */}
      <audio ref={saraAudioRef} className="hidden" />

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/40 border-b border-white/5 rounded-2xl flex-wrap gap-3">
        <div className="text-cyan-500 text-xs tracking-[0.3em] font-bold">LIVE HEARING</div>
        <div className="text-orange-400 text-sm tracking-widest uppercase font-semibold">
          ⚖ {selectedLaw}
        </div>
        <div className="flex gap-2 items-center">
          {/* Bail Presentation Button */}
          <button
            onClick={() => {
              setSavedBails(getBailApplications());
              setShowBailPanel(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-bold tracking-widest uppercase transition-all"
          >
            🗄 Present Bail
            {savedBails.length > 0 && (
              <span className="w-4 h-4 bg-emerald-500 text-black rounded-full text-[9px] flex items-center justify-center font-black">
                {savedBails.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`text-[10px] px-3 py-1.5 rounded border transition-all ${
              showSubtitles
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            {showSubtitles ? "SUBTITLES ON" : "SUBTITLES OFF"}
          </button>
          <button
            onClick={() => {
              setSetupPhase(true);
              wsRef.current?.close();
              setSaraVideoUrl("");
              setSaraAudioUrl("");
              setCameraOn(false);
              setMicOn(false);
              setPresentingBailId(null);
              setIsAvatarTalking(false);
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
            }}
            className="text-white/40 hover:text-white text-xs px-4 py-2 border border-white/10 rounded-lg transition-all"
          >
            LEAVE COURT
          </button>
        </div>
      </div>

      {/* Bail Panel Drawer */}
      <AnimatePresence>
        {showBailPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBailPanel(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-3xl bg-slate-950 border-t border-emerald-500/30 rounded-t-3xl p-8 max-h-[60vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-emerald-300 tracking-widest uppercase">
                  🗄 Bail Applications Vault
                </h3>
                <button
                  onClick={() => setShowBailPanel(false)}
                  className="text-white/40 hover:text-white text-sm px-3 py-1 border border-white/10 rounded-lg"
                >
                  Close
                </button>
              </div>

              {savedBails.length === 0 ? (
                <div className="text-center text-white/30 py-12">
                  <div className="text-5xl mb-4">🗄</div>
                  <p>No bail applications in vault.</p>
                  <p className="text-xs mt-2">Go to the Bail tab to generate and save one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedBails.map((bail) => (
                    <div
                      key={bail.id}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        presentingBailId === bail.id
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-emerald-300 font-bold text-sm">{bail.applicantName}</div>
                          <div className="text-white/50 text-xs mt-1">{bail.bailType}</div>
                          {bail.charges && (
                            <div className="text-white/30 text-xs mt-1">Charges: {bail.charges}</div>
                          )}
                          <div className="text-white/20 text-xs mt-1">
                            {new Date(bail.createdAt).toLocaleDateString("en-IN")}
                          </div>
                          <p className="text-white/60 text-xs mt-2 leading-relaxed line-clamp-2">
                            {bail.reason}
                          </p>
                        </div>
                      </div>
                      {presentingBailId === bail.id ? (
                        <div className="mt-3 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-lg text-center font-semibold">
                          ✓ Presented in Court
                        </div>
                      ) : (
                        <button
                          onClick={() => presentBail(bail)}
                          className="mt-3 w-full px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg font-bold tracking-widest uppercase transition-all"
                        >
                          ⚖ Present to Court
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Court Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 h-[75vh] min-h-[600px]">
        {/* LEFT — USER */}
        <div className="col-span-1 bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col relative shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded-md border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-white/50 uppercase tracking-widest">Advocate</div>
            <div className="text-xs text-white uppercase font-bold">{role}</div>
          </div>

          <div className="flex-1 bg-black/50 flex items-center justify-center relative min-h-[250px] overflow-hidden">
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center text-4xl text-white/20 bg-black">
                👤
              </div>
            )}
            {cameraOn && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-red-500/30">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest">LIVE</div>
              </div>
            )}
          </div>

          <div className="p-3 bg-black/40 border-t border-white/5 flex gap-2 justify-center">
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`flex-1 flex justify-center py-2.5 rounded-xl transition-all ${
                cameraOn
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              } border text-lg`}
            >
              {cameraOn ? "📸" : "📷"}
            </button>
            <button
              onClick={() => setMicOn(!micOn)}
              className={`flex-1 flex justify-center py-2.5 rounded-xl transition-all ${
                micOn
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              } border text-lg`}
            >
              {micOn ? "🎙️" : "🔇"}
            </button>
          </div>

          <div className="p-3 pt-0 bg-black/40">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your argument... (Enter to send)"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none h-20"
            />
            <button
              onClick={sendMessage}
              className="w-full mt-1.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-bold tracking-widest uppercase transition-all"
            >
              Present Argument
            </button>
          </div>
        </div>

        {/* MIDDLE — Transcript + Scenario */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
          {/* Judge bench */}
          <div className="h-36 bg-slate-900/50 border border-orange-500/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-3 left-4 z-10 bg-black/50 px-3 py-1 rounded-md border border-orange-500/30">
              <div className="text-[10px] text-orange-400/80 uppercase tracking-widest">Honorable</div>
              <div className="text-xs text-orange-400 font-bold uppercase">{judge}</div>
            </div>
            {judge === "Human" ? (
              <div className="w-full h-full flex items-center justify-center text-orange-400/50 text-sm tracking-widest uppercase animate-pulse">
                Waiting for Judge...
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-orange-950/30 to-black/80 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full border border-orange-500/30 flex items-center justify-center text-3xl mb-2 bg-black">
                  ⚖️
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <div className="text-orange-500/70 text-xs tracking-[0.2em]">AI LISTENING</div>
                </div>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-5 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="mb-3 pb-3 border-b border-white/10 text-xs text-white/60 leading-relaxed font-serif max-h-24 overflow-y-auto pr-1">
              <span className="text-cyan-400 text-[10px] tracking-widest uppercase block mb-1 font-sans font-bold">
                Case Scenario:
              </span>
              <span className={`whitespace-pre-line ${isLoadingScenario ? "animate-pulse text-cyan-500/50" : ""}`}>
                {scenario}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {transcript.map((line, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${line.role === "YOU" ? "items-end" : "items-start"}`}
                >
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${
                      line.role === "YOU"
                        ? "text-cyan-400"
                        : line.role === judge || line.role === "SYSTEM"
                        ? "text-orange-400"
                        : "text-purple-400"
                    }`}
                  >
                    {line.role}
                  </span>
                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[88%] ${
                      line.role === "YOU"
                        ? "bg-cyan-500/10 text-cyan-100 border border-cyan-500/20 rounded-tr-sm"
                        : line.role === judge || line.role === "SYSTEM"
                        ? "bg-orange-500/10 text-orange-100 border border-orange-500/20 rounded-tl-sm italic"
                        : "bg-purple-500/10 text-purple-100 border border-purple-500/20 rounded-tl-sm"
                    }`}
                  >
                    {line.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        {/* RIGHT — Sara/Opponent */}
        <div className="col-span-1 bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden relative flex flex-col">
          <div className="absolute top-4 right-4 z-10 bg-black/50 px-3 py-1 rounded-md border border-white/10 text-right">
            <div className="text-[10px] text-white/50 uppercase tracking-widest">Opposition</div>
            <div className="text-xs text-white uppercase font-bold">
              {role === "Accused" ? "Public Prosecutor" : "Defense Counsel"}
            </div>
          </div>

          <div className="flex-1 bg-black/50 flex items-center justify-center relative min-h-[300px]">
            {opponent === "AI Sara" ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                {saraVideoUrl ? (
                  <video
                    src={saraVideoUrl}
                    autoPlay
                    className="w-full h-full object-cover"
                    onPlay={() => setIsAvatarTalking(true)}
                    onEnded={() => setIsAvatarTalking(false)}
                    onPause={() => setIsAvatarTalking(false)}
                  />
                ) : (
                  <div className="w-full h-full relative overflow-hidden bg-slate-900 flex items-center justify-center border-l border-white/5">
                    <style>{`
                      @keyframes vtuber-talk {
                        0%, 100% { opacity: 0; }
                        50% { opacity: 1; }
                      }
                      .anime-mouth-open {
                        animation: vtuber-talk 0.25s infinite steps(2, jump-none);
                      }
                    `}</style>
                    
                    {/* Idle / Closed Face base */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: 'url(/sara-anime-closed.png)' }}
                    />
                    
                    {/* Talking / Open Face overlay */}
                    {isAvatarTalking && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center anime-mouth-open"
                        style={{ backgroundImage: 'url(/sara-anime-open.png)' }}
                      />
                    )}
                  </div>
                )}

                {/* Speaking wave animation */}
                {!saraVideoUrl && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-4xl mb-4">
                      ⚖
                    </div>
                    <div className="flex items-end gap-[3px] h-6 opacity-70">
                      {[...Array(14)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: [3, Math.random() * 18 + 6, Math.random() * 10 + 4, Math.random() * 22 + 6, 3],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.0 + Math.random() * 0.6,
                            delay: i * 0.08,
                          }}
                          className="w-[3px] bg-purple-400 rounded-full"
                        />
                      ))}
                    </div>
                    <div className="mt-3 text-purple-400/60 text-[10px] tracking-[0.3em] uppercase">
                      Sara — AI Counsel
                    </div>
                  </div>
                )}

                {/* Subtitles */}
                {showSubtitles && liveSubtitleText && !saraVideoUrl && (
                  <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
                    <div className="bg-black/80 px-4 py-2 rounded-lg border border-purple-500/30 text-purple-100 text-xs font-medium text-center backdrop-blur-md">
                      {liveSubtitleText}
                    </div>
                  </div>
                )}
                {/* Fallback for regular subtitles if video is playing */}
                {showSubtitles && saraVideoUrl && (
                  <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
                    <div className="bg-black/80 px-4 py-2 rounded-lg border border-purple-500/30 text-purple-100 text-xs font-medium text-center backdrop-blur-md">
                      {transcript.filter(t => t.role !== "YOU" && t.role !== "SYSTEM" && t.role !== judge).pop()?.text || "..."}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-sm tracking-widest uppercase border-2 border-dashed border-white/5 rounded-3xl m-2 bg-black/80">
                <div className="text-4xl mb-4">⏳</div>
                <div className="animate-pulse">Waiting for Opponent...</div>
              </div>
            )}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5">
            <div className="flex items-center justify-between text-xs tracking-widest uppercase text-white/40 mb-2">
              <span>STATUS</span>
              <span className={opponent === "AI Sara" ? "text-purple-400" : "text-cyan-400"}>
                {opponent === "AI Sara" ? "AI ENGINE ACTIVE" : "AWAITING HUMAN"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        `,
      }} />
    </div>
  );
}