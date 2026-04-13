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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Use environment variables for cloud deployment support
      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://127.0.0.1:5000";

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
          if (otpData.debugOTP) {
            setFormData(prev => ({ ...prev, otp: otpData.debugOTP }));
            console.log("Nyaya AI Debug: OTP captured automatically:", otpData.debugOTP);
            // Optionally auto-verify if debug mode is active
            setTimeout(() => {
                const fakeEvent = { preventDefault: () => {} } as any;
                handleOtpVerify(fakeEvent, otpData.debugOTP);
            }, 1000);
          }
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
      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://127.0.0.1:5000";
      const res = await fetch(`${authUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: otpToVerify })
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsOtpStep(false);
        setIsAuthenticated(true);
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
                setFormData({firstName: "", lastName: "", email: "", password: "", otp: "", college: "", registrationNo: "", govtId: "", judicialId: ""}) 
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

  // OTP View
  if (isOtpStep) {
    return (
      <div className="min-h-[800px] w-full flex items-center justify-center p-6 text-white relative">
        <div className="absolute inset-0 bg-black z-0" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative z-10 w-full max-w-md bg-[#1a1a1b] border border-[#303134] p-10 rounded-2xl shadow-xl text-center"
        >
          <h1 className="text-2xl text-white mb-2 font-google">2-Step Verification</h1>
          <p className="text-gray-400 text-sm mb-8">
            Nyaya AI sent a verification code to your email address.
           </p>
          <form onSubmit={handleOtpVerify} className="space-y-6">
            <input 
              type="text" 
              name="otp" 
              value={formData.otp} 
              onChange={handleInputChange} 
              placeholder="Enter code" 
              className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white text-center text-2xl tracking-[0.5em] focus:border-blue-500 focus:outline-none" 
              required 
            />
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-google rounded-lg transition-all"
            >
              {isLoading ? "Verifying..." : "Next"}
            </button>
          </form>
          <button type="button" onClick={() => setIsOtpStep(false)} className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium">Try another way</button>
        </motion.div>
      </div>
    );
  }

  // Component: Role Selection
  if (!activeRole) {
    return (
      <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-white overflow-hidden bg-black">
        <h2 className="text-4xl font-google text-center mb-12">Who are you?</h2>
        <div className="flex flex-wrap justify-center gap-8 z-10">
          {[
            { id: "STUDENT", label: "Student / Citizen", icon: "👤", description: "General public & students" },
            { id: "LAWYER", label: "Advocate", icon: "⚖️", description: "Legal practitioners" },
            { id: "JUDGE", label: "Hon'ble Judge", icon: "🔨", description: "Judicial officers" }
          ].map(role => (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveRole(role.id)}
              className="cursor-pointer w-72 p-8 rounded-2xl border border-[#303134] bg-[#1a1a1b] flex flex-col items-center text-center transition-colors"
            >
              <div className="text-6xl mb-6">{role.icon}</div>
              <h3 className="text-2xl font-google mb-2">{role.label}</h3>
              <p className="text-gray-400 text-sm">{role.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Component: Student Type Selection
  if (activeRole === "STUDENT" && !studentType) {
    return (
      <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-white bg-black">
        <button onClick={() => setActiveRole(null)} className="absolute top-10 left-10 text-gray-400 hover:text-white flex items-center gap-2">
          ← Back
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center max-w-md w-full bg-[#1a1a1b] p-10 border border-[#303134] rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-google mb-8 text-center">Select Account Type</h2>
          <div className="w-full space-y-4">
            <button onClick={() => setStudentType("LAW_STUDENT")} className="w-full p-6 border border-[#3c4043] rounded-xl hover:bg-white/5 transition-all text-left">
              <div className="text-xl font-google mb-1 text-white">Law Student</div>
              <div className="text-sm text-gray-400">I am currently studying law</div>
            </button>
            <button onClick={() => setStudentType("NORMAL_USER")} className="w-full p-6 border border-[#3c4043] rounded-xl hover:bg-white/5 transition-all text-left">
              <div className="text-xl font-google mb-1 text-white">Citizen / Normal User</div>
              <div className="text-sm text-gray-400">I want to access legal resources</div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Google-Style View
  return (
    <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 bg-black">
      
      <button onClick={() => studentType ? setStudentType(null) : setActiveRole(null)} className="absolute top-10 left-10 text-gray-400 hover:text-white flex items-center gap-2">
        ← Change Role
      </button>

      <div className="w-full max-w-[450px] bg-[#1a1a1b] rounded-2xl border border-[#303134] p-10 shadow-2xl overflow-hidden">
        <div className="text-center mb-8">
          <h1 className="text-2xl text-white font-google mb-2">Nyaya AI</h1>
          <h2 className="text-xl text-white font-google">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-gray-400 mt-2">
            {isLogin ? "Use your Nyaya AI Account" : "Starting your judicial journey"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-fields"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <input 
                  type="email" name="email" value={formData.email} onChange={handleInputChange} 
                  placeholder="Email" 
                  className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500 focus:outline-none" 
                  required 
                />
                <input 
                  type="password" name="password" value={formData.password} onChange={handleInputChange} 
                  placeholder="Password" 
                  className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500 focus:outline-none" 
                  required 
                />
              </motion.div>
            ) : (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} 
                    placeholder="First Name" 
                    className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500 focus:outline-none" 
                    required 
                  />
                  <input 
                    type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} 
                    placeholder="Last Name" 
                    className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500 focus:outline-none" 
                    required 
                  />
                </div>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleInputChange} 
                  placeholder="Email" 
                  className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500 focus:outline-none" 
                  required 
                />

                {/* Dynamic Role Inputs */}
                {activeRole === "STUDENT" && studentType === "LAW_STUDENT" && (
                  <>
                    <select name="college" required value={formData.college} onChange={handleInputChange} className="w-full bg-[#1a1a1b] border border-[#3c4043] p-4 rounded-lg text-white appearance-none">
                      <option value="" disabled>Select Law College</option>
                      {lawColleges.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                    <input type="text" name="registrationNo" placeholder="Registration No." required value={formData.registrationNo} onChange={handleInputChange} className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500" />
                  </>
                )}
                {activeRole === "LAWYER" && (
                   <input type="text" name="govtId" placeholder="Govt Advocate ID" required value={formData.govtId} onChange={handleInputChange} className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500" />
                )}
                {activeRole === "JUDGE" && (
                   <input type="text" name="judicialId" placeholder="Judicial ID Number" required value={formData.judicialId} onChange={handleInputChange} className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500" />
                )}

                <input 
                  type="password" name="password" value={formData.password} onChange={handleInputChange} 
                  placeholder="Password" 
                  className="w-full bg-transparent border border-[#3c4043] p-4 rounded-lg text-white focus:border-blue-500 focus:outline-none" 
                  required 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {isLogin ? "Create account" : "Sign in instead"}
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white font-google rounded-lg transition-all"
            >
              {isLoading ? "Wait..." : "Next"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 flex gap-6 text-xs text-gray-500">
        <span className="cursor-pointer hover:underline">English (United Kingdom)</span>
        <span className="cursor-pointer hover:underline">Help</span>
        <span className="cursor-pointer hover:underline">Privacy</span>
        <span className="cursor-pointer hover:underline">Terms</span>
      </div>
    </div>
  );
}