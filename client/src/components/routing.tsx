import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ResumeBuilder from "@/pages/resume-builder";
import ResumeEditorNew from "@/pages/resume-builder/new";
import ResumeEditor from "@/pages/resume-builder/[id]";
import CoverLetter from "@/pages/cover-letter";
import InterviewPrep from "@/pages/interview-prep";
import MockInterviews from "@/pages/mock-interviews";
import JobMatching from "@/pages/job-matching";
import Settings from "@/pages/settings";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import LandingPage from "@/pages/landing";
import { useAuth } from "@/context/auth-context";

// Checks if the current route is public (doesn't require authentication)
const isPublicRoute = (path: string): boolean => {
  const publicRoutes = ["/", "/auth/login", "/auth/register"];
  return publicRoutes.includes(path);
};

export function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to login if not authenticated and trying to access protected route
  // Don't redirect if we're on a public route or still loading
  if (!isLoading && !isAuthenticated && !isPublicRoute(location)) {
    setLocation("/auth/login");
  }
  
  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/resume-builder" component={ResumeBuilder} />
      <Route path="/resume-builder/new" component={ResumeEditorNew} />
      <Route path="/resume-builder/:id" component={ResumeEditor} />
      <Route path="/cover-letter" component={CoverLetter} />
      <Route path="/interview-prep" component={InterviewPrep} />
      <Route path="/mock-interviews" component={MockInterviews} />
      <Route path="/job-matching" component={JobMatching} />
      <Route path="/settings" component={Settings} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}