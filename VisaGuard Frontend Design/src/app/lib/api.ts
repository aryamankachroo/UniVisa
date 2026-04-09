/** Backend base URL from Vite environment (no localhost fallback in production). */
const fromEnv = import.meta.env?.VITE_API_URL;
export const API_BASE = fromEnv != null ? String(fromEnv).replace(/\/$/, "") : "";

const STUDENT_ID_KEY = "uniVisaStudentId";

/** Student ID saved after onboarding POST /student/profile. Falls back to "demo" if backend seeded it. */
export function getStudentId(): string {
  return localStorage.getItem(STUDENT_ID_KEY) ?? "demo";
}

export function setStudentId(id: string): void {
  localStorage.setItem(STUDENT_ID_KEY, id);
}
