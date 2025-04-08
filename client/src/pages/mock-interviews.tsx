import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { MockInterview } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { analyzeMockInterview } from "@/lib/openai";
import { format } from "date-fns";
import { InterviewSimulator } from "@/components/interviews/InterviewSimulator";
import { Badge } from "@/components/ui/badge";

function MockInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewTitle, setInterviewTitle] = useState("General Interview Practice");
  const [selectedJobRole, setSelectedJobRole] = useState("Software Engineer");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [interviewTranscript, setInterviewTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState("classic");
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

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('videoPreview') as HTMLVideoElement;
      
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        setRecordedChunks(chunks);
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Your mock interview is now being recorded.",
      });
    } catch (error) {
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access to record your interview.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Your interview has been recorded. You can now analyze your performance.",
      });
    }
  };

  const handleAnalyzeInterview = async () => {
    if (recordedChunks.length === 0) {
      toast({
        title: "No recording",
        description: "Please record an interview before analyzing.",
        variant: "destructive",
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Interview limit reached",
        description: "You've reached the maximum number of interviews for your plan. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // In a real implementation, we would:
      // 1. Upload the video to a server or directly transcribe it
      // 2. Get the transcript
      // 3. Analyze the transcript
      
      // For demo purposes, using a mock transcript
      const mockTranscript = "Hello, my name is Alex. I'm applying for the Senior Developer position. I have 5 years of experience working with React and Node.js. In my previous role, I led a team of developers working on a customer-facing application that improved user engagement by 30%. I'm passionate about creating clean, efficient code and solving complex problems. One of my strengths is communication - I believe that clear communication is essential for successful projects. A challenge I faced recently was optimizing a slow-performing application. I analyzed the bottlenecks, implemented code splitting and lazy loading, and reduced load time by 40%.";
      
      setInterviewTranscript(mockTranscript);
      setShowTranscript(true);
      
      // Analyze the transcript
      const analysis = await analyzeMockInterview(mockTranscript);
      
      // Save the analysis
      const response = await apiRequest("POST", "/api/mock-interviews", {
        title: interviewTitle,
        score: analysis.score,
        feedback: analysis.feedback
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/mock-interviews"] });
        
        toast({
          title: "Analysis complete",
          description: "Your interview performance has been analyzed. Check the results below.",
        });
      } else {
        throw new Error("Failed to save analysis");
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="interactive">Interactive AI Interview</TabsTrigger>
          <TabsTrigger value="classic">Classic Video Recording</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interactive">
          {showInterviewSim ? (
            <InterviewSimulator 
              jobRole={selectedJobRole} 
              onComplete={handleInterviewComplete} 
            />
          ) : (
            <Card>
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
        </TabsContent>
        
        <TabsContent value="classic">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Practice Interview</CardTitle>
              <CardDescription>Record yourself answering interview questions to get AI feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Title
                  </label>
                  <Input
                    type="text"
                    value={interviewTitle}
                    onChange={(e) => setInterviewTitle(e.target.value)}
                    placeholder="e.g. Full Stack Developer Interview"
                  />
                  
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-gray-600">Practice Questions:</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900">Tell me about yourself and your experience.</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900">What are your greatest strengths and weaknesses?</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-900">Describe a challenging project you worked on.</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm text-gray-600">AI will evaluate:</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Confidence and delivery
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Eye contact and body language
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Answer structure and clarity
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Content relevance and depth
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    {!isRecording ? (
                      <Button 
                        onClick={handleStartRecording}
                        disabled={hasReachedLimit}
                        className="flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
                        </svg>
                        Start Recording
                      </Button>
                    ) : (
                      <Button onClick={handleStopRecording} variant="destructive" className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        Stop Recording
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleAnalyzeInterview} 
                      variant="outline" 
                      disabled={isRecording || recordedChunks.length === 0 || isAnalyzing || hasReachedLimit}
                      className="flex items-center"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          Analyze Performance
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-md flex items-center justify-center relative">
                  <video 
                    id="videoPreview" 
                    className="w-full h-full rounded-md"
                    muted 
                    playsInline
                    style={{ display: isRecording || recordedChunks.length > 0 ? 'block' : 'none' }}
                  ></video>
                  
                  {!isRecording && recordedChunks.length === 0 && (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-sm">Your video will appear here</p>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
                      </svg>
                      Recording
                    </div>
                  )}
                </div>
              </div>
              
              {showTranscript && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Transcript</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700">{interviewTranscript}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Previous Results */}
      <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Previous Results</h2>
      {isLoadingInterviews ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : interviews && interviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviews.map(interview => (
            <Card key={interview.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{interview.title}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(interview.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-lg font-semibold text-secondary-600">
                    {interview.score}% Score
                  </div>
                </div>
                
                {interview.feedback && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-xs font-medium text-gray-700">Strengths:</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                          {(interview.feedback as any).strengths.map((strength: string, index: number) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium text-gray-700">Areas for Improvement:</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                          {(interview.feedback as any).improvements.map((improvement: string, index: number) => (
                            <li key={index}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-medium text-gray-700">Overall Assessment:</h5>
                        <p className="text-xs text-gray-600 mt-1">{(interview.feedback as any).overall}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interview results yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start recording mock interviews to get AI feedback</p>
          </CardContent>
        </Card>
      )}

      {/* Interview Tips */}
      <div className="mt-10">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Video Interview Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Camera Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Place your camera at eye level</li>
                <li>Ensure your face is well-lit from the front</li>
                <li>Choose a clean, professional background</li>
                <li>Test your camera and microphone beforehand</li>
                <li>Dress professionally from head to toe</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Body Language</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Maintain natural eye contact with the camera</li>
                <li>Sit up straight with shoulders back</li>
                <li>Use hand gestures sparingly and deliberately</li>
                <li>Smile and show engagement</li>
                <li>Avoid fidgeting or looking off-camera</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Response Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Use the STAR method for behavioral questions</li>
                <li>Keep responses concise (1-2 minutes per question)</li>
                <li>Prepare examples from your experience</li>
                <li>Focus on quantifiable results</li>
                <li>Practice active listening before responding</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MockInterviews;