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
  const [studentType, setStudentType] = useState<"LAW_STUDENT" | "NORMAL_USER" | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
    college: "",
    registrationNo: "",
    govtId: "",
    judicialId: ""
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

      if (isLogin) {
        const loginRes = await fetch(`${backendUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const loginData = await loginRes.json();
        if (loginData.status === "success") {
          setUserProfile(loginData.user);
        } else {
          alert("Invalid Login credentials.");
          setIsLoading(false);
          return;
        }
      } else {
        const regRes = await fetch(`${backendUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password, 
            role: activeRole,
            college: formData.college,
            registration_no: formData.registrationNo,
            govt_id: formData.govtId,
            judicial_id: formData.judicialId
          })
        });
        if (!regRes.ok) {
          alert("Registration failed.");
          setIsLoading(false);
          return;
        }
      }

      // Both flows send an OTP for security
      const otpRes = await fetch(`${backendUrl}/send_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });
      if (otpRes.ok) {
        setIsOtpStep(true);
      } else {
        alert("Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/verify_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await res.json();
      if (data.status === "verified") {
        setIsOtpStep(false);
        setIsAuthenticated(true);
      } else {
        alert("Invalid OTP!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dashboard View post-login
  if (isAuthenticated) {
    return (
      <div className="min-h-[800px] w-full flex items-center justify-center p-6 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0c] to-black z-0" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] text-center"
        >
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-cyan-400 flex items-center justify-center text-5xl bg-black mb-6 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            👤
          </div>
          <h2 className="text-3xl font-bold tracking-widest text-white mb-2">{formData.email.split('@')[0]}</h2>
          <p className="text-cyan-400 font-medium tracking-[0.2em] uppercase mb-8">Verified User</p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
              <div className="text-[10px] text-white/50 tracking-widest uppercase mb-1">Email Data</div>
              <div className="text-sm font-bold truncate">{formData.email}</div>
            </div>
            <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
              <div className="text-[10px] text-white/50 tracking-widest uppercase mb-1">Security</div>
              <div className="text-sm font-bold text-green-400">Level 4 Confirmed</div>
            </div>
          </div>
          <button onClick={() => { setIsAuthenticated(false); setFormData({name:"", email:"", password:"", otp:"", college:"", registrationNo:"", govtId:"", judicialId:""}) }} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all tracking-widest uppercase text-xs font-bold">
            Secure Logout
          </button>
        </motion.div>
      </div>
    );
  }

  // OTP View
  if (isOtpStep) {
    return (
      <div className="min-h-[800px] w-full flex items-center justify-center p-6 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0c] to-black z-0" />
        <motion.form onSubmit={handleOtpVerify} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-bold tracking-widest mb-6">SECURITY OTP</h2>
          <p className="text-sm text-white/60 mb-6">Enter code sent to {formData.email}</p>
          <input type="text" name="otp" value={formData.otp} onChange={handleInputChange} placeholder="• • • • • •" className="w-full text-center text-3xl tracking-[0.5em] bg-black/50 border border-cyan-500/50 p-4 rounded-xl focus:outline-none focus:border-cyan-400 mb-6 text-cyan-400" required />
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            {isLoading ? "Verifying..." : "Confirm Identity"}
          </button>
          <button type="button" onClick={() => setIsOtpStep(false)} className="mt-4 text-xs text-white/40 hover:text-white uppercase tracking-widest block w-full text-center">Cancel</button>
        </motion.form>
      </div>
    );
  }

  // Component: Role Selection
  if (!activeRole) {
    return (
      <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0c] to-black z-0 pointer-events-none" />
        <h2 className="text-3xl font-bold tracking-widest text-center mb-8 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10">
          SELECT YOUR JURISDICTION
        </h2>
        <div className="flex flex-wrap justify-center gap-6 z-10">
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
              className="cursor-pointer relative overflow-hidden group w-64 h-80 rounded-[30px] border border-white/10 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${role.color}`} />
              <div className="text-7xl mb-6 filter drop-shadow-lg">{role.icon}</div>
              <h3 className="text-xl font-bold tracking-widest">{role.label}</h3>
              <p className="text-white/40 text-xs mt-2 uppercase tracking-widest">Access Portal</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Component: Student Type Selection
  if (activeRole === "STUDENT" && !studentType) {
    return (
      <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0c] to-black z-0 pointer-events-none" />
        <button onClick={() => setActiveRole(null)} className="absolute top-10 left-10 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors p-3 hover:bg-white/5 rounded-xl uppercase tracking-widest text-xs font-bold">← Back</button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center max-w-md w-full bg-slate-900/60 backdrop-blur-2xl p-10 border border-white/10 rounded-[40px] z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-bold mb-8 tracking-widest text-center">ACCOUNT TYPE</h2>
          <div className="w-full space-y-4">
            <button onClick={() => setStudentType("LAW_STUDENT")} className="w-full py-6 border border-white/10 bg-white/5 font-bold rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-2">
              <span className="text-3xl">📚</span>
              <span>LAW STUDENT</span>
              <span className="text-xs text-white/40 font-normal">I am studying/practicing law</span>
            </button>
            <button onClick={() => setStudentType("NORMAL_USER")} className="w-full py-6 border border-white/10 bg-white/5 font-bold rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-2">
              <span className="text-3xl">👤</span>
              <span>NORMAL USER</span>
              <span className="text-xs text-white/40 font-normal">I want generic access</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dynamic Content logic for overlays
  const getQuotes = () => {
    if (activeRole === "JUDGE") {
      return {
        fact: "The Supreme Court of India officially came into existence on 28 January 1950.",
        axiom: "A Judge is not a gladiator. Their primary goal is absolute justice, not dominance."
      };
    } else if (activeRole === "LAWYER") {
      return {
        fact: "The Advocates Act of 1961 strictly governs the legal framework for all legal practitioners in India.",
        axiom: "An Advocate is a rigorous champion of justice, sworn to protect the integrity of the court."
      };
    } else if (activeRole === "STUDENT" && studentType === "LAW_STUDENT") {
      return {
        fact: "The Constitution of India is the longest written constitution of any sovereign country in the world.",
        axiom: "The Law is reason, absolutely free from passion. Study the ancient precedents meticulously."
      };
    } else {
      // Normal User / Default
      return {
        fact: "Article 21: No person shall be deprived of his life or personal liberty except according to procedure established by law.",
        axiom: "Ignorantia juris non excusat: Ignorance of the law excuses no one. Always know your rights."
      };
    }
  };

  const { fact, axiom } = getQuotes();

  // Main Sliding Animated Login/Register View
  return (
    <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0c] to-[#050505] z-0 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <button onClick={() => studentType ? setStudentType(null) : setActiveRole(null)} className="absolute top-10 left-10 z-50 flex items-center gap-2 text-white/50 hover:text-white transition-colors p-3 hover:bg-white/5 rounded-xl uppercase tracking-widest text-xs font-bold">
        ← Change Role
      </button>

      {/* Container */}
      <div className="relative z-10 w-[800px] h-[500px] bg-slate-900/60 backdrop-blur-2xl rounded-[30px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex">
        
        {/* Form Container (Behind Overlay) */}
        <div className="w-full h-full relative">
          
          {/* Sign In Form (Left Side) */}
          <motion.div 
            className="absolute top-0 left-0 w-1/2 h-full p-10 flex flex-col justify-center"
            initial={false}
            animate={{ zIndex: isLogin ? 10 : 0, opacity: isLogin ? 1 : 0, x: isLogin ? 0 : 50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <h2 className="text-3xl font-bold text-white tracking-widest mb-2 text-center uppercase">Login</h2>
            <p className="text-white/40 text-xs tracking-widest mb-8 text-center">Welcome back</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors" required />
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors" required />
              <button disabled={isLoading} className="w-full py-3 mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                {isLoading ? "Processing..." : "SIGN IN"}
              </button>
            </form>
          </motion.div>

          {/* Sign Up Form (Right Side) */}
          <motion.div 
            className="absolute top-0 right-0 w-1/2 h-full p-10 flex flex-col justify-center"
            initial={false}
            animate={{ zIndex: !isLogin ? 10 : 0, opacity: !isLogin ? 1 : 0, x: !isLogin ? 0 : -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <h2 className="text-3xl font-bold text-white tracking-widest mb-2 text-center uppercase">Register</h2>
            <p className="text-white/40 text-xs tracking-widest mb-8 text-center">Create account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Name" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors" required />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors" required />
              
              {/* Dynamic Role Inputs */}
              {activeRole === "STUDENT" && studentType === "LAW_STUDENT" && (
                <>
                  <select name="college" required value={formData.college} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-xs appearance-none">
                    <option value="" disabled>Select Law College</option>
                    {lawColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                  <input type="text" name="registrationNo" placeholder="Registration No." required value={formData.registrationNo} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-cyan-400 transition-colors" />
                </>
              )}
              {activeRole === "LAWYER" && (
                 <input type="text" name="govtId" placeholder="Govt Advocate ID" required value={formData.govtId} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-cyan-400 transition-colors" />
              )}
              {activeRole === "JUDGE" && (
                 <input type="text" name="judicialId" placeholder="Judicial ID Number" required value={formData.judicialId} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-cyan-400 transition-colors" />
              )}

              <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-cyan-400 focus:outline-none transition-colors" required />
              <button disabled={isLoading} className="w-full py-2 mt-4 bg-purple-500 hover:bg-purple-400 text-white font-bold tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {isLoading ? "Processing..." : "SIGN UP"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Sliding Overlay Panel */}
        <motion.div 
          className="absolute top-0 left-0 w-1/2 h-full z-20 overflow-hidden"
          initial={false}
          animate={{ x: isLogin ? "100%" : "0%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="w-[200%] h-full bg-gradient-to-br from-cyan-600 to-purple-600 relative left-[-100%] flex" >
            
            {/* Overlay Panel Left */}
            <motion.div 
              className="w-1/2 h-full flex flex-col justify-center items-center p-10 text-center"
              initial={false}
              animate={{ x: isLogin ? "0%" : "20%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <h2 className="text-3xl font-bold text-white tracking-widest mb-4">Law Fact</h2>
              <p className="text-white/80 text-xs mb-8 leading-relaxed max-w-[200px]">
                "{fact}"
              </p>
              <button 
                onClick={() => setIsLogin(true)}
                className="px-8 py-3 border-2 border-white text-white font-bold tracking-widest uppercase rounded-full hover:bg-white hover:text-purple-600 transition-colors"
              >
                Sign In Instead
              </button>
            </motion.div>

            {/* Overlay Panel Right */}
            <motion.div 
              className="w-1/2 h-full flex flex-col justify-center items-center p-10 text-center relative pointer-events-auto"
              initial={false}
              animate={{ x: isLogin ? "-20%" : "0%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <h2 className="text-3xl font-bold text-white tracking-widest mb-4">Judicial Axiom</h2>
              <p className="text-white/80 text-xs mb-8 leading-relaxed max-w-[200px]">
                "{axiom}"
              </p>
              <button 
                onClick={() => setIsLogin(false)}
                className="px-8 py-3 border-2 border-white text-white font-bold tracking-widest uppercase rounded-full hover:bg-white hover:text-cyan-600 transition-colors"
                style={{ pointerEvents: 'auto' }}
              >
                Register
              </button>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}