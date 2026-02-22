import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Briefcase, Search, FileText } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

export type PolicyAlertItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  sourceName: string;
  sourceUrl: string;
  severity: "high" | "medium" | "info";
  visaRelevance: string[];
};

/** Policy alerts with real source URLs. When clicked, user is sent to the official source. */
const POLICY_ALERTS: PolicyAlertItem[] = [
  {
    id: "1",
    title: "H-1B re-entry guidance and travel uncertainty",
    description:
      "Executive and agency guidance affecting H-1B holders’ re-entry has created confusion. If you hold H-1B status and plan to travel abroad, check the latest CBP and USCIS guidance before departing. UniVisa can help you see how policy changes apply to your profile and travel dates.",
    date: "Mar 2025",
    sourceName: "USCIS – Working in the United States",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states",
    severity: "high",
    visaRelevance: ["H-1B", "F-1", "J-1"],
  },
  {
    id: "2",
    title: "F-1 travel and re-entry requirements",
    description:
      "Official resources on travel and re-entry for F-1 students: valid visa, I-20, and enrollment. Policy updates can affect what documents CBP expects. Always confirm current rules before international travel.",
    date: "Feb 2025",
    sourceName: "Study in the States (DHS)",
    sourceUrl: "https://studyinthestates.dhs.gov/",
    severity: "medium",
    visaRelevance: ["F-1"],
  },
  {
    id: "3",
    title: "OPT for F-1 students – eligibility and application",
    description:
      "USCIS policy on Optional Practical Training: who qualifies, application windows, and required documents. Check the official page for the latest updates and forms.",
    date: "Feb 2025",
    sourceName: "USCIS – OPT for F-1 Students",
    sourceUrl: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students",
    severity: "info",
    visaRelevance: ["F-1"],
  },
  {
    id: "4",
    title: "SEVIS and SEVP policy updates",
    description:
      "ICE SEVP updates affect F-1 and J-1 program rules, school compliance, and student status. DSOs and students should review changes that may impact enrollment and employment.",
    date: "Jan 2025",
    sourceName: "ICE – Student and Exchange Visitor Program",
    sourceUrl: "https://www.ice.gov/sevis",
    severity: "info",
    visaRelevance: ["F-1", "J-1"],
  },
  {
    id: "5",
    title: "DHS announcements and policy changes",
    description:
      "Department of Homeland Security news and announcements on immigration and border policy. Useful during periods of rapid change (e.g. re-entry, travel, or work authorization).",
    date: "Ongoing",
    sourceName: "DHS – News",
    sourceUrl: "https://www.dhs.gov/news",
    severity: "info",
    visaRelevance: ["F-1", "J-1", "H-1B"],
  },
];

function Sidebar({
  activeNav,
  onNav,
}: {
  activeNav: string;
  onNav: (path: string, nav: string) => void;
}) {
  const navigate = useNavigate();
  const navItems: [string, string, typeof FileText, string][] = [
    ["/dashboard", "dashboard", LayoutDashboard, "Dashboard"],
    ["/ai-advisor", "ai", Bot, "AI Advisor"],
    ["/cpt", "cpt", Briefcase, "CPT / Internship"],
    ["/opportunities", "opportunities", Search, "Opportunities"],
    ["/profile", "profile", User, "My Profile"],
    ["/alerts", "alerts", Bell, "Alerts"],
    ["/policy-alerts", "policy", FileText, "Policy Alerts"],
  ];
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <Shield className="w-8 h-8 text-primary shrink-0" />
          <span className="text-xl font-bold truncate" style={{ fontFamily: "var(--font-family-heading)" }}>
            UniVisa
          </span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(([path, nav, Icon, label]) => (
          <button
            key={path}
            onClick={() => onNav(path, nav)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === nav ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default function PolicyAlerts() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("policy");

  const handleNav = (path: string, nav: string) => {
    setActiveNav(nav);
    navigate(path);
  };

  const severityStyles = {
    high: "border-l-amber-500 bg-amber-500/5 border-amber-500/30",
    medium: "border-l-primary bg-primary/5 border-primary/30",
    info: "border-l-muted-foreground/50 bg-muted/20 border-muted-foreground/20",
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeNav={activeNav} onNav={handleNav} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">Policy Alerts</h1>
          </div>

          <div className="space-y-4">
            {POLICY_ALERTS.map((alert) => (
              <article
                key={alert.id}
                className={`rounded-xl border border-border bg-card overflow-hidden border-l-4 ${severityStyles[alert.severity]}`}
              >
                <div className="p-5">
                  <h2 className="font-semibold text-lg mb-2">
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary hover:underline focus:outline-none focus:underline"
                    >
                      {alert.title}
                    </a>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
