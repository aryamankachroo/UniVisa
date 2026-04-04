import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { SignInButton, SignUpButton, useAuth, useClerk } from "@clerk/react";
import { Shield, Users, TrendingUp, AlertTriangle, CheckCircle, Briefcase } from "lucide-react";
import {
  listDsoCPTRequests,
  type DsoCPTRequest,
  type DsoStudentRowApi,
  fetchDsoMe,
  fetchDsoStudents,
  claimDsoInstitution,
  fetchInstitutionCatalog,
  type InstitutionRow,
} from "../api";
import { ThemeToggle } from "../components/ThemeToggle";
import { StudentRow } from "../components/StudentRow";
import { RiskBadge } from "../components/RiskBadge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";

const DEV_API_HINT =
  "Backend: set CLERK_JWKS_URL and CLERK_JWT_ISSUER. Clerk: add `email` from user.primary_email_address to the session token so institution claim can check your domain.";

function riskBandFromApi(row: DsoStudentRowApi): "high" | "medium" | "low" {
  const rl = row.risk_level?.toUpperCase();
  if (rl === "HIGH" || rl === "CRITICAL") return "high";
  if (rl === "MEDIUM") return "medium";
  if (rl === "LOW") return "low";
  if (row.risk_score > 70) return "high";
  if (row.risk_score >= 40) return "medium";
  return "low";
}

const SCHEDULE_TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM",
];

const CPT_STATUS: Record<string, string> = { intent: "Early alert (no offer yet)", offer_signed: "Offer signed — pending", approved: "Approved", rejected: "Rejected" };

export default function DSODashboard() {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"riskScore" | "name">("riskScore");
  const [cptRequests, setCptRequests] = useState<DsoCPTRequest[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [dsoStudents, setDsoStudents] = useState<DsoStudentRowApi[]>([]);
  const [dsoSummary, setDsoSummary] = useState({
    total: 0,
    high_risk: 0,
    medium_risk: 0,
    compliant: 0,
  });
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [dsoLoading, setDsoLoading] = useState(true);
  const [dsoError, setDsoError] = useState<string | null>(null);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [claimCatalog, setClaimCatalog] = useState<InstitutionRow[]>([]);
  const [claimFilter, setClaimFilter] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);

  const loadCohort = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setDsoLoading(false);
      return;
    }
    setDsoError(null);
    try {
      const me = await fetchDsoMe(token);
      if (!me.institution_id) {
        setNeedsClaim(true);
        setInstitutionName(null);
        setDsoStudents([]);
        setDsoSummary({ total: 0, high_risk: 0, medium_risk: 0, compliant: 0 });
        const cat = await fetchInstitutionCatalog().catch(() => []);
        setClaimCatalog(cat);
        return;
      }
      setNeedsClaim(false);
      setInstitutionName(me.display_name);
      const data = await fetchDsoStudents(token);
      setDsoStudents(data.students);
      setDsoSummary(data.summary);
    } catch (e) {
      setDsoError(e instanceof Error ? e.message : "Could not load DSO data");
      setNeedsClaim(false);
    } finally {
      setDsoLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    listDsoCPTRequests().then(setCptRequests).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setDsoLoading(false);
      return;
    }
    setDsoLoading(true);
    loadCohort();
  }, [isLoaded, isSignedIn, loadCohort]);

  const sortedStudents = [...dsoStudents].sort((a, b) => {
    if (sortBy === "riskScore") {
      return b.risk_score - a.risk_score;
    }
    return a.name.localeCompare(b.name);
  });

  const selectedStudentData = sortedStudents.find((s) => s.clerk_user_id === selectedStudent) ?? null;

  const filteredClaimCatalog = claimCatalog.filter((r) =>
    r.display_name.toLowerCase().includes(claimFilter.trim().toLowerCase())
  );

  async function handleClaimInstitution(institutionId: string) {
    setClaimBusy(true);
    try {
      const token = await getToken();
      await claimDsoInstitution(token, institutionId);
      toast.success("Institution linked to your account.");
      setNeedsClaim(false);
      await loadCohort();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaimBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>
              UniVisa
            </span>
            <span className="ml-2 text-sm text-muted-foreground">DSO Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isLoaded && isSignedIn ? (
              <>
                <span className="text-sm text-muted-foreground max-w-[200px] truncate" title={institutionName ?? undefined}>
                  {institutionName ?? "Institution"}
                </span>
                <Button variant="outline" size="sm" onClick={() => signOut(() => navigate("/"))}>
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <SignUpButton mode="modal">
                  <Button variant="outline" size="sm">
                    Register with school email
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button variant="default" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {isLoaded && !isSignedIn ? (
          <div className="max-w-xl space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary mb-2">Institution access</p>
              <h1 className="text-2xl font-semibold mb-2">DSO portal — official school email only</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                UniVisa is set up for <strong className="text-foreground font-medium">email sign-up and sign-in</strong>
                . Use your <strong className="text-foreground font-medium">official institutional address</strong> (for
                example your <span className="whitespace-nowrap">@university.edu</span> work email), not a personal Gmail
                or Yahoo account. That email is used to verify your school when you claim your institution on the next
                step.
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 border border-border rounded-lg p-4 bg-muted/30">
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">1.</span>
                <span>New to UniVisa? Create an account with your college email.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">2.</span>
                <span>Returning? Sign in with the same institutional email.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">3.</span>
                <span>After sign-in, search for your school and claim it to open the risk dashboard.</span>
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <SignUpButton mode="modal">
                <Button size="lg" className="min-w-[200px]">
                  Register with school email
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="min-w-[160px]">
                  Sign in
                </Button>
              </SignInButton>
            </div>
            <p className="text-xs text-muted-foreground">{DEV_API_HINT}</p>
          </div>
        ) : null}

        {isLoaded && isSignedIn ? (
          <>
          {dsoLoading && (
            <p className="text-sm text-muted-foreground mb-6">Loading dashboard…</p>
          )}

          {!dsoLoading && dsoError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6 text-sm">
              <p className="font-medium text-destructive">Could not load dashboard</p>
              <p className="text-muted-foreground mt-1">{dsoError}</p>
              <p className="text-xs text-muted-foreground mt-2">{DEV_API_HINT}</p>
            </div>
          )}

          {!dsoLoading && needsClaim && !dsoError && (
            <div className="max-w-2xl space-y-4 mb-10">
              <h1 className="text-2xl font-semibold">Claim your institution</h1>
              <p className="text-muted-foreground text-sm">
                You are signed in with your institutional email. Search for your school and claim it. The{" "}
                <strong className="text-foreground font-medium">first DSO</strong> to claim a school sets which{" "}
                <strong className="text-foreground font-medium">email domain</strong> may access this dashboard (taken
                from your sign-in address). Other DSOs at the same college must register or sign in with an address on
                that same domain.
              </p>
              <Input
                placeholder="Filter schools…"
                value={claimFilter}
                onChange={(e) => setClaimFilter(e.target.value)}
                className="max-w-md"
              />
              <div className="border border-border rounded-lg max-h-[min(50vh,24rem)] overflow-y-auto divide-y divide-border">
                {filteredClaimCatalog.slice(0, 200).map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <span className="min-w-0">{row.display_name}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={claimBusy}
                      onClick={() => handleClaimInstitution(row.id)}
                    >
                      Claim
                    </Button>
                  </div>
                ))}
                {filteredClaimCatalog.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">No schools match. Run the SQL migration and ensure the API can reach Supabase.</p>
                )}
              </div>
            </div>
          )}

          {!dsoLoading && !needsClaim && !dsoError && (
            <>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">International Student Risk Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor compliance status across your student cohort
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{dsoSummary.total}</div>
            <div className="text-sm text-muted-foreground">Total International Students</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-lg p-6 border-l-4 border-l-[#FF4D4D]"
          >
            <div className="flex items-start justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-[#FF4D4D]" />
            </div>
            <div className="text-3xl font-bold mb-1 text-[#FF4D4D]">
              {dsoSummary.high_risk}
            </div>
            <div className="text-sm text-muted-foreground">High Risk Students</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-lg p-6 border-l-4 border-l-[#FFB347]"
          >
            <div className="flex items-start justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-[#FFB347]" />
            </div>
            <div className="text-3xl font-bold mb-1 text-[#FFB347]">
              {dsoSummary.medium_risk}
            </div>
            <div className="text-sm text-muted-foreground">Medium Risk</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-lg p-6 border-l-4 border-l-[#4CAF50]"
          >
            <div className="flex items-start justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-[#4CAF50]" />
            </div>
            <div className="text-3xl font-bold mb-1 text-[#4CAF50]">
              {dsoSummary.compliant}
            </div>
            <div className="text-sm text-muted-foreground">Compliant</div>
          </motion.div>
        </div>

        {cptRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              CPT requests (early visibility)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Students who started CPT before signing their offer — prepare approval so it’s faster when they upload the signed offer.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Student</th>
                    <th className="pb-2 pr-4">Company</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Start – End</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cptRequests.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium">{r.student_name}</td>
                      <td className="py-3 pr-4">{r.company_name}</td>
                      <td className="py-3 pr-4">{r.role}</td>
                      <td className="py-3 pr-4">{r.expected_start_date} – {r.expected_end_date}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.status === "intent" ? "bg-primary/20 text-primary" : r.status === "offer_signed" ? "bg-amber-500/20 text-amber-600" : r.status === "approved" ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                          {CPT_STATUS[r.status] ?? r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Student Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">Student Risk Overview</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
              >
                <option value="riskScore">Risk Score</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div className="flex">
            {/* Table */}
            <div className={`${selectedStudent ? "w-2/3" : "w-full"} transition-all`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Country</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Visa</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Program End</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Risk Score</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Top Risk Flag</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No students linked to this institution yet, or none have opted in. Students must pick this school
                          during onboarding and keep &quot;visible to DSO&quot; on in Profile.
                        </td>
                      </tr>
                    ) : (
                      sortedStudents.map((student) => (
                        <StudentRow
                          key={student.clerk_user_id}
                          name={student.name}
                          country={student.country}
                          visa={student.visa}
                          programEnd={student.program_end}
                          riskScore={student.risk_score}
                          topRiskFlag={student.top_risk_flag}
                          lastActive={student.last_active ?? "—"}
                          riskBand={riskBandFromApi(student)}
                          isExpanded={selectedStudent === student.clerk_user_id}
                          onClick={() =>
                            setSelectedStudent(
                              selectedStudent === student.clerk_user_id ? null : student.clerk_user_id
                            )
                          }
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail Panel */}
            {selectedStudent && selectedStudentData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-1/3 border-l border-border p-6 bg-muted/20"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">
                    {selectedStudentData.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Program end {selectedStudentData.program_end} · {selectedStudentData.visa}
                  </p>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Risk</span>
                  <RiskBadge level={riskBandFromApi(selectedStudentData)} />
                  <span className="text-sm font-semibold tabular-nums">{selectedStudentData.risk_score}</span>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Suggested actions (from analysis)</h4>
                  <div className="space-y-2">
                    {selectedStudentData.tasks.length > 0 ? (
                      selectedStudentData.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 rounded bg-background border border-border"
                        >
                          {task}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No tasks listed for this snapshot.</div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Flags</h4>
                  <div className="space-y-2">
                    {selectedStudentData.flag_descriptions.length > 0 ? (
                      selectedStudentData.flag_descriptions.map((risk, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 rounded bg-background border border-border"
                        >
                          {risk}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No flag descriptions in the last saved analysis.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      toast.success("Student has been notified.");
                    }}
                  >
                    Notify Student
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setScheduleDialogOpen(true)}
                  >
                    Schedule Meeting
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
            </>
          )}
          </>
        ) : null}
      </main>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Choose a date and time for the meeting with{" "}
              {selectedStudentData?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Time</label>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!scheduleDate || !scheduleTime) {
                  toast.error("Please select both date and time.");
                  return;
                }
                const dateStr = new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                toast.success(`Meeting scheduled for ${dateStr} at ${scheduleTime}.`);
                setScheduleDialogOpen(false);
                setScheduleDate("");
                setScheduleTime("");
              }}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
