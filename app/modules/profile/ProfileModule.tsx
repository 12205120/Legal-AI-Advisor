import { useState, useEffect } from "react";
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
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    otp: "",
    college: "",
    registrationNo: "",
    govtId: "",
    judicialId: ""
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("nyaya_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserProfile(user);
        setFormData(prev => ({ 
          ...prev, 
          firstName: user.firstName || user.first_name || "", 
          email: user.email || "" 
        }));
        setActiveRole(user.role || "STUDENT");
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Direct Implementation: Use Vercel Serverless Functions (/api/auth)
      // This ensures 24/7 automation without a local server.
      const authUrl = "/api/auth";

      if (isLogin) {
        // Now calling Node.js instead of Python
        const loginRes = await fetch(`${authUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const loginData = await loginRes.json();
        if (loginData.status === "success") {
          setUserProfile(loginData.user);
          setFormData(prev => ({
            ...prev,
            firstName: loginData.user.first_name || "",
            lastName: loginData.user.last_name || ""
          }));
        } else {
          alert(loginData.error || "Invalid Login credentials.");
          setIsLoading(false);
          return;
        }
      } else {
        // Now calling Node.js instead of Python
        const regRes = await fetch(`${authUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password, 
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: activeRole,
            college: formData.college,
            registration_no: formData.registrationNo,
            govt_id: formData.govtId,
            judicial_id: formData.judicialId
          })
        });
        const regData = await regRes.json();
        if (regData.status !== "success") {
          alert(regData.error || "Registration failed.");
          setIsLoading(false);
          return;
        }
      }

      // Both flows send an OTP via the new Node.js server
      const otpRes = await fetch(`${authUrl}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      });

      if (otpRes.ok) {
        const otpData = await otpRes.json();
        if (otpData.status === "success") {
          setIsOtpStep(true);
        } else {
          alert(otpData.message || "Failed to send OTP.");
        }
      } else {
        alert("Authentication server error.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reaching authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent, manualOtp?: string) => {
    e.preventDefault();
    setIsLoading(true);
    const otpToVerify = manualOtp || formData.otp;
    try {
      const authUrl = "/api/auth";
      const res = await fetch(`${authUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: otpToVerify })
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsOtpStep(false);
        setIsAuthenticated(true);
        // Save to localStorage
        const userData = { 
          email: formData.email, 
          firstName: formData.firstName || userProfile?.first_name || "", 
          role: activeRole, 
          ...userProfile 
        };
        localStorage.setItem("nyaya_user", JSON.stringify(userData));
      } else {
        alert(data.error || "Invalid Verification Code!");
      }
    } catch (err) {
      console.error(err);
      alert("Verification server reachable but failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dashboard View post-login
  if (isAuthenticated) {
    const stats = [
      { label: "Total Usage", value: "24.5", unit: "Hrs", icon: "🕒", color: "from-red-600/20 to-black/40" },
      { label: "Learnings", value: "12", unit: "Modules", icon: "📚", color: "from-yellow-600/20 to-black/40" },
      { label: "Cases Solved", value: "156", unit: "Cases", icon: "⚖️", color: "from-red-700/20 to-black/40" },
      { label: "AI Interactions", value: "842", unit: "Queries", icon: "🤖", color: "from-yellow-500/20 to-black/40" },
    ];

    const modules = [
      { name: "Bharatiya Nyaya Sanhita (BNS)", progress: 75, color: "bg-red-600" },
      { label: "Bharatiya Nagarik Suraksha Sanhita (BNSS)", progress: 45, color: "bg-yellow-600" },
      { label: "Bharatiya Sakshya Adhiniyam (BSA)", progress: 90, color: "bg-red-500" },
    ];

    const history = [
      { action: "Consulted AI Sara on CrPC Sec 144", time: "2 hours ago", type: "AI Consult" },
      { action: "Completed Module: BNS Fundamentals", time: "5 hours ago", type: "Learning" },
      { action: "Drafted Legal Notice: Rent Dispute", time: "Yesterday", type: "Drafting" },
      { action: "Virtual Court Simulation: Session 4", time: "2 days ago", type: "Simulation" },
    ];

    return (
      <div className="min-h-screen w-full bg-black text-white p-4 md:p-10 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#121212]/80 backdrop-blur-xl border border-red-600/20 p-8 rounded-3xl">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-600 to-black flex items-center justify-center text-4xl font-bold shadow-xl shadow-red-500/20 border border-yellow-500/30">
                {formData.firstName?.[0] || formData.email[0].toUpperCase()}
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-google font-bold text-white mb-2">Welcome back, {formData.firstName}!</h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-red-600/20 border border-red-600/30 rounded-full text-red-500 text-xs font-semibold uppercase tracking-wider">
                    {activeRole}
                  </span>
                  <span className="text-gray-400 text-sm">{formData.email}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { 
                setIsAuthenticated(false); 
                setIsOtpStep(false);
                setFormData({firstName: "", lastName: "", email: "", password: "", otp: "", college: "", registrationNo: "", govtId: "", judicialId: ""});
                localStorage.removeItem("nyaya_user");
              }} 
              className="px-8 py-3 bg-[#111] hover:bg-red-600 border border-red-600/30 rounded-xl text-white font-google transition-all flex items-center gap-2 group"
            >
              <span className="group-hover:translate-x-1 transition-transform">Sign Out</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`p-6 bg-gradient-to-br ${stat.color} backdrop-blur-md border border-white/5 rounded-3xl relative overflow-hidden group`}
              >
                <div className="absolute -right-4 -top-4 text-6xl opacity-5 group-hover:scale-125 transition-transform duration-500">{stat.icon}</div>
                <div className="flex flex-col items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">{stat.icon}</div>
                  <div>
                    <div className="text-3xl font-bold font-google tracking-tight">{stat.value} <span className="text-sm font-medium opacity-60">{stat.unit}</span></div>
                    <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Learning Progress */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-google font-bold ml-2">Module Rankings</h2>
              <div className="bg-[#1a1a1b]/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl space-y-8">
                {modules.map((mod, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300 font-medium">{mod.name || (mod as any).label}</span>
                      <span className="text-red-500 font-bold">{mod.progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${mod.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                        className={`h-full ${mod.color} rounded-full relative`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 animate-pulse" />
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History Feed */}
            <div className="space-y-6">
              <h2 className="text-2xl font-google font-bold ml-2">History Log</h2>
              <div className="bg-[#1a1a1b]/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {history.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + (i * 0.1) }}
                      className="p-5 hover:bg-red-600/10 transition-colors cursor-default group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">{item.type}</span>
                        <span className="text-[10px] text-gray-500 uppercase">{item.time}</span>
                      </div>
                      <p className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">{item.action}</p>
                    </motion.div>
                  ))}
                </div>
                <button className="w-full py-4 text-sm text-gray-500 hover:text-red-500 hover:bg-black transition-all font-medium border-t border-white/5">
                  View All History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VISME-STYLE ANIMATED FULLSCREEN FLOW ──
  
  const slideVariants = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -30, scale: 0.98, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
  };

  const currentStepKey = isOtpStep 
    ? "otp" 
    : (!isLogin && !activeRole) 
    ? "role" 
    : (!isLogin && activeRole === "STUDENT" && !studentType) 
    ? "student_type" 
    : "details";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Visme-style animated background accents */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-red-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-yellow-600/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          
          {currentStepKey === "otp" && (
            <motion.div key="step-otp" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-12 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center">
              <div className="text-5xl mb-6">🔒</div>
              <h2 className="text-4xl font-black tracking-tight mb-3">Verification Required</h2>
              <p className="text-gray-400 text-lg mb-10">We've sent a secure code to <span className="text-white font-medium">{formData.email}</span></p>
              
              <form onSubmit={handleOtpVerify} className="space-y-8">
                <input 
                  type="text" name="otp" value={formData.otp} onChange={handleInputChange} 
                  placeholder="Enter 6-digit code" 
                  className="w-full bg-black/50 border border-white/10 p-6 rounded-2xl text-white text-center text-3xl tracking-[0.5em] focus:border-red-500 focus:outline-none transition-colors shadow-inner" 
                  required 
                />
                <button type="submit" disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-lg font-bold tracking-widest uppercase rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]">
                  {isLoading ? "Verifying Identity..." : "Complete Access"}
                </button>
              </form>
              <button onClick={() => setIsOtpStep(false)} className="mt-8 text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">
                Cancel & Go Back
              </button>
            </motion.div>
          )}

          {currentStepKey === "role" && (
            <motion.div key="step-role" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center">
              <div className="text-red-500 font-bold tracking-[0.3em] uppercase text-sm mb-4">Step 1 of 3</div>
              <h2 className="text-5xl md:text-6xl font-black text-center mb-12 tracking-tighter">Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Legal Identity</span></h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {[
                  { id: "STUDENT", label: "Citizen / Student", icon: "👤", desc: "Access basic resources" },
                  { id: "LAWYER", label: "Advocate", icon: "⚖️", desc: "Professional suite" },
                  { id: "JUDGE", label: "Hon'ble Judge", icon: "🔨", desc: "Judicial simulation" }
                ].map(role => (
                  <motion.div
                    key={role.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveRole(role.id)}
                    className="cursor-pointer p-8 rounded-3xl border border-white/10 bg-[#121212]/80 backdrop-blur-xl flex flex-col items-center text-center transition-all hover:border-red-500/50 hover:bg-red-500/5 group"
                  >
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{role.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{role.label}</h3>
                    <p className="text-gray-500 text-sm">{role.desc}</p>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setIsLogin(true)} className="mt-12 text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold border-b border-transparent hover:border-white pb-1">
                Already have an account? Sign In
              </button>
            </motion.div>
          )}

          {currentStepKey === "student_type" && (
            <motion.div key="step-student-type" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center w-full max-w-xl mx-auto">
              <div className="text-red-500 font-bold tracking-[0.3em] uppercase text-sm mb-4">Step 2 of 3</div>
              <h2 className="text-5xl font-black text-center mb-12 tracking-tighter">Specify Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Path</span></h2>
              
              <div className="w-full space-y-4">
                <button onClick={() => setStudentType("LAW_STUDENT")} className="w-full p-8 border border-white/10 rounded-3xl bg-[#121212]/80 backdrop-blur-xl hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">Law Student</div>
                      <div className="text-gray-400">Enrolled in an Indian Law College</div>
                    </div>
                    <div className="text-3xl opacity-0 group-hover:opacity-100 transform translate-x-[-20px] group-hover:translate-x-0 transition-all">→</div>
                  </div>
                </button>
                <button onClick={() => setStudentType("NORMAL_USER")} className="w-full p-8 border border-white/10 rounded-3xl bg-[#121212]/80 backdrop-blur-xl hover:border-red-500/50 hover:bg-red-500/5 transition-all text-left group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">Citizen User</div>
                      <div className="text-gray-400">Seeking general legal knowledge</div>
                    </div>
                    <div className="text-3xl opacity-0 group-hover:opacity-100 transform translate-x-[-20px] group-hover:translate-x-0 transition-all">→</div>
                  </div>
                </button>
              </div>
              <button onClick={() => setActiveRole(null)} className="mt-10 text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">
                ← Back to Roles
              </button>
            </motion.div>
          )}

          {currentStepKey === "details" && (
            <motion.div key="step-details" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="bg-[#121212]/80 backdrop-blur-2xl border border-white/10 p-10 md:p-14 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {!isLogin && (
                <button onClick={() => studentType ? setStudentType(null) : setActiveRole(null)} className="text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 mb-8">
                  ← Change Selection
                </button>
              )}
              
              <div className="mb-10">
                <div className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3">Nyaya AI Gateway</div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                  {isLogin ? "Welcome Back." : "Final Details."}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" required />
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" required />
                  </div>
                )}
                
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" required />
                
                {!isLogin && activeRole === "STUDENT" && studentType === "LAW_STUDENT" && (
                  <div className="space-y-5">
                    <select name="college" required value={formData.college} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none appearance-none transition-colors">
                      <option value="" disabled>Select Law College</option>
                      {lawColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                    <input type="text" name="registrationNo" placeholder="College Registration No." required value={formData.registrationNo} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" />
                  </div>
                )}
                
                {!isLogin && activeRole === "LAWYER" && (
                  <input type="text" name="govtId" placeholder="Advocate Bar Council ID" required value={formData.govtId} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" />
                )}
                
                {!isLogin && activeRole === "JUDGE" && (
                  <input type="text" name="judicialId" placeholder="Judicial Officer ID" required value={formData.judicialId} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" />
                )}

                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Secure Password" className="w-full bg-black/50 border border-white/10 p-5 rounded-2xl text-white focus:border-red-500 focus:outline-none transition-colors" required />

                <div className="pt-6">
                  <button type="submit" disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-bold tracking-[0.2em] uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]">
                    {isLoading ? "Authenticating..." : (isLogin ? "Access Intelligence" : "Initialize Identity")}
                  </button>
                </div>
                
                <div className="text-center pt-4">
                  <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-gray-500 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
                    {isLogin ? "New user? Register now" : "Already registered? Sign in"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}