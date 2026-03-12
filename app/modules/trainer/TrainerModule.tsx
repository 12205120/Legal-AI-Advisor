"use client";
import { useState } from "react";
import Solve from "./submodules/Solve";
import Generator from "./submodules/Generator";
import Library from "./submodules/Library";
import Assessment from "./submodules/Assessment";
import Virtual from "./submodules/Virtual";

export default function TrainerModule() {
  const [active, setActive] = useState("generator");

  const tabs = [
    { id: "generator", label: "Scenario Generator" },
    { id: "logic", label: "Logic Solver" },
    { id: "library", label: "Library AI" },
    { id: "assessment", label: "Assessment" },
    { id: "court", label: "Virtual Court Bench" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex gap-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-5 py-2 rounded-xl border transition-all duration-300 ${
              active === tab.id
                ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 text-cyan-300"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {active === "generator" && <Generator />}
        {active === "logic" && <Solve />}
        {active === "library" && <Library />}
        {active === "assessment" && <Assessment />}
        {active === "court" && <Virtual />}
      </div>
    </div>
  );
}