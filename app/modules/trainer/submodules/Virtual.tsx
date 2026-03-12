"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [saraVideoUrl, setSaraVideoUrl] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const indianLaws = [
    "CONSTITUTIONAL LAW",
    "CRIMINAL LAW (IPC/BNS)",
    "CORPORATE LAW",
    "FAMILY LAW",
    "CYBER LAW"
  ];

  const handleEnterCourt = () => {
    if (opponent === "Human" || judge === "Human") {
      setInviteLink(`http://localhost:3005/courtroom/invite_${Math.random().toString(36).substring(7)}`);
      setShowLinkModal(true);
    } else {
      startCourtSession();
    }
  };

  const startCourtSession = async () => {
    setShowLinkModal(false);
    setSetupPhase(false);

    // Setup Web Speech API for Mic
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Update user message input directly
        if (finalTranscript) {
           setUserMessage(prev => (prev + " " + finalTranscript).trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setMicOn(false);
      };
      
      recognitionRef.current = recognition;
    }

    // Initial Transcript
    setTranscript([
      { role: "SYSTEM", text: `Case Context: proceedings under ${selectedLaw}` },
      { role: judge, text: `The court is now in session. We will hear the matter regarding the ${selectedLaw}. Advocates, you may proceed with opening statements.` }
    ]);

    // Connect WS
    const wsUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/legal_debate`);
    ws.onopen = () => console.log("Connected to virtual court WS");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setTranscript((prev) => [...prev, { role: opponent, text: data.message }]);
        }
        if (data.url) {
          setSaraVideoUrl(data.url);
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  // Fetch Scenario on Law Change
  useEffect(() => {
    if (setupPhase) {
      const fetchScenario = async () => {
        setIsLoadingScenario(true);
        setScenario("Generating case scenario...");
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/generate_scenario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ law: selectedLaw }),
          });
          const data = await res.json();
          setScenario(data.scenario || "Scenario generation failed.");
        } catch (e) {
          setScenario("Failed to connect to backend for scenario generation. Make sure the backend gives a proper 200 response.");
        }
        setIsLoadingScenario(false);
      };
      fetchScenario();
    }
  }, [selectedLaw, setupPhase]);

  // Handle Camera Toggle
  useEffect(() => {
    if (cameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          setCameraOn(false);
          alert("Could not access camera. Please check permissions.");
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [cameraOn]);

  // Handle Mic Toggle
  useEffect(() => {
    if (micOn && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech recognition start error", e);
      }
    } else if (!micOn && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Speech recognition stop error", e);
      }
    }
  }, [micOn]);

  const sendMessage = () => {
    if (!userMessage.trim()) return;
    setTranscript((prev) => [...prev, { role: "YOU", text: userMessage }]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ query: userMessage }));
    }
    setUserMessage("");
  };

  if (setupPhase) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="bg-black/60 border border-cyan-500/30 p-10 rounded-3xl w-full max-w-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(0,255,255,0.1)]">
          <h2 className="text-3xl text-cyan-400 mb-8 text-center tracking-[0.2em] font-light">SUPREME COURT SETUP</h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">Select Law Focus</label>
              <select 
                value={selectedLaw} onChange={(e) => setSelectedLaw(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white hover:border-cyan-500/50 transition-colors focus:outline-none"
              >
                {indianLaws.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Live Scenario Preview */}
            <div className="bg-black/40 border border-cyan-500/30 rounded-xl p-4">
               <label className="text-[10px] text-cyan-500 tracking-widest uppercase mb-2 block font-bold flex items-center justify-between">
                 <span>Case Scenario (Auto-Generated)</span>
                 {isLoadingScenario && <span className="text-cyan-400/50">Loading...</span>}
               </label>
               <div className={`text-sm text-white/80 leading-relaxed font-serif max-h-32 overflow-y-auto pr-2 custom-scrollbar ${isLoadingScenario ? 'animate-pulse opacity-50' : ''}`}>
                 {scenario}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">Your Role</label>
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  {['Victim', 'Accused'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 p-3 text-sm transition-colors ${role === r ? 'bg-cyan-500/20 text-cyan-300' : 'bg-black/50 text-white/50 hover:bg-white/5'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">Opposing Counsel</label>
                <div className="flex rounded-xl overflow-hidden border border-white/10">
                  {['AI Sara', 'Human'].map(o => (
                    <button 
                      key={o}
                      onClick={() => setOpponent(o)}
                      className={`flex-1 p-3 text-sm transition-colors ${opponent === o ? 'bg-purple-500/20 text-purple-300' : 'bg-black/50 text-white/50 hover:bg-white/5'}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-cyan-500 tracking-widest uppercase mb-2 block">Honorable Judge</label>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {['AI Judge', 'Human'].map(j => (
                  <button 
                    key={j}
                    onClick={() => setJudge(j)}
                    className={`flex-1 p-3 text-sm transition-colors ${judge === j ? 'bg-orange-500/20 text-orange-300' : 'bg-black/50 text-white/50 hover:bg-white/5'}`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleEnterCourt}
              className="w-full mt-8 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded-xl text-cyan-400 font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(0,255,255,0.1)]"
            >
              Enter Courtroom
            </button>
          </div>
        </div>

        {/* Link Modal */}
        <AnimatePresence>
          {showLinkModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            >
              <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl max-w-md w-full text-center">
                <h3 className="text-xl text-cyan-400 mb-4 tracking-wider">Invite Participants</h3>
                <p className="text-white/70 text-sm mb-6">
                  You have selected human participants. Share this link with them to join the proceeding.
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

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-black/40 border-b border-white/5 rounded-2xl">
        <div className="text-cyan-500 text-xs tracking-[0.3em] font-bold">LIVE HEARING</div>
        <div className="text-orange-400 text-sm tracking-widest uppercase font-semibold">⚖ {selectedLaw}</div>
        <button 
          onClick={() => {
            setSetupPhase(true); 
            wsRef.current?.close();
            setSaraVideoUrl("");
            setCameraOn(false);
            setMicOn(false);
          }} 
          className="text-white/40 hover:text-white text-xs px-4 py-2 border border-white/10 rounded-lg transition-all"
        >
          LEAVE COURT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh]">
        
        {/* LEFT PANEL - USER */}
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
                 className="absolute inset-0 w-full h-full object-cover rounded-xl border border-cyan-500/30 m-2 -z-0"
               />
             ) : (
               <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center text-4xl text-white/20 bg-black">
                 👤
               </div>
             )}
             
             {cameraOn && (
               <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-red-500/30">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest">LIVE</div>
               </div>
             )}
           </div>

           <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3 justify-center">
             <button onClick={() => setCameraOn(!cameraOn)} className={`flex-1 flex justify-center py-3 rounded-xl transition-all ${cameraOn ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} border`}>
               <span className="text-lg">{cameraOn ? '📸' : '📷'}</span>
             </button>
             <button onClick={() => setMicOn(!micOn)} className={`flex-1 flex justify-center py-3 rounded-xl transition-all ${micOn ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} border`}>
               <span className="text-lg">{micOn ? '🎙️' : '🔇'}</span>
             </button>
           </div>
           
           <div className="p-4 pt-0 bg-black/40">
              <textarea 
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your legal argument... (Press Enter to send)"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none h-24"
              />
              <button 
                onClick={sendMessage}
                className="w-full mt-2 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-bold tracking-widest uppercase transition-all"
              >
                Present Argument
              </button>
           </div>
        </div>

        {/* MIDDLE PANEL - SCENARIO & TRANSCRIPT */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          
          {/* JUDGE BENCH */}
          <div className="h-44 bg-slate-900/50 border border-orange-500/20 rounded-3xl overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
             <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded-md border border-orange-500/30 backdrop-blur-md">
               <div className="text-[10px] text-orange-400/80 uppercase tracking-widest">Honorable</div>
               <div className="text-xs text-orange-400 font-bold uppercase">{judge}</div>
             </div>
             
             {judge === "Human" ? (
               <div className="w-full h-full flex items-center justify-center text-orange-400/50 text-sm tracking-widest uppercase animate-pulse">Waiting for Judge to join...</div>
             ) : (
               <div className="w-full h-full bg-gradient-to-b from-orange-950/30 to-black/80 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 rounded-full border border-orange-500/30 flex items-center justify-center text-4xl mb-3 bg-black">
                   ⚖️
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                   <div className="text-orange-500/70 text-xs tracking-[0.2em]">AI LISTENING</div>
                 </div>
               </div>
             )}
          </div>

          {/* SCENARIO & LIVE TRANSCRIPT */}
          <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative">
            
            <div className="absolute top-4 right-6 z-10">
              <button 
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={`text-[10px] px-2 py-1 rounded border ${showSubtitles ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40'} transition-all`}
              >
                {showSubtitles ? 'SUBTITLES ON' : 'SUBTITLES OFF'}
              </button>
            </div>

            <div className="mb-4 pb-4 border-b border-white/10 text-sm text-white/70 leading-relaxed font-serif max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              <span className="text-cyan-400 text-[10px] tracking-widest uppercase block mb-2 font-sans font-bold">Official Case Scenario:</span>
              <span className={isLoadingScenario ? "animate-pulse text-cyan-500/50" : ""}>
                {scenario}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              {transcript.map((line, i) => (
                <div key={i} className={`flex flex-col ${line.role === 'YOU' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${
                    line.role === 'YOU' ? 'text-cyan-400' :
                    line.role === judge || line.role === 'SYSTEM' ? 'text-orange-400' :
                    'text-purple-400'
                  }`}>
                    {line.role}
                  </span>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                    line.role === 'YOU' ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20 rounded-tr-sm' :
                    line.role === judge || line.role === 'SYSTEM' ? 'bg-orange-500/10 text-orange-100 border border-orange-500/20 rounded-tl-sm italic' :
                    'bg-purple-500/10 text-purple-100 border border-purple-500/20 rounded-tl-sm'
                  }`}>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - OPPONENT */}
        <div className="col-span-1 bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden relative flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
           <div className="absolute top-4 right-4 z-10 bg-black/50 px-3 py-1 rounded-md border border-white/10 backdrop-blur-md text-right">
             <div className="text-[10px] text-white/50 uppercase tracking-widest">Opposition</div>
             <div className="text-xs text-white uppercase font-bold">{opponent}</div>
           </div>

           <div className="flex-1 bg-black/50 flex items-center justify-center relative min-h-[300px]">
              {opponent === "AI Sara" ? (
                 <>
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                   {saraVideoUrl ? (
                     <video src={saraVideoUrl} autoPlay className="w-full h-full object-cover" />
                   ) : (
                     <img 
                       src="/sara-human.jpg" 
                       alt="Sara" 
                       className="w-full h-full object-cover grayscale-[0.2]" 
                     />
                   )}
                   
                   {/* Subtitles Overlay */}
                   {showSubtitles && (
                      <div className="absolute bottom-6 left-0 right-0 z-30 px-6 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                         <div className="bg-black/80 px-4 py-2 rounded-lg border border-purple-500/30 text-purple-100 text-sm font-medium text-center backdrop-blur-md">
                            {transcript.filter(t => t.role === opponent).pop()?.text || "..."}
                         </div>
                      </div>
                   )}
                   
                   {!saraVideoUrl && (
                     <div className="absolute bottom-20 left-0 right-0 z-20 flex justify-center gap-[3px] h-6 opacity-60">
                       {[...Array(12)].map((_, i) => (
                         <motion.div 
                           key={i} 
                           animate={{ height: [2, Math.random() * 16 + 8, Math.random() * 8 + 4, Math.random() * 20 + 8, 2] }} 
                           transition={{ repeat: Infinity, duration: 1.2 + Math.random(), delay: i * 0.1 }} 
                           className="w-[4px] bg-purple-400 rounded-full" 
                         />
                       ))}
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
             <div className="flex gap-2 opacity-50">
               <button disabled className="w-full py-2 bg-white/5 border border-white/10 rounded-lg">🎥</button>
               <button disabled className="w-full py-2 bg-white/5 border border-white/10 rounded-lg">🎙️</button>
             </div>
           </div>
        </div>

      </div>
      
      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}