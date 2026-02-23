import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Users, TrendingUp, AlertTriangle, CheckCircle, Briefcase } from "lucide-react";
import { listDsoCPTRequests, type DsoCPTRequest } from "../api";
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

const SCHEDULE_TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM",
];

const STUDENTS_DATA = [
  {
    id: 1,
    name: "Riya Sharma",
    country: "India",
    visa: "F-1",
    programEnd: "May 15, 2026",
    riskScore: 74,
    topRiskFlag: "OPT application deadline approaching",
    lastActive: "2 hours ago",
    details: {
      email: "riya.sharma@gatech.edu",
      major: "Computer Science MS",
      enrollmentStatus: "Full-time",
      workHours: 18,
      risks: [
        "OPT application window opens in 18 days",
        "Work hours approaching 20hr limit",
        "Program end date in 84 days",
      ],
    },
  },
  {
    id: 2,
    name: "Wei Chen",
    country: "China",
    visa: "F-1",
    programEnd: "Dec 20, 2026",
    riskScore: 68,
    topRiskFlag: "Address change not reported",
    lastActive: "1 day ago",
    details: {
      email: "wei.chen@gatech.edu",
      major: "Electrical Engineering PhD",
      enrollmentStatus: "Full-time",
      workHours: 20,
      risks: [
        "Address change pending USCIS notification",
        "SEVIS fee renewal due in 45 days",
      ],
    },
  },
  {
    id: 3,
    name: "Carlos Rodriguez",
    country: "Mexico",
    visa: "F-1",
    programEnd: "Aug 15, 2027",
    riskScore: 45,
    topRiskFlag: "Travel documentation needs review",
    lastActive: "3 hours ago",
    details: {
      email: "carlos.rodriguez@gatech.edu",
      major: "Mechanical Engineering MS",
      enrollmentStatus: "Full-time",
      workHours: 15,
      risks: [
        "Upcoming international travel in 30 days",
        "I-20 signature expiring soon",
      ],
    },
  },
  {
    id: 4,
    name: "Aisha Patel",
    country: "India",
    visa: "J-1",
    programEnd: "Jun 30, 2026",
    riskScore: 28,
    topRiskFlag: "All requirements met",
    lastActive: "5 hours ago",
    details: {
      email: "aisha.patel@gatech.edu",
      major: "Business Administration MBA",
      enrollmentStatus: "Full-time",
      workHours: 10,
      risks: [],
    },
  },
  {
    id: 5,
    name: "Kim Min-jun",
    country: "South Korea",
    visa: "F-1",
    programEnd: "May 20, 2026",
    riskScore: 82,
    topRiskFlag: "CPT authorization expiring",
    lastActive: "30 mins ago",
    details: {
      email: "kim.minjun@gatech.edu",
      major: "Computer Science BS",
      enrollmentStatus: "Full-time",
      workHours: 20,
      risks: [
        "CPT authorization expires in 7 days",
        "Needs new employment authorization",
        "Program completion in 84 days",
      ],
    },
  },
];

const SUMMARY_STATS = {
  total: 847,
  highRisk: 23,
  mediumRisk: 156,
  compliant: 668,
};

const CPT_STATUS: Record<string, string> = { intent: "Early alert (no offer yet)", offer_signed: "Offer signed — pending", approved: "Approved", rejected: "Rejected" };

export default function DSODashboard() {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"riskScore" | "name">("riskScore");
  const [cptRequests, setCptRequests] = useState<DsoCPTRequest[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    listDsoCPTRequests().then(setCptRequests).catch(() => {});
  }, []);

  const sortedStudents = [...STUDENTS_DATA].sort((a, b) => {
    if (sortBy === "riskScore") {
      return b.riskScore - a.riskScore;
    }
    return a.name.localeCompare(b.name);
  });

  const selectedStudentData = STUDENTS_DATA.find((s) => s.id === selectedStudent);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <span className="text-sm text-muted-foreground">Georgia Tech</span>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">International Student Risk Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor compliance status across your student cohort
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-2">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{SUMMARY_STATS.total}</div>
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
              {SUMMARY_STATS.highRisk}
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
              {SUMMARY_STATS.mediumRisk}
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
              {SUMMARY_STATS.compliant}
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
                    {sortedStudents.map((student) => (
                      <StudentRow
                        key={student.id}
                        {...student}
                        isExpanded={selectedStudent === student.id}
                        onClick={() =>
                          setSelectedStudent(
                            selectedStudent === student.id ? null : student.id
                          )
                        }
                      />
                    ))}
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
                    {selectedStudentData.details.email}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Major</div>
                    <div className="text-sm font-medium">
                      {selectedStudentData.details.major}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Enrollment Status
                    </div>
                    <div className="text-sm font-medium">
                      {selectedStudentData.details.enrollmentStatus}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Work Hours (Weekly)
                    </div>
                    <div className="text-sm font-medium">
                      {selectedStudentData.details.workHours} hours
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Risk Breakdown</h4>
                  <div className="space-y-2">
                    {selectedStudentData.details.risks.length > 0 ? (
                      selectedStudentData.details.risks.map((risk, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 rounded bg-background border border-border"
                        >
                          {risk}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No active risks
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
