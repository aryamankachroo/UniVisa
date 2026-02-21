import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Shield, GraduationCap, Users, ArrowRight } from "lucide-react";

interface FormData {
  fullName: string;
  university: string;
  country: string;
  visaType: "F-1" | "J-1";
  programStart: string;
  programEnd: string;
  enrollmentStatus: string;
  workHours: number;
  onOptCpt: boolean;
  optCptStart: string;
  optCptEnd: string;
  travelPlans: boolean;
  changeEmployer: boolean;
  courseChanges: boolean;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    university: "",
    country: "",
    visaType: "F-1",
    programStart: "",
    programEnd: "",
    enrollmentStatus: "Full-time",
    workHours: 18,
    onOptCpt: false,
    optCptStart: "",
    optCptEnd: "",
    travelPlans: false,
    changeEmployer: false,
    courseChanges: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Store form data in localStorage for demo purposes
    localStorage.setItem("visaGuardUser", JSON.stringify(formData));
    navigate("/dashboard");
  };

  const progressPercent = (step / 3) * 100;

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>
                VisaGuard
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

          {/* Demo Note */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Demo app featuring Riya Sharma, an MS Computer Science student at Georgia Tech</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>
              VisaGuard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your AI-powered visa compliance co-pilot
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Step {step} of 3</span>
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
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Who are you?</h2>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Riya Sharma"
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
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Georgia Tech">Georgia Institute of Technology</SelectItem>
                      <SelectItem value="MIT">Massachusetts Institute of Technology</SelectItem>
                      <SelectItem value="UCLA">University of California, Los Angeles</SelectItem>
                      <SelectItem value="Stanford">Stanford University</SelectItem>
                      <SelectItem value="Harvard">Harvard University</SelectItem>
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
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="South Korea">South Korea</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="Brazil">Brazil</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
                          : "border-border hover:border-primary/50"
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
                          : "border-border hover:border-primary/50"
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
                <h2 className="text-2xl font-semibold mb-6">Your visa situation</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="programStart">Program Start Date</Label>
                    <Input
                      id="programStart"
                      type="date"
                      value={formData.programStart}
                      onChange={(e) => updateField("programStart", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="programEnd">Program End Date</Label>
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
                  <Label htmlFor="enrollmentStatus">Current Enrollment Status</Label>
                  <Select
                    value={formData.enrollmentStatus}
                    onValueChange={(value) => updateField("enrollmentStatus", value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="On break">On break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="workHours">
                    Weekly On-Campus Work Hours: {formData.workHours}
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
                  <Label className="mb-3 block">
                    Are you currently on OPT or CPT?
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("onOptCpt", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.onOptCpt
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("onOptCpt", false)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !formData.onOptCpt
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {formData.onOptCpt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <Label htmlFor="optCptStart">OPT/CPT Start Date</Label>
                      <Input
                        id="optCptStart"
                        type="date"
                        value={formData.optCptStart}
                        onChange={(e) => updateField("optCptStart", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="optCptEnd">OPT/CPT End Date</Label>
                      <Input
                        id="optCptEnd"
                        type="date"
                        value={formData.optCptEnd}
                        onChange={(e) => updateField("optCptEnd", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </motion.div>
                )}
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
                <h2 className="text-2xl font-semibold mb-6">Upcoming plans</h2>

                <div>
                  <Label className="mb-3 block">
                    Planning to travel outside US in next 90 days?
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
                  <Label className="mb-3 block">
                    Planning to change employers?
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateField("changeEmployer", true)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.changeEmployer
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
                        !formData.changeEmployer
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
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
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="bg-primary">
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="bg-primary min-w-[200px]">
                Analyze My Risk
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}