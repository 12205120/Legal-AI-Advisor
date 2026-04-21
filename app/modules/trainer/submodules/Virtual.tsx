"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getBailApplications, BailApplication } from "../../../lib/bail_store";
import { LegalService, ArgumentAnalysis } from "../../../lib/legal_service";
import VRMAvatar from "../../../components/ui/VRMAvatar";

export default function Virtual() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get("session");
  const urlRole = searchParams.get("role");
  
  // Pre-court setup states
  const [sessionId, setSessionId] = useState(initialSession || "");
  const [setupPhase, setSetupPhase] = useState(!initialSession);
  const [selectedLaw, setSelectedLaw] = useState("CONSTITUTIONAL LAW");
  const [role, setRole] = useState(urlRole || "Victim");
  const [opponent, setOpponent] = useState("AI Sara");
  const [judge, setJudge] = useState("AI Judge");

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    if (initialSession && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      // Wait for layout mount
      setTimeout(() => startCourtSession(), 500);
    }
  }, [initialSession]);

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
  
  // Analysis
  const [analysis, setAnalysis] = useState<ArgumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prioritize Indian Female voices, then other Female voices for a sweet tone
        utterance.voice = voices.find(v => (v.lang.includes("en-IN") || v.lang.includes("hi-IN")) && (v.name.includes("Female") || v.name.includes("Heera") || v.name.includes("Neerja") || v.name.includes("Kajal"))) 
          || voices.find(v => v.name.includes("Female") || v.name.includes("female") || v.name.includes("Samantha") || v.name.includes("Zira")) 
          || voices[0] || null;
        utterance.pitch = 1.3; // Higher pitch for sweeter voice
        utterance.rate = 0.95; // Slightly slower for clarity
        utterance.onstart = () => setFullPendingText(text);
        utterance.onend = () => setIsAvatarTalking(false);
        utterance.onerror = () => setIsAvatarTalking(false);
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      } else {
        setVoiceAndSpeak();
      }
    }
  };

  const indianLaws = [
    "CONSTITUTIONAL LAW",
    "CRIMINAL LAW (IPC/BNS)",
    "CODE OF CRIMINAL PROCEDURE (CrPC/BNSS)",
    "INDIAN EVIDENCE ACT (IEA/BSA)",
    "CORPORATE & COMPANIES ACT",
    "FAMILY & PERSONAL LAWS",
    "CYBER & IT ACT",
    "CONTRACT & PROPERTY LAW",
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
    
    // Generate new session if not joining one
    const activeSessionId = sessionId || `session_${Math.random().toString(36).substring(7)}`;
    if (!sessionId) setSessionId(activeSessionId);
    
    const ws = new WebSocket(`${wsUrl}/ws/legal_debate/${activeSessionId}`);
    ws.onopen = () => {
      ws.send(
        JSON.stringify({ setup: true, scenario, role })
      );
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          const senderLabel = data.sender_role || (role === "Accused" ? "Public Prosecutor" : "Defense Counsel");
          setTranscript((prev) => [...prev, { role: senderLabel, text: data.message }]);
          speakOffline(data.message);
        } else if (data.query) {
          // P2P Human Broadcast incoming
          const senderLabel = data.role || (role === "Accused" ? "Public Prosecutor" : "Defense Counsel");
          setTranscript((prev) => [...prev, { role: senderLabel, text: data.query }]);
          speakOffline(data.query);
        }
        if (data.url) setSaraVideoUrl(data.url);
        // We purposefully ignore data.audio_url here so we ALWAYS use the local browser TTS (sweet lady voice)
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
      wsRef.current.send(JSON.stringify({ query: userMessage, role: role, opponent: opponent }));
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

  const runJudicialAnalysis = async () => {
    const pros = transcript.filter(t => t.role.includes("Prosecutor") || (role === "Victim" && t.role === "YOU")).map(t => t.text).join("\n");
    const def = transcript.filter(t => t.role.includes("Defense") || (role === "Accused" && t.role === "YOU")).map(t => t.text).join("\n");
    
    setIsAnalyzing(true);
    try {
      const result = await LegalService.analyzeArguments(pros, def, scenario);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── SETUP PHASE ──────────────────────────────────────────────────────
  if (setupPhase) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="bg-black/60 border border-red-500/30 p-10 rounded-3xl w-full max-w-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(242,28,28,0.1)]">
          <h2 className="text-3xl text-red-500 mb-8 text-center tracking-[0.2em] font-black uppercase">
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
            <div className="bg-black/40 border border-red-500/30 rounded-xl p-4">
              <label className="text-[10px] text-red-500 tracking-widest uppercase mb-2 block font-bold flex items-center justify-between">
                <span>Case Scenario (Auto-Generated)</span>
                {isLoadingScenario && (
                  <span className="text-red-400/50 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block" />
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
                <label className="text-xs text-red-500 tracking-widest uppercase mb-2 block">
                  Your Role
                </label>
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  {["Victim", "Accused"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 p-3 text-sm transition-colors ${
                        role === r
                          ? "bg-red-500/20 text-red-300"
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
              className="w-full mt-4 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(242,28,28,0.1)]"
            >
              ⚖ Enter BNSS Courtroom
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
                  Share this link or send an email invite to human participants.
                </p>

                <div className="space-y-4 mb-6 text-left">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] text-cyan-500 tracking-widest uppercase mb-2 block font-bold">1. Share Direct Link</label>
                    <div className="flex gap-2">
                      <div className="bg-black/50 p-2 rounded-lg flex-1 border border-white/10 text-cyan-300 text-xs truncate select-all">
                        {`http://localhost:3000/?session=${sessionId || "pending"}&mode=court`}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(`http://localhost:3000/?session=${sessionId || "pending"}&mode=court`)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white transition-colors text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                    <label className="text-[10px] text-cyan-500 tracking-widest uppercase mb-2 block font-bold">2. Send Email Invite (Via ID)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={opponent === "Human" && judge === "Human" ? "Enter Lawyer/Judge ID" : opponent === "Human" ? "Enter Lawyer ID" : "Enter Judge ID"}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                        id="lawyer_id_input"
                      />
                      <button
                        onClick={() => {
                          const id = (document.getElementById("lawyer_id_input") as HTMLInputElement).value;
                          if (id.trim()) {
                            alert(`Invite email successfully sent to registered lawyer/judge ID: ${id}`);
                          } else {
                            alert("Please enter a valid ID");
                          }
                        }}
                        className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 transition-colors text-xs font-bold"
                      >
                        Send Mail
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={startCourtSession}
                    className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 transition-colors font-bold tracking-wider"
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
        <div className="text-red-500 text-xs tracking-[0.3em] font-bold">LIVE BNSS HEARING</div>
        <div className="text-orange-400 text-sm tracking-widest uppercase font-semibold">
          ⚖ {selectedLaw}
        </div>
        <div className="flex gap-2 items-center">
          {/* Bail Presentation Button */}
          {role !== "Judge" && role !== "Audience" && (
            <button
              onClick={() => {
                setSavedBails(getBailApplications());
                setShowBailPanel(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/15 hover:bg-red-600/25 border border-red-600/40 rounded-lg text-red-200 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all"
            >
              🗄 Present Bail (BNSS)
              {savedBails.length > 0 && (
                <span className="w-4 h-4 bg-emerald-500 text-black rounded-full text-[9px] flex items-center justify-center font-black">
                  {savedBails.length}
                </span>
              )}
            </button>
          )}

          {/* Share to Audience Button (Visible to any participant) */}
          {role !== "Audience" && (
            <button
               onClick={() => {
                 const audienceLink = `${window.location.origin}/?session=${sessionId || "pending"}&mode=court&role=Audience`;
                 navigator.clipboard.writeText(audienceLink);
                 alert(`Public Spectator Link copied to clipboard:\n${audienceLink}\nShare this with the public to watch the case.`);
               }}
               className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 rounded-lg text-blue-300 text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all"
            >
              👥 Public Spectator Link
            </button>
          )}

            <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`text-[10px] px-3 py-1.5 rounded border transition-all ${
              showSubtitles
                ? "bg-red-500/20 border-red-500/50 text-red-400"
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
                <h3 className="text-lg font-bold text-red-400 tracking-widest uppercase">
                  🗄 BNSS Bail Applications Vault
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
                          className="mt-3 w-full px-3 py-2 bg-red-600/15 hover:bg-red-600/30 border border-red-600/30 text-red-300 text-xs rounded-lg font-bold tracking-widest uppercase transition-all"
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 h-[75vh] max-h-[75vh] min-h-[600px] overflow-hidden">
        {/* LEFT — USER (Hidden for Judge/Audience) */}
        {role !== "Judge" && role !== "Audience" && (
          <div className="col-span-1 bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col relative shadow-[0_4px_30px_rgba(0,0,0,0.5)] h-full">
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
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 resize-none h-20"
            />
            <button
              onClick={sendMessage}
              className="w-full mt-1.5 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-400 text-xs font-bold tracking-widest uppercase transition-all"
            >
              Present Argument
            </button>
          </div>
        </div>
        )}

        {/* MIDDLE — Transcript + Scenario */}
        <div className={`col-span-1 flex flex-col gap-4 h-full overflow-hidden ${role === "Judge" || role === "Audience" ? "lg:col-span-3" : "lg:col-span-2"}`}>
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
          <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-5 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="mb-3 pb-3 border-b border-white/10 text-xs text-white/60 leading-relaxed font-serif max-h-24 overflow-y-auto pr-1 flex flex-col items-start gap-2">
              <div className="flex items-center justify-between w-full">
                <span className="text-red-500 text-[10px] tracking-widest uppercase font-sans font-bold">
                  Case Scenario (BNSS):
                </span>
                <button 
                  onClick={runJudicialAnalysis}
                  disabled={isAnalyzing}
                  className="px-2 py-1 bg-red-600/20 border border-red-600/40 rounded text-[9px] text-red-400 hover:bg-red-600/30 transition-all font-bold tracking-widest uppercase disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing..." : "Judge's Deep Analysis"}
                </button>
              </div>
              <span className={`whitespace-pre-line ${isLoadingScenario ? "animate-pulse text-red-500/50" : ""}`}>
                {scenario}
              </span>
            </div>

            {/* Analysis Overlay */}
            {analysis && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl p-6 m-4 rounded-3xl border border-red-500/30 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-red-500 tracking-widest uppercase flex items-center gap-2">
                    ⚖️ Judicial Analysis Report
                  </h3>
                  <button onClick={() => setAnalysis(null)} className="text-white/40 hover:text-white">✕</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl">
                    <div className="text-[10px] text-red-400 uppercase font-black mb-1">Pros. Strength</div>
                    <div className="text-2xl font-black text-white">{analysis.prosecutionStrength}/10</div>
                  </div>
                  <div className="p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-2xl">
                    <div className="text-[10px] text-yellow-400 uppercase font-black mb-1">Def. Strength</div>
                    <div className="text-2xl font-black text-white">{analysis.defenseStrength}/10</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs text-red-400 uppercase font-black mb-2 tracking-widest">Legal Analysis</h4>
                    <p className="text-sm text-white/80 leading-relaxed font-serif border-l-2 border-red-600 pl-4">{analysis.benchOpinion}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-red-400 uppercase font-black mb-2 tracking-widest">Contradictions Found</h4>
                    <ul className="list-disc list-inside text-xs text-white/60 space-y-1">
                      {analysis.contradictions.map((c, idx) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs text-red-400 uppercase font-black mb-2 tracking-widest">Citations & Precedents</h4>
                    <div className="flex flex-wrap gap-2">
                       {analysis.legalPrecedents.map((p, idx) => (
                         <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/40">{p}</span>
                       ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {transcript.map((line, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${line.role === "YOU" ? "items-end" : "items-start"}`}
                >
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${
                      line.role === "YOU"
                        ? "text-red-500"
                        : line.role === judge || line.role === "SYSTEM"
                        ? "text-[#ecb31c]"
                        : "text-red-400"
                    }`}
                  >
                    {line.role}
                  </span>
                  <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[88%] ${
                      line.role === "YOU"
                        ? "bg-red-500/10 text-red-50 border border-red-500/20 rounded-tr-sm"
                        : line.role === judge || line.role === "SYSTEM"
                        ? "bg-[#ecb31c]/10 text-yellow-50 border border-[#ecb31c]/20 rounded-tl-sm italic"
                        : "bg-red-950/30 text-red-100 border border-red-500/20 rounded-tl-sm"
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
        <div className="col-span-1 bg-black/50 border border-white/10 rounded-3xl overflow-hidden relative flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)] h-full">
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
                    <VRMAvatar isTalking={isAvatarTalking} vrmUrl="/sara.vrm" />
                  </div>
                )}

                {/* Subtitles */}
                {showSubtitles && liveSubtitleText && !saraVideoUrl && (
                  <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
                    <div className="bg-black/80 px-4 py-2 rounded-lg border border-red-500/30 text-red-100 text-xs font-medium text-center backdrop-blur-md">
                      {liveSubtitleText}
                    </div>
                  </div>
                )}
                {/* Fallback for regular subtitles if video is playing */}
                {showSubtitles && saraVideoUrl && (
                  <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
                    <div className="bg-black/80 px-4 py-2 rounded-lg border border-red-500/30 text-red-100 text-xs font-medium text-center backdrop-blur-md">
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
              <span className={opponent === "AI Sara" ? "text-red-500 font-bold" : "text-yellow-500 font-bold"}>
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