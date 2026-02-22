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

export interface CPTRequest {
  id: string;
  student_id: string;
  company_name: string;
  role: string;
  expected_start_date: string;
  expected_end_date: string;
  notes?: string;
  status: "intent" | "offer_signed" | "approved" | "rejected";
  signed_offer_uploaded_at?: string;
  created_at: string;
  updated_at: string;
}

export async function createCPTRequest(
  studentId: string,
  body: { company_name: string; role: string; expected_start_date: string; expected_end_date: string; notes?: string }
): Promise<CPTRequest> {
  const res = await fetch(`${API_BASE}/cpt/student/${studentId}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}

export async function listCPTRequests(studentId: string): Promise<CPTRequest[]> {
  const res = await fetch(`${API_BASE}/cpt/student/${studentId}/requests`);
  if (!res.ok) throw new Error("Failed to load CPT requests");
  return res.json();
}

export async function markCPTOfferSigned(studentId: string, requestId: string): Promise<CPTRequest> {
  const res = await fetch(`${API_BASE}/cpt/student/${studentId}/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "offer_signed" }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}

export interface DsoCPTRequest extends CPTRequest {
  student_name: string;
}

export async function listDsoCPTRequests(): Promise<DsoCPTRequest[]> {
  const res = await fetch(`${API_BASE}/cpt/dso/requests`);
  if (!res.ok) throw new Error("Failed to load CPT requests");
  return res.json();
}
