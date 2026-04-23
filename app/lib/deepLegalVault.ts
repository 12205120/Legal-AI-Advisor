export interface DeepLegalEntry {
  title: string;
  officialText: string;
  historicalJourney: string;
  judgesRationale: string;
  prosAndCons: { title: string; detail: string; type: "pro" | "con" }[];
  landmarkCases: { name: string; citation: string; impact: string }[];
  futureOutlook: string;
  complexity: "High" | "Medium" | "Low";
  domain: string;
  lastUpdated: string;
}

export const deepLegalVault: Record<string, DeepLegalEntry> = {
  "article 29": {
    title: "Article 29: Protection of Interests of Minorities",
    officialText: "(1) Any section of the citizens residing in the territory of India or any part thereof having a distinct language, script or culture of its own shall have the right to conserve the same. (2) No citizen shall be denied admission into any educational institution maintained by the State or receiving aid out of State funds on grounds only of religion, race, caste, language or any of them.",
    historicalJourney: "Article 29 was debated in the Constituent Assembly on 7th and 8th December 1948. Originally, the draft article focused on 'cultural and educational rights' of all citizens, but the sub-committee on Fundamental Rights refined it to specifically safeguard the 'distinctive' nature of minority groups. Dr. B.R. Ambedkar emphasized that this article is not just about religious minorities but also linguistic and cultural minorities, making it one of the most inclusive protection clauses in the world.",
    judgesRationale: "The Supreme Court has consistently held that the right to conserve language and culture is an absolute right, not subject to reasonable restrictions like other fundamental rights. In the landmark T.M.A. Pai case, the bench noted that 'Minority' is determined by the population of a specific state, not just the national average. This rationale ensures that even a majority community in India (like Hindus) could be considered a minority in states like Punjab or Nagaland, thus receiving protection under Article 29.",
    prosAndCons: [
      { title: "Preservation of Diversity", detail: "Ensures that India's 'Mosaic' of cultures remains intact against the pressure of homogenization.", type: "pro" },
      { title: "Educational Access", detail: "Prevents discrimination in state-funded schools, ensuring merit and identity coexist.", type: "pro" },
      { title: "Administrative Complexity", detail: "Determining who constitutes a 'minority' at the state vs. national level often leads to prolonged litigation.", type: "con" },
      { title: "Potential for Segregation", detail: "Critics argue it may sometimes encourage isolation rather than integration into the mainstream education system.", type: "con" }
    ],
    landmarkCases: [
      { name: "T.M.A. Pai Foundation vs State of Karnataka", citation: "2002 (8) SCC 481", impact: "Redefined the scope of minority rights and institutional autonomy in India." },
      { name: "Ahmedabad St. Xavier's College vs State of Gujarat", citation: "1974 (1) SCC 717", impact: "Established that the right to administer includes the right to choose the medium of instruction." }
    ],
    futureOutlook: "As India digitizes, Article 29 is being interpreted to include the 'Right to Digital Language Preservation,' ensuring that minority scripts are supported in AI models and government portals.",
    complexity: "High",
    domain: "Constitutional Law",
    lastUpdated: "April 2024"
  },
  "article 21": {
    title: "Article 21: Protection of Life and Personal Liberty",
    officialText: "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
    historicalJourney: "Derived from the 'Due Process' clause of the US Constitution, Article 21 has undergone the most dramatic evolution of any article. Post-emergency (1975-77), the Supreme Court realized that 'procedure established by law' must also be 'just, fair, and reasonable.' This single line has become the source of dozens of other rights, including the right to clean air, the right to privacy, and the right to a speedy trial.",
    judgesRationale: "The judiciary views Article 21 as the 'Heart of Fundamental Rights.' In the Maneka Gandhi case, Justice Bhagwati ruled that life is not just 'animal existence' but living with human dignity. This expansive interpretation allows the court to intervene whenever a citizen's basic quality of life is threatened by state negligence.",
    prosAndCons: [
      { title: "Ultimate Protection", detail: "Acts as a safety net for every conceivable human right not explicitly mentioned.", type: "pro" },
      { title: "Judicial Activism", detail: "Allows the court to create new laws where the legislature is silent.", type: "pro" },
      { title: "Legal Ambiguity", detail: "The term 'liberty' is so broad that it often leads to conflicting judgments between different High Courts.", type: "con" }
    ],
    landmarkCases: [
      { name: "Maneka Gandhi vs Union of India", citation: "1978 AIR 597", impact: "Established the 'Golden Triangle' of Articles 14, 19, and 21." },
      { name: "K.S. Puttaswamy vs Union of India", citation: "2017 (10) SCC 1", impact: "Declared Privacy as a fundamental right under Article 21." }
    ],
    futureOutlook: "Article 21 is now expanding to include the 'Right to be Forgotten' in the digital age and the 'Right to Net Neutrality' as a prerequisite for modern life.",
    complexity: "High",
    domain: "Constitutional Law",
    lastUpdated: "2024"
  }
};
