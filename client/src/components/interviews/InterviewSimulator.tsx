import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { analyzeMockInterview } from '@/lib/openai';

interface InterviewSimulatorProps {
  jobRole: string;
  duration?: number; // Interview duration in minutes
  onComplete?: (result: any) => void;
}

type Message = {
  role: 'interviewer' | 'user';
  content: string;
  timestamp: Date;
};

export function InterviewSimulator({ 
  jobRole, 
  duration = 15, 
  onComplete 
}: InterviewSimulatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // Calculate time remaining in seconds
  const totalTime = duration * 60;
  const remaining = Math.max(0, totalTime - elapsed);
  const progress = (elapsed / totalTime) * 100;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Initialize websocket connection
  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnecting(false);
      
      // Send initial job role information
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'start',
          jobRole,
          userId: user?.id,
        }));
      }
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'question') {
          // Received a new interview question
          setMessages(prev => [
            ...prev, 
            { 
              role: 'interviewer', 
              content: data.content, 
              timestamp: new Date() 
            }
          ]);
        }
        else if (data.type === 'follow_up') {
          // Received a follow-up comment or question
          setMessages(prev => [
            ...prev, 
            { 
              role: 'interviewer', 
              content: data.content, 
              timestamp: new Date() 
            }
          ]);
        }
        else if (data.type === 'error') {
          toast({
            title: "Interview Error",
            description: data.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to interview server. Please try again.",
        variant: "destructive"
      });
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    // Start with an initial welcome message
    setMessages([{
      role: 'interviewer',
      content: `Hello! I'll be conducting your interview for the ${jobRole} position today. I'll ask you several questions to assess your skills and experience. Please respond as if you're in a real interview. Let's begin in a moment...`,
      timestamp: new Date()
    }]);
    
    // Start the timer
    timerRef.current = window.setInterval(() => {
      setElapsed(prev => {
        if (prev >= totalTime) {
          clearInterval(timerRef.current!);
          endInterview();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    // Clean up function
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Submit user's answer to the current question
  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    
    // Add user's message to the chat
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: currentAnswer, 
        timestamp: new Date() 
      }
    ]);
    
    // Send answer to the server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'answer',
        content: currentAnswer,
      }));
    }
    
    // Clear the input
    setCurrentAnswer('');
  };
  
  // Handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };
  
  // End the interview
  const endInterview = async () => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Close WebSocket connection
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'end',
        }));
      }
      socketRef.current.close();
    }
    
    // Inform user that interview is ending
    setMessages(prev => [
      ...prev,
      {
        role: 'interviewer',
        content: 'That concludes our interview. Thank you for your time. I will now analyze your responses.',
        timestamp: new Date()
      }
    ]);
    
    setIsFinished(true);
    
    // Analyze the interview
    try {
      setIsAnalyzing(true);
      
      // Build the transcript from messages
      const transcript = messages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');
      
      // Send to OpenAI for analysis
      const result = await analyzeMockInterview(transcript, jobRole);
      
      setAnalysis(result);
      
      // Notify parent component that interview is complete
      if (onComplete) {
        onComplete({
          transcript,
          analysis: result,
          jobRole,
          duration: elapsed,
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Failed to analyze interview responses. Please try again.",
        variant: "destructive"
      });
      console.error("Error analyzing interview:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Render appropriate content based on interview state
  const renderContent = () => {
    if (isConnecting) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Connecting to interview server...</p>
        </div>
      );
    }
    
    if (isFinished) {
      return (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-medium text-lg mb-2">Interview Complete</h3>
            <p className="text-gray-600">
              You've completed your mock interview for the <span className="font-medium">{jobRole}</span> position.
            </p>
            <p className="text-gray-600 mt-2">
              Duration: {formatTime(elapsed)}
            </p>
          </div>
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-500">Analyzing your interview responses...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-2">Overall Performance</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="text-2xl font-bold">{analysis.overallScore}/10</div>
                  <div className="text-gray-600">{analysis.overallFeedback}</div>
                </div>
                <Progress value={analysis.overallScore * 10} className="h-2" />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-2">Strengths</h3>
                <ul className="list-disc ml-5 space-y-1">
                  {analysis.strengths.map((strength: string, i: number) => (
                    <li key={i} className="text-gray-600">{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-2">Areas for Improvement</h3>
                <ul className="list-disc ml-5 space-y-1">
                  {analysis.improvementAreas.map((area: string, i: number) => (
                    <li key={i} className="text-gray-600">{area}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-2">Question-Specific Feedback</h3>
                <div className="space-y-3">
                  {analysis.questionFeedback.map((feedback: any, i: number) => (
                    <div key={i} className="border-t pt-3 first:border-t-0 first:pt-0">
                      <div className="font-medium">{feedback.question}</div>
                      <div className="text-gray-600 mt-1">{feedback.feedback}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    
    return (
      <>
        <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`mb-4 ${msg.role === 'interviewer' ? 'text-gray-800' : 'text-primary'}`}
            >
              <div className="font-medium mb-1">
                {msg.role === 'interviewer' ? 'Interviewer' : 'You'}
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                {msg.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-4">
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            placeholder="Type your answer..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isFinished}
          />
          <div className="flex justify-between mt-2">
            <Button 
              variant="destructive" 
              onClick={endInterview}
              disabled={isFinished}
            >
              End Interview
            </Button>
            <Button 
              onClick={submitAnswer} 
              disabled={!currentAnswer.trim() || isFinished}
            >
              Send Response
            </Button>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mock Interview: {jobRole}</CardTitle>
        <CardDescription>
          {isFinished 
            ? `Interview completed in ${formatTime(elapsed)}`
            : `Remaining time: ${formatTime(remaining)}`
          }
        </CardDescription>
        {!isFinished && (
          <Progress value={progress} className="h-2 mt-2" />
        )}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      {!isConnecting && !isFinished && (
        <CardFooter className="border-t pt-4 text-sm text-gray-500">
          <div className="w-full flex justify-between items-center">
            <div>
              {isRecording ? (
                <span className="flex items-center">
                  <span className="animate-pulse mr-2">●</span> Recording...
                </span>
              ) : (
                <span>Mic off</span>
              )}
            </div>
            <div>
              Interview progress: {Math.min(100, Math.round(progress))}%
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}