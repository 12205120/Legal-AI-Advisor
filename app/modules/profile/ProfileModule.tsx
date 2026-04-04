"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const lawColleges = [
  "National Law School of India University (NLSIU), Bengaluru",
  "National Law University (NLU), Delhi",
  "NALSAR University of Law, Hyderabad",
  "The West Bengal National University of Juridical Sciences (NUJS), Kolkata",
  "Symbiosis Law School, Pune",
  "Faculty of Law, University of Delhi",
  "Jindal Global Law School, Sonipat",
  "Government Law College, Mumbai",
  "ILS Law College, Pune",
  "Gujarat National Law University (GNLU), Gandhinagar",
];

export default function ProfileModule() {
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER" | null>(null);
  const [studentType, setStudentType] = useState<"LAW_STUDENT" | "NORMAL_USER" | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    college: "",
    registrationNo: "",
    govtId: "",
    judicialId: "",
    otp: "",
  });

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/send_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      if (res.ok) {
        setIsOtpStep(true);
      } else {
        alert("Failed to send OTP. Is the backend running?");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching backend for OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/verify_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await res.json();
      if (data.status === "verified") {
        setIsOtpStep(false);
        setIsAuthenticated(true);
      } else {
        alert("Invalid OTP! Try testing with console if not configured.");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (isOtpStep) {
      setIsOtpStep(false);
      return;
    }
    if (studentType) {
      setStudentType(null);
      return;
    }
    if (authMode) {
      setAuthMode(null);
      return;
    }
    setActiveRole(null);
  };

  // ----------------------------------------------------
  // COMPONENTS
  // ----------------------------------------------------

  const RoleSelection = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center gap-6"
    >
      <h2 className="text-3xl font-bold text-white tracking-widest text-center mb-8 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
        SELECT YOUR JURISDICTION
      </h2>
      <div className="flex flex-wrap justify-center gap-6">
        {[
          { id: "STUDENT", label: "STUDENT / CITIZEN", icon: "🎓", color: "from-cyan-400 to-blue-600" },
          { id: "LAWYER", label: "ADVOCATE", icon: "⚖️", color: "from-purple-400 to-purple-800" },
          { id: "JUDGE", label: "HON'BLE JUDGE", icon: "🔨", color: "from-amber-400 to-orange-600" }
        ].map(role => (
          <motion.div
            key={role.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveRole(role.id)}
            className="cursor-pointer relative overflow-hidden group w-64 h-80 rounded-[30px] border border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${role.color}`} />
            <div className="text-7xl mb-6 filter drop-shadow-lg">{role.icon}</div>
            <h3 className="text-white text-xl font-bold tracking-widest">{role.label}</h3>
            <p className="text-white/40 text-xs mt-2 uppercase tracking-widest">Access Portal</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const ModeSelection = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="flex flex-col items-center max-w-md w-full bg-slate-900/60 backdrop-blur-2xl p-10 border border-white/10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
    >
      <div className="text-5xl mb-6">{activeRole === 'STUDENT' ? '🎓' : activeRole === 'LAWYER' ? '⚖️' : '🔨'}</div>
      <h2 className="text-2xl text-white font-bold mb-8 tracking-widest">CHOOSE ACTION</h2>
      <div className="w-full space-y-4">
        <button 
          onClick={() => setAuthMode("LOGIN")}
          className="w-full py-4 border-2 border-cyan-500/50 text-cyan-400 font-bold rounded-2xl hover:bg-cyan-500/10 transition-all tracking-widest"
        >
          LOGIN
        </button>
        <button 
          onClick={() => setAuthMode("REGISTER")}
          className="w-full py-4 bg-cyan-500 text-black font-black rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] tracking-widest"
        >
          REGISTER
        </button>
      </div>
    </motion.div>
  );

  const StudentTypeSelection = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center max-w-md w-full bg-slate-900/60 backdrop-blur-2xl p-10 border border-white/10 rounded-[40px]"
    >
      <h2 className="text-2xl text-white font-bold mb-8 tracking-widest text-center">ACCOUNT TYPE</h2>
      <div className="w-full space-y-4">
        <button 
          onClick={() => setStudentType("LAW_STUDENT")}
          className="w-full py-6 border border-white/10 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-2"
        >
          <span className="text-3xl">📚</span>
          <span>LAW STUDENT</span>
          <span className="text-xs text-white/40 font-normal">I am studying/practicing law</span>
        </button>
        <button 
          onClick={() => setStudentType("NORMAL_USER")}
          className="w-full py-6 border border-white/10 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-2"
        >
          <span className="text-3xl">👤</span>
          <span>NORMAL USER</span>
          <span className="text-xs text-white/40 font-normal">I want generic access</span>
        </button>
      </div>
    </motion.div>
  );

  const AuthForm = () => {
    return (
      <motion.form
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={isOtpStep ? handleOtpVerify : handleAuthSubmit}
        className="flex flex-col items-center max-w-md w-full bg-slate-900/60 backdrop-blur-2xl p-10 border border-white/10 rounded-[40px]"
      >
        <h2 className="text-xl text-white font-bold mb-6 tracking-widest text-center uppercase">
          {isOtpStep ? "VERIFY OTP" : `${authMode} - ${activeRole}`}
        </h2>

        {isOtpStep ? (
           <div className="w-full space-y-4">
             <p className="text-white/60 text-sm text-center mb-4">A security OTP has been sent to your email.</p>
             <input type="text" name="otp" placeholder="Enter OTP" required value={formData.otp} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-cyan-400 text-center text-2xl tracking-[0.5em]" />
             <button type="submit" className="w-full py-4 bg-cyan-500 text-black font-black rounded-xl hover:bg-white transition-colors mt-4">VERIFY & PROCEED</button>
           </div>
        ) : (
          <div className="w-full space-y-4">
            <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white placeholder-white/30" />
            
            {authMode === "REGISTER" && activeRole === "STUDENT" && studentType === "LAW_STUDENT" && (
              <>
                <select name="college" required value={formData.college} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white appearance-none">
                  <option value="" disabled>Select Law College</option>
                  {lawColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <input type="text" name="registrationNo" placeholder="College Registration No." required value={formData.registrationNo} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white placeholder-white/30" />
              </>
            )}

            {authMode === "REGISTER" && activeRole === "LAWYER" && (
              <input type="text" name="govtId" placeholder="Government Advocate ID" required value={formData.govtId} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white placeholder-white/30" />
            )}

            {authMode === "REGISTER" && activeRole === "JUDGE" && (
              <input type="text" name="judicialId" placeholder="Judicial ID Number" required value={formData.judicialId} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white placeholder-white/30" />
            )}

            <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white placeholder-white/30" />

            {authMode === "REGISTER" && studentType === "NORMAL_USER" && (
              <div className="py-2 flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1"/>
                <span className="text-white/40 text-xs text-center block">OR SIGN UP WITH</span>
                <div className="h-px bg-white/10 flex-1"/>
              </div>
            )}
            
            {authMode === "REGISTER" && studentType === "NORMAL_USER" && (
              <button type="button" className="w-full py-4 border border-white/10 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <span>Google</span>
              </button>
            )}

            <button type="submit" className="w-full py-4 bg-cyan-500 text-black font-black rounded-xl hover:bg-white transition-colors mt-6 tracking-widest">
              {authMode === "LOGIN" ? "SECURE LOGIN" : "REQUEST OTP"}
            </button>
          </div>
        )}
      </motion.form>
    );
  };

  const ProfileDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {/* User Bio Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/20 to-transparent" />
        <div className="w-32 h-32 rounded-full border-4 border-cyan-400 p-1 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.4)] relative z-10 bg-slate-900 flex items-center justify-center text-5xl">
          {activeRole === 'STUDENT' ? '🎓' : activeRole === 'LAWYER' ? '⚖️' : '🔨'}
        </div>
        <h3 className="text-2xl font-bold text-white tracking-widest uppercase z-10">{formData.email.split('@')[0] || "User"}</h3>
        <p className="text-cyan-400/80 text-sm mt-1 z-10 font-medium">
          {activeRole === 'LAWYER' ? 'ADVOCATE' : activeRole === 'JUDGE' ? "HON'BLE JUDGE" : studentType === 'LAW_STUDENT' ? 'LAW STUDENT' : 'CITIZEN'}
        </p>
        {(formData.college || formData.govtId || formData.judicialId) && (
           <p className="text-white/40 text-xs mt-2 text-center max-w-[80%] z-10">
             {formData.college || formData.govtId || formData.judicialId}
           </p>
        )}
        
        <div className="mt-8 w-full space-y-2 z-10">
          <div className="flex justify-between text-[10px] text-white/40 font-bold">
            <span>VERIFICATION STATUS</span>
            <span className="text-green-400">VERIFIED</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 w-full" />
          </div>
        </div>
      </div>

      {/* Modules/Stats Grid */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/5 p-6 rounded-[30px] flex flex-col justify-center hover:bg-white/10 transition-colors cursor-pointer">
          <span className="text-white/40 text-[10px] uppercase tracking-tighter">Registered Email</span>
          <span className="text-lg font-bold mt-2 text-white truncate">{formData.email}</span>
        </div>
        <div className="bg-white/5 border border-white/5 p-6 rounded-[30px] flex flex-col justify-center hover:bg-white/10 transition-colors cursor-pointer">
           <span className="text-white/40 text-[10px] uppercase tracking-tighter">Security Level</span>
           <span className="text-2xl font-bold mt-2 text-cyan-400">Level 4 (OTP)</span>
        </div>
        
        <div className="col-span-2 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 p-8 rounded-[30px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <h4 className="text-xl text-white font-bold mb-2">ACCESS VIRTUAL COURTROOM</h4>
          <p className="text-white/60 text-sm mb-6 max-w-sm">
            Enter the simulation environment based on your current role and jurisdiction settings.
          </p>
          <button className="px-8 py-3 bg-white text-black font-bold tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            ENTER NOW
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="relative min-h-[800px] w-full flex flex-col items-center justify-center overflow-hidden p-6">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0c] to-black z-0 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      {(activeRole || isOtpStep) && !isAuthenticated && (
        <button 
          onClick={goBack}
          className="absolute top-10 left-10 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors p-3 hover:bg-white/5 rounded-xl"
        >
          <span>←</span> <span className="text-sm font-bold tracking-widest uppercase">Back</span>
        </button>
      )}

      <div className="relative z-10 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            !activeRole ? (
              <div key="roles">{RoleSelection()}</div>
            ) : !authMode ? (
              <div key="modes">{ModeSelection()}</div>
            ) : activeRole === "STUDENT" && authMode === "REGISTER" && !studentType ? (
              <div key="student-type">{StudentTypeSelection()}</div>
            ) : (
              <div key="auth-form">{AuthForm()}</div>
            )
          ) : (
            <div key="dashboard">{ProfileDashboard()}</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}