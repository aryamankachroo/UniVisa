import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Shield, GraduationCap, Users, ArrowRight } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

const API_BASE = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:8000";
const UNIVERSITIES_API = `${API_BASE}/universities`;
const COMPLIANCE_ANALYZE_API = `${API_BASE}/api/compliance/analyze`;

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

const TOP_UNIVERSITIES = [
  "Georgia Institute of Technology",
  "MIT",
  "Stanford University",
  "UC Berkeley",
  "Carnegie Mellon University",
];

type VisaStage = "studying" | "opt" | "stem_opt" | "opt_approved_not_started";
type EnrollmentStatus = "full_time" | "reduced_course_load" | "not_enrolled";
type TrainingType = "none" | "cpt" | "opt" | "stem_opt";
type StemEligible = "yes" | "no" | "not_sure" | "";
type StemApproved = "yes" | "no" | "pending" | "";
type SevisHistory = "yes" | "no" | "not_sure" | "";

interface ImmigrationCaseInput {
  // Step 1 — Basic Profile
  full_name: string;
  university_name: string;
  country_of_origin: string;
  visa_type: "F-1" | "J-1" | "";

  // Step 2 — Visa Status
  is_on_f1: boolean;
  inside_us: boolean;
  current_stage: VisaStage;

  // Step 3 — Academic Program
  program_start_date: string;
  program_end_date: string;
  enrollment_status: EnrollmentStatus;
  planning_course_changes: boolean;

  // Step 4 — Work Compliance
  on_campus_hours: number;
  training_type: TrainingType;

  // Step 5 — OPT Details
  opt_start_date: string;
  opt_end_date: string;

  // Step 6 — STEM
  stem_eligible: StemEligible;
  stem_approved: StemApproved;

  // Step 7 — Employment
  employed_in_authorized_job: boolean;
  planning_employer_change: boolean;

  // Step 8 — Risk Factors
  unemployment_days_used: number;
  travel_plans_next_90_days: boolean;
  received_uscis_notices: boolean;
  unauthorized_work: boolean;
  sevis_terminated_before: SevisHistory;
}

interface FormData {
  fullName: string;
  university: string;
  country: string;
  visaType: "F-1" | "J-1" | "";

  // Visa status
  isOnF1: boolean | null;
  insideUS: boolean | null;
  currentStage: VisaStage;

  // Academic program
  programStart: string;
  programEnd: string;
  enrollmentStatus: EnrollmentStatus;
  courseChanges: boolean;

  // Work compliance
  workHours: number;
  trainingType: TrainingType;

  // OPT details
  optStart: string;
  optEnd: string;

  // STEM
  stemEligible: StemEligible;
  stemApproved: StemApproved;

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

export default function Onboarding() {
  const navigate = useNavigate();
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 7;
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    university: "",
    country: "",
    visaType: "",
    isOnF1: null,
    insideUS: null,
    currentStage: "studying",
    programStart: "",
    programEnd: "",
    enrollmentStatus: "full_time",
    courseChanges: false,
    workHours: 18,
    trainingType: "none",
    optStart: "",
    optEnd: "",
    stemEligible: "",
    stemApproved: "",
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
  const [analysisResult, setAnalysisResult] = useState<{
    risk_score?: number;
    current_stage?: string;
    unemployment_usage?: number;
    next_deadline?: string | null;
    urgent_tasks?: string[];
    compliance_explanation?: string;
  } | null>(null);

  const [universities, setUniversities] = useState<string[]>(TOP_UNIVERSITIES);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [universitiesError, setUniversitiesError] = useState<string | null>(null);

  useEffect(() => {
    fetch(UNIVERSITIES_API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((names: string[]) => {
        if (Array.isArray(names) && names.length > 0) {
          setUniversities(names);
        }
      })
      .catch(() => {
        // Keep TOP_UNIVERSITIES as fallback; no error message so dropdown stays usable
      });
  }, []);

  const updateField = (field: keyof FormData, value: FormData[typeof field]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildImmigrationCaseInput = (): ImmigrationCaseInput => {
    return {
      full_name: formData.fullName,
      university_name: formData.university,
      country_of_origin: formData.country,
      visa_type: formData.visaType,

      is_on_f1: formData.isOnF1 ?? false,
      inside_us: formData.insideUS ?? false,
      current_stage: formData.currentStage,

      program_start_date: formData.programStart,
      program_end_date: formData.programEnd,
      enrollment_status: formData.enrollmentStatus,
      planning_course_changes: formData.courseChanges,

      on_campus_hours: formData.workHours,
      training_type: formData.trainingType,

      opt_start_date: formData.optStart,
      opt_end_date: formData.optEnd,

      stem_eligible: formData.stemEligible,
      stem_approved: formData.stemApproved,

      employed_in_authorized_job: formData.employedInAuthorizedJob ?? false,
      planning_employer_change: formData.changeEmployer ?? false,

      unemployment_days_used:
        typeof formData.unemploymentDaysUsed === "number"
          ? formData.unemploymentDaysUsed
          : formData.unemploymentDaysUsed === ""
          ? 0
          : Number(formData.unemploymentDaysUsed) || 0,
      travel_plans_next_90_days: formData.travelPlans,
      received_uscis_notices: formData.receivedUSCISNotices,
      unauthorized_work: formData.unauthorizedWork,
      sevis_terminated_before: formData.sevisTerminatedBefore,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const immigration_case_input = buildImmigrationCaseInput();

    try {
      const response = await fetch(COMPLIANCE_ANALYZE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ immigration_case_input }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      localStorage.setItem("immigration_case_input", JSON.stringify(immigration_case_input));
      localStorage.setItem("immigration_case_analysis", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to analyze compliance", error);
      setSubmitError("We could not analyze your compliance right now. Please try again in a few minutes.");
    } finally {
      setSubmitting(false);
      navigate("/dashboard");
    }
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="fixed top-4 right-4 z-10">
          <ThemeToggle />
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
              onClick={() => setShowRoleSelection(false)}
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
                  Monitor compliance across your student cohort with real-time risk dashboard
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
                {"risk_score" in analysisResult && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Risk score</div>
                    <div className="text-2xl font-semibold">
                      {typeof analysisResult.risk_score === "number" ? analysisResult.risk_score.toFixed(1) : "--"}
                    </div>
                  </div>
                )}
                {"current_stage" in analysisResult && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Current stage</div>
                    <div className="text-base font-medium">
                      {analysisResult.current_stage || "Not specified"}
                    </div>
                  </div>
                )}
                {"unemployment_usage" in analysisResult && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Unemployment usage</div>
                    <div className="text-base font-medium">
                      {analysisResult.unemployment_usage ?? "--"} days
                    </div>
                  </div>
                )}
                {"next_deadline" in analysisResult && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Next deadline</div>
                    <div className="text-base font-medium">
                      {analysisResult.next_deadline || "No upcoming deadline detected"}
                    </div>
                  </div>
                )}
              </div>

              {Array.isArray(analysisResult.urgent_tasks) && analysisResult.urgent_tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Urgent tasks</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {analysisResult.urgent_tasks.map((task, idx) => (
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
                  <Label htmlFor="university">University Name</Label>
                  <Select
                    value={formData.university}
                    onValueChange={(value) => updateField("university", value)}
                    disabled={universitiesLoading}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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

                <div>
                  <Label className="mb-3 block">Visa Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("visaType", "F-1")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.visaType === "F-1"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold mb-1">F-1 Visa</div>
                      <div className="text-sm text-muted-foreground">
                        Academic Student
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("visaType", "J-1")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.visaType === "J-1"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-transparent hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold mb-1">J-1 Visa</div>
                      <div className="text-sm text-muted-foreground">
                        Exchange Visitor
                      </div>
                    </button>
                  </div>
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
                <h2 className="text-2xl font-semibold mb-6">Visa status</h2>

                <div>
                  <Label className="mb-3 block">Are you currently in F-1 status?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("isOnF1", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.isOnF1 === true
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("isOnF1", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.isOnF1 === false
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Are you currently inside the US?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("insideUS", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.insideUS === true
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("insideUS", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.insideUS === false
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentStage">Current stage</Label>
                  <Select
                    value={formData.currentStage}
                    onValueChange={(value) => updateField("currentStage", value as VisaStage)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studying">Studying (in program)</SelectItem>
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
                <h2 className="text-2xl font-semibold mb-6">Academic program</h2>

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

                <div>
                  <Label htmlFor="enrollmentStatus">Current enrollment status</Label>
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
                  <Label className="mb-3 block">
                    Planning to drop or add courses this semester?
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("courseChanges", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.courseChanges
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("courseChanges", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !formData.courseChanges
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
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
                <h2 className="text-2xl font-semibold mb-6">Work compliance</h2>

                <div>
                  <Label htmlFor="workHours">
                    Weekly on-campus work hours: {formData.workHours}
                  </Label>
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
                    <span>0 hours</span>
                    <span>40 hours</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="trainingType">Current training authorization</Label>
                  <Select
                    value={formData.trainingType}
                    onValueChange={(value) => updateField("trainingType", value as TrainingType)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select training type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="cpt">CPT (Curricular Practical Training)</SelectItem>
                      <SelectItem value="opt">OPT (Optional Practical Training)</SelectItem>
                      <SelectItem value="stem_opt">STEM OPT extension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <h2 className="text-2xl font-semibold mb-6">STEM eligibility</h2>

                <div>
                  <Label className="mb-3 block">Is your degree STEM-eligible for STEM OPT?</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("stemEligible", "yes")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.stemEligible === "yes"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("stemEligible", "no")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.stemEligible === "no"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("stemEligible", "not_sure")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.stemEligible === "not_sure"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Not sure
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">STEM OPT application status</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("stemApproved", "yes")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.stemApproved === "yes"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("stemApproved", "pending")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.stemApproved === "pending"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("stemApproved", "no")}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.stemApproved === "no"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Not applied / denied
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Employment</h2>

                <div>
                  <Label className="mb-3 block">Are you working in a job authorized for your status?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("employedInAuthorizedJob", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.employedInAuthorizedJob === true
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("employedInAuthorizedJob", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.employedInAuthorizedJob === false
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No / not working
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">
                    Planning to change employers?
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("changeEmployer", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.changeEmployer === true
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("changeEmployer", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.changeEmployer === false
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Risk factors</h2>

                <div>
                  <Label htmlFor="unemploymentDays">Total unemployment days used (if on OPT/STEM)</Label>
                  <Input
                    id="unemploymentDays"
                    type="number"
                    min={0}
                    value={formData.unemploymentDaysUsed}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateField(
                        "unemploymentDaysUsed",
                        value === "" ? "" : Math.max(0, Number.isNaN(Number(value)) ? 0 : Number(value))
                      );
                    }}
                    className="mt-1.5"
                  />
                </div>

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
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))} className="bg-primary">
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