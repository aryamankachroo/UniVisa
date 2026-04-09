import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Show, SignInButton, UserButton, useClerk, useUser } from "@clerk/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Shield, GraduationCap, Users, ArrowRight } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

const API_BASE = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";
const INSTITUTIONS_API = `${API_BASE}/api/institutions`;
const CASES_SUBMIT_API = `${API_BASE}/api/cases/submit`;

type InstitutionOption = { id: string; display_name: string };

function casesMeUrl(clerkUserId: string) {
  return `${API_BASE}/api/cases/me?clerk_user_id=${encodeURIComponent(clerkUserId)}`;
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Bulgaria",
  "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Denmark", "Egypt", "Estonia",
  "Finland", "France", "Germany", "Ghana", "Greece", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "South Korea", "Kuwait", "Lebanon", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Venezuela", "Vietnam", "Other",
];

type VisaStage = "studying" | "cpt" | "opt" | "stem_opt" | "opt_approved_not_started";
type EnrollmentStatus = "full_time" | "reduced_course_load" | "not_enrolled";
type TrainingType = "none" | "cpt" | "opt" | "stem_opt";
type StemEligible = "yes" | "no" | "not_sure" | "";
type StemApplicationStatus = "yes" | "no" | "pending" | "";
type SevisHistory = "yes" | "no" | "not_sure" | "";
type CptType = "part_time" | "full_time" | "";

interface ImmigrationCaseInput {
  // These fields mirror backend.backend.risk_engine.types.ImmigrationCaseInput
  fullName: string;
  university: string;
  country: string;

  currentStage: VisaStage;

  programStart: string;
  programEnd: string;

  enrollmentStatus: EnrollmentStatus;

  workHours?: number;
  courseChanges?: boolean;
  usingCpt?: boolean;

  cptHours?: number;
  cptType?: CptType | "";

  optStart?: string;
  optEnd?: string;

  unemploymentDaysUsed?: number;

  employedInAuthorizedJob?: boolean;
  changeEmployer?: boolean;

  stemEligible?: boolean | null;
  stemApplicationStatus?: "not_applied" | "pending" | "approved" | "denied";

  travelPlans?: boolean;
  receivedUSCISNotices?: boolean;
  unauthorizedWork?: boolean;
  sevisTerminatedBefore?: boolean | null;
}

interface FormData {
  fullName: string;
  /** Display name for risk engine when using catalog pick */
  university: string;
  universityPick: "catalog" | "other";
  /** Supabase institutions.id when universityPick === catalog */
  institutionId: string;
  /** Free-text school when universityPick === other (no DSO cohort link) */
  universityOther: string;
  country: string;

  // Visa status (stage only — app is F-1 only)
  currentStage: VisaStage;

  // Academic program
  programStart: string;
  programEnd: string;
  enrollmentStatus: EnrollmentStatus;
  courseChanges: boolean;

  // Work compliance (studying / CPT)
  workHours: number;
  usingCpt: boolean;
  cptHours: number;
  cptType: CptType;

  // OPT details
  optStart: string;
  optEnd: string;

  // STEM
  stemEligible: StemEligible;
  stemApplicationStatus: StemApplicationStatus;

  // Employment
  employedInAuthorizedJob: boolean | null;
  changeEmployer: boolean | null;

  // Risk factors
  unemploymentDaysUsed: number | "";
  travelPlans: boolean;
  receivedUSCISNotices: boolean;
  unauthorizedWork: boolean;
  sevisTerminatedBefore: SevisHistory;
}

interface AnalysisResult {
  riskScore: number;
  riskLevel: string;
  flags: { code: string; description?: string | null }[];
  tasks: string[];
  deadlines: { nextDeadline: string | null; daysUntilNextDeadline: number | null };
  urgent_tasks?: string[];
  compliance_explanation?: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [studentFlowStarted, setStudentFlowStarted] = useState(false);
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    university: "",
    universityPick: "catalog",
    institutionId: "",
    universityOther: "",
    country: "",
    currentStage: "studying",
    programStart: "",
    programEnd: "",
    enrollmentStatus: "full_time",
    courseChanges: false,
    workHours: 18,
    usingCpt: false,
    cptHours: 20,
    cptType: "part_time",
    optStart: "",
    optEnd: "",
    stemEligible: "",
    stemApplicationStatus: "",
    employedInAuthorizedJob: null,
    changeEmployer: null,
    unemploymentDaysUsed: "",
    travelPlans: false,
    receivedUSCISNotices: false,
    unauthorizedWork: false,
    sevisTerminatedBefore: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);

  /** False while checking whether this signed-in user already has a saved case (skip questionnaire). */
  const [savedCaseLookupDone, setSavedCaseLookupDone] = useState(false);

  useEffect(() => {
    setInstitutionsLoading(true);
    setInstitutionsError(null);
    fetch(INSTITUTIONS_API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((rows: InstitutionOption[]) => {
        if (Array.isArray(rows)) {
          setInstitutions(rows);
        }
      })
      .catch(() => {
        setInstitutions([]);
        setInstitutionsError("Could not load schools. Check that the API is running and Supabase is migrated.");
      })
      .finally(() => setInstitutionsLoading(false));
  }, []);

  // Returning users: backend already has questionnaire + risk → go straight to dashboard.
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setSavedCaseLookupDone(true);
      return;
    }

    let cancelled = false;
    setSavedCaseLookupDone(false);

    const ac = new AbortController();
    const timeoutMs = 15_000;
    const timeoutId = window.setTimeout(() => ac.abort(), timeoutMs);

    fetch(casesMeUrl(user.id), { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { risk?: unknown } | null) => {
        if (cancelled || !data?.risk) return;
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        /* stay on onboarding if API unreachable or slow */
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (!cancelled) setSavedCaseLookupDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id, navigate]);

  // Keep role selection as an explicit choice (no auto-redirect).
  // However, if the user clicked "I'm a Student" and then completed sign-in,
  // automatically continue into the questionnaire.
  useEffect(() => {
    if (studentFlowStarted && isLoaded && isSignedIn) {
      goToStudentStep(1);
      setStudentFlowStarted(false);
    }
  }, [studentFlowStarted, isLoaded, isSignedIn]);

  // Sync splash/questionnaire + step with URL so browser back/forward works.
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const view = sp.get("view"); // "student" | null
    const stepParam = sp.get("step");

    if (view === "student") {
      setShowRoleSelection(false);
      const n = Number(stepParam);
      if (Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS) {
        setStep(n);
      } else {
        setStep(1);
      }
    } else {
      setShowRoleSelection(true);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const goToStudentStep = (nextStep: number, replace = false) => {
    const s = Math.max(1, Math.min(TOTAL_STEPS, nextStep));
    navigate({ pathname: "/", search: `?view=student&step=${s}` }, { replace });
  };

  const goToRoleSelection = (replace = false) => {
    navigate({ pathname: "/", search: "" }, { replace });
  };

  const updateField = (field: keyof FormData, value: FormData[typeof field]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildImmigrationCaseInput = (): ImmigrationCaseInput => {
    // Map form data into the new deterministic engine's input shape
    const unemploymentDays =
      typeof formData.unemploymentDaysUsed === "number"
        ? formData.unemploymentDaysUsed
        : formData.unemploymentDaysUsed === ""
        ? 0
        : Number(formData.unemploymentDaysUsed) || 0;

    const stemEligibleBool =
      formData.stemEligible === "yes"
        ? true
        : formData.stemEligible === "no"
        ? false
        : null;

    let stemStatus: ImmigrationCaseInput["stemApplicationStatus"] = undefined;
    if (formData.stemApplicationStatus === "yes") stemStatus = "approved";
    else if (formData.stemApplicationStatus === "pending") stemStatus = "pending";
    else if (formData.stemApplicationStatus === "no") stemStatus = "denied";

    const sevisTerminatedBool =
      formData.sevisTerminatedBefore === "yes"
        ? true
        : formData.sevisTerminatedBefore === "no"
        ? false
        : null;

    const uniName =
      formData.universityPick === "other"
        ? formData.universityOther.trim()
        : formData.university.trim();

    return {
      fullName: formData.fullName,
      university: uniName,
      country: formData.country,

      currentStage: formData.currentStage,

      programStart: formData.programStart,
      programEnd: formData.programEnd,

      enrollmentStatus: formData.enrollmentStatus,

      workHours: formData.workHours,
      courseChanges: formData.courseChanges,
      usingCpt: formData.currentStage === "cpt" || formData.usingCpt,

      cptHours: formData.cptHours,
      cptType: formData.cptType || undefined,

      optStart: formData.optStart || undefined,
      optEnd: formData.optEnd || undefined,

      unemploymentDaysUsed: unemploymentDays,

      employedInAuthorizedJob: formData.employedInAuthorizedJob ?? undefined,
      changeEmployer: formData.changeEmployer ?? undefined,

      stemEligible: stemEligibleBool,
      stemApplicationStatus: stemStatus,

      travelPlans: formData.travelPlans,
      receivedUSCISNotices: formData.receivedUSCISNotices,
      unauthorizedWork: formData.unauthorizedWork,
      sevisTerminatedBefore: sevisTerminatedBool,
    };
  };

  const handleSubmit = async () => {
    if (!user) {
      setSubmitError("Please sign in first to save your analysis.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const immigration_case_input = buildImmigrationCaseInput();
    if (!immigration_case_input.university.trim()) {
      setSubmitError("Please select your university or enter your school name.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(CASES_SUBMIT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          institutionId:
            formData.universityPick === "catalog" && formData.institutionId.trim()
              ? formData.institutionId.trim()
              : null,
          immigration_case_input,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      localStorage.setItem("immigration_case_input", JSON.stringify(immigration_case_input));
      localStorage.setItem("immigration_case_analysis", JSON.stringify(data));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to analyze compliance", error);
      setSubmitError("We could not analyze your compliance right now. Please try again in a few minutes.");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  if (!isLoaded || (isSignedIn && !savedCaseLookupDone)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="fixed top-4 right-4 z-10 flex items-center gap-3">
          <ThemeToggle />
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton>Log in</SignInButton>
            </div>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
        <div className="w-full max-w-4xl">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>
                UniVisa
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              AI-powered visa compliance co-pilot for international students
            </p>
          </div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <button
              onClick={() => {
                if (isSignedIn) {
                  goToStudentStep(1);
                  return;
                }
                setStudentFlowStarted(true);
                try {
                  const maybePromise = openSignIn({});
                  void Promise.resolve(maybePromise).catch(() => {
                    // If modal fails to open for any reason, keep the splash visible.
                    setStudentFlowStarted(false);
                  });
                } catch {
                  // If modal throws synchronously, keep the splash visible.
                  setStudentFlowStarted(false);
                }
              }}
              className="group bg-card border-2 border-border hover:border-primary rounded-lg p-8 transition-all hover:scale-[1.02]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <GraduationCap className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">I'm a Student</h2>
                <p className="text-muted-foreground mb-4">
                  Track your visa compliance, get personalized alerts, and chat with AI advisor
                </p>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/dso")}
              className="group bg-card border-2 border-border hover:border-primary rounded-lg p-8 transition-all hover:scale-[1.02]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">I'm a DSO</h2>
                <p className="text-muted-foreground mb-4">
                  Open the DSO portal and sign up or sign in with your <strong className="text-foreground font-medium">official school email</strong> to claim your institution and monitor cohort risk.
                </p>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </motion.div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>
              UniVisa
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your AI-powered visa compliance co-pilot
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
            <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-8">
              {analysisResult ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">Your compliance analysis</h2>
              <p className="text-muted-foreground">
                Based on your answers, here is a snapshot of your current F-1/J-1 compliance position.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeof analysisResult.riskScore === "number" && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Risk score</div>
                    <div className="text-2xl font-semibold">{analysisResult.riskScore}</div>
                  </div>
                )}
                {analysisResult.riskLevel && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Current stage</div>
                    <div className="text-base font-medium">{analysisResult.riskLevel}</div>
                  </div>
                )}
                {Array.isArray(analysisResult.flags) && analysisResult.flags.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Flags</div>
                    <div className="text-base font-medium">
                      {analysisResult.flags.map((f) => f.code).join(", ")}
                    </div>
                  </div>
                )}
                {analysisResult.deadlines && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Next deadline</div>
                    <div className="text-base font-medium">
                      {analysisResult.deadlines.nextDeadline || "No upcoming deadline detected"}
                    </div>
                  </div>
                )}
              </div>

              {Array.isArray(analysisResult.urgent_tasks) && analysisResult.urgent_tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Urgent tasks</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {analysisResult.urgent_tasks.map((task: string, idx: number) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.compliance_explanation && (
                <div className="p-4 rounded-lg bg-muted/60 text-sm text-muted-foreground whitespace-pre-line">
                  {analysisResult.compliance_explanation}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysisResult(null);
                    setStep(1);
                  }}
                >
                  Edit answers
                </Button>
                <Button onClick={() => navigate("/dashboard")} className="bg-primary">
                  Go to dashboard
                </Button>
              </div>
            </div>
          ) : (
          <>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Basic profile</h2>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="university">University / college</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    This links your profile to your school so your DSO can see cohort risk after they register on UniVisa.
                  </p>
                  {institutionsError && (
                    <p className="text-xs text-destructive mb-2">{institutionsError}</p>
                  )}
                  <Select
                    value={
                      formData.universityPick === "other"
                        ? "__other__"
                        : formData.institutionId || undefined
                    }
                    onValueChange={(value) => {
                      if (value === "__other__") {
                        setFormData((prev) => ({
                          ...prev,
                          universityPick: "other",
                          institutionId: "",
                          university: prev.universityOther.trim(),
                        }));
                        return;
                      }
                      const inst = institutions.find((i) => i.id === value);
                      setFormData((prev) => ({
                        ...prev,
                        universityPick: "catalog",
                        institutionId: value,
                        university: inst?.display_name ?? "",
                      }));
                    }}
                    disabled={institutionsLoading}
                  >
                    <SelectTrigger className="mt-1.5" id="university">
                      <SelectValue placeholder={institutionsLoading ? "Loading schools…" : "Select your university"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(60vh,24rem)]">
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.display_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__other__">Other (not listed — no institution link)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.universityPick === "other" && (
                    <div className="mt-3">
                      <Label htmlFor="universityOther">School name</Label>
                      <Input
                        id="universityOther"
                        placeholder="Enter your school name"
                        value={formData.universityOther}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, universityOther: e.target.value, university: e.target.value.trim() }))
                        }
                        className="mt-1.5"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">Country of Origin</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => updateField("country", value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Your current F-1 stage</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  This determines which questions we show next.
                </p>
                <div>
                  <Label htmlFor="currentStage">Current stage</Label>
                  <Select
                    value={formData.currentStage}
                    onValueChange={(value) => updateField("currentStage", value as VisaStage)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select your stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studying">Studying (in program)</SelectItem>
                      <SelectItem value="cpt">On CPT (Curricular Practical Training)</SelectItem>
                      <SelectItem value="opt">On standard OPT</SelectItem>
                      <SelectItem value="stem_opt">On STEM OPT</SelectItem>
                      <SelectItem value="opt_approved_not_started">OPT approved, not started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Program dates</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="programStart">Program start date (I-20)</Label>
                    <Input
                      id="programStart"
                      type="date"
                      value={formData.programStart}
                      onChange={(e) => updateField("programStart", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="programEnd">Program end date (I-20)</Label>
                    <Input
                      id="programEnd"
                      type="date"
                      value={formData.programEnd}
                      onChange={(e) => updateField("programEnd", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Details for your stage</h2>

                {formData.currentStage === "studying" && (
                  <>
                    <div>
                      <Label htmlFor="enrollmentStatus">Enrollment status</Label>
                      <Select
                        value={formData.enrollmentStatus}
                        onValueChange={(value) => updateField("enrollmentStatus", value as EnrollmentStatus)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full-time</SelectItem>
                          <SelectItem value="reduced_course_load">Reduced course load (authorized)</SelectItem>
                          <SelectItem value="not_enrolled">Not enrolled this term</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="workHours">Weekly on-campus work hours: {formData.workHours}</Label>
                      <Slider
                        id="workHours"
                        min={0}
                        max={40}
                        step={1}
                        value={[formData.workHours]}
                        onValueChange={(value) => updateField("workHours", value[0])}
                        className="mt-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span>40</span>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-3 block">Planning to drop or add courses this semester?</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => updateField("courseChanges", true)}
                          className={`p-4 rounded-lg border-2 transition-all ${formData.courseChanges ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>Yes</button>
                        <button type="button" onClick={() => updateField("courseChanges", false)}
                          className={`p-4 rounded-lg border-2 transition-all ${!formData.courseChanges ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>No</button>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-3 block">Using CPT for off-campus work?</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => updateField("usingCpt", true)}
                          className={`p-4 rounded-lg border-2 transition-all ${formData.usingCpt ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>Yes</button>
                        <button type="button" onClick={() => updateField("usingCpt", false)}
                          className={`p-4 rounded-lg border-2 transition-all ${!formData.usingCpt ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>No</button>
                      </div>
                    </div>
                  </>
                )}

                {formData.currentStage === "cpt" && (
                  <>
                    <div>
                      <Label htmlFor="enrollmentStatusCpt">Enrollment status</Label>
                      <Select value={formData.enrollmentStatus} onValueChange={(value) => updateField("enrollmentStatus", value as EnrollmentStatus)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full-time</SelectItem>
                          <SelectItem value="reduced_course_load">Reduced course load</SelectItem>
                          <SelectItem value="not_enrolled">Not enrolled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CPT hours per week: {formData.cptHours}</Label>
                      <Slider id="cptHours" min={0} max={40} step={1} value={[formData.cptHours]} onValueChange={(v) => updateField("cptHours", v[0])} className="mt-3" />
                    </div>
                    <div>
                      <Label htmlFor="cptType">CPT type</Label>
                      <Select value={formData.cptType} onValueChange={(value) => updateField("cptType", value as CptType)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="part_time">Part-time (≤20 hrs/week)</SelectItem>
                          <SelectItem value="full_time">Full-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {formData.currentStage === "opt" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="optStart">OPT start date</Label>
                        <Input id="optStart" type="date" value={formData.optStart} onChange={(e) => updateField("optStart", e.target.value)} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="optEnd">OPT end date</Label>
                        <Input id="optEnd" type="date" value={formData.optEnd} onChange={(e) => updateField("optEnd", e.target.value)} className="mt-1.5" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="unemploymentDays">Unemployment days used</Label>
                      <Input id="unemploymentDays" type="number" min={0} value={formData.unemploymentDaysUsed}
                        onChange={(e) => { const v = e.target.value; updateField("unemploymentDaysUsed", v === "" ? "" : Math.max(0, Number(v) || 0)); }} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="mb-3 block">Employed in a job authorized for OPT?</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => updateField("employedInAuthorizedJob", true)}
                          className={`p-4 rounded-lg border-2 transition-all ${formData.employedInAuthorizedJob === true ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>Yes</button>
                        <button type="button" onClick={() => updateField("employedInAuthorizedJob", false)}
                          className={`p-4 rounded-lg border-2 transition-all ${formData.employedInAuthorizedJob === false ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>No</button>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-3 block">Planning to change employers?</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => updateField("changeEmployer", true)}
                          className={`p-4 rounded-lg border-2 transition-all ${formData.changeEmployer === true ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>Yes</button>
                        <button type="button" onClick={() => updateField("changeEmployer", false)}
                          className={`p-4 rounded-lg border-2 transition-all ${formData.changeEmployer === false ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>No</button>
                      </div>
                    </div>
                  </>
                )}

                {formData.currentStage === "stem_opt" && (
                  <>
                    <div>
                      <Label className="mb-3 block">Degree STEM-eligible for STEM OPT?</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <button type="button" onClick={() => updateField("stemEligible", "yes")} className={`p-3 rounded-lg border-2 text-sm ${formData.stemEligible === "yes" ? "border-primary bg-primary/10" : "border-border"}`}>Yes</button>
                        <button type="button" onClick={() => updateField("stemEligible", "no")} className={`p-3 rounded-lg border-2 text-sm ${formData.stemEligible === "no" ? "border-primary bg-primary/10" : "border-border"}`}>No</button>
                        <button type="button" onClick={() => updateField("stemEligible", "not_sure")} className={`p-3 rounded-lg border-2 text-sm ${formData.stemEligible === "not_sure" ? "border-primary bg-primary/10" : "border-border"}`}>Not sure</button>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-3 block">STEM OPT application status</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <button type="button" onClick={() => updateField("stemApplicationStatus", "yes")} className={`p-3 rounded-lg border-2 text-sm ${formData.stemApplicationStatus === "yes" ? "border-primary bg-primary/10" : "border-border"}`}>Approved</button>
                        <button type="button" onClick={() => updateField("stemApplicationStatus", "pending")} className={`p-3 rounded-lg border-2 text-sm ${formData.stemApplicationStatus === "pending" ? "border-primary bg-primary/10" : "border-border"}`}>Pending</button>
                        <button type="button" onClick={() => updateField("stemApplicationStatus", "no")} className={`p-3 rounded-lg border-2 text-sm ${formData.stemApplicationStatus === "no" ? "border-primary bg-primary/10" : "border-border"}`}>Not applied</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>OPT/STEM OPT start date</Label><Input type="date" value={formData.optStart} onChange={(e) => updateField("optStart", e.target.value)} className="mt-1.5" /></div>
                      <div><Label>OPT/STEM OPT end date</Label><Input type="date" value={formData.optEnd} onChange={(e) => updateField("optEnd", e.target.value)} className="mt-1.5" /></div>
                    </div>
                    <div>
                      <Label>Unemployment days used (OPT + STEM OPT)</Label>
                      <Input type="number" min={0} value={formData.unemploymentDaysUsed}
                        onChange={(e) => { const v = e.target.value; updateField("unemploymentDaysUsed", v === "" ? "" : Math.max(0, Number(v) || 0)); }} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="mb-3 block">Planning to change employers?</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => updateField("changeEmployer", true)} className={`p-4 rounded-lg border-2 ${formData.changeEmployer === true ? "border-primary bg-primary/10" : "border-border"}`}>Yes</button>
                        <button type="button" onClick={() => updateField("changeEmployer", false)} className={`p-4 rounded-lg border-2 ${formData.changeEmployer === false ? "border-primary bg-primary/10" : "border-border"}`}>No</button>
                      </div>
                    </div>
                  </>
                )}

                {formData.currentStage === "opt_approved_not_started" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>OPT start date</Label><Input type="date" value={formData.optStart} onChange={(e) => updateField("optStart", e.target.value)} className="mt-1.5" /></div>
                      <div><Label>OPT end date</Label><Input type="date" value={formData.optEnd} onChange={(e) => updateField("optEnd", e.target.value)} className="mt-1.5" /></div>
                    </div>
                    <p className="text-sm text-muted-foreground">We only need your OPT dates until you start.</p>
                  </>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Risk factors</h2>

                <div>
                  <Label className="mb-3 block">
                    Planning to travel outside the US in the next 90 days?
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("travelPlans", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.travelPlans
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("travelPlans", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !formData.travelPlans
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Have you received any USCIS notices or RFEs?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("receivedUSCISNotices", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.receivedUSCISNotices
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("receivedUSCISNotices", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !formData.receivedUSCISNotices
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Have you ever worked without proper authorization?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("unauthorizedWork", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.unauthorizedWork
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("unauthorizedWork", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !formData.unauthorizedWork
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Has your SEVIS record ever been terminated?</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("sevisTerminatedBefore", "yes")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.sevisTerminatedBefore === "yes"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("sevisTerminatedBefore", "no")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.sevisTerminatedBefore === "no"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("sevisTerminatedBefore", "not_sure")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.sevisTerminatedBefore === "not_sure"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Not sure
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {submitError && !analysisResult && (
            <div className="mt-4 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* Navigation Buttons */}
          {!analysisResult && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                if (step <= 1) {
                  goToRoleSelection();
                } else {
                  goToStudentStep(step - 1);
                }
              }}
            >
              Back
            </Button>
            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => {
                  if (step === 1) {
                    if (!formData.fullName.trim()) return;
                    if (formData.universityPick === "catalog" && !formData.institutionId.trim()) return;
                    if (formData.universityPick === "other" && !formData.universityOther.trim()) return;
                  }
                  goToStudentStep(step + 1);
                }}
                className="bg-primary"
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-primary min-w-[200px]" disabled={submitting}>
                {submitting ? "Analyzing..." : "Analyze My Risk"}
              </Button>
            )}
          </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}