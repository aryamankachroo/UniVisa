import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Shield, LayoutDashboard, Bot, User, Bell, LogOut, Briefcase, Search, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Profile() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("profile");

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
              3
            </span>
          </button>
          <button
            onClick={() => handleNavigation("/policy-alerts", "policy")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === "policy" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Policy Alerts</span>
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
        <div className="max-w-3xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information and visa details
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  defaultValue="Riya Sharma"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="riya.sharma@gatech.edu"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  defaultValue="Georgia Institute of Technology"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="country">Country of Origin</Label>
                <Input
                  id="country"
                  defaultValue="India"
                  className="mt-1.5"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Visa Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="visaType">Visa Type</Label>
                <Input
                  id="visaType"
                  defaultValue="F-1 (Academic Student)"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="sevisId">SEVIS ID</Label>
                <Input
                  id="sevisId"
                  defaultValue="N0012345678"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="programStart">Program Start Date</Label>
                <Input
                  id="programStart"
                  defaultValue="August 15, 2024"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="programEnd">Program End Date</Label>
                <Input
                  id="programEnd"
                  defaultValue="May 15, 2026"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="major">Major/Program</Label>
                <Input
                  id="major"
                  defaultValue="Computer Science MS"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="enrollmentStatus">Enrollment Status</Label>
                <Input
                  id="enrollmentStatus"
                  defaultValue="Full-time"
                  className="mt-1.5"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Employment Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="workStatus">Current Work Status</Label>
                <Input
                  id="workStatus"
                  defaultValue="On-campus Employment"
                  className="mt-1.5"
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="workHours">Weekly Work Hours</Label>
                <Input
                  id="workHours"
                  defaultValue="18 hours"
                  className="mt-1.5"
                  readOnly
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                To update your information, please contact your Designated School Official (DSO) or visit the international students office.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
