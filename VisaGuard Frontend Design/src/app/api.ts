const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

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

/** Alert from backend (risk engine). type is "deadline" | "warning" | "info". */
export interface Alert {
  id: string;
  type: "deadline" | "warning" | "info";
  title: string;
  description: string;
  severity?: "high" | "medium" | "low" | string;
  urgency?: number | null;
  days_until_critical?: number | null;
  is_read?: boolean;
  status?: "active" | "resolved" | "snoozed" | string;
  snooze_until?: string | null;
  updated_at?: string;
  action_type?: "navigate" | string;
  action_payload?: { label?: string; route?: string } | null;
}

export async function getAlerts(clerkUserId: string): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/api/alerts?clerk_user_id=${encodeURIComponent(clerkUserId)}`);
  if (!res.ok) throw new Error("Failed to load alerts");
  return res.json();
}

export async function applyAlertAction(
  clerkUserId: string,
  alertId: string,
  action: "mark_read" | "mark_unread" | "resolve" | "reopen" | "snooze" | "unsnooze",
  snoozeDays?: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/alerts/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkUserId, alertId, action, snoozeDays }),
  });
  if (!res.ok) throw new Error("Failed to update alert");
}

export interface PolicyAlert {
  fingerprint?: string;
  title: string;
  description: string;
  source_name: string;
  source_url: string;
  severity: "high" | "medium" | "info" | string;
  visa_relevance?: string[];
  published_at?: string | null;
}

export async function getPolicyAlerts(limit = 50): Promise<PolicyAlert[]> {
  const res = await fetch(`${API_BASE}/api/policy-alerts?limit=${encodeURIComponent(String(limit))}`);
  if (!res.ok) throw new Error("Failed to load policy alerts");
  return res.json();
}

/** Institution row from GET /api/institutions (snake_case JSON). */
export interface InstitutionRow {
  id: string;
  display_name: string;
}

export async function fetchInstitutionCatalog(): Promise<InstitutionRow[]> {
  const res = await fetch(`${API_BASE}/api/institutions`);
  if (!res.ok) throw new Error("Failed to load institutions");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export interface DsoMeResponse {
  institution_id: string | null;
  display_name: string | null;
  role: string | null;
}

export interface DsoStudentRowApi {
  clerk_user_id: string;
  name: string;
  country: string;
  visa: string;
  program_end: string;
  risk_score: number;
  risk_level: string | null;
  top_risk_flag: string;
  last_active: string | null;
  tasks: string[];
  flag_descriptions: string[];
}

export interface DsoStudentsResponse {
  students: DsoStudentRowApi[];
  summary: {
    total: number;
    high_risk: number;
    medium_risk: number;
    compliant: number;
  };
}

export async function fetchDsoMe(token: string | null): Promise<DsoMeResponse> {
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/dso/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}

export async function claimDsoInstitution(token: string | null, institutionId: string): Promise<DsoMeResponse> {
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/dso/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ institution_id: institutionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}

export async function fetchDsoStudents(token: string | null): Promise<DsoStudentsResponse> {
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/dso/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}

export async function patchProfileSharing(clerkUserId: string, shareWithInstitution: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/cases/profile/sharing`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkUserId, shareWithInstitution }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
}

export async function patchProfileInstitution(
  clerkUserId: string,
  institutionId: string | null
): Promise<{ displayName: string | null }> {
  const res = await fetch(`${API_BASE}/api/cases/profile/institution`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkUserId, institutionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}
