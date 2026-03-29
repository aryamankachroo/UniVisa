import { useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Shield, LayoutDashboard, Bot, User, Bell, LogOut,
  Briefcase, Search, FileText, RefreshCw, ExternalLink,
  BookmarkPlus, BookmarkCheck, ChevronDown, ChevronUp,
  AlertTriangle, Wifi, WifiOff, SlidersHorizontal,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

// ─── API base (same pattern as your existing api.ts) ──────────────────────────
const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ??
  "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkAuth = "F-1 CPT" | "F-1 OPT" | "OPT STEM Extension" | "J-1" | "H-1B Sponsor";
type JobType = "Internship" | "Full-time" | "Co-op" | "Part-time" | "Contract";
type Remote = "Remote" | "Hybrid" | "On-site";

interface Job {
  id: string;
  company: string;
  role: string;
  type: JobType;
  location: string;
  remote: Remote;
  pay?: string | null;
  deadline?: string | null;
  tags: string[];
  visaTypes: WorkAuth[];
  eVerify: boolean;
  sponsorship: boolean;
  description: string;
  applyUrl?: string;
  source: string;
  postedAt?: string;
}

type WorkAuthParam = "all" | "cpt" | "opt" | "stem_opt" | "h1b";
type JobTypeParam  = "all" | "internship" | "fulltime" | "coop";

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeNav, onNav }: { activeNav: string; onNav: (path: string, nav: string) => void }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <Shield className="w-8 h-8 text-primary shrink-0" />
          <span className="text-xl font-bold truncate" style={{ fontFamily: "var(--font-family-heading)" }}>UniVisa</span>
        </Link>
        <ThemeToggle />
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
            key={path as string}
            onClick={() => onNav(path as string, nav as string)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === nav ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label as string}</span>
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

// ─── Visa badge ───────────────────────────────────────────────────────────────

function VisaBadge({ visa }: { visa: WorkAuth }) {
  const colors: Record<WorkAuth, string> = {
    "F-1 CPT":            "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20",
    "F-1 OPT":            "bg-violet-500/10  text-violet-600  dark:text-violet-400  border-violet-500/20",
    "OPT STEM Extension": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "J-1":                "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
    "H-1B Sponsor":       "bg-primary/10     text-primary                           border-primary/20",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${colors[visa] ?? "bg-muted/50 text-muted-foreground border-border"}`}>
      {visa}
    </span>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job, saved, onToggleSave }: { job: Job; saved: boolean; onToggleSave: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const typeColor =
    job.type === "Full-time"  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
    job.type === "Co-op"      ? "bg-amber-500/15   text-amber-600   dark:text-amber-400   border-amber-500/30"   :
    job.type === "Contract"   ? "bg-rose-500/15    text-rose-600    dark:text-rose-400    border-rose-500/30"    :
                                "bg-primary/15     text-primary                           border-primary/30";

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-sm flex flex-col">
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-sm leading-tight">{job.role}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{job.company}</div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className={`shrink-0 p-1 rounded-md transition-colors ${saved ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          </button>
        </div>

        {/* Type + location + remote chips */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${typeColor}`}>{job.type}</span>
          <span className="rounded-full px-2.5 py-0.5 text-xs text-muted-foreground bg-muted/50 border border-border truncate max-w-[130px]">
            📍 {job.location}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs border ${
            job.remote === "Remote" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-muted/50 text-muted-foreground border-border"
          }`}>
            {job.remote}
          </span>
        </div>

        {/* Pay / date */}
        {(job.pay || job.postedAt) && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            {job.pay && (
              <div>
                <div className="text-muted-foreground text-xs">Salary</div>
                <div className="font-bold text-green-600 dark:text-green-400 text-xs">{job.pay}</div>
              </div>
            )}
            {job.postedAt && (
              <div>
                <div className="text-muted-foreground text-xs">Posted</div>
                <div className="font-medium text-foreground text-xs">{job.postedAt}</div>
              </div>
            )}
          </div>
        )}

        {/* Skill tags */}
        {job.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {job.tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-md px-2 py-0.5 text-xs text-muted-foreground bg-muted/30 border border-border">{t}</span>
            ))}
          </div>
        )}

        {/* Visa types + badges */}
        <div className="flex gap-1.5 items-center flex-wrap">
          {job.visaTypes.length > 0 ? (
            <>
              <span className="text-muted-foreground text-xs">Auth:</span>
              {job.visaTypes.map((v) => <VisaBadge key={v} visa={v} />)}
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">Verify auth with employer</span>
          )}
          <div className="ml-auto flex gap-1">
            {job.eVerify && (
              <span className="rounded-md px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">✓ E-Verify</span>
            )}
            {job.sponsorship && (
              <span className="rounded-md px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20">H-1B</span>
            )}
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2.5 px-4 border-t border-border bg-muted/20 text-muted-foreground text-xs flex justify-between items-center hover:bg-primary/10 transition-colors"
      >
        <span>{expanded ? "Hide details" : "View details & apply"}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="p-4 border-t border-border bg-primary/5">
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">{job.description}</p>

          {/* CPT checklist */}
          {job.visaTypes.includes("F-1 CPT") && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 mb-3">
              <div className="text-primary font-semibold text-xs mb-1">📋 CPT Checklist</div>
              <div className="text-primary/90 text-xs leading-relaxed">
                1. Confirm role relates to your field of study<br />
                2. Obtain a written offer letter from {job.company}<br />
                3. Submit CPT request to your DSO with the offer letter<br />
                4. Receive updated I-20 with CPT dates before starting<br />
                5. Complete I-9 verification with {job.company} HR on Day 1
              </div>
            </div>
          )}

          {job.applyUrl ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 px-4 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              Apply Now <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button type="button" className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 px-4 text-sm font-semibold hover:opacity-90 transition-opacity">
              Apply Now →
            </button>
          )}
          <div className="mt-2 text-xs text-muted-foreground">Source: {job.source}</div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function JobSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-2"><div className="h-5 bg-muted rounded-full w-16" /><div className="h-5 bg-muted rounded-full w-24" /></div>
        <div className="flex gap-1.5"><div className="h-5 bg-muted rounded w-12" /><div className="h-5 bg-muted rounded w-16" /></div>
      </div>
      <div className="h-9 bg-muted/40 border-t border-border" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PRESET_SEARCHES: { label: string; q: string; auth: WorkAuthParam; type: JobTypeParam }[] = [
  { label: "🤖 ML/AI Internships",       q: "machine learning AI",        auth: "cpt",      type: "internship" },
  { label: "💻 SWE OPT Full-time",       q: "software engineer",          auth: "opt",      type: "fulltime"   },
  { label: "📊 Data Science CPT",        q: "data science data analyst",  auth: "cpt",      type: "internship" },
  { label: "☁️ Cloud / DevOps OPT",     q: "cloud infrastructure DevOps",auth: "opt",      type: "all"        },
  { label: "🧬 STEM Research",           q: "research scientist engineer", auth: "stem_opt", type: "all"        },
  { label: "🏦 Finance / Quant",         q: "quantitative finance analyst",auth: "all",     type: "internship" },
  { label: "🏢 H-1B Sponsors",          q: "software engineer developer", auth: "h1b",      type: "fulltime"   },
];

const WORK_AUTH_OPTIONS: { label: string; value: WorkAuthParam }[] = [
  { label: "All Auth",       value: "all"      },
  { label: "F-1 CPT",       value: "cpt"      },
  { label: "F-1 OPT",       value: "opt"      },
  { label: "STEM OPT",      value: "stem_opt" },
  { label: "H-1B Sponsor",  value: "h1b"      },
];

const JOB_TYPE_OPTIONS: { label: string; value: JobTypeParam }[] = [
  { label: "All Types",   value: "all"        },
  { label: "Internship",  value: "internship" },
  { label: "Full-time",   value: "fulltime"   },
  { label: "Co-op",       value: "coop"       },
];

export default function JobOpportunities() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("opportunities");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [workAuth, setWorkAuth] = useState<WorkAuthParam>("all");
  const [jobType, setJobType] = useState<JobTypeParam>("all");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleNav = (path: string, nav: string) => { setActiveNav(nav); navigate(path); };

  const runSearch = useCallback(async (
    query: string,
    loc: string,
    auth: WorkAuthParam,
    type: JobTypeParam,
  ) => {
    if (!query.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus("loading");
    setJobs([]);
    setLastQuery(query);

    const params = new URLSearchParams({
      q: query,
      location: loc,
      work_auth: auth,
      job_type: type,
    });

    try {
      const res = await fetch(`${API_BASE}/jobs?${params}`, { signal: abortRef.current.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Server error ${res.status}`);
      }
      const data: Job[] = await res.json();
      setJobs(data);
      setStatus("done");
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Search failed");
      setStatus("error");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); runSearch(q, location, workAuth, jobType); };

  const handlePreset = (p: typeof PRESET_SEARCHES[0]) => {
    setQ(p.q);
    setWorkAuth(p.auth);
    setJobType(p.type);
    runSearch(p.q, location, p.auth, p.type);
  };

  const toggleSave = (id: string) =>
    setSavedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeNav={activeNav} onNav={handleNav} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-2xl">💼</span>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">CPT & OPT Opportunities</h1>
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
                Live via Adzuna
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Real job listings filtered for international students — F-1, OPT, STEM OPT, and H-1B sponsor roles only.
            </p>
          </div>

          {/* CPT warning */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 border-l-4 border-l-amber-500 p-4 mb-5 flex gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed m-0">
              <strong>CPT Reminder:</strong> Obtain CPT authorization from your DSO BEFORE accepting any offer or starting work. Unauthorized work is a deportable SEVIS violation.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Role or skill — e.g. "software engineer" or "data analyst"'
                className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-xl px-3.5 py-3 border text-sm transition-colors flex items-center gap-1.5 ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <button
                type="submit"
                disabled={status === "loading" || !q.trim()}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {status === "loading" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {status === "loading" ? "Searching…" : "Search"}
              </button>
            </div>

            {/* Expandable filters */}
            {showFilters && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Work Authorization</p>
                  <div className="flex gap-2 flex-wrap">
                    {WORK_AUTH_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setWorkAuth(o.value)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${workAuth === o.value ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Job Type</p>
                  <div className="flex gap-2 flex-wrap">
                    {JOB_TYPE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setJobType(o.value)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${jobType === o.value ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border"}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Location (optional)</p>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or state — e.g. New York or California"
                    className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </form>

          {/* Preset searches */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick searches:</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_SEARCHES.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  disabled={status === "loading"}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border transition-colors disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── States ── */}

          {status === "idle" && (
            <div className="text-center py-20 text-muted-foreground">
              <div className="text-5xl mb-4">🔍</div>
              <div className="font-semibold text-lg text-foreground mb-2">Search Real Opportunities</div>
              <p className="text-sm max-w-md mx-auto">
                All results are screened for CPT, OPT, STEM OPT, and H-1B visa signals. Jobs that explicitly exclude international students are filtered out automatically.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs">
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                <span>Powered by Adzuna — real listings, updated daily</span>
              </div>
            </div>
          )}

          {status === "loading" && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Searching for <span className="text-foreground font-medium">"{lastQuery}"</span>…</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <JobSkeleton key={i} />)}
              </div>
            </>
          )}

          {status === "error" && (
            <div className="text-center py-16">
              <WifiOff className="w-10 h-10 text-destructive mx-auto mb-3" />
              <div className="font-semibold text-foreground mb-1">Search Failed</div>
              <p className="text-sm text-muted-foreground mb-1">{error}</p>
              {error.includes("ADZUNA_APP_ID") && (
                <p className="text-xs text-muted-foreground mb-4">
                  Add <code className="bg-muted px-1 rounded">ADZUNA_APP_ID</code> and <code className="bg-muted px-1 rounded">ADZUNA_APP_KEY</code> to{" "}
                  <code className="bg-muted px-1 rounded">univisa-backend/.env</code>.{" "}
                  <a href="https://developer.adzuna.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Sign up free →
                  </a>
                </p>
              )}
              <button
                onClick={() => runSearch(lastQuery, location, workAuth, jobType)}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "done" && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">{jobs.length}</span> international-student-friendly results for{" "}
                  <span className="text-foreground">"{lastQuery}"</span>
                </span>
                <button
                  onClick={() => runSearch(lastQuery, location, workAuth, jobType)}
                  className="ml-auto rounded-lg px-3 py-1.5 text-xs border border-border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-4xl mb-3">📭</div>
                  <div className="font-medium">No international-student-friendly roles found.</div>
                  <div className="text-sm mt-1">Try broader keywords or change the work auth filter.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      saved={savedIds.includes(job.id)}
                      onToggleSave={() => toggleSave(job.id)}
                    />
                  ))}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground mt-8">
                Sourced via Adzuna · filtered for international student work authorization · always verify visa requirements with the employer and your DSO
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
