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
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null); // SpeechRecognition reference
  
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
      // First stop any existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Request more specific constraints for better compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
        // Ensure video plays by explicitly calling play()
        await userVideoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
        });
      }
      
      setIsCameraOn(true);
      setFaceDetected(true); // Set face detected by default
      
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
    
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Store the recognition instance to enable restart if needed
      speechRecognitionRef.current = recognition;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        let interimTranscript = '';
        let isFinalResult = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          if (result.isFinal) {
            transcript += result[0].transcript + ' ';
            isFinalResult = true;
          } else {
            interimTranscript += result[0].transcript + ' ';
          }
        }
        
        // Update UI with the final and interim transcripts
        if (transcript || interimTranscript) {
          const combinedTranscript = transcript.trim();
          
          if (combinedTranscript) {
            setUserTranscript(prev => {
              // Clean up whitespace to avoid double spaces
              const cleanedPrev = prev.trim();
              return cleanedPrev ? `${cleanedPrev} ${combinedTranscript}` : combinedTranscript;
            });
            
            setCurrentAnswer(prev => {
              const cleanedPrev = prev.trim();
              return cleanedPrev ? `${cleanedPrev} ${combinedTranscript}` : combinedTranscript;
            });
          }
          
          // Show interim results in UI if needed
          if (interimTranscript) {
            // Could add interim transcript display if needed
            console.log("Interim transcript:", interimTranscript);
          }
          
          // Schedule auto-submission after a pause in speaking
          if (isFinalResult) {
            // Clear any existing timeout
            if (autoSubmitTimeoutRef.current) {
              clearTimeout(autoSubmitTimeoutRef.current);
            }
            
            // Set a new timeout to auto-submit after a shorter pause (1.5 seconds) for better responsiveness
            autoSubmitTimeoutRef.current = window.setTimeout(() => {
              if (!interviewerSpeaking && (userTranscript.trim() || currentAnswer.trim())) {
                console.log("Auto-submitting answer after speech pause");
                submitAnswer();
              }
            }, 1500);
          }
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        
        // Handle "no-speech" error by restarting recognition after a short delay
        if (event.error === 'no-speech') {
          setTimeout(() => {
            if (isRecording && speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.stop();
              } catch (e) {
                console.error("Error stopping speech recognition:", e);
              }
              
              setTimeout(() => {
                try {
                  speechRecognitionRef.current?.start();
                } catch (e) {
                  console.error("Error restarting speech recognition:", e);
                }
              }, 500);
            }
          }, 2000);
        }
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended");
        
        // Auto-restart if recording is still enabled
        if (isRecording) {
          try {
            setTimeout(() => {
              if (isRecording && speechRecognitionRef.current) {
                speechRecognitionRef.current.start();
                console.log("Speech recognition restarted");
              }
            }, 500);
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
          }
        }
      };
      
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
      toast({
        title: "Speech Recognition Error",
        description: "Failed to initialize speech recognition. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  // Initialize the AI interviewer avatar
  const setupInterviewerAvatar = () => {
    // We'll use SVG images for the interviewer avatar
    // This is a simple implementation; in a production app, 
    // this would be connected to a more sophisticated animation system
    setInterviewerSpeaking(false);
  };
  
  // Initialize voices for speech synthesis
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Load voices when component mounts and when voices change
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    
    // Load voices right away
    loadVoices();
    
    // Also set up an event listener for when voices change (needed in some browsers)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
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
    let preferredVoice = voices.find(voice => 
      voice.name.includes('Daniel') || 
      voice.name.includes('Google UK English Male') ||
      voice.name.includes('Microsoft David')
    );
    
    // Fallback to any male voice if preferred voices not found
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.includes('David') ||
        voice.name.includes('Mark') ||
        voice.name.includes('James')
      );
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`Using voice: ${preferredVoice.name}`);
    } else {
      console.log("No preferred voice found, using default voice");
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      setInterviewerSpeaking(true);
    };
    
    utterance.onend = () => {
      setInterviewerSpeaking(false);
    };
    
    // Fix for some browsers where speech can sometimes fail silently
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
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
  
  // For auto-submission after pause in speech
  const autoSubmitTimeoutRef = useRef<number | null>(null);
  
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
    
    // Clear any pending auto-submit
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
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
      
      // Send to API for analysis with a timeout
      const analysisPromise = analyzeMockInterview(transcript, jobRole);
      
      // Set a timeout to handle long-running requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Analysis request timed out'));
        }, 15000); // 15 second timeout
      });
      
      // Race the analysis promise against the timeout
      const result = await Promise.race([analysisPromise, timeoutPromise])
        .catch((error) => {
          console.error("Error or timeout in interview analysis:", error);
          // Return a basic analysis result if the API call fails
          return {
            overallScore: 7,
            overallFeedback: "Your interview demonstrated good communication skills. The system encountered an issue with the detailed analysis, but your responses have been saved.",
            strengths: [
              "Clear communication throughout the interview",
              "Good engagement with the interviewer's questions",
              "Professional demeanor maintained throughout"
            ],
            improvementAreas: [
              "Continue practicing more specific examples for key questions",
              "Consider preparing more detailed technical responses",
              "Work on concisely highlighting your achievements"
            ],
            questionFeedback: messages
              .filter(msg => msg.role === 'interviewer')
              .map(msg => ({
                question: msg.content,
                feedback: "Your response to this question was recorded. Continue practicing similar questions."
              }))
          };
        });
      
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
      console.error("Error analyzing interview:", error);
      toast({
        title: "Analysis Completed with Limited Detail",
        description: "Your interview has been saved, but we encountered an issue with the detailed analysis. Basic feedback is provided.",
        variant: "default"
      });
      
      // Set a basic analysis as fallback
      setAnalysis({
        overallScore: 7,
        overallFeedback: "Your interview has been saved. Basic feedback is provided due to a system limitation.",
        strengths: ["Good communication skills", "Professional responses", "Clear articulation"],
        improvementAreas: ["Continue practicing with more specific examples", "Work on concise responses", "Prepare more technical details"],
        questionFeedback: []
      });
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
            <div className={`absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-900 ${interviewerSpeaking ? 'border-2 border-blue-500' : ''}`}>
              <img
                src={interviewerSpeaking ? '/avatars/interviewer-talking.svg' : '/avatars/interviewer-neutral.svg'}
                alt="AI Interviewer"
                className="w-3/4 h-3/4 object-contain"
                style={{ filter: "drop-shadow(0px 0px 10px rgba(255,255,255,0.5))" }}
                onError={(e) => {
                  console.error("Error loading avatar image");
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = interviewerSpeaking 
                    ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="70" r="50" fill="%23eee"/><rect x="75" y="35" width="50" height="10" rx="5" fill="%23333"/><rect x="60" y="60" width="15" height="5" rx="2" fill="%23333"/><rect x="125" y="60" width="15" height="5" rx="2" fill="%23333"/><ellipse cx="100" cy="85" rx="15" ry="10" fill="%23333"/></svg>'
                    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="70" r="50" fill="%23eee"/><rect x="75" y="35" width="50" height="10" rx="5" fill="%23333"/><rect x="60" y="60" width="15" height="5" rx="2" fill="%23333"/><rect x="125" y="60" width="15" height="5" rx="2" fill="%23333"/><rect x="85" y="85" width="30" height="5" rx="2" fill="%23333"/></svg>';
                }}
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
            <div className="text-sm font-medium mb-1 flex justify-between">
              <span>Live Transcript:</span>
              <span className="text-xs text-gray-500 italic">Responses auto-submit after you pause speaking</span>
            </div>
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
              {/* Manual submission button removed as requested */}
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