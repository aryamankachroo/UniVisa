const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:8000";

export function getStudentId(): string {
  try {
    const raw = localStorage.getItem("uniVisaUser");
    if (!raw) return "demo";
    const data = JSON.parse(raw) as { studentId?: string };
    return data.studentId ?? "demo";
  } catch {
    return "demo";
  }
}

export async function chat(
  studentId: string,
  question: string
): Promise<{ answer: string; sources: string[] }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}
