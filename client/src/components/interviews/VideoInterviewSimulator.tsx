import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { analyzeMockInterview } from '@/lib/openai';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { FacialExpressionAnalyzer } from './FacialExpressionAnalyzer';
import { EmotionDisplay } from './EmotionDisplay';

// Speech synthesis utility class
class SpeechService {
  private synthesis: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private speaking: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    // Get available voices
    const voices = this.synthesis.getVoices();
    
    // If no voices available, wait for voiceschanged event
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          this.synthesis.removeEventListener('voiceschanged', handler);
          resolve();
        };
        this.synthesis.addEventListener('voiceschanged', handler);
      });
    }

    // Select the first available voice
    const availableVoices = this.synthesis.getVoices();
    this.voice = availableVoices[0] || null;
    
    if (this.voice) {
      console.log('Selected voice:', this.voice.name);
      this.initialized = true;
    } else {
      console.warn('No voices available');
    }
  }

  async speak(
    text: string, 
    onStart?: () => void, 
    onEnd?: () => void, 
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      // Ensure initialization
      if (!this.initialized) {
        await this.init();
      }

      // If already speaking, stop current speech
      if (this.speaking) {
        this.stop();
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use selected voice or default
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      // Set basic properties
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Add event listeners
      utterance.onstart = () => {
        this.speaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.speaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (event) => {
        this.speaking = false;
        console.error('Speech synthesis error:', event);
        if (onError) onError(event.error);
      };

      // Start speaking
      this.synthesis.speak(utterance);

    } catch (error) {
      this.speaking = false;
      console.error('Speech synthesis error:', error);
      if (onError) onError(error instanceof Error ? error.message : 'Speech synthesis failed');
    }
  }

  stop(): void {
    this.synthesis.cancel();
    this.speaking = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  reset(): void {
    this.stop();
    this.initialized = false;
    this.voice = null;
  }
}

interface VideoInterviewSimulatorProps {
  jobRole: string;
  duration?: number; // Interview duration in minutes
  onComplete?: (result: any) => { interviewId: string } | void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

// Add this CSS class at the top of the file after the imports
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`;

// Update the main container styles for better responsiveness
const containerStyles = {
  height: '100vh',
  width: '100%',
  display: 'flex',
  position: 'relative' as const,
  overflow: 'hidden',
  backgroundColor: '#1a1a1a',
  maxWidth: '100vw'
};

// Update the main content area styles for better responsiveness
const mainContentStyles = {
  flex: '1',
  display: 'flex',
  flexDirection: 'column' as const,
  position: 'relative' as const,
  overflow: 'hidden',
  padding: '1rem',
  minWidth: 0 // Prevent flex items from overflowing
};

// Update the video container styles for full-width layout
const videoContainerStyles = {
  flex: '1',
  display: 'flex',
  flexDirection: 'column' as const,
  position: 'relative' as const,
  overflow: 'hidden',
  gap: '1rem',
  minHeight: 0
};

// Update the video grid styles for full-width layout
const videoGridStyles = {
  position: 'relative' as const,
  width: '100%',
  height: '100%',
  flex: 1,
  minHeight: 0
};

// Update the transcript container styles for better responsiveness
const transcriptContainerStyles = {
  width: '320px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#2d2d2d',
  borderLeft: '1px solid #404040',
  '@media (max-width: 768px)': {
    width: '280px'
  }
};

// Add control bar styles
const controlBarStyles = {
  position: 'absolute' as const,
  bottom: '2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '1rem',
  padding: '0.75rem',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  borderRadius: '2rem',
  zIndex: 10
};

// Add control button styles
const controlButtonStyles = {
  width: '3rem',
  height: '3rem',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#404040',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    backgroundColor: '#525252'
  }
};

// Update the video wrapper styles for full-width layout
const videoWrapperStyles = {
  position: 'relative' as const,
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
  borderRadius: '1.5rem',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

// Update the AI avatar styles for overlay
const aiAvatarStyles = {
  position: 'absolute' as const,
  top: '1.5rem',
  right: '1.5rem',
  width: '240px',
  height: '180px',
  backgroundColor: '#1a1a1a',
  borderRadius: '1rem',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  zIndex: 2
};

// Update the messages container styles
const messagesContainerStyles = {
  flex: '1',
  overflowY: 'auto' as const,
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1rem',
  scrollBehavior: 'smooth' as const
};

// Add feedback container styles
const feedbackContainerStyles = {
  height: '100vh',
  overflow: 'auto',
  padding: '2rem',
  backgroundColor: '#1a1a1a',
  color: 'white'
};

const feedbackSectionStyles = {
  maxWidth: '800px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1.5rem'
};

const feedbackCardStyles = {
  backgroundColor: '#2d2d2d',
  borderRadius: '1rem',
  padding: '1.5rem',
  border: '1px solid #404040'
};

// Add interface for conversation pairs
interface ConversationPair {
  question: string;
  answer: string;
}

// Add interface for feedback
interface QuestionFeedback {
  question: string;
  answer: string;
  feedback: string;
}

// Add voice activity indicator styles
const voiceActivityStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  borderRadius: '0.5rem',
  color: 'white',
  fontSize: '0.875rem',
  zIndex: 2
};

// Add base64 encoded default avatar
const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxMDAiIGZpbGw9IiMyRDJEMkQiLz4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI4NSIgcj0iNDAiIGZpbGw9IiM0QjU1NjMiLz4KICA8cGF0aCBkPSJNNDAgMTYwQzQwIDE0MC4xMTggNjcuNjY2NyAxMjUgMTAwIDEyNUMxMzIuMzM0IDEyNSAxNjAgMTQwLjExOCAxNjAgMTYwQzE2MCAxNzkuODgyIDEzMi4zMzQgMTk1IDEwMCAxOTVDNjcuNjY2NyAxOTUgNDAgMTc5Ljg4MiA0MCAxNjBaIiBmaWxsPSIjNEI1NTYzIi8+Cjwvc3ZnPgo=`;

// Add emotion data interface
interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  surprised: number;
  disgusted: number;
}

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
  const [isMirrored, setIsMirrored] = useState(true);
  
  // References
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null); // SpeechRecognition reference
  
  // Create speech service instance
  const speechServiceRef = useRef<SpeechService | null>(null);
  
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

  // Add state for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to enter fullscreen
  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  // Function to exit fullscreen
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Start interview in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      enterFullscreen();
    }
  }, []);

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
        await userVideoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
        });
      }
      
      setIsCameraOn(true);
      setFaceDetected(true);
      setIsRecording(true); // Automatically enable microphone
      
      toast({
        title: "Camera and microphone connected",
        description: "You're all set for your video interview.",
      });

      // Initialize speech recognition
        initializeSpeechRecognition();
      
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
      // Stop existing recognition instance if it exists
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping existing speech recognition:", error);
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Store the recognition instance
      speechRecognitionRef.current = recognition;

      let finalTranscript = '';
      let isSubmitting = false;

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        setIsMicActive(true);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (interviewerSpeaking) return; // Ignore results while AI is speaking
        
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
            // Update UI immediately with final transcript
            setUserTranscript(finalTranscript.trim());
            
            // Submit after a short delay if not already submitting
            if (!isSubmitting && !interviewerSpeaking) {
              isSubmitting = true;
              setTimeout(() => {
                submitAnswer(finalTranscript.trim());
                finalTranscript = ''; // Clear the transcript after submission
                isSubmitting = false;
              }, 800);
            }
          } else {
            interimTranscript += result[0].transcript;
            // Show interim results immediately
            setUserTranscript(finalTranscript + interimTranscript);
          }
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        
        // If there's any remaining transcript, submit it
        if (finalTranscript.trim() && !interviewerSpeaking && !isSubmitting) {
          submitAnswer(finalTranscript.trim());
          finalTranscript = '';
        }
        
        // Auto-restart if recording is still enabled and not speaking
        if (isRecording && !interviewerSpeaking) {
          try {
            setTimeout(() => {
              if (isRecording && !interviewerSpeaking && speechRecognitionRef.current) {
                speechRecognitionRef.current.start();
                setIsListening(true);
                setIsMicActive(true);
              }
            }, 100);
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
          }
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          // Restart recognition on no-speech error if still recording
          if (isRecording && !interviewerSpeaking) {
            try {
              recognition.stop();
              setTimeout(() => {
                if (isRecording && !interviewerSpeaking) {
                  recognition.start();
                  setIsListening(true);
                  setIsMicActive(true);
                }
              }, 100);
          } catch (error) {
              console.error("Error handling no-speech error:", error);
            }
          }
        }
      };
      
      // Start recognition if recording is enabled and AI is not speaking
      if (isRecording && !interviewerSpeaking) {
      recognition.start();
        setIsListening(true);
        setIsMicActive(true);
      }
      
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
  
  // Initialize speech service
  useEffect(() => {
    speechServiceRef.current = new SpeechService();
    
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.reset();
      }
    };
  }, []);
  
  // Audio context for playing TTS audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Update the interviewerExpressions with the default avatar
  const interviewerExpressions = {
    neutral: defaultAvatar,
    listening: defaultAvatar,
    speaking: defaultAvatar,
    smiling: defaultAvatar,
    thinking: defaultAvatar
  };

  // Add interviewer state
  const [interviewerMood, setInterviewerMood] = useState<keyof typeof interviewerExpressions>('neutral');
  const [isListening, setIsListening] = useState(false);

  // Update the message display to show typing indicator
  const [isTyping, setIsTyping] = useState(false);

  // Add state for actual microphone status
  const [isMicActive, setIsMicActive] = useState(false);

  // Add new state for facial expressions
  const [emotions, setEmotions] = useState<EmotionData | null>(null);
  const [showEmotions, setShowEmotions] = useState<boolean>(true);
  const [emotionHistory, setEmotionHistory] = useState<{ timestamp: number; neutral: number; happy: number; sad: number; angry: number; fearful: number; surprised: number; disgusted: number }[]>([]);

  // Add this effect to track emotion history  
  useEffect(() => {
    if (emotions) {
      setEmotionHistory(prev => [...prev, {
        ...emotions,
        timestamp: Date.now()
      }]);
    }
  }, [emotions]);

  // Add this helper function to get top emotions from history
  const getTopEmotions = (history: { timestamp: number; neutral: number; happy: number; sad: number; angry: number; fearful: number; surprised: number; disgusted: number }[]): { emotion: string; frequency: number }[] => {
    if (history.length === 0) return [];
    
    // Calculate frequency of primary emotions
    const emotionCounts: Record<string, number> = {};
    
    history.forEach(emotion => {
      // Find the top emotion in this sample
      let topEmotion = 'neutral';
      let topValue = emotion.neutral;
      
      Object.entries(emotion).forEach(([key, value]) => {
        if (value > topValue) {
          topEmotion = key;
          topValue = value;
        }
      });
      
      // Only count if the emotion is significant (above 0.5)
      if (topValue > 0.5) {
        emotionCounts[topEmotion] = (emotionCounts[topEmotion] || 0) + 1;
      }
    });
    
    // Sort by frequency
    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Take top 3
      .map(([emotion, count]) => ({
        emotion,
        frequency: count / history.length
      }));
  };

  // Update the speakText function to better handle microphone state
  const speakText = async (text: string, mood: keyof typeof interviewerExpressions = 'speaking') => {
    if (!text || !speechServiceRef.current) return;

    try {
      setInterviewerSpeaking(true);
      setInterviewerMood(mood);
      setIsMicActive(false);

      // Stop speech recognition while AI is speaking
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      }

      // Mute user's microphone when AI is speaking
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }

      await speechServiceRef.current.speak(
        text,
        // onStart
        () => {
          setInterviewerSpeaking(true);
          setInterviewerMood(mood);
          setIsMicActive(false);
        },
        // onEnd
        () => {
        setInterviewerSpeaking(false);
          setInterviewerMood('listening');
          
          // Re-enable user's microphone and speech recognition
          if (streamRef.current && isRecording) {
          streamRef.current.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
            setIsMicActive(true);
            
            // Ensure speech recognition is restarted
            if (speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.stop(); // Stop first to ensure clean state
            setTimeout(() => {
                  if (isRecording && speechRecognitionRef.current) {
                    speechRecognitionRef.current.start();
                    setIsListening(true);
                  }
                }, 100); // Reduced delay for more immediate response
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
                // Try to reinitialize speech recognition
                initializeSpeechRecognition();
              }
            } else {
              // If speech recognition reference is lost, reinitialize it
              initializeSpeechRecognition();
            }
          }
        },
        // onError
        (error) => {
          console.error("Speech synthesis error:", error);
        setInterviewerSpeaking(false);
          setInterviewerMood('neutral');
          
          // Re-enable user's microphone on error
          if (streamRef.current && isRecording) {
          streamRef.current.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
            setIsMicActive(true);
            
        // Restart speech recognition on error
            if (speechRecognitionRef.current) {
          try {
                speechRecognitionRef.current.start();
                setIsListening(true);
          } catch (error) {
                console.error("Error restarting speech recognition after error:", error);
                initializeSpeechRecognition();
              }
            }
          }
        }
      );
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setInterviewerSpeaking(false);
      setInterviewerMood('neutral');
      
      // Re-enable user's microphone on error
      if (streamRef.current && isRecording) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
        setIsMicActive(true);
        initializeSpeechRecognition();
      }
    }
  };
  
  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      // First set up camera and mic
      const cameraReady = await setupCamera();
      if (!cameraReady) return;
      
      // Set up the interviewer avatar
      setupInterviewerAvatar();
      
      // Start with an initial welcome message
      const welcomeMessage = `Hi, I'm Ruby! I'll be conducting your interview for the ${jobRole} position today. I'm excited to learn more about your experience and skills. I'll ask you questions, and you can respond naturally just like in a real interview. Ready to begin?`;
      setMessages([{
        id: 'welcome-message',
        content: welcomeMessage,
        sender: 'ai',
        timestamp: Date.now()
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
      
      // Connect to WebSocket server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
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
              
            if (data.type === 'question' || data.type === 'feedback' || data.type === 'follow_up') {
              // Show typing indicator
              setIsTyping(true);
              
              // Add a natural delay before showing the message
              setTimeout(() => {
                setIsTyping(false);
                
                const message: Message = {
                  id: Date.now().toString(),
                  content: data.content,
                  sender: 'ai',
                  timestamp: Date.now()
                };
                
                setMessages(prev => [...prev, message]);
                
                // Speak with appropriate mood
                speakText(data.content, data.mood || 'speaking');
              }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
              }
              else if (data.type === 'error') {
                toast({
                  title: "Interview Error",
                description: data.message || "An error occurred during the interview.",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            // handleCommunicationError(); // This function is not defined in the provided context
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
    };
      
    initializeInterview();
    
    // Cleanup
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (socketRef.current) {
          socketRef.current.close();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      if (speechServiceRef.current) {
        speechServiceRef.current.stop();
      }
    };
  }, [jobRole, totalTime, user]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // For auto-submission after pause in speech
  const autoSubmitTimeoutRef = useRef<number | null>(null);
  
  // Submit user's answer to the current question
  const submitAnswer = (transcript: string = '') => {
    const finalAnswer = transcript || userTranscript.trim();
    if (!finalAnswer) return;
    
    // Add user's message to the chat immediately
    setMessages(prev => [
      ...prev, 
      { 
        id: Date.now().toString(),
        content: finalAnswer, 
        sender: 'user', 
        timestamp: Date.now() 
      }
    ]);
    
    // Send answer to the server
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'answer',
        content: finalAnswer,
      }));
    }
    
    // Clear the transcript
    setUserTranscript('');
    setCurrentAnswer('');
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
    if (interviewerSpeaking) {
      // Don't allow enabling mic while AI is speaking
      toast({
        title: "Cannot Enable Microphone",
        description: "Please wait for the AI interviewer to finish speaking.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      // Turn off microphone
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = false);
        setIsRecording(false);
        setIsMicActive(false);
      }
    } else {
      // Turn on microphone
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = true);
        setIsRecording(true);
        setIsMicActive(true);
        initializeSpeechRecognition();
      }
    }
  };
  
  // End the interview
  const endInterview = async () => {
    try {
      setIsFinished(true);
      
      // Stop all media streams
      if (userVideoRef.current && userVideoRef.current.srcObject) {
        const stream = userVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Stop speech recognition
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      
      // Stop speech synthesis
      speechServiceRef.current?.stop();
      
      // Create conversation transcript
      const transcript = messages.map(message => 
        `${message.sender === 'ai' ? 'Interviewer' : 'User'}: ${message.content}`
      ).join('\n\n');
      
      // Create conversation pairs for analysis
      const conversationPairs: ConversationPair[] = [];
      
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].sender === 'ai' && messages[i+1]?.sender === 'user') {
          conversationPairs.push({
            question: messages[i].content,
            answer: messages[i+1].content
          });
        }
      }
      
      // Add emotion analysis data
      const emotionSummary = emotions ? {
        neutral: emotions.neutral,
        happy: emotions.happy,
        sad: emotions.sad,
        angry: emotions.angry,
        fearful: emotions.fearful,
        surprised: emotions.surprised,
        disgusted: emotions.disgusted
      } : null;
      
      // Get top emotions from history
      const topEmotions = getTopEmotions(emotionHistory);
      
      // If we have conversation pairs, analyze them
      if (conversationPairs.length > 0) {
        const analysisData = {
          jobRole,
          transcript,
          conversationPairs,
          emotionData: emotionSummary,
          emotionHistory: emotionHistory,
          topEmotions: topEmotions
        };
        
        try {
          // If onComplete is provided, pass the entire analysis data
          if (onComplete) {
            const result = onComplete({
              transcript,
              analysis: {
                // Provide default values for immediate feedback
                overallScore: calculateOverallScore(conversationPairs),
                overallFeedback: generateOverallFeedback(conversationPairs),
                questionFeedback: conversationPairs.map(pair => ({
              question: pair.question,
              answer: pair.answer,
              feedback: generateDefaultFeedback(pair.question, pair.answer)
                })),
                emotionAnalysis: emotionSummary,
                emotionHistory: emotionHistory,
                topEmotions: topEmotions
              }
            });
            
            // Save emotion data to the server if we have an interview ID
            if (result && 'interviewId' in result) {
              await saveEmotionData(result.interviewId, emotionHistory);
            }
          }
          
          // For detailed AI analysis, we might want to send to a server
          // const analysis = await analyzeMockInterview(analysisData);
          // setFeedback(analysis.overall);
          
        } catch (analysisError) {
          console.error('Error analyzing interview:', analysisError);
          toast({
            variant: 'destructive',
            title: 'Error analyzing interview',
            description: 'There was a problem analyzing your interview. However, your interview has been recorded and will be analyzed shortly.',
          });
        }
      } else {
      toast({
          variant: 'destructive',
          title: 'Error analyzing interview',
          description: 'The interview was too short to provide meaningful feedback. Please try again and answer more questions.',
        });
      }
      
      // Mark interview as finished
      setIsFinished(true);
      
    } catch (error) {
      console.error('Error ending interview:', error);
      
      // Handle error
      toast({
        variant: 'destructive',
        title: 'Error ending interview',
        description: 'There was a problem ending your interview. Please try again.',
      });
    }
  };
  
  // Helper function to calculate overall score
  const calculateOverallScore = (conversationPairs: ConversationPair[]): number => {
    // Implement your logic to calculate overall score based on conversation pairs
    return 7; // Placeholder, actual implementation needed
  };
  
  // Helper function to generate overall feedback
  const generateOverallFeedback = (conversationPairs: ConversationPair[]): string => {
    // Implement your logic to generate overall feedback based on conversation pairs
    return "Your interview demonstrated good communication skills. The system encountered an issue with the detailed analysis, but your responses have been saved.";
  };
  
  // Helper function to generate meaningful default feedback
  const generateDefaultFeedback = (question: string, answer: string): string => {
    const answerLength = answer.split(' ').length;
    const hasSpecificExamples = answer.toLowerCase().includes('example') || 
                               answer.toLowerCase().includes('instance') || 
                               answer.toLowerCase().includes('specifically');
    const hasNumbers = /\d+/.test(answer);
    
    let feedback = '';
    
    if (answerLength < 20) {
      feedback = "Your response could benefit from more detail. Consider expanding your answer with specific examples or experiences.";
    } else if (answerLength > 150) {
      feedback = "Your response is comprehensive but could be more concise. Focus on the most relevant points while maintaining clarity.";
    } else {
      feedback = "Your response is well-structured and appropriately detailed.";
    }
    
    if (!hasSpecificExamples) {
      feedback += " Including specific examples would strengthen your answer.";
    }
    
    if (!hasNumbers && (
      question.toLowerCase().includes('how many') || 
      question.toLowerCase().includes('what percentage') ||
      question.toLowerCase().includes('impact') ||
      question.toLowerCase().includes('result')
    )) {
      feedback += " Consider including metrics or numerical results to quantify your achievements.";
    }
    
    return feedback;
  };
  
  // Add the style tag in the component
  useEffect(() => {
    // Add scrollbar styles
    const styleTag = document.createElement('style');
    styleTag.textContent = scrollbarStyles;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
  
  // Move videoStyles inside component to access isMirrored state
  const videoStyles = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transform: isMirrored ? 'scaleX(-1)' : 'none',
    borderRadius: '1.5rem',
    backgroundColor: '#000'
  };
  
  // Update the scroll to bottom effect to be more robust
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };

    // Add a small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, userTranscript]); // Also trigger on userTranscript changes
  
  // Add the handler for emotion data
  const handleEmotionDetected = (emotionData: EmotionData) => {
    setEmotions(emotionData);
    
    // Optionally use emotion data to influence the interview flow
    // For example, if the user appears very nervous, you could
    // make the next question easier or provide reassurance
    
    // We could also send this data to the server for later analysis
    // alongside the interview results
  };
  
  // Add function to save emotion data to the server
  const saveEmotionData = async (interviewId: string, emotionData: any[]) => {
    try {
      const response = await fetch(`/api/mock-interviews/${interviewId}/emotions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emotionData }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save emotion data');
      }
      
      const result = await response.json();
      console.log('Emotion data saved:', result);
      return result;
    } catch (error) {
      console.error('Error saving emotion data:', error);
      toast({
        variant: 'destructive',
        title: 'Error saving emotion data',
        description: 'There was a problem saving your emotion data.',
      });
      return null;
    }
  };
  
  // Render appropriate content based on interview state
  const renderContent = () => {
    if (isFinished) {
      return (
        <div style={feedbackContainerStyles} className="custom-scrollbar">
          <div style={feedbackSectionStyles}>
            <div style={feedbackCardStyles}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                Interview Feedback - {jobRole} Position
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>
              Duration: {formatTime(elapsed)}
            </p>
          </div>
          
          {isAnalyzing ? (
              <div style={{
                ...feedbackCardStyles,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '3rem'
              }}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p style={{ color: '#9ca3af' }}>Analyzing your interview responses...</p>
            </div>
          ) : analysis ? (
              <>
                <div style={feedbackCardStyles}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Overall Performance
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold',
                      color: '#3b82f6'
                    }}>
                      {analysis.overallScore}/10
                    </div>
                    <div style={{ color: '#9ca3af', flex: 1 }}>
                      {analysis.overallFeedback}
                    </div>
                </div>
                <Progress value={analysis.overallScore * 10} className="h-2" />
              </div>
              
                <div style={feedbackCardStyles}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Key Strengths
                  </h3>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.strengths.map((strength: string, i: number) => (
                      <li key={i} style={{ 
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#22c55e' }}>•</span>
                        {strength}
                      </li>
                  ))}
                </ul>
              </div>
              
                <div style={feedbackCardStyles}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Areas for Improvement
                  </h3>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.improvementAreas.map((area: string, i: number) => (
                      <li key={i} style={{ 
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#f59e0b' }}>•</span>
                        {area}
                      </li>
                  ))}
                </ul>
              </div>
              
                <div style={feedbackCardStyles}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Detailed Response Analysis
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {analysis.questionFeedback.map((feedback: any, i: number) => (
                      <div key={i} style={{
                        padding: '1.5rem',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '0.75rem',
                        border: '1px solid #404040'
                      }}>
                        <div style={{ 
                          fontWeight: 600,
                          color: '#e5e7eb',
                          marginBottom: '1rem',
                          fontSize: '1.1rem'
                        }}>
                          Question {i + 1}:
                    </div>
                        <div style={{ 
                          color: '#9ca3af',
                          marginBottom: '1rem',
                          paddingLeft: '1rem',
                          borderLeft: '2px solid #3b82f6'
                        }}>
                          {feedback.question}
                </div>
                        
                        <div style={{ 
                          fontWeight: 600,
                          color: '#e5e7eb',
                          marginBottom: '0.5rem',
                          marginTop: '1.5rem'
                        }}>
                          Your Response:
              </div>
                        <div style={{ 
                          color: '#9ca3af',
                          marginBottom: '1rem',
                          padding: '1rem',
                          backgroundColor: '#2d2d2d',
                          borderRadius: '0.5rem'
                        }}>
                          {feedback.answer}
            </div>
                        
                        <div style={{ 
                          fontWeight: 600,
                          color: '#e5e7eb',
                          marginBottom: '0.5rem',
                          marginTop: '1.5rem'
                        }}>
                          Feedback:
            </div>
                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                          color: '#9ca3af',
                          padding: '1rem',
                          backgroundColor: '#2d2d2d',
                          borderRadius: '0.5rem',
                          borderLeft: '3px solid #22c55e'
                        }}>
                          <div style={{ flex: 1 }}>
                            {feedback.feedback}
            </div>
              </div>
          </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      );
    }
    
    return (
      <div ref={containerRef} style={containerStyles}>
        <div style={mainContentStyles}>
          <div style={videoContainerStyles}>
            <div style={videoGridStyles}>
              {/* User Video - Full width */}
              <div style={videoWrapperStyles}>
            <video 
              ref={userVideoRef}
              autoPlay 
              muted 
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: isMirrored ? 'scaleX(-1)' : 'none',
                    borderRadius: '1.5rem'
                  }}
                />
                <FacialExpressionAnalyzer 
                  onEmotionDetected={handleEmotionDetected}
                  isActive={isCameraOn && !isFinished} 
                />
                
                {/* PERMANENT FACE ANALYSIS PANEL - DIRECT INSIDE VIDEO WRAPPER */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  zIndex: 9999,
                  width: '200px',
                  backgroundColor: '#000000',
                  padding: '16px',
                  borderRadius: '8px',
                  color: 'white',
                  pointerEvents: 'none',
                }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Face Analysis</h3>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Gender: Male</span>
                    <span style={{ fontSize: '12px', marginLeft: '8px', color: '#3b82f6' }}>Age: 35-51</span>
                  </div>
                  
                  {/* Attention */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white">Attention</span>
                      <span className="text-xs font-medium text-white">99%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ width: '99%', backgroundColor: '#22c55e' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Positivity */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white">Positivity</span>
                      <span className="text-xs font-medium text-white">43%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ width: '43%', backgroundColor: '#22c55e' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '16px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'white' }}>Arousal</span>
                  </div>
                  
                  {/* Confidence */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white">Confidence</span>
                      <span className="text-xs font-medium text-white">5%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ width: '5%', backgroundColor: '#eab308' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Happy */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white">Happy</span>
                      <span className="text-xs font-medium text-white">0%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ width: '0%', backgroundColor: '#ef4444' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Uncomfortable */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-white">Uncomfortable</span>
                      <span className="text-xs font-medium text-white">11%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ width: '11%', backgroundColor: '#8b5cf6' }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  ...voiceActivityStyles
                }}>
                  <span>You</span>
                  {isRecording && !interviewerSpeaking && (
                    <FiVolume2 
                      size={16} 
                      className="animate-pulse" 
                      style={{ color: '#22c55e' }}
                    />
                  )}
              </div>

                {/* AI Avatar Overlay */}
                <div style={{
                  ...aiAvatarStyles,
                  background: 'linear-gradient(180deg, rgba(45, 45, 45, 0.9) 0%, rgba(26, 26, 26, 0.9) 100%)'
                }}>
                  <img
                    src={interviewerExpressions[interviewerMood]}
                    alt="AI Interviewer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '1rem'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    left: '0.5rem',
                    ...voiceActivityStyles,
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <span>Ruby</span>
                    {interviewerSpeaking && (
                      <FiVolume2 
                        size={14} 
                        className="animate-pulse" 
                        style={{ color: '#22c55e' }}
                      />
                    )}
                  </div>
                  </div>
                </div>
          </div>
        </div>
        
            {/* Control Bar */}
            <div style={controlBarStyles}>
              <button
                onClick={toggleMicrophone}
                style={{
                  ...controlButtonStyles,
                  backgroundColor: (!isRecording || !isMicActive || interviewerSpeaking) ? '#dc2626' : '#404040',
                  cursor: interviewerSpeaking ? 'not-allowed' : 'pointer'
                }}
                title={
                  interviewerSpeaking 
                    ? 'Microphone automatically muted while AI is speaking' 
                    : isRecording 
                      ? 'Mute' 
                      : 'Unmute'
                }
                disabled={interviewerSpeaking}
              >
                {isMicActive && isRecording && !interviewerSpeaking ? <FiMic size={20} /> : <FiMicOff size={20} />}
              </button>
              <button
                onClick={toggleCamera}
                style={{
                  ...controlButtonStyles,
                  backgroundColor: isCameraOn ? '#404040' : '#dc2626'
                }}
                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
              </button>
              <button
                onClick={endInterview}
                style={{
                  ...controlButtonStyles,
                  backgroundColor: '#dc2626'
                }}
                title="End interview"
              >
                <FiPhoneOff size={20} />
              </button>
              </div>
        </div>
        
        {/* Right-side Transcript Panel */}
        <div style={transcriptContainerStyles}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #404040',
            color: 'white',
            fontWeight: 500
          }}>
            Live Transcript
            </div>
          <div 
            style={{
              ...messagesContainerStyles,
              padding: '1rem',
              backgroundColor: '#2d2d2d'
            }}
            className="custom-scrollbar"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxWidth: '90%',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: message.sender === 'user' ? '#3b82f6' : '#4b5563',
                    color: 'white',
                    wordBreak: 'break-word'
                  }}
                >
                  {message.content}
            </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
            ))}
            {/* Add a dummy div for scroll reference */}
            <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />
        </div>
        </div>
      </div>
    );
  };
  
  return (
    <div ref={containerRef} style={containerStyles}>
        {renderContent()}
      <style>
        {`
          @media (max-width: 768px) {
            .video-grid {
              grid-template-columns: 1fr;
            }
            .transcript-panel {
              width: 280px;
            }
          }
          @media (max-width: 480px) {
            .transcript-panel {
              width: 240px;
            }
          }
        `}
      </style>
            </div>
  );
}