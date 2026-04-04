// Shared bail application store (localStorage)
// Used by Bail module to save + by Virtual Court to present

export interface BailApplication {
  id: string;
  createdAt: string;
  applicantName: string;
  idNumber: string;
  firNumber: string;
  policeStation: string;
  charges: string;
  caseDescription: string;
  bailType: string;
  reason: string;
  draftTemplate: string;
}

const STORAGE_KEY = "nyaya_bail_vault";

export function getBailApplications(): BailApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBailApplication(app: Omit<BailApplication, "id" | "createdAt">): BailApplication {
  const newApp: BailApplication = {
    ...app,
    id: `bail_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existing = getBailApplications();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newApp, ...existing]));
  return newApp;
}

export function deleteBailApplication(id: string): void {
  const apps = getBailApplications().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function getBailById(id: string): BailApplication | null {
  return getBailApplications().find((a) => a.id === id) ?? null;
}
