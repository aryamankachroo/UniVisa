import { createBrowserRouter } from "react-router";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import AIAdvisor from "./pages/AIAdvisor";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import DSODashboard from "./pages/DSODashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Onboarding,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/ai-advisor",
    Component: AIAdvisor,
  },
  {
    path: "/alerts",
    Component: Alerts,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/dso",
    Component: DSODashboard,
  },
]);
