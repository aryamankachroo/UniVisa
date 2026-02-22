/**
 * List of universities for onboarding university selector.
 * Add or reorder entries here; keep "Other" last.
 * `keywords` improve search (e.g. "MIT" → Massachusetts Institute of Technology).
 */
export interface UniversityOption {
  name: string;
  keywords?: string[];
}

export const UNIVERSITIES: UniversityOption[] = [
  { name: "Georgia Institute of Technology", keywords: ["Georgia Tech", "GT", "Georgia"] },
  { name: "Massachusetts Institute of Technology", keywords: ["MIT"] },
  { name: "University of California, Los Angeles", keywords: ["UCLA", "UC Los Angeles"] },
  { name: "Stanford University", keywords: ["Stanford"] },
  { name: "Harvard University", keywords: ["Harvard"] },
  { name: "University of Michigan", keywords: ["Michigan", "UMich", "U-M"] },
  { name: "Carnegie Mellon University", keywords: ["CMU", "Carnegie Mellon"] },
  { name: "University of Texas at Austin", keywords: ["UT Austin", "UT", "Texas"] },
  { name: "University of Washington", keywords: ["UW", "Washington", "UDub"] },
  { name: "Cornell University", keywords: ["Cornell"] },
  { name: "Columbia University", keywords: ["Columbia"] },
  { name: "University of Illinois Urbana-Champaign", keywords: ["UIUC", "Illinois", "U of I"] },
  { name: "New York University", keywords: ["NYU", "New York"] },
  { name: "University of Southern California", keywords: ["USC", "Southern California"] },
  { name: "Northwestern University", keywords: ["Northwestern", "NU"] },
  { name: "Other" },
];

/** Display names only (e.g. for form value). */
export const UNIVERSITY_NAMES = UNIVERSITIES.map((u) => u.name) as readonly string[];
