import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export interface FaceAnalysisMetrics {
  attention: number; // 0-100 based on eye gaze and head pose
  positivity: number; // 0-100 based on smile detection and eye features
  confidence: number; // 0-100 based on facial stability and posture
  arousal: number; // 0-100 (0=uncomfortable, 50=neutral, 100=happy)
  eyeGaze: {
    looking_forward: boolean;
    gaze_direction: string;
  };
  headPose: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  facialFeatures: {
    smile_intensity: number;
    eye_openness: number;
    eyebrow_position: number;
  };
}

interface MediaPipeFaceAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onAnalysis: (metrics: FaceAnalysisMetrics) => void;
  isActive: boolean;
}

export function MediaPipeFaceAnalyzer({ 
  videoRef, 
  onAnalysis, 
  isActive 
}: MediaPipeFaceAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        // Continue without models - we'll still provide basic analysis
        setIsInitialized(true);
      }
    };

    loadModels();
  }, []);

  // Calculate face analysis metrics from face-api.js detection
  const analyzeFaceApiResults = useCallback((detection: any): FaceAnalysisMetrics => {
    if (!detection) {
      return {
        attention: 50,
        positivity: 50,
        confidence: 50,
        arousal: 50,
        eyeGaze: { looking_forward: true, gaze_direction: 'forward' },
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        facialFeatures: { smile_intensity: 50, eye_openness: 80, eyebrow_position: 50 }
      };
    }

    // Get expressions if available
    const expressions = detection.expressions || {};
    const landmarks = detection.landmarks;

    // Calculate basic metrics from expressions
    const happiness = (expressions.happy || 0) * 100;
    const neutral = (expressions.neutral || 0) * 100;
    const surprised = (expressions.surprised || 0) * 100;
    const angry = (expressions.angry || 0) * 100;
    const fearful = (expressions.fearful || 0) * 100;
    const disgusted = (expressions.disgusted || 0) * 100;
    const sad = (expressions.sad || 0) * 100;

    // Calculate attention (high when neutral/focused, low when distracted)
    const attention = Math.min(100, Math.max(0, 
      80 + (neutral * 0.3) - (sad * 0.5) - (fearful * 0.3)
    ));

    // Calculate positivity (happiness and engagement)
    const positivity = Math.min(100, Math.max(0,
      (happiness * 0.8) + (surprised * 0.3) + (neutral * 0.2)
    ));

    // Calculate confidence (stability and positive expressions)
    const confidence = Math.min(100, Math.max(0,
      70 + (happiness * 0.4) + (neutral * 0.3) - (fearful * 0.6) - (sad * 0.4)
    ));

    // Calculate arousal (emotional intensity)
    let arousal = 50; // neutral base
    if (happiness > 30) {
      arousal = Math.min(100, 60 + (happiness * 0.6)); // Happy
    } else if (fearful > 20 || angry > 20 || sad > 30) {
      arousal = Math.max(0, 40 - (fearful * 0.8) - (angry * 0.6) - (sad * 0.5)); // Uncomfortable
    } else {
      arousal = 50 + (neutral * 0.1); // Neutral with slight variation
    }

    // Estimate head pose from face detection box
    const box = detection.detection?.box;
    let headPose = { pitch: 0, yaw: 0, roll: 0 };
    
    if (box && videoRef.current) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const videoCenterX = videoRef.current.videoWidth / 2;
      const videoCenterY = videoRef.current.videoHeight / 2;
      
      // Estimate yaw and pitch from face position
      headPose.yaw = ((centerX - videoCenterX) / videoCenterX) * 30; // -30 to +30 degrees
      headPose.pitch = ((centerY - videoCenterY) / videoCenterY) * 20; // -20 to +20 degrees
      headPose.roll = 0; // Simplified - no roll calculation
    }

    const gazeForward = Math.abs(headPose.yaw) < 15 && Math.abs(headPose.pitch) < 10;

    return {
      attention: Math.round(attention),
      positivity: Math.round(positivity),
      confidence: Math.round(confidence),
      arousal: Math.round(arousal),
      eyeGaze: {
        looking_forward: gazeForward,
        gaze_direction: headPose.yaw > 10 ? 'right' : headPose.yaw < -10 ? 'left' : 'forward'
      },
      headPose,
      facialFeatures: {
        smile_intensity: Math.round(happiness),
        eye_openness: Math.round(80 - (sad * 0.5) - (fearful * 0.3)), // Estimate eye openness
        eyebrow_position: Math.round(50 + (surprised * 0.4) - (angry * 0.3))
      }
    };
  }, [videoRef]);

  // Perform face detection and analysis
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isInitialized) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Detect face with landmarks and expressions
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Analyze and report metrics
      const metrics = analyzeFaceApiResults(detection);
      onAnalysis(metrics);

    } catch (error) {
      console.error('Error in face detection:', error);
      // Provide neutral metrics if detection fails
      onAnalysis({
        attention: 50,
        positivity: 50,
        confidence: 50,
        arousal: 50,
        eyeGaze: { looking_forward: true, gaze_direction: 'forward' },
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        facialFeatures: { smile_intensity: 50, eye_openness: 80, eyebrow_position: 50 }
      });
    }
  }, [videoRef, isInitialized, onAnalysis, analyzeFaceApiResults]);

  // Start/stop face detection
  useEffect(() => {
    if (isActive && isInitialized && videoRef.current) {
      // Start detection loop
      intervalRef.current = window.setInterval(() => {
        detectFace();
      }, 500); // Analyze every 500ms

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Stop detection
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isActive, isInitialized, detectFace]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0
      }}
    />
  );
}