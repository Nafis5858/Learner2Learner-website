import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import FindPartner from "./pages/FindPartner";
import ActiveCall from "./pages/ActiveCall";
import FeedbackReview from "./pages/FeedbackReview";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/auth", Component: Auth },
  {
    Component: AppLayout,
    children: [
      { path: "home", Component: Dashboard },
      { path: "find-partner", Component: FindPartner },
      { path: "call", Component: ActiveCall },
      { path: "feedback", Component: FeedbackReview },
      { path: "profile", Component: Profile },
      { path: "progress", Component: Progress },
    ],
  },
]);
