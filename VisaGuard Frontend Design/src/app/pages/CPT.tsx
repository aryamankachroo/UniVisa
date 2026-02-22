import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Briefcase, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { getStudentId, listCPTRequests, createCPTRequest, markCPTOfferSigned, type CPTRequest } from "../api";

const STATUS: Record<string, string> = {
  intent: "Early alert (no offer yet)",
  offer_signed: "Offer signed — pending DSO",
  approved: "Approved",
  rejected: "Rejected",
};

function Sidebar({ activeNav, onNav }: { activeNav: string; onNav: (path: string, nav: string) => void }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold" style={{ fontFamily: "var(--font-family-heading)" }}>UniVisa</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {[
          ["/dashboard", "dashboard", LayoutDashboard, "Dashboard"],
          ["/ai-advisor", "ai", Bot, "AI Advisor"],
          ["/cpt", "cpt", Briefcase, "CPT / Internship"],
          ["/profile", "profile", User, "My Profile"],
          ["/alerts", "alerts", Bell, "Alerts"],
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

export default function CPT() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("cpt");
  const [requests, setRequests] = useState<CPTRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ company_name: "", role: "", expected_start_date: "", expected_end_date: "", notes: "" });

  const sid = getStudentId();

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      setRequests([]);
      setLoading(false);
    }, 6000);
    listCPTRequests(sid)
      .then((list) => {
        if (cancelled) return;
        setRequests(list);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      })
      .finally(() => {
        if (!cancelled) cancelled = true;
        clearTimeout(timeout);
        setLoading(false);
      });
    return () => clearTimeout(timeout);
  }, [sid]);

  const handleNav = (path: string, nav: string) => {
    setActiveNav(nav);
    navigate(path);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.role.trim() || !form.expected_start_date || !form.expected_end_date) return;
    setError(null);
    const payload = {
      company_name: form.company_name.trim(),
      role: form.role.trim(),
      expected_start_date: form.expected_start_date,
      expected_end_date: form.expected_end_date,
      notes: form.notes.trim() || undefined,
    };
    const tempId = `temp-${Date.now()}`;
    const optimistic: CPTRequest = {
      id: tempId,
      student_id: sid,
      company_name: payload.company_name,
      role: payload.role,
      expected_start_date: payload.expected_start_date,
      expected_end_date: payload.expected_end_date,
      notes: payload.notes,
      status: "intent",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setForm({ company_name: "", role: "", expected_start_date: "", expected_end_date: "", notes: "" });
    setFormOpen(false);
    setLoading(false);
    setRequests((prev) => [optimistic, ...prev]);
    setShowConfirmPopup(true);
    setSuccessMessage("CPT request submitted. Your DSO has been alerted.");
    setTimeout(() => setSuccessMessage(null), 5000);
    createCPTRequest(sid, payload)
      .then((created) => {
        setRequests((prev) => prev.map((r) => (r.id === tempId ? created : r)));
      })
      .catch(() => {
        setShowConfirmPopup(false);
        setError("Couldn't save to server. Your request is shown below but won't persist until the backend is running.");
      });
  };

  const onMarkSigned = async (req: CPTRequest) => {
    if (req.status !== "intent") return;
    setError(null);
    try {
      const updated = await markCPTOfferSigned(sid, req.id);
      setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeNav={activeNav} onNav={handleNav} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-semibold mb-2">CPT / Internship</h1>
          <p className="text-muted-foreground mb-6">
            Start your CPT process before signing the offer. Your DSO gets an early alert and can prepare, so approval is faster once you upload the signed offer.
          </p>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          {successMessage && (
            <p className="mb-4 text-sm text-green-600 dark:text-green-400 font-medium">{successMessage}</p>
          )}
          {!formOpen ? (
            <Button onClick={() => { setFormOpen(true); setSuccessMessage(null); setShowConfirmPopup(false); }} className="mb-6">
              <Plus className="w-4 h-4 mr-2" />
              Start CPT process (before signing offer)
            </Button>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">New CPT intent</h2>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label>Company name</Label>
                  <Input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="e.g. Acme Corp" className="mt-1.5" />
                </div>
                <div>
                  <Label>Role / title</Label>
                  <Input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Software Engineering Intern" className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expected start date</Label>
                    <Input type="date" value={form.expected_start_date} onChange={(e) => setForm((p) => ({ ...p, expected_start_date: e.target.value }))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Expected end date</Label>
                    <Input type="date" value={form.expected_end_date} onChange={(e) => setForm((p) => ({ ...p, expected_end_date: e.target.value }))} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="e.g. Awaiting final offer letter" className="mt-1.5" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Submit — alert DSO</Button>
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          )}
          <h2 className="text-lg font-semibold mb-4">Your CPT requests</h2>
          {loading && <p className="text-muted-foreground">Loading…</p>}
          {!loading && requests.length === 0 && <p className="text-muted-foreground">No CPT requests yet. Start one above so your DSO is alerted early.</p>}
          {!loading && requests.length > 0 && (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-medium">{req.company_name}</div>
                    <div className="text-sm text-muted-foreground">{req.role}</div>
                    <div className="text-xs text-muted-foreground mt-1">{req.expected_start_date} → {req.expected_end_date}</div>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${req.status === "approved" ? "bg-green-500/20 text-green-600" : req.status === "rejected" ? "bg-destructive/20 text-destructive" : req.status === "offer_signed" ? "bg-amber-500/20 text-amber-600" : "bg-primary/20 text-primary"}`}>
                      {STATUS[req.status] ?? req.status}
                    </span>
                  </div>
                  {req.status === "intent" && !req.id.startsWith("temp-") && <Button variant="outline" size="sm" onClick={() => onMarkSigned(req)}>I've signed the offer</Button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Dialog open={showConfirmPopup} onOpenChange={setShowConfirmPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Form submitted</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Your CPT request has been submitted. Your DSO has been alerted.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowConfirmPopup(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
