"use client";
import { useState } from "react";

interface QuestionData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  error?: string;
}

export default function Assessment() {
  const [law, setLaw] = useState("");
  const [difficulty, setDifficulty] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const generateQuestion = async () => {
    if (!law || !difficulty) {
      alert("Please select both a law and difficulty level.");
      return;
    }
    
    setLoading(true);
    setQuestionData(null);
    setSelectedOption(null);
    setIsCorrect(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/generate_assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ law: law, difficulty: difficulty }),
      });
      if (!res.ok) throw new Error("Backend API Failed");
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      } else {
        setQuestionData(data);
      }
    } catch (error) {
       console.error(error);
       setTimeout(() => {
         setQuestionData({
           question: `[OFFLINE FALLBACK]: A simulated ${difficulty} question concerning ${law}. Which of the following is correct regarding the core premise of this law?`,
           options: ["Option A: It is fundamentally strict.", "Option B: It is lenient in all cases.", "Option C: It depends on the case facts.", "Option D: None of the above"],
           correctAnswer: "Option C: It depends on the case facts.",
           explanation: "This is a simulated offline explanation because the backend AI is unavailable. In most cases under " + law + ", context is everything.",
         });
       }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption || !questionData) return; // Prevent multiple selections
    
    setSelectedOption(option);
    setIsCorrect(option === questionData.correctAnswer);
  };

  return (
    <div className="bg-black/40 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-all duration-500">

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-widest uppercase">
          Neural Assessment Interface
        </h2>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <select
            onChange={(e) => setLaw(e.target.value)}
            className="relative w-full p-4 bg-gray-900/80 border border-cyan-500/20 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 appearance-none transition-all"
            value={law}
          >
            <option value="" disabled>Select Legal Domain</option>
            <option value="IPC">Indian Penal Code (IPC)</option>
            <option value="Constitution">Constitutional Law</option>
            <option value="Contract Act">Contract Act</option>
            <option value="Family Law">Family Law</option>
          </select>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <select
            onChange={(e) => setDifficulty(e.target.value)}
            className="relative w-full p-4 bg-gray-900/80 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 appearance-none transition-all"
            value={difficulty}
          >
            <option value="" disabled>Select Difficulty</option>
            <option value="Beginner">Level 1: Beginner</option>
            <option value="Intermediate">Level 2: Intermediate</option>
            <option value="Advanced">Level 3: Advanced</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateQuestion}
        disabled={loading}
        className="w-full relative group overflow-hidden rounded-xl p-[1px]"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
        <div className="relative bg-black px-8 py-4 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
          <span className="text-white font-semibold tracking-wider flex items-center justify-center gap-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Synthesizing Scenario...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Commence Assessment
              </>
            )}
          </span>
        </div>
      </button>

      {/* Results Area */}
      {questionData && (
        <div className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {questionData.error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              {questionData.error}
            </div>
          ) : (
            <>
              {/* Question */}
              <div className="p-6 bg-blue-950/20 border border-blue-500/20 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600"></div>
                <h3 className="text-xl font-medium text-white/90 leading-relaxed pl-4">
                  {questionData.question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questionData.options.map((option, index) => {
                  const isSelected = selectedOption === option;
                  const isCorrectAnswer = option === questionData.correctAnswer;
                  
                  let optionStateClasses = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/50 cursor-pointer";
                  
                  if (selectedOption) {
                    if (isCorrectAnswer) {
                      optionStateClasses = "bg-green-500/20 border-green-500/50 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                    } else if (isSelected) {
                      optionStateClasses = "bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                    } else {
                      optionStateClasses = "bg-black/40 border-white/5 opacity-50 cursor-not-allowed";
                    }
                  }

                  return (
                    <div
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      className={`relative p-5 rounded-xl border transition-all duration-300 group ${optionStateClasses}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm border ${
                          selectedOption 
                            ? isCorrectAnswer 
                              ? 'bg-green-500/20 border-green-500/50 text-green-400'
                              : isSelected
                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                : 'bg-black/50 border-white/10 text-white/30'
                            : 'bg-black/50 border-white/20 text-cyan-400 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-sm md:text-base pt-1">{option}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Feedback & Explanation */}
              {selectedOption && (
                <div className={`mt-8 p-6 rounded-2xl border animate-in slide-in-from-bottom-4 duration-500 ${
                  isCorrect 
                    ? "bg-green-950/20 border-green-500/30" 
                    : "bg-red-950/20 border-red-500/30"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {isCorrect ? (
                      <>
                        <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-green-400 tracking-wide">JUDGMENT CORRECT</h4>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-red-500/20 rounded-full text-red-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-red-400 tracking-wide">OBJECTION OVERRULED - INCORRECT</h4>
                      </>
                    )}
                  </div>
                  
                  <div className="pl-11">
                    <div className="text-sm text-white/50 mb-2 uppercase tracking-wider font-semibold">Legal Reasoning</div>
                    <p className="text-white/80 leading-relaxed">
                      {questionData.explanation}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}