import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut } from "lucide-react";
import { RiskScoreGauge } from "../components/RiskScoreGauge";
import { RiskBadge } from "../components/RiskBadge";
import { DeadlineCountdown } from "../components/DeadlineCountdown";
import { InsightCard } from "../components/InsightCard";
import { Button } from "../components/ui/button";
import { motion } from "motion/react";

// Demo data for Riya Sharma
const DEMO_DATA = {
  student: {
    name: "Riya Sharma",
    university: "Georgia Tech",
    riskScore: 74,
    lastUpdated: new Date().toLocaleString(),
  },
  activeRisks: [
    {
      id: 1,
      title: "OPT Application Window",
      description: "Your OPT application window opens in 18 days. Missing this deadline could affect your post-graduation work authorization.",
      severity: "high" as const,
    },
    {
      id: 2,
      title: "Work Hours Approaching Limit",
      description: "You're currently working 18 hours per week. During school terms, F-1 students are limited to 20 hours per week on-campus.",
      severity: "medium" as const,
    },
    {
      id: 3,
      title: "Program End Date Approaching",
      description: "Your program ends on May 15, 2026. You have 84 days to prepare for post-completion plans.",
      severity: "medium" as const,
    },
  ],
  upcomingDeadlines: [
    { title: "OPT Application Window Opens", date: new Date(2026, 2, 11), days: 18 },
    { title: "Spring Semester Enrollment Verification", date: new Date(2026, 2, 25), days: 32 },
    { title: "SEVIS Fee Renewal", date: new Date(2026, 3, 15), days: 53 },
  ],
  aiPreview: {
    message: "Based on your profile, I recommend starting your OPT application preparation now. You'll need to gather documents like your EAD application form, passport photos, and a check for the filing fee. Would you like me to walk you through the complete checklist?",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");

  const handleNavigation = (path: string, nav: string) => {
    setActiveNav(nav);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>
              UniVisa
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
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
            onClick={() => handleNavigation("/ai-advisor", "ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "ai"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>AI Advisor</span>
          </button>
          <button
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
            onClick={() => handleNavigation("/alerts", "alerts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "alerts"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Alerts</span>
            <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              3
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3">
            <div className="font-medium">{DEMO_DATA.student.name}</div>
            <div className="text-sm text-muted-foreground">
              {DEMO_DATA.student.university}
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Risk Score Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex flex-col items-center">
                <h2 className="text-xl mb-2">Your F-1 Compliance Risk Score</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Last updated: {DEMO_DATA.student.lastUpdated}
                </p>
                <RiskScoreGauge score={DEMO_DATA.student.riskScore} size="lg" />
              </div>
            </div>
          </motion.div>

          {/* Three Column Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Active Risks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Active Risks</h3>
              <div className="space-y-3">
                {DEMO_DATA.activeRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3 rounded-lg border border-border bg-background"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium">{risk.title}</span>
                      <RiskBadge level={risk.severity} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {risk.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {DEMO_DATA.upcomingDeadlines.map((deadline, idx) => (
                  <DeadlineCountdown
                    key={idx}
                    title={deadline.title}
                    date={deadline.date}
                    daysRemaining={deadline.days}
                  />
                ))}
              </div>
            </motion.div>

            {/* Student Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InsightCard
                title="Student Insights"
                description="67% of F-1 students from India report confusion around OPT timing"
                percentage={67}
                source="r/internationalstudents analysis"
              />
            </motion.div>
          </div>

          {/* AI Advisor Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">AI Advisor</h3>
            <div className="bg-background rounded-lg p-4 border border-border mb-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">
                    {DEMO_DATA.aiPreview.message}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleNavigation("/ai-advisor", "ai")}
              className="bg-primary hover:bg-primary/90"
            >
              Continue Conversation
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
