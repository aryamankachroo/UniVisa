import { createBrowserRouter } from "react-router";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import AIAdvisor from "./pages/AIAdvisor";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import CPT from "./pages/CPT";
import JobOpportunities from "./pages/JobOpportunities";
import DSODashboard from "./pages/DSODashboard";
import PolicyAlerts from "./pages/PolicyAlerts";

export const router = createBrowserRouter([
  { path: "/", Component: Onboarding },
  { path: "/dashboard", Component: Dashboard },
  { path: "/ai-advisor", Component: AIAdvisor },
  { path: "/cpt", Component: CPT },
  { path: "/opportunities", Component: JobOpportunities },
  { path: "/alerts", Component: Alerts },
  { path: "/policy-alerts", Component: PolicyAlerts },
  { path: "/profile", Component: Profile },
  { path: "/dso", Component: DSODashboard },
]);
