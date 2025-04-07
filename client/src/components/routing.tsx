import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ResumeBuilder from "@/pages/resume-builder";
import CoverLetter from "@/pages/cover-letter";
import InterviewPrep from "@/pages/interview-prep";
import MockInterviews from "@/pages/mock-interviews";
import JobMatching from "@/pages/job-matching";
import Settings from "@/pages/settings";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import { useAuth } from "@/hooks/use-auth";

export function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/resume-builder" component={ResumeBuilder} />
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