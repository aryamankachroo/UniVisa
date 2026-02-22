/** Backend base URL. Must match CORS and running server (e.g. run backend with ./run.sh). */
const fromEnv = import.meta.env?.VITE_API_BASE;
export const API_BASE =
  fromEnv != null ? String(fromEnv).replace(/\/$/, "") : "http://localhost:8000";

const STUDENT_ID_KEY = "uniVisaStudentId";

/** Student ID saved after onboarding POST /student/profile. Falls back to "demo" if backend seeded it. */
export function getStudentId(): string {
  return localStorage.getItem(STUDENT_ID_KEY) ?? "demo";
}

export function setStudentId(id: string): void {
  localStorage.setItem(STUDENT_ID_KEY, id);
}
