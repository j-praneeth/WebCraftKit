import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { MockInterview } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { VideoInterviewSimulator } from "@/components/interviews/VideoInterviewSimulator";
import { Badge } from "@/components/ui/badge";

function MockInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobRole, setSelectedJobRole] = useState("Software Engineer");
  const [showInterviewSim, setShowInterviewSim] = useState(false);

  // Fetch mock interviews
  const { 
    data: interviews,
    isLoading: isLoadingInterviews 
  } = useQuery<MockInterview[]>({
    queryKey: ["/api/mock-interviews"],
    enabled: !!user,
  });

  // Check if user has reached their interview limit (for free tier)
  const userInterviewCount = user?.mockInterviewsCount || 0;
  const interviewLimit = user?.plan === 'free' ? 3 : null;
  const hasReachedLimit = interviewLimit !== null && userInterviewCount >= interviewLimit;

  const handleStartAIInterview = () => {
    if (hasReachedLimit) {
      toast({
        title: "Interview limit reached",
        description: "You've reached the maximum number of interviews for your plan. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setShowInterviewSim(true);
  };

  const handleInterviewComplete = (result: any) => {
    queryClient.invalidateQueries({ queryKey: ["/api/mock-interviews"] });
    
    toast({
      title: "Interview completed",
      description: "Your AI interview feedback is ready. Check your results below.",
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          AI Video Mock Interviews
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Practice your interview skills and get AI-powered feedback
        </p>
        
        {/* User interview limit indicator */}
        {interviewLimit && (
          <div className="mt-2 flex items-center">
            <span className="text-sm text-gray-600 mr-2">
              {userInterviewCount} of {interviewLimit} interviews used
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-primary" 
                style={{ width: `${Math.min(100, (userInterviewCount / interviewLimit) * 100)}%` }}
              ></div>
            </div>
            {hasReachedLimit && (
              <Badge variant="outline" className="ml-3 border-amber-500 text-amber-600">
                Limit reached
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Interactive AI Interview */}
      {showInterviewSim ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <VideoInterviewSimulator 
              jobRole={selectedJobRole} 
              onComplete={handleInterviewComplete} 
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Interactive AI Interview</CardTitle>
            <CardDescription>
              Have a real-time conversation with our AI interviewer and receive immediate feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Role
                  </label>
                  <Input
                    type="text"
                    value={selectedJobRole}
                    onChange={(e) => setSelectedJobRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full"
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
                  <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                    <li>Start the interactive interview</li>
                    <li>Our AI interviewer will ask you relevant questions</li>
                    <li>Respond to each question by typing or using your microphone</li>
                    <li>Receive detailed feedback when the interview is complete</li>
                  </ol>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">Benefits of AI Interviews:</h3>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
                    <li>Practice with questions tailored to your target job</li>
                    <li>Get real-time conversational experience</li>
                    <li>Detailed analysis of your responses</li>
                    <li>Practice as many times as you need</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-gray-50 rounded-md">
                <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 2c1.7 0 3.3.2 4.9.7 1.1.3 2.2.8 3.2 1.4"></path>
                    <path d="M19.1 5c.4.6.8 1.2 1.1 1.9.6 1.5.9 3 .9 4.6 0 2.4-.7 4.6-1.9 6.5"></path>
                    <path d="M20 18c-1 .7-2 1.2-3.1 1.5-1.6.5-3.2.7-4.9.7-5.5 0-10-4.5-10-10S6.5 2 12 2"></path>
                    <path d="M12 13v-1"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center">
                  Ready for your AI Interview?
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Start an interactive conversation with our AI interviewer for the {selectedJobRole} role.
                </p>
                <Button 
                  onClick={handleStartAIInterview} 
                  disabled={hasReachedLimit}
                  size="lg"
                >
                  Start Interactive Interview
                </Button>
                {hasReachedLimit && (
                  <p className="text-xs text-amber-600">
                    You've reached your free tier limit. Please upgrade your plan.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Interviews Section */}
      <div className="mb-4">
        <h2 className="text-xl font-medium">Past Interviews</h2>
        <p className="text-sm text-gray-500">Review your previous interview performances</p>
      </div>

      {isLoadingInterviews ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your past interviews...</p>
        </div>
      ) : interviews?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{interview.title}</CardTitle>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Score: {interview.score}/10
                    </span>
                  </div>
                </div>
                <CardDescription>
                  {format(new Date(interview.updatedAt), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ width: `${interview.score * 10}%` }}
                    ></div>
                  </div>
                </div>
                <div className="line-clamp-3 text-sm text-gray-600">
                  {interview.feedback}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 text-sm">
                <Button variant="ghost" size="sm" className="text-primary">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-1">No interviews yet</h3>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Complete your first mock interview to get feedback on your performance
            </p>
            <Button onClick={handleStartAIInterview}>
              Start Your First Interview
            </Button>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

export default MockInterviews;