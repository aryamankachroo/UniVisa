import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Briefcase, Search } from "lucide-react";
import { AlertCard } from "../components/AlertCard";
import { motion } from "motion/react";

const ALERTS = [
  {
    id: 1,
    type: "deadline" as const,
    title: "OPT Application Window Opens in 18 Days",
    description: "Your OPT application window is opening soon. You must submit your application within 30 days before and up to 60 days after your program completion date. Start gathering required documents now: completed I-765 form, two passport photos, copy of I-94, copy of F-1 visa, and filing fee. Missing this window could result in losing your work authorization.",
    timestamp: "2 hours ago",
    urgency: 1,
  },
  {
    id: 2,
    type: "warning" as const,
    title: "Work Hours Approaching Legal Limit",
    description: "You're currently working 18 hours per week during the academic term. F-1 students are limited to 20 hours per week of on-campus employment during the school year. Consider reducing hours or ensuring you don't exceed this limit, as violations can result in loss of visa status.",
    timestamp: "5 hours ago",
    urgency: 2,
  },
  {
    id: 3,
    type: "info" as const,
    title: "Spring Semester Enrollment Verification Due",
    description: "Your DSO will need to verify your enrollment for Spring 2026 semester within the next 32 days. Make sure you're registered for the minimum credit hours (typically 12 credits for graduate students, 9 for undergraduates) to maintain full-time status.",
    timestamp: "1 day ago",
    urgency: 3,
  },
  {
    id: 4,
    type: "deadline" as const,
    title: "SEVIS Fee Renewal Required",
    description: "Your SEVIS I-901 fee needs to be renewed in 53 days. This fee is required to maintain your F-1 status. You can pay online through the SEVIS payment portal. Keep your payment receipt as proof of payment.",
    timestamp: "2 days ago",
    urgency: 4,
  },
  {
    id: 5,
    type: "info" as const,
    title: "New USCIS Policy Update Available",
    description: "USCIS has published updated guidance on F-1 student employment during school breaks. Review the new policy to ensure you remain compliant during summer vacation. The AI Advisor has been updated with this information.",
    timestamp: "3 days ago",
    urgency: 5,
  },
];

export default function Alerts() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("alerts");

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
            onClick={() => handleNavigation("/cpt", "cpt")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === "cpt" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Briefcase className="w-5 h-5" />
            <span>CPT / Internship</span>
          </button>
          <button
            onClick={() => handleNavigation("/opportunities", "opportunities")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeNav === "opportunities" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          >
            <Search className="w-5 h-5" />
            <span>Opportunities</span>
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
              {ALERTS.length}
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3">
            <div className="font-medium">Riya Sharma</div>
            <div className="text-sm text-muted-foreground">Georgia Tech</div>
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
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">Alerts & Notifications</h1>
            <p className="text-muted-foreground">
              Stay on top of important deadlines and compliance requirements
            </p>
          </div>

          <div className="space-y-4">
            {ALERTS.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AlertCard
                  type={alert.type}
                  title={alert.title}
                  description={alert.description}
                  timestamp={alert.timestamp}
                  ctaText="Learn More"
                  onCtaClick={() => handleNavigation("/ai-advisor", "ai")}
                />
              </motion.div>
            ))}
          </div>

          {ALERTS.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No alerts at this time</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
