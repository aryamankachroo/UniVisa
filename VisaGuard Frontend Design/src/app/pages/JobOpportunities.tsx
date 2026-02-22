import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Briefcase, Search, FileText } from "lucide-react";

type Job = {
  id: number;
  company: string;
  logo: string;
  logoColor: string;
  logoBg: string;
  role: string;
  type: string;
  location: string;
  remote: string;
  duration: string;
  pay: string;
  deadline: string;
  tags: string[];
  visas: string[];
  description: string;
  evVerify: boolean;
  spotsLeft: number;
};

const JOBS: Job[] = [
  { id: 1, company: "Google", logo: "G", logoColor: "#4285F4", logoBg: "#e8f0fe", role: "Software Engineering Intern", type: "CPT", location: "Mountain View, CA", remote: "Hybrid", duration: "12 weeks", pay: "$8,500/mo", deadline: "Mar 15, 2026", tags: ["Python", "ML", "Distributed Systems"], visas: ["F-1", "J-1"], description: "Work on core Google infrastructure. CPT authorization required before start date. Must maintain full-time enrollment.", evVerify: true, spotsLeft: 3 },
  { id: 2, company: "Microsoft", logo: "M", logoColor: "#00a4ef", logoBg: "#e6f4ff", role: "Data Science Intern", type: "CPT", location: "Redmond, WA", remote: "Hybrid", duration: "16 weeks", pay: "$7,800/mo", deadline: "Mar 28, 2026", tags: ["Python", "Azure", "Power BI"], visas: ["F-1", "J-1", "M-1"], description: "Join the Azure AI team. E-Verify employer. CPT paperwork assistance provided by HR.", evVerify: true, spotsLeft: 5 },
  { id: 3, company: "Meta", logo: "M", logoColor: "#0081FB", logoBg: "#e7f0ff", role: "Product Intern — AR/VR", type: "CPT", location: "Menlo Park, CA", remote: "On-site", duration: "12 weeks", pay: "$9,000/mo", deadline: "Feb 28, 2026", tags: ["Product", "UX Research", "AR"], visas: ["F-1", "J-1"], description: "Work on the Reality Labs product team. Must have CPT authorization from DSO before first day.", evVerify: true, spotsLeft: 2 },
  { id: 4, company: "Apple", logo: "A", logoColor: "#555", logoBg: "#f5f5f7", role: "ML Research Intern", type: "CPT", location: "Cupertino, CA", remote: "On-site", duration: "16 weeks", pay: "$9,200/mo", deadline: "Mar 10, 2026", tags: ["PyTorch", "CoreML", "Research"], visas: ["F-1"], description: "Join Apple AI/ML team working on on-device intelligence. F-1 CPT only. Strict confidentiality agreement.", evVerify: true, spotsLeft: 1 },
  { id: 5, company: "Amazon", logo: "A", logoColor: "#FF9900", logoBg: "#fff8ee", role: "SDE Intern", type: "CPT / OPT", location: "Seattle, WA", remote: "Hybrid", duration: "12 weeks", pay: "$8,200/mo", deadline: "Apr 1, 2026", tags: ["Java", "AWS", "System Design"], visas: ["F-1", "J-1"], description: "Build scalable systems on AWS. Accepts both CPT and OPT. Relocation stipend included.", evVerify: true, spotsLeft: 8 },
  { id: 6, company: "NVIDIA", logo: "N", logoColor: "#76b900", logoBg: "#f0fae6", role: "Deep Learning Research Intern", type: "CPT", location: "Santa Clara, CA", remote: "On-site", duration: "20 weeks", pay: "$9,500/mo", deadline: "Mar 20, 2026", tags: ["CUDA", "PyTorch", "LLMs"], visas: ["F-1", "J-1"], description: "Work directly with NVIDIA Research on next-gen GPU architectures and LLM training pipelines.", evVerify: true, spotsLeft: 2 },
  { id: 7, company: "Goldman Sachs", logo: "GS", logoColor: "#6699FF", logoBg: "#eef2ff", role: "Quantitative Finance Intern", type: "CPT / OPT", location: "New York, NY", remote: "On-site", duration: "10 weeks", pay: "$11,000/mo", deadline: "Feb 20, 2026", tags: ["Python", "Quant", "Risk Modeling"], visas: ["F-1", "J-1"], description: "Summer analyst role in Securities division. One of the highest-paying CPT/OPT positions available to international students.", evVerify: true, spotsLeft: 4 },
  { id: 8, company: "JPMorgan Chase", logo: "JP", logoColor: "#005EB8", logoBg: "#e6f0fb", role: "Software Engineer Intern", type: "CPT / OPT", location: "New York, NY", remote: "Hybrid", duration: "10 weeks", pay: "$8,900/mo", deadline: "Mar 5, 2026", tags: ["Java", "Cloud", "FinTech"], visas: ["F-1", "J-1", "M-1"], description: "Build next-gen banking infrastructure. Active OPT/CPT required before start. Strong mentorship program.", evVerify: true, spotsLeft: 6 },
  { id: 9, company: "McKinsey & Co.", logo: "Mc", logoColor: "#2D6A4F", logoBg: "#e8f5ee", role: "Business Analyst Intern", type: "CPT", location: "Chicago, IL", remote: "Hybrid", duration: "10 weeks", pay: "$7,500/mo", deadline: "Mar 1, 2026", tags: ["Strategy", "Analytics", "MBA"], visas: ["F-1", "J-1"], description: "Work on Fortune 500 client engagements. CPT requires curriculum integration — coordinate with your academic advisor first.", evVerify: true, spotsLeft: 3 },
  { id: 10, company: "Tesla", logo: "T", logoColor: "#CC0000", logoBg: "#fce8e8", role: "Autopilot ML Intern", type: "CPT", location: "Palo Alto, CA", remote: "On-site", duration: "16 weeks", pay: "$8,700/mo", deadline: "Apr 10, 2026", tags: ["Computer Vision", "PyTorch", "C++"], visas: ["F-1"], description: "Work on Autopilot perception systems. Fast-paced environment. CPT authorization must be obtained before offer acceptance.", evVerify: true, spotsLeft: 2 },
  { id: 11, company: "Spotify", logo: "S", logoColor: "#1DB954", logoBg: "#e6f9ed", role: "Data Engineering Intern", type: "CPT / OPT", location: "New York, NY", remote: "Hybrid", duration: "12 weeks", pay: "$7,200/mo", deadline: "Apr 15, 2026", tags: ["Spark", "Kafka", "Python"], visas: ["F-1", "J-1"], description: "Build data pipelines for Spotify's recommendation engine. Accepting both CPT and OPT students. International-friendly HR team.", evVerify: true, spotsLeft: 4 },
  { id: 12, company: "Salesforce", logo: "SF", logoColor: "#00A1E0", logoBg: "#e6f6ff", role: "Full Stack Intern", type: "CPT / OPT", location: "San Francisco, CA", remote: "Remote", duration: "12 weeks", pay: "$7,600/mo", deadline: "Apr 20, 2026", tags: ["React", "Node.js", "Apex"], visas: ["F-1", "J-1", "M-1"], description: "Remote internship. Build on Salesforce Platform. One of the most international-student-friendly companies for visa paperwork support.", evVerify: true, spotsLeft: 7 },
];

const FILTERS = ["All", "CPT", "OPT", "Remote", "On-site", "Hybrid"];
const VISA_FILTERS = ["All Visas", "F-1", "J-1", "M-1"];

function Sidebar({ activeNav, onNav }: { activeNav: string; onNav: (path: string, nav: string) => void }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>UniVisa</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {[
          ["/dashboard", "dashboard", LayoutDashboard, "Dashboard"],
          ["/ai-advisor", "ai", Bot, "AI Advisor"],
          ["/cpt", "cpt", Briefcase, "CPT / Internship"],
          ["/opportunities", "opportunities", Search, "Opportunities"],
          ["/profile", "profile", User, "My Profile"],
          ["/alerts", "alerts", Bell, "Alerts"],
          ["/policy-alerts", "policy", FileText, "Policy Alerts"],
        ].map(([path, nav, Icon, label]) => (
          <button
            key={path}
            onClick={() => onNav(path as string, nav)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === nav ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default function JobOpportunities() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("opportunities");
  const [activeFilter, setActiveFilter] = useState("All");
  const [visaFilter, setVisaFilter] = useState("All Visas");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = JOBS.filter((j) => {
    const matchFilter = activeFilter === "All" || j.type.includes(activeFilter) || j.remote === activeFilter;
    const matchVisa = visaFilter === "All Visas" || j.visas.includes(visaFilter);
    const matchSearch =
      search === "" ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase()) ||
      j.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchVisa && matchSearch;
  });

  const toggleSave = (id: number) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleNav = (path: string, nav: string) => {
    setActiveNav(nav);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeNav={activeNav} onNav={handleNav} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-2xl">💼</span>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">CPT & OPT Opportunities</h1>
              <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {filtered.length} open
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              All listings are E-Verify enrolled and accept international students. CPT requires DSO authorization before start date.
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, role, or skill..."
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
                  }`}
                >
                  {f}
                </button>
              ))}
              <span className="w-px bg-border self-stretch my-1" />
              {VISA_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setVisaFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    visaFilter === f
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 border-l-4 border-l-amber-500 p-4 mb-6 flex gap-2.5">
            <span className="text-lg shrink-0">⚠️</span>
            <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed m-0">
              <strong>CPT Reminder:</strong> You must obtain CPT authorization from your DSO BEFORE accepting any offer or starting work. Working without authorization is a deportable SEVIS violation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border bg-card overflow-hidden transition-all cursor-pointer hover:border-primary/30"
                style={{ borderColor: expanded === job.id ? "hsl(var(--primary) / 0.4)" : undefined }}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex gap-3 items-center min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-extrabold text-sm border border-white/10"
                        style={{ background: job.logoBg, color: job.logoColor }}
                      >
                        {job.logo}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground text-sm leading-tight truncate">{job.role}</div>
                        <div className="text-muted-foreground text-xs truncate">{job.company}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(job.id);
                      }}
                      className="shrink-0 text-lg text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      {saved.includes(job.id) ? "★" : "☆"}
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        job.type.includes("CPT") && job.type.includes("OPT")
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : job.type.includes("OPT")
                            ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30"
                            : "bg-primary/15 text-primary border border-primary/30"
                      }`}
                    >
                      {job.type}
                    </span>
                    <span className="rounded-full px-2.5 py-0.5 text-xs text-muted-foreground bg-muted/50 border border-border">
                      📍 {job.location}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        job.remote === "Remote" ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-muted/50 text-muted-foreground border border-border"
                      }`}
                    >
                      {job.remote}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Pay</div>
                      <div className="font-bold text-green-600 dark:text-green-400">{job.pay}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Duration</div>
                      <div className="font-medium text-foreground">{job.duration}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Deadline</div>
                      <div className="font-medium text-amber-600 dark:text-amber-400">{job.deadline}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Spots</div>
                      <div className={`font-medium ${job.spotsLeft <= 2 ? "text-destructive" : "text-foreground"}`}>
                        {job.spotsLeft <= 2 ? `⚡ ${job.spotsLeft} left` : job.spotsLeft}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {job.tags.map((t) => (
                      <span key={t} className="rounded-md px-2.5 py-0.5 text-xs text-muted-foreground bg-muted/30 border border-border">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-1.5 items-center flex-wrap">
                    <span className="text-muted-foreground text-xs">Accepts:</span>
                    {job.visas.map((v) => (
                      <span key={v} className="rounded-md px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {v}
                      </span>
                    ))}
                    {job.evVerify && (
                      <span className="ml-auto rounded-md px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        ✓ E-Verify
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                  className="w-full py-2.5 px-4 border-t border-border bg-muted/20 text-muted-foreground text-xs text-left flex justify-between items-center hover:bg-primary/10 transition-colors"
                >
                  <span>{expanded === job.id ? "Hide details" : "View details & CPT notes"}</span>
                  <span className="shrink-0 transition-transform" style={{ transform: expanded === job.id ? "rotate(180deg)" : "none" }}>
                    ▾
                  </span>
                </button>

                {expanded === job.id && (
                  <div className="p-4 border-t border-border bg-primary/5">
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">{job.description}</p>
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 mb-3">
                      <div className="text-primary font-semibold text-xs mb-1">📋 CPT Checklist for this role</div>
                      <div className="text-primary/90 text-xs leading-relaxed">
                        1. Confirm role is related to your field of study<br />
                        2. Get a job offer letter from {job.company}<br />
                        3. Submit CPT request to your DSO with offer letter<br />
                        4. Receive updated I-20 with CPT authorization<br />
                        5. Complete I-9 with {job.company} HR on Day 1
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 px-4 text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Apply Now →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-4xl mb-3">🔍</div>
              <div className="font-medium">No opportunities match your filters.</div>
              <div className="text-sm mt-1">Try adjusting your search or filters above.</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
