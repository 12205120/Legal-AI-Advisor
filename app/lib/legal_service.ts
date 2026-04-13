export interface LegalMapping {
  ipcSection: string;
  bnsSection: string;
  crimeName: string;
  punishment: string;
  difference: string;
}

export interface BailSuggestion {
  bailType: string;
  reason: string;
  draftTemplate: string;
}

export interface ArgumentAnalysis {
  prosecutionStrength: string;
  defenseStrength: string;
  contradictions: string[];
  legalPrecedents: string[];
  benchOpinion: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const LegalService = {
  /**
   * Map an IPC section or crime name to its BNS equivalent
   */
  async mapLaw(query: string): Promise<LegalMapping | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/map_law`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Legal Mapping Error:", e);
      return null;
    }
  },

  /**
   * Get BNSS-compliant bail suggestion and draft
   */
  async suggestBail(applicantName: string, idNumber: string, caseDescription: string): Promise<BailSuggestion | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/suggest_bail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          applicant_name: applicantName,
          id_number: idNumber,
          case_description: caseDescription
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Bail Suggestion Error:", e);
      return null;
    }
  },

  /**
   * Analyze dual lawyer arguments (Prosecution vs Defense)
   */
  async analyzeArguments(prosecution: string, defense: string, scenario: string): Promise<ArgumentAnalysis | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/analyze_arguments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prosecution, defense, scenario }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Argument Analysis Error:", e);
      return null;
    }
  }
};
