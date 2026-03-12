import os
import requests
from tqdm import tqdm

def download_file(url, destination):
    if os.path.exists(destination):
        print(f"--- [EXISTS] {destination} ---")
        return
    
    print(f"--- [DOWNLOADING] {destination} ---")
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(destination, 'wb') as file, tqdm(
        total=total_size, unit='B', unit_scale=True, desc=destination
    ) as bar:
        for data in response.iter_content(chunk_size=1024):
            file.write(data)
            bar.update(len(data))

# 1. CREATE DIRECTORY STRUCTURE
paths = [
    "checkpoints", 
    "temp", 
    "Wav2Lip/face_detection/detection/sfd"
]

for path in paths:
    os.makedirs(path, exist_ok=True)

# 2. DEFINE MODEL URLS
# Using reliable mirrors for Wav2Lip and Face Detection weights
models = {
    "checkpoints/wav2lip_gan.pth": "https://huggingface.co/justinjohn0306/Wav2Lip/resolve/main/wav2lip_gan.pth",
    "Wav2Lip/face_detection/detection/sfd/s3fd.pth": "https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth"
}

if __name__ == "__main__":
    print("NYAYAAI NEURAL INITIALIZER: Shaik Rameez Protocol V11.0")
    for local_path, url in models.items():
        try:
            download_file(url, local_path)
        except Exception as e:
            print(f"Error downloading {local_path}: {e}")
    
    print("\n--- ARCHITECTURE READY ---")



blue interface-
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Trophy, FilePlus, Gavel, Sparkles, Camera, Mic, MicOff, VideoOff, 
  PowerOff, BrainCircuit, BarChart3, Network, Database, BookOpen, 
  UserCheck, Settings2, ChevronDown, Download, Send, CheckCircle2, 
  AlertCircle, History, Info, Layers, Cpu, FileText, Zap, ShieldCheck, User, Volume2
} from 'lucide-react';

/**
 * CINEMATIC LOGIN COMPONENT: THE SUPREME COURT SEQUENCE
 */
const JudicialLogin = ({ onComplete }) => {
  const [stage, setStage] = useState('exterior'); 

  useEffect(() => {
    if (stage === 'exterior') setTimeout(() => setStage('interior'), 1500);
    if (stage === 'interior') setTimeout(() => setStage('gavel-hit'), 1200);
  }, [stage]);

  const handleLoginAction = () => {
    setStage('reverse-pop');
    setTimeout(() => setStage('zoom-out'), 800);
    setTimeout(onComplete, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1 }}
        animate={{ 
          scale: (stage === 'exterior') ? 1.2 : (stage === 'interior' || stage === 'gavel-hit') ? 3 : 1,
          filter: (stage === 'login-active') ? "blur(10px) brightness(0.3)" : "blur(0px) brightness(0.6)"
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      >
        <img 
          src="/supremecourt.jpg" 
          className="w-full h-full object-cover"
          alt="Supreme Court of India"
        />
      </motion.div>

      {(stage === 'interior' || stage === 'gavel-hit' || stage === 'zoom-out') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: stage === 'gavel-hit' ? 1.5 : 1 }}
          className="relative z-10 text-amber-500 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]"
        >
          <motion.div
            animate={{ 
              rotate: stage === 'gavel-hit' ? [0, -45, 20, 0] : 0,
              y: stage === 'gavel-hit' ? [0, -20, 10, 0] : 0
            }}
            onAnimationComplete={() => {
              if(stage === 'gavel-hit') setStage('login-active');
            }}
            transition={{ duration: 0.6 }}
          >
            <Gavel size={200} strokeWidth={1} />
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {(stage === 'login-active') && (
          <motion.div 
            initial={{ y: "-100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="absolute inset-0 z-[100] flex items-start justify-center pt-20"
          >
            <div className="w-[500px] bg-black border-x-4 border-b-4 border-cyan-500 rounded-b-[60px] p-12 shadow-[0_50px_100px_rgba(6,182,212,0.3)]">
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-4">
                  <UserCheck size={40} className="text-cyan-400" />
                  <div className="h-10 w-[2px] bg-white/20" />
                  <Scale size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter italic">ADVOCATE LOGIN</h2>
                <div className="w-full space-y-4 mt-4">
                  <button onClick={handleLoginAction} className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs flex items-center justify-center gap-4 hover:bg-cyan-400 transition-all active:scale-95">CONNECT VIA GOOGLE_ID</button>
                  <button className="w-full py-5 border border-white/10 rounded-2xl font-black text-[9px] text-white/40 tracking-widest hover:bg-white/5">MANUAL SIGNUP / REGISTER</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function NyayaAIOS_Final_V7() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [usageTracker, setUsageTracker] = useState({});
  const [activeModule, setActiveModule] = useState("trainer");
  const [trainerSub, setTrainerSub] = useState("virtual");
  const [lawDomain, setLawDomain] = useState("Criminal Law (BNS)");
  const [isLawOpen, setIsLawOpen] = useState(false);
  
  // Media States
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [courtRole, setCourtRole] = useState("Victim"); // User side
  const [transcript, setTranscript] = useState("JUDGE_PATHAAN (Audio): The bench is now in session. Counsel, you have the floor.");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const toggleCamera = async () => {
    if (!cameraActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraActive(true);
      } catch (err) { console.error("Camera error", err); }
    } else {
      streamRef.current?.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const checkAccess = (id) => {
    if (isLoggedIn) return true;
    if (usageTracker[id]) { setShowLogin(true); return false; }
    setUsageTracker(prev => ({ ...prev, [id]: true }));
    return true;
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-[#010208] text-white flex p-4 gap-4 overflow-hidden font-mono">
      <AnimatePresence>
        {showLogin && (
          <JudicialLogin onComplete={() => { setIsLoggedIn(true); setShowLogin(false); }} />
        )}
      </AnimatePresence>

      <aside className="w-24 border border-white/10 rounded-[45px] bg-black/40 flex flex-col items-center py-10 shrink-0 backdrop-blur-3xl">
        <div className="mb-16 relative"><Scale size={32} className="text-cyan-400" /></div>
        <nav className="flex flex-col gap-10 flex-1">
          <SidebarIcon active={activeModule === 'trainer'} icon={<Trophy/>} label="TRAINER" onClick={() => checkAccess('trainer') && setActiveModule('trainer')} />
          <SidebarIcon active={activeModule === 'mapper'} icon={<Network/>} label="MAPPER" onClick={() => checkAccess('mapper') && setActiveModule('mapper')} />
          <SidebarIcon active={activeModule === 'bail'} icon={<FilePlus/>} label="BAIL" onClick={() => checkAccess('bail') && setActiveModule('bail')} />
          <SidebarIcon active={activeModule === 'profile'} icon={<UserCheck/>} label="PROFILE" onClick={() => checkAccess('profile') && setActiveModule('profile')} />
        </nav>
        <Settings2 size={20} className="opacity-20 hover:opacity-100 cursor-pointer" />
      </aside>

      <main className="flex-1 flex flex-col gap-4 overflow-hidden">
        <header className="h-24 border border-white/5 rounded-[40px] bg-black/60 flex items-center justify-between px-10 shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic">NYAYAAI <span className="text-cyan-500 underline underline-offset-4">OS_V7</span></h1>
          </div>
          
          {/* JUDGE PATHAAN AUDIO INDICATOR */}
          <div className="flex items-center gap-4 bg-amber-500/5 px-6 py-3 rounded-3xl border border-amber-500/20">
             <div className="flex items-end gap-[2px] h-4">
                {[1, 2, 3, 4, 3, 5, 2].map((h, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [`${h*20}%`, `${h*35}%`, `${h*20}%`] }} 
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-1 bg-amber-500 rounded-full" 
                  />
                ))}
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Judge Pathaan</span>
               <span className="text-[7px] text-amber-500/50 uppercase">Audio Monitor Active</span>
             </div>
          </div>
        </header>

        {activeModule === 'trainer' && (
          <nav className="flex gap-2.5 shrink-0 px-2">
            {[
              { id: 'gen', label: 'Scenario Gen', icon: <Sparkles size={12}/> },
              { id: 'solve', label: 'Logic Solver', icon: <Cpu size={12}/> },
              { id: 'assessment', label: 'Assessment', icon: <Trophy size={12}/> },
              { id: 'virtual', label: 'Virtual Court', icon: <Gavel size={12}/> },
              { id: 'library', label: 'Library', icon: <BookOpen size={12}/> }
            ].map(tab => (
              <button key={tab.id} onClick={() => checkAccess(tab.id) && setTrainerSub(tab.id)} className={`px-8 py-3 rounded-full text-[9px] font-black tracking-widest border transition-all flex items-center gap-3 ${trainerSub === tab.id ? 'bg-cyan-400 text-black border-cyan-400' : 'text-slate-500 border-white/5 bg-white/5'}`}>
                {tab.icon} {tab.label.toUpperCase()}
              </button>
            ))}
          </nav>
        )}

        <div className="flex-1 min-h-0 relative">
          
          {/* VIRTUAL COURT: 1v1 DEBATE DASHBOARD */}
          {activeModule === 'trainer' && trainerSub === 'virtual' && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex justify-center gap-3">
                {["Victim", "Accused"].map(role => (
                  <button key={role} onClick={() => setCourtRole(role)} className={`px-10 py-3 rounded-full text-[10px] font-black tracking-widest border transition-all ${courtRole === role ? 'bg-white text-black border-white' : 'text-white/40 border-white/10 hover:border-white/30'}`}>
                    I AM {role.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex gap-4 min-h-0">
                {/* USER PANEL (YOU) */}
                <div className="flex-1 rounded-[50px] border-2 border-white/10 bg-[#080808] relative flex items-center justify-center overflow-hidden">
                    {cameraActive ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center opacity-20">
                        <User size={64} className="mb-4" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase">Connect Camera</span>
                      </div>
                    )}
                    <div className="absolute top-8 left-8 bg-white text-black px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {courtRole} (YOU)
                    </div>
                    <div className="absolute bottom-8 flex gap-4 bg-black/80 p-4 rounded-3xl border border-white/10 backdrop-blur-xl">
                        <button onClick={toggleCamera} className={`p-4 rounded-2xl ${cameraActive ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>
                          {cameraActive ? <Camera size={20}/> : <VideoOff size={20}/>}
                        </button>
                        <button onClick={() => setMicActive(!micActive)} className={`p-4 rounded-2xl ${micActive ? 'bg-red-500' : 'bg-white/5 hover:bg-white/10'}`}>
                          <Mic size={20}/>
                        </button>
                    </div>
                </div>

                {/* MIDDLE DASHBOARD: THE DEBATE FEED */}
                <div className="w-1/3 rounded-[50px] border border-cyan-500/20 bg-black/40 p-8 flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.05)]">
                    <div className="text-center border-b border-white/5 pb-4 mb-6">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.4em]">Live Debate Feed</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        <p className="text-[11px] leading-relaxed italic text-white/80">
                          <span className="text-cyan-400 font-black not-italic block mb-1">SARA ({courtRole === "Victim" ? "Accused" : "Victim"}):</span>
                          The evidence suggests a clear lapse in duty...
                        </p>
                        <p className="text-[11px] leading-relaxed italic text-white/40 border-l-2 border-white/10 pl-4">
                          <span className="text-white/60 font-black not-italic block mb-1 uppercase">YOUR DEFENSE ({courtRole}):</span>
                          [Speak now to see transcription...]
                        </p>
                    </div>
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                       <span className="text-[8px] font-black text-amber-500/60 uppercase italic">Pathaan is grading...</span>
                       <Zap size={14} className="text-amber-500 animate-pulse" />
                    </div>
                </div>

                {/* SARA PANEL (CO-COUNSEL / OPPONENT) */}
                <div className="flex-1 rounded-[50px] border-2 border-white/10 bg-[#080808] relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80" 
                      className="w-full h-full object-cover brightness-[0.3]" 
                    />
                    <div className="absolute top-8 right-8 bg-cyan-500 text-black px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
                      SARA ({courtRole === "Victim" ? "Accused" : "Victim"})
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-20 h-20 rounded-full border border-cyan-500/30 animate-ping opacity-20" />
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGIC SOLVER (REMAINING UNCHANGED) */}
          {activeModule === 'trainer' && trainerSub === 'solve' && (
            <div className="h-full grid grid-cols-12 gap-4">
              <GridBox title="INPUT SCENARIO" icon={<Info size={18}/>} className="col-span-5">
                <textarea className="flex-1 bg-white/5 border border-white/10 rounded-[30px] p-8 outline-none text-xs italic leading-loose" placeholder="Input legal facts..." />
              </GridBox>
              <GridBox title="LOGIC NODES" icon={<Network size={18}/>} className="col-span-7">
                <div className="grid grid-cols-2 gap-4">
                  {["Motive Analysis", "Statutory Fit", "Evidence Weight", "Chain Analysis"].map((node, i) => (
                    <div key={i} className="bg-black border border-white/10 p-6 rounded-[30px] flex flex-col gap-3 group hover:border-cyan-500 transition-all text-cyan-400 font-black uppercase text-[10px] tracking-tighter"><CheckCircle2 size={14}/>{node}</div>
                  ))}
                </div>
              </GridBox>
            </div>
          )}

          {/* LIBRARY MODULE (REMAINING UNCHANGED) */}
          {activeModule === 'trainer' && trainerSub === 'library' && (
            <div className="h-full grid grid-cols-12 gap-4">
              <GridBox title="NEURAL SEARCH" icon={<BrainCircuit size={18}/>} className="col-span-7">
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto text-[11px] text-white/70 italic">Analyzing case history...</div>
                <div className="flex gap-4 items-center bg-white/5 p-4 rounded-[30px] border border-white/10"><input className="flex-1 bg-transparent outline-none text-xs px-4" placeholder="Deep Search..." /><button className="p-4 bg-cyan-500 text-black rounded-2xl"><Send size={18}/></button></div>
              </GridBox>
              <GridBox title="STATISTICS" icon={<BarChart3 size={18}/>} className="col-span-5">
                <div className="grid grid-cols-1 gap-4 text-center">
                    <div className="p-8 bg-black border border-white/5 rounded-3xl"><span className="text-4xl font-black text-cyan-400">92%</span><p className="text-[8px] mt-2 opacity-40 uppercase tracking-widest">Accuracy</p></div>
                </div>
              </GridBox>
            </div>
          )}

          {/* ASSESSMENT (REMAINING UNCHANGED) */}
          {activeModule === 'trainer' && trainerSub === 'assessment' && (
            <div className="h-full grid grid-cols-2 gap-6 p-2">
                <div className="bg-[#080808] border border-white/10 rounded-[50px] p-10 flex flex-col justify-center">
                    <h2 className="text-2xl font-black italic mb-10 leading-snug">"Can a witness testimony recorded via video link be treated as Primary Evidence?"</h2>
                    <div className="space-y-4">
                        {["Yes, Under BNS", "No, Secondary Only"].map((opt, i) => (
                            <button key={i} className={`w-full p-6 rounded-3xl border text-[10px] font-black uppercase text-left bg-white/5 border-white/5`}>{opt}</button>
                        ))}
                    </div>
                </div>
                <div className="bg-[#050505] border border-white/5 rounded-[50px] p-10 flex flex-col items-center justify-center">
                    <BrainCircuit size={80} className="opacity-10 mb-4" />
                </div>
            </div>
          )}

          {/* SCENARIO GEN (REMAINING UNCHANGED) */}
          {activeModule === 'trainer' && trainerSub === 'gen' && (
            <div className="h-full grid grid-cols-3 gap-4">
              <GridBox title="01. PARAMETERS" icon={<Settings2 size={18}/>}>
                <div className="space-y-6">
                  <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-[10px] outline-none"><option>Financial Fraud</option><option>Digital Trespass</option></select>
                  <button className="w-full py-5 bg-cyan-500 text-black font-black text-[10px] rounded-2xl tracking-widest uppercase">Initialize Seed</button>
                </div>
              </GridBox>
              <GridBox title="02. VOICE INPUT" icon={<Mic size={18}/>}>
                <div className="flex-1 flex flex-col">
                  <textarea defaultValue="The accused was seen entering..." className="flex-1 bg-white/5 border border-dashed border-white/10 rounded-3xl p-6 mb-4 bg-transparent text-[11px] text-cyan-400 italic outline-none" />
                </div>
              </GridBox>
              <GridBox title="03. AI PREDICTION" icon={<CheckCircle2 size={18}/>}>
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center"><Trophy size={40} className="text-emerald-500" /></div>
                  <h4 className="text-lg font-black italic uppercase">Probability: 88%</h4>
                </div>
              </GridBox>
            </div>
          )}

          {/* MAPPER (REMAINING UNCHANGED) */}
          {activeModule === 'mapper' && (
            <div className="h-full grid grid-cols-2 gap-8">
                <GridBox title="LEGACY (IPC)" icon={<History size={24}/>}><input className="w-full bg-transparent border-b-2 border-white/10 text-[8rem] font-black text-center outline-none focus:border-cyan-400 mb-8" placeholder="302" /></GridBox>
                <GridBox title="MODERN (BNS)" icon={<Database size={24}/>}><div className="flex-1 flex flex-col items-center justify-center"><span className="text-8xl font-black text-cyan-400 italic">101</span></div></GridBox>
            </div>
          )}

          {/* PROFILE (REMAINING UNCHANGED) */}
          {activeModule === 'profile' && (
            <div className="h-full flex items-center justify-center">
              <div className="w-[500px] bg-black border border-white/10 rounded-[60px] p-16 text-center shadow-3xl">
                <div className="w-32 h-32 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center mx-auto mb-8"><UserCheck size={64} className="text-cyan-400" /></div>
                <h2 className="text-2xl font-black italic mb-2 uppercase tracking-widest">Judicial_Master</h2>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GridBox({ title, icon, children, className = "" }) {
  return (
    <div className={`bg-[#050505] border border-white/10 rounded-[40px] flex flex-col overflow-hidden ${className}`}>
      <div className="px-8 py-5 border-b border-white/5 flex items-center gap-4">
        <div className="text-cyan-400">{icon}</div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="flex-1 p-6 flex flex-col">{children}</div>
    </div>
  );
}

function SidebarIcon({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-4 transition-all ${active ? 'opacity-100 scale-110' : 'opacity-20 hover:opacity-100'}`}>
      <div className={`p-5 rounded-[25px] border-2 ${active ? 'bg-cyan-400 text-black border-cyan-400' : 'border-white/10 text-white'}`}>
        {icon}
      </div>
      <span className="text-[7px] font-black tracking-[0.4em] uppercase">{label}</span>
    </button>
  );
}