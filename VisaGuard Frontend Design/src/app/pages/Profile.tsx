import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useUser } from "@clerk/react";
import {
  Shield,
  LayoutDashboard,
  Bot,
  User,
  Bell,
  Briefcase,
  Search,
  FileText,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { SidebarUserFooter } from "../components/SidebarUserFooter";
import { Button } from "../components/ui/button";
import { RiskScoreGauge } from "../components/RiskScoreGauge";
import { RiskBadge } from "../components/RiskBadge";
import { motion } from "motion/react";

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:8000";

type CasePayload = {
  profile: Record<string, unknown> | null;
  risk: Record<string, unknown> | null;
  questionnaire: Record<string, unknown> | null;
};

function fmtDate(v: unknown): string {
  if (v == null || v === "") return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtYesNo(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

function fmtYesNoUnsure(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "Not specified";
}

function humanizeStage(s: unknown): string {
  if (s == null || s === "") return "—";
  const key = String(s);
  const map: Record<string, string> = {
    studying: "Studying",
    cpt: "Curricular Practical Training (CPT)",
    opt: "Optional Practical Training (OPT)",
    stem_opt: "STEM OPT extension",
    opt_approved_not_started: "OPT approved (not yet started)",
  };
  return map[key] ?? key.replace(/_/g, " ");
}

function humanizeEnrollment(s: unknown): string {
  if (s == null || s === "") return "—";
  const key = String(s);
  const map: Record<string, string> = {
    full_time: "Full-time",
    reduced_course_load: "Reduced course load",
    not_enrolled: "Not enrolled",
  };
  return map[key] ?? key.replace(/_/g, " ");
}

function humanizeCptType(s: unknown): string {
  if (s == null || s === "") return "—";
  const key = String(s);
  if (key === "part_time") return "Part-time CPT";
  if (key === "full_time") return "Full-time CPT";
  return key.replace(/_/g, " ");
}

function humanizeStemApp(s: unknown): string {
  if (s == null || s === "") return "—";
  const key = String(s);
  const map: Record<string, string> = {
    not_applied: "Not applied",
    pending: "Pending",
    approved: "Approved",
    denied: "Denied",
  };
  return map[key] ?? key;
}

function stemEligibleLabel(v: unknown): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "Not sure / not specified";
}

function riskLevelToBadge(level: unknown): "high" | "medium" | "low" {
  const u = String(level ?? "").toUpperCase();
  if (u === "CRITICAL" || u === "HIGH") return "high";
  if (u === "MEDIUM") return "medium";
  return "low";
}

const HIGH_SEVERITY_FLAGS = new Set([
  "unauthorized_work",
  "sevis_termination_history",
  "opt_unemployment_exceeded",
  "enrollment_violation",
  "cpt_enrollment_violation",
  "invalid_stem_extension",
  "cpt_hours_violation",
]);

const MEDIUM_SEVERITY_FLAGS = new Set([
  "opt_unemployment_warning",
  "uscis_notice_received",
  "on_campus_work_violation",
  "reduced_course_load_review",
  "stem_eligibility_unknown",
  "travel_risk",
]);

function severityForFlagCode(code: string): "high" | "medium" | "low" {
  if (HIGH_SEVERITY_FLAGS.has(code)) return "high";
  if (MEDIUM_SEVERITY_FLAGS.has(code)) return "medium";
  return "low";
}

function titleForFlag(flag: { code: string; description?: string | null }) {
  const d = flag.description?.trim();
  if (d) return d;
  return flag.code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 border-b border-border/70 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </motion.div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [activeNav, setActiveNav] = useState("profile");
  const [caseData, setCaseData] = useState<CasePayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [localCase, setLocalCase] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("immigration_case_input");
      if (raw) setLocalCase(JSON.parse(raw));
    } catch {
      setLocalCase(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch(`${API_BASE}/api/cases/me?clerk_user_id=${encodeURIComponent(user.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "no_case" : `status_${res.status}`);
        return res.json();
      })
      .then((data: CasePayload) => {
        if (!cancelled) setCaseData(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error && err.message === "no_case" ? null : "Could not load saved profile.";
          setLoadError(msg);
          setCaseData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  const q = useMemo(
    () => (caseData?.questionnaire ?? localCase) as Record<string, unknown> | null,
    [caseData?.questionnaire, localCase]
  );

  const prof = caseData?.profile as Record<string, unknown> | undefined;
  const risk = caseData?.risk as Record<string, unknown> | undefined;

  const clerkName =
    user && (user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim())
      ? (user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim())
      : null;

  const displayName =
    (typeof q?.fullName === "string" && q.fullName.trim()) ||
    (typeof prof?.full_name === "string" && String(prof.full_name).trim()) ||
    clerkName ||
    "Student";

  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  const university =
    (typeof prof?.university === "string" && prof.university) ||
    (typeof q?.university === "string" && q.university) ||
    "—";

  const country =
    (typeof prof?.country === "string" && prof.country) || (typeof q?.country === "string" && q.country) || "—";

  const riskScore = typeof risk?.riskScore === "number" ? risk.riskScore : null;
  const riskLevel = risk?.riskLevel;
  const flags = Array.isArray(risk?.flags) ? (risk.flags as { code: string; description?: string | null }[]) : [];
  const deadlines = risk?.deadlines as { nextDeadline?: string | null; daysUntilNextDeadline?: number | null } | undefined;
  const hasQuestionnaire = q != null && Object.keys(q).length > 0;

  const handleNavigation = (path: string, nav: string) => {
    setActiveNav(nav);
    navigate(path);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">Sign in to view your profile and questionnaire.</p>
        <Button onClick={() => navigate("/")}>Go to home</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Shield className="w-8 h-8 text-primary shrink-0" />
            <span className="text-xl font-bold truncate" style={{ fontFamily: "var(--font-family-heading)" }}>
              UniVisa
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleNavigation("/dashboard", "dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("/ai-advisor", "ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "ai" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>AI Advisor</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("/cpt", "cpt")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "cpt" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>CPT / Internship</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("/opportunities", "opportunities")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "opportunities"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Opportunities</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("/profile", "profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "profile"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <User className="w-5 h-5" />
            <span>My Profile</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("/alerts", "alerts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "alerts" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Alerts</span>
            <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              3
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("/policy-alerts", "policy")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "policy" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Policy Alerts</span>
          </button>
        </nav>

        <SidebarUserFooter
          nameOverride={displayName}
          universityOverride={university === "—" ? null : university}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center border border-border shrink-0">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
              <p className="text-muted-foreground mt-1">
                Signed in as <span className="text-foreground font-medium">{email}</span>
                {hasQuestionnaire ? " · Questionnaire on file" : ""}
              </p>
            </div>
          </div>

          {loadError ? (
            <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {loadError} Showing any data saved on this device only.
            </div>
          ) : null}

          {!hasQuestionnaire ? (
            <SectionCard
              title="Complete your questionnaire"
              subtitle="We don’t have a saved case for this account yet (or the server could not be reached)."
            >
              <p className="text-sm text-muted-foreground mb-4">
                Answer the onboarding questions once so your visa details and risk analysis stay in sync with your
                dashboard.
              </p>
              <Button className="bg-primary" onClick={() => navigate("/")}>
                Go to questionnaire
              </Button>
            </SectionCard>
          ) : null}

          {riskScore != null ? (
            <SectionCard
              title="Compliance snapshot"
              subtitle="From your last saved risk analysis (same source as the dashboard)."
            >
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex justify-center md:justify-start">
                  <RiskScoreGauge score={riskScore} size="md" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">Risk level</span>
                    <RiskBadge level={riskLevelToBadge(riskLevel)} />
                    {riskLevel != null && String(riskLevel) !== "" ? (
                      <span className="text-xs font-mono text-muted-foreground uppercase">{String(riskLevel)}</span>
                    ) : null}
                  </div>

                  {deadlines?.nextDeadline != null && deadlines?.daysUntilNextDeadline != null ? (
                    <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
                      <CalendarClock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Upcoming deadline</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {fmtDate(deadlines.nextDeadline)}
                          <span className="mx-2 text-border">·</span>
                          <span className="tabular-nums">{deadlines.daysUntilNextDeadline}</span> days remaining
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No next deadline was computed in the last analysis.</p>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Active flags ({flags.length})</span>
                    </div>
                    {flags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No compliance flags from the last run.</p>
                    ) : (
                      <ul className="space-y-2">
                        {flags.map((f, i) => (
                          <li
                            key={`${f.code}-${i}`}
                            className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/80 bg-background px-3 py-2"
                          >
                            <span className="text-sm">{titleForFlag(f)}</span>
                            <RiskBadge level={severityForFlagCode(f.code)} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : hasQuestionnaire ? (
            <SectionCard title="Compliance snapshot" subtitle="Complete a new analysis from the questionnaire to see your risk score here.">
              <p className="text-sm text-muted-foreground">
                Risk data appears after a successful submit to the backend. Open the last step of onboarding and run
                &quot;Analyze My Risk&quot;, or check that the API is reachable.
              </p>
            </SectionCard>
          ) : null}

          <SectionCard title="Account" subtitle="From your sign-in (Clerk) and saved questionnaire.">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <ProfileField
                label="Full name (questionnaire)"
                value={
                  hasQuestionnaire && typeof q?.fullName === "string" && q.fullName.trim()
                    ? q.fullName
                    : clerkName ?? "—"
                }
              />
              <ProfileField label="Email (Clerk)" value={email} />
              <ProfileField label="University" value={university} />
              <ProfileField label="Country of origin" value={country} />
            </dl>
          </SectionCard>

          {hasQuestionnaire ? (
            <>
              <SectionCard title="Visa & program" subtitle="Answers from your F-1 questionnaire.">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <ProfileField label="Visa type" value="F-1 (Academic Student)" />
                  <ProfileField label="Current stage" value={humanizeStage(q?.currentStage)} />
                  <ProfileField label="Program start" value={fmtDate(q?.programStart)} />
                  <ProfileField label="Program end" value={fmtDate(q?.programEnd)} />
                  <ProfileField label="Enrollment status" value={humanizeEnrollment(q?.enrollmentStatus)} />
                  <ProfileField label="Course changes reported" value={fmtYesNo(q?.courseChanges)} />
                  <ProfileField
                    label="SEVIS ID"
                    value="Not collected in questionnaire — add with your DSO if needed."
                  />
                  <ProfileField
                    label="Major / program name"
                    value="Not collected in questionnaire — use university records for official major."
                  />
                </dl>
              </SectionCard>

              <SectionCard title="Work & practical training" subtitle="CPT, OPT, STEM, and employment-related answers.">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <ProfileField
                    label="On-campus work hours (per week)"
                    value={q?.workHours != null && q.workHours !== "" ? `${q.workHours} hours` : "—"}
                  />
                  <ProfileField label="Using CPT" value={fmtYesNoUnsure(q?.usingCpt)} />
                  <ProfileField
                    label="CPT hours (per week)"
                    value={q?.cptHours != null && q.cptHours !== "" ? String(q.cptHours) : "—"}
                  />
                  <ProfileField label="CPT type" value={humanizeCptType(q?.cptType)} />
                  <ProfileField label="OPT start" value={fmtDate(q?.optStart)} />
                  <ProfileField label="OPT end" value={fmtDate(q?.optEnd)} />
                  <ProfileField
                    label="Unemployment days used (OPT)"
                    value={q?.unemploymentDaysUsed != null ? String(q.unemploymentDaysUsed) : "—"}
                  />
                  <ProfileField label="STEM eligible" value={stemEligibleLabel(q?.stemEligible)} />
                  <ProfileField label="STEM application status" value={humanizeStemApp(q?.stemApplicationStatus)} />
                  <ProfileField label="Employed in authorized job" value={fmtYesNoUnsure(q?.employedInAuthorizedJob)} />
                  <ProfileField label="Employer change reported" value={fmtYesNoUnsure(q?.changeEmployer)} />
                </dl>
              </SectionCard>

              <SectionCard title="Risk factors (questionnaire)" subtitle="Self-reported items used in compliance analysis.">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <ProfileField label="Travel plans" value={fmtYesNo(q?.travelPlans)} />
                  <ProfileField label="Received USCIS notices" value={fmtYesNo(q?.receivedUSCISNotices)} />
                  <ProfileField label="Unauthorized work reported" value={fmtYesNo(q?.unauthorizedWork)} />
                  <ProfileField label="SEVIS terminated before" value={fmtYesNoUnsure(q?.sevisTerminatedBefore)} />
                </dl>
              </SectionCard>
            </>
          ) : null}

          {Array.isArray(risk?.tasks) && (risk.tasks as string[]).length > 0 ? (
            <SectionCard title="Suggested tasks" subtitle="From your last analysis.">
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {(risk.tasks as string[]).map((t, i) => (
                  <li key={i} className="text-foreground">
                    {t}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground mb-6">
            To change official SEVIS or academic records, work with your Designated School Official (DSO). To refresh
            this page with new answers, complete the questionnaire again (a future update can add &quot;update case&quot;
            without repeating all steps).
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
