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
          // Set names from backend if available
          setFormData(prev => ({
            ...prev,
            firstName: loginData.user.first_name || "",
            lastName: loginData.user.last_name || ""
          }));
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
            first_name: formData.firstName,
            last_name: formData.lastName,
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

      // Both flows send an OTP via the new Node.js server
      const authUrl = "http://localhost:5000";
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

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const authUrl = "http://localhost:5000";
      const res = await fetch(`${authUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await res.json();
      if (data.status === "success" || data.status === "verified") {
        setIsOtpStep(false);
        setIsAuthenticated(true);
      } else {
        alert(data.error || "Invalid Verification Code!");
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black z-0" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-2xl bg-[#1a1a1b] border border-[#303134] p-12 rounded-2xl text-center shadow-2xl"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-4xl mb-6 text-white font-bold">
            {formData.firstName?.[0] || formData.email[0].toUpperCase()}
          </div>
          <h2 className="text-3xl font-google text-white mb-2">Welcome, {formData.firstName} {formData.lastName}</h2>
          <p className="text-gray-400 mb-8">{formData.email}</p>
          
          <div className="space-y-4 text-left">
            <div className="bg-[#242426] p-4 rounded-xl border border-[#3c4043]">
              <div className="text-xs text-blue-400 uppercase tracking-wider mb-1">Role</div>
              <div className="text-lg font-medium">{activeRole}</div>
            </div>
            <div className="bg-[#242426] p-4 rounded-xl border border-[#3c4043]">
              <div className="text-xs text-blue-400 uppercase tracking-wider mb-1">Email</div>
              <div className="text-lg font-medium">{formData.email}</div>
            </div>
          </div>
          
          <button 
            onClick={() => { 
              setIsAuthenticated(false); 
              setFormData({firstName: "", lastName: "", email: "", password: "", otp: "", college: "", registrationNo: "", govtId: "", judicialId: ""}) 
            }} 
            className="mt-10 px-10 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-google transition-all"
          >
            Sign Out
          </button>
        </motion.div>
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