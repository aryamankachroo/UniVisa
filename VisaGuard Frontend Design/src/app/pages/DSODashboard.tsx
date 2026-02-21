import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, Users, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { StudentRow } from "../components/StudentRow";
import { RiskBadge } from "../components/RiskBadge";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";

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

export default function DSODashboard() {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"riskScore" | "name">("riskScore");

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
              VisaGuard
            </span>
            <span className="ml-2 text-sm text-muted-foreground">DSO Portal</span>
          </Link>
          <div className="flex items-center gap-4">
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
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Notify Student
                  </Button>
                  <Button variant="outline" className="w-full">
                    Schedule Meeting
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
