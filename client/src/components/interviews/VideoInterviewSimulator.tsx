import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { analyzeMockInterview } from '@/lib/openai';
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';

interface VideoInterviewSimulatorProps {
  jobRole: string;
  duration?: number; // Interview duration in minutes
  onComplete?: (result: any) => void;
}

type Message = {
  role: 'interviewer' | 'user';
  content: string;
  timestamp: Date;
};

export function VideoInterviewSimulator({ 
  jobRole, 
  duration = 15, 
  onComplete 
}: VideoInterviewSimulatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  
  // References
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
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

  // Initialize camera and microphone
  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }
      
      setIsCameraOn(true);
      toast({
        title: "Camera and microphone connected",
        description: "You're all set for your video interview.",
      });

      // Initialize speech recognition for real-time transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Speech recognition is supported
        initializeSpeechRecognition();
      } else {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Please use Chrome or Edge for the best experience.",
          variant: "destructive"
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera or microphone. Please check your permissions.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Set up speech recognition for real-time transcription
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      
      if (transcript) {
        setUserTranscript(prev => prev + ' ' + transcript);
        setCurrentAnswer(prev => prev + ' ' + transcript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };
    
    recognition.start();
    setIsRecording(true);
  };

  // Initialize the AI interviewer avatar
  const setupInterviewerAvatar = () => {
    // We'll use SVG images for the interviewer avatar
    // This is a simple implementation; in a production app, 
    // this would be connected to a more sophisticated animation system
    setInterviewerSpeaking(false);
  };
  
  // Speak the given text using speech synthesis
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a professional sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Daniel') || 
      voice.name.includes('Google UK English Male') ||
      voice.name.includes('Microsoft David')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      setInterviewerSpeaking(true);
    };
    
    utterance.onend = () => {
      setInterviewerSpeaking(false);
    };
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };
  
  // Initialize websocket connection
  useEffect(() => {
    const initializeInterview = async () => {
      // First set up camera and mic
      const cameraReady = await setupCamera();
      if (!cameraReady) return;
      
      // Set up the interviewer avatar
      setupInterviewerAvatar();
      
      // Connect to WebSocket server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket server at:', wsUrl);
      
      // Start with an initial welcome message
      const welcomeMessage = `Hello! I'll be conducting your interview for the ${jobRole} position today. I'll ask you several questions to assess your skills and experience. Please respond as if you're in a real interview. Let's begin in a moment...`;
      setMessages([{
        role: 'interviewer',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
      
      // Speak the welcome message
      speakText(welcomeMessage);
      
      // Start the timer
      timerRef.current = window.setInterval(() => {
        setElapsed(prev => {
          if (prev >= totalTime) {
            if (timerRef.current) clearInterval(timerRef.current);
            endInterview();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Add a delay to ensure the server is ready
      const connectionTimeout = setTimeout(() => {
        try {
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
                const questionMessage = {
                  role: 'interviewer' as const,
                  content: data.content,
                  timestamp: new Date()
                };
                
                setMessages(prev => [...prev, questionMessage]);
                
                // Speak the question
                speakText(data.content);
              }
              else if (data.type === 'follow_up') {
                // Received a follow-up comment or question
                const followUpMessage = {
                  role: 'interviewer' as const,
                  content: data.content,
                  timestamp: new Date()
                };
                
                setMessages(prev => [...prev, followUpMessage]);
                
                // Speak the follow-up
                speakText(data.content);
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
          
        } catch (error) {
          console.error("Error establishing WebSocket connection:", error);
          setIsConnecting(false);
          toast({
            title: "Connection Error",
            description: "Failed to connect to interview server. Please try again.",
            variant: "destructive"
          });
        }
      }, 1000);
      
      // Clean up function
      return () => {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        if (timerRef.current) clearInterval(timerRef.current);
        if (socketRef.current) {
          socketRef.current.close();
        }
        
        // Stop media tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Cancel any ongoing speech
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    };
    
    initializeInterview();
  }, [jobRole, totalTime, user]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Submit user's answer to the current question
  const submitAnswer = () => {
    // If the user didn't type or say anything, don't submit
    if (!currentAnswer.trim() && !userTranscript.trim()) return;
    
    // Use transcript if available, otherwise use typed answer
    const finalAnswer = userTranscript.trim() || currentAnswer.trim();
    
    // Add user's message to the chat
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: finalAnswer, 
        timestamp: new Date() 
      }
    ]);
    
    // Send answer to the server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'answer',
        content: finalAnswer,
      }));
    }
    
    // Clear inputs
    setCurrentAnswer('');
    setUserTranscript('');
  };
  
  // Handle key press in textarea
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn off camera
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
        setIsCameraOn(false);
      }
    } else {
      // Turn on camera
      await setupCamera();
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (isRecording) {
      // Turn off microphone
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = false);
        setIsRecording(false);
      }
    } else {
      // Turn on microphone
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = true);
        setIsRecording(true);
        initializeSpeechRecognition();
      }
    }
  };
  
  // End the interview
  const endInterview = async () => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
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
    
    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Inform user that interview is ending
    const endMessage = 'That concludes our interview. Thank you for your time. I will now analyze your responses.';
    setMessages(prev => [
      ...prev,
      {
        role: 'interviewer',
        content: endMessage,
        timestamp: new Date()
      }
    ]);
    
    // Speak the end message
    speakText(endMessage);
    
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
          <p className="text-gray-500">Connecting to interview server and initializing cameras...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative rounded-lg overflow-hidden bg-black h-[240px] md:h-[320px]">
            {/* Interviewer Avatar */}
            <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${interviewerSpeaking ? 'border-2 border-blue-500' : ''}`}>
              <img
                src={interviewerSpeaking ? '/avatars/interviewer-talking.svg' : '/avatars/interviewer-neutral.svg'}
                alt="AI Interviewer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-sm py-1 px-2 rounded">
              AI Interviewer
            </div>
            {interviewerSpeaking && (
              <div className="absolute top-2 right-2 flex items-center bg-blue-500 text-white text-xs py-1 px-2 rounded">
                <span className="animate-pulse mr-1">●</span> Speaking
              </div>
            )}
          </div>
          
          <div className="relative rounded-lg overflow-hidden bg-black h-[240px] md:h-[320px]">
            {/* User Video */}
            <video 
              ref={userVideoRef}
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-sm py-1 px-2 rounded">
              You
            </div>
            {isRecording && (
              <div className="absolute top-2 right-2 flex items-center bg-red-500 text-white text-xs py-1 px-2 rounded">
                <span className="animate-pulse mr-1">●</span> Recording
              </div>
            )}
            {faceDetected && (
              <div className="absolute top-2 left-2 flex items-center bg-green-500 text-white text-xs py-1 px-2 rounded">
                Face Detected
              </div>
            )}
          </div>
        </div>
        
        <div className="h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg mb-4">
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
        
        {userTranscript && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium mb-1">Live Transcript:</div>
            <div className="text-gray-700">{userTranscript}</div>
          </div>
        )}
        
        <div>
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            placeholder="Type your answer (or just speak)..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isFinished}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={toggleCamera}
                className="flex items-center"
              >
                {isCameraOn ? <FiVideo className="mr-1" /> : <FiVideoOff className="mr-1" />}
                {isCameraOn ? 'Cam On' : 'Cam Off'}
              </Button>
              <Button 
                variant="outline" 
                onClick={toggleMicrophone}
                className="flex items-center"
              >
                {isRecording ? <FiMic className="mr-1" /> : <FiMicOff className="mr-1" />}
                {isRecording ? 'Mic On' : 'Mic Off'}
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="destructive" 
                onClick={endInterview}
                disabled={isFinished}
              >
                End Interview
              </Button>
              <Button 
                onClick={submitAnswer} 
                disabled={(!currentAnswer.trim() && !userTranscript.trim()) || isFinished}
              >
                Send Response
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Mock Interview: {jobRole}</CardTitle>
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
                  <span className="animate-pulse text-red-500 mr-2">●</span> Recording Audio
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="text-gray-400 mr-2">●</span> Mic Off
                </span>
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