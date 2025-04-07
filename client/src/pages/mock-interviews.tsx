import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { MockInterview } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { analyzeMockInterview } from "@/lib/openai";
import { format } from "date-fns";

function MockInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewTitle, setInterviewTitle] = useState("General Interview Practice");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [interviewTranscript, setInterviewTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  // Fetch mock interviews
  const { 
    data: interviews,
    isLoading: isLoadingInterviews 
  } = useQuery<MockInterview[]>({
    queryKey: ["/api/mock-interviews"],
    enabled: !!user,
  });

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
        description: error.message || "Failed to analyze interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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
      </div>

      {/* Practice Section */}
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
              <input
                type="text"
                value={interviewTitle}
                onChange={(e) => setInterviewTitle(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm"
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
                    <i className="ri-check-line text-green-500 mr-2"></i> Confidence and delivery
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i> Eye contact and body language
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i> Answer structure and clarity
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="ri-check-line text-green-500 mr-2"></i> Content relevance and depth
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                {!isRecording ? (
                  <Button onClick={handleStartRecording} className="flex items-center">
                    <i className="ri-record-circle-line mr-2"></i> Start Recording
                  </Button>
                ) : (
                  <Button onClick={handleStopRecording} variant="destructive" className="flex items-center">
                    <i className="ri-stop-circle-line mr-2"></i> Stop Recording
                  </Button>
                )}
                
                <Button 
                  onClick={handleAnalyzeInterview} 
                  variant="outline" 
                  disabled={isRecording || recordedChunks.length === 0 || isAnalyzing}
                  className="flex items-center"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="ri-ai-generate mr-2"></i> Analyze Performance
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
                    <i className="ri-vidicon-line text-gray-500 text-3xl"></i>
                  </div>
                  <p className="text-gray-600 text-sm">Your video will appear here</p>
                </div>
              )}
              
              {isRecording && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs flex items-center">
                  <i className="ri-record-circle-fill mr-1"></i> Recording
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

      {/* Previous Results */}
      <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Previous Results</h2>
      {isLoadingInterviews ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
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
              <i className="ri-vidicon-line text-gray-500 text-xl"></i>
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
              <CardTitle className="text-md">Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Speak clearly and at a moderate pace</li>
                <li>Pause briefly after questions to organize thoughts</li>
                <li>Use the STAR method for behavioral questions</li>
                <li>Keep answers concise (1-2 minutes per question)</li>
                <li>End with a strong closing statement</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MockInterviews;
