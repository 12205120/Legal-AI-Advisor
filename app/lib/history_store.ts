export interface HistoryItem {
  action: string;
  time: number;
  type: string;
}

export interface UserStats {
  usageHours: number;
  modulesLearned: number;
  casesSolved: number;
  aiInteractions: number;
}

export const getHistory = (): HistoryItem[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("nyaya_history");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const logAction = (type: string, action: string) => {
  if (typeof window === "undefined") return;
  const history = getHistory();
  const newItem: HistoryItem = {
    action,
    type,
    time: Date.now(),
  };
  // keep last 50 items
  const newHistory = [newItem, ...history].slice(0, 50);
  localStorage.setItem("nyaya_history", JSON.stringify(newHistory));

  // Update stats
  const stats = getStats();
  if (type.includes("Consult") || type.includes("Simulation")) {
    stats.aiInteractions += 1;
    stats.usageHours += 0.2; // approx 12 mins per interaction
  } else if (type.includes("Logic Solver") || type.includes("Case")) {
    stats.casesSolved += 1;
    stats.usageHours += 0.5;
  } else if (type.includes("Assessment") || type.includes("Library") || type.includes("Learning")) {
    stats.modulesLearned += 1;
    stats.usageHours += 0.3;
  } else {
    stats.usageHours += 0.1;
  }
  
  localStorage.setItem("nyaya_stats", JSON.stringify(stats));
};

export const getStats = (): UserStats => {
  if (typeof window === "undefined") return { usageHours: 0, modulesLearned: 0, casesSolved: 0, aiInteractions: 0 };
  const raw = localStorage.getItem("nyaya_stats");
  if (!raw) return { usageHours: 0, modulesLearned: 0, casesSolved: 0, aiInteractions: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { usageHours: 0, modulesLearned: 0, casesSolved: 0, aiInteractions: 0 };
  }
};

export const formatTimeAgo = (timestamp: number): string => {
  const diffInMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};
