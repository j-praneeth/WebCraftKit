import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
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

  // Create a new mock interview record in the database when starting an interview
  const createMockInterviewMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mock-interviews", data),
  });

  const handleStartAIInterview = async () => {
    if (hasReachedLimit) {
      toast({
        title: "Interview limit reached",
        description: "You've reached the maximum number of interviews for your plan. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Starting interview with user:", user);
      if (!user || !user.id) {
        throw new Error("User information not available");
      }
      
      // Create a mock interview entry in the database
      const response = await createMockInterviewMutation.mutateAsync({
        userId: user.id, // Explicitly include userId
        title: `Interview for ${selectedJobRole} position`,
        date: new Date(),
        score: null,
        feedback: null,
        transcript: null,
        videoUrl: null
      });
      
      console.log("Interview created:", response);
      
      // Show the interview simulator
      setShowInterviewSim(true);
    } catch (error) {
      console.error("Error creating mock interview:", error);
      toast({
        title: "Error",
        description: "Could not start the interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update the mock interview with results when completed
  const updateMockInterviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest("PATCH", `/api/mock-interviews/${id}`, data),
  });

  const handleInterviewComplete = async (result: any) => {
    try {
      // Get the most recent interview (which should be the one we just completed)
      const recentInterviews = await queryClient.fetchQuery({ 
        queryKey: ["/api/mock-interviews"] 
      });
      
      if (Array.isArray(recentInterviews) && recentInterviews.length > 0) {
        // Sort to get the most recent one
        const sortedInterviews = [...recentInterviews].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        const currentInterview = sortedInterviews[0];
        
        // Update the interview with the results
        await updateMockInterviewMutation.mutateAsync({
          id: currentInterview.id,
          data: {
            transcript: result.transcript,
            score: result.analysis.overallScore,
            feedback: result.analysis.overallFeedback,
            // We could also store more detailed analysis data if needed
          }
        });
      }
      
      // Refresh the interviews list
      queryClient.invalidateQueries({ queryKey: ["/api/mock-interviews"] });
      
      toast({
        title: "Interview completed",
        description: "Your AI interview feedback is ready. Check your results below.",
      });
    } catch (error) {
      console.error("Error updating mock interview results:", error);
      toast({
        title: "Interview completed",
        description: "Your interview was completed, but there was an issue saving the results.",
        variant: "default",
      });
    }
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
              onComplete={(result) => {
                // Convert the Promise-returning function to a synchronous one
                handleInterviewComplete(result);
                return undefined; // Return void to satisfy the type requirement
              }} 
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
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <CardTitle>Your Interview History</CardTitle>
              <CardDescription>Track your progress and review past interviews</CardDescription>
            </div>
            <div className="mt-2 md:mt-0 flex items-center space-x-2">
              <Input 
                placeholder="Search by job role..." 
                className="w-full md:w-64"
                onChange={(e) => {
                  // We could add search functionality here
                  // This is just UI for now
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInterviews ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your interview history...</p>
            </div>
          ) : interviews?.filter(interview => interview.score !== null)?.length ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews
                  .filter(interview => interview.score !== null) // Only show completed interviews
                  .map((interview) => {
                  // Extract job role from title or feedback
                  const jobRole = interview.title?.split("position")[0]?.trim() || 
                                 (typeof interview.feedback === 'object' && interview.feedback ? 
                                   (interview.feedback as any)?.jobRole : undefined) || 
                                 "General Interview";
                                 
                  // Determine status based on score (no "In Progress" status as we're filtering those out)
                  let status = "Completed";
                  let statusColor = "green";
                  
                  // We know score is not null because we filtered those out
                  const score = interview.score || 0; // Fallback is just for type safety
                  
                  if (score < 5) {
                    status = "Needs Improvement";
                    statusColor = "red";
                  } else if (score < 8) {
                    status = "Good";
                    statusColor = "blue";
                  } else {
                    status = "Excellent";
                    statusColor = "green";
                  }
                  
                  return (
                    <Card key={interview.id} className="overflow-hidden">
                      <CardHeader className="pb-2 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-medium">
                              {jobRole}
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(interview.date), 'MMM d, yyyy • h:mm a')}
                            </CardDescription>
                          </div>
                          <Badge 
                            className={`
                              ${statusColor === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                              ${statusColor === 'amber' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                              ${statusColor === 'red' ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}
                              ${statusColor === 'blue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                            `}
                            variant="outline"
                          >
                            {status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Performance Score</span>
                            <span className="font-medium">{score}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                score >= 8 ? 'bg-green-500' : 
                                score >= 5 ? 'bg-blue-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${score * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700 line-clamp-3">
                            <span className="font-medium">Feedback:</span> {
                              typeof interview.feedback === 'string' 
                                ? interview.feedback 
                                : typeof interview.feedback === 'object' && interview.feedback 
                                  ? (interview.feedback as any).overall || JSON.stringify(interview.feedback)
                                  : "No detailed feedback available."
                            }
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 border-t pt-3 pb-3 flex justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                        >
                          View Complete Report
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              
              {interviews.length > 6 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline">Load More Interviews</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <i className="ri-vidicon-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No interviews yet</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Start a mock interview to practice your skills and get AI-powered feedback
              </p>
              <Button onClick={handleStartAIInterview}>
                Start Your First Interview
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default MockInterviews;