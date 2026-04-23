export interface HistoryEntry {
  type: "Logic Solver" | "Scenario Generator" | "Assessment" | "Library";
  action: string;
  time: string;
  timestamp: number;
}

export const addHistory = (type: HistoryEntry["type"], action: string) => {
  if (typeof window === "undefined") return;
  
  const history: HistoryEntry[] = JSON.parse(localStorage.getItem("nyaya_history") || "[]");
  const newEntry: HistoryEntry = {
    type,
    action,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  };
  
  localStorage.setItem("nyaya_history", JSON.stringify([newEntry, ...history].slice(0, 50)));
  
  // Update usage stats
  const stats = JSON.parse(localStorage.getItem("nyaya_stats") || "{}");
  stats[type] = (stats[type] || 0) + 1;
  localStorage.setItem("nyaya_stats", JSON.stringify(stats));
};

export const getHistory = (): HistoryEntry[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("nyaya_history") || "[]");
};

export const getUsageStats = () => {
  if (typeof window === "undefined") return [];
  const stats = JSON.parse(localStorage.getItem("nyaya_stats") || "{}");
  const total = Object.values(stats).reduce((a: any, b: any) => a + b, 0) as number;
  
  const modules = [
    { name: "Logic Solver", key: "Logic Solver" },
    { name: "Scenario Generator", key: "Scenario Generator" },
    { name: "Assessment", key: "Assessment" },
    { name: "Library", key: "Library" }
  ];

  return modules.map(m => ({
    name: m.name,
    progress: total > 0 ? Math.round(((stats[m.key] || 0) / total) * 100) : 0,
    count: stats[m.key] || 0
  }));
};
