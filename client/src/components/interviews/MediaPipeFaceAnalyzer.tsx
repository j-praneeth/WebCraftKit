import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// MediaPipe Face Mesh connection constants
const FACEMESH_TESSELATION: [number, number][] = [
  [127, 34], [34, 139], [139, 127], [11, 0], [0, 37], [37, 11], [232, 231], [231, 120], [120, 232]
];

const FACEMESH_RIGHT_EYE: [number, number][] = [
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133]
];

const FACEMESH_LEFT_EYE: [number, number][] = [
  [362, 382], [382, 381], [381, 380], [380, 374], [374, 373], [373, 390], [390, 249], [249, 263]
];

const FACEMESH_LIPS: [number, number][] = [
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 405], [405, 320], [320, 307], [307, 375], [375, 321], [321, 308], [308, 324], [324, 318]
];

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
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate eye aspect ratio for blink detection
  const calculateEAR = (landmarks: any[], leftEye: number[], rightEye: number[]) => {
    const getEAR = (eye: number[]) => {
      const p1 = landmarks[eye[1]];
      const p2 = landmarks[eye[5]];
      const p3 = landmarks[eye[2]];
      const p4 = landmarks[eye[4]];
      const p5 = landmarks[eye[0]];
      const p6 = landmarks[eye[3]];

      const vertical1 = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      const vertical2 = Math.sqrt((p3.x - p4.x) ** 2 + (p3.y - p4.y) ** 2);
      const horizontal = Math.sqrt((p5.x - p6.x) ** 2 + (p5.y - p6.y) ** 2);

      return (vertical1 + vertical2) / (2 * horizontal);
    };

    const leftEAR = getEAR(leftEye);
    const rightEAR = getEAR(rightEye);
    return (leftEAR + rightEAR) / 2;
  };

  // Calculate mouth aspect ratio for smile detection
  const calculateMAR = (landmarks: any[]) => {
    // Mouth landmarks
    const upperLip = landmarks[13]; // Upper lip center
    const lowerLip = landmarks[14]; // Lower lip center
    const leftMouth = landmarks[61]; // Left corner
    const rightMouth = landmarks[291]; // Right corner

    const vertical = Math.sqrt((upperLip.x - lowerLip.x) ** 2 + (upperLip.y - lowerLip.y) ** 2);
    const horizontal = Math.sqrt((leftMouth.x - rightMouth.x) ** 2 + (leftMouth.y - rightMouth.y) ** 2);

    return vertical / horizontal;
  };

  // Calculate head pose angles
  const calculateHeadPose = (landmarks: any[]) => {
    if (!landmarks || landmarks.length < 468) return { pitch: 0, yaw: 0, roll: 0 };

    // Key landmarks for head pose estimation
    const noseTip = landmarks[1];
    const noseBase = landmarks[2];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Calculate yaw (left-right rotation)
    const eyeDistance = Math.sqrt((leftEye.x - rightEye.x) ** 2 + (leftEye.y - rightEye.y) ** 2);
    const noseTipToLeftEye = Math.sqrt((noseTip.x - leftEye.x) ** 2 + (noseTip.y - leftEye.y) ** 2);
    const noseTipToRightEye = Math.sqrt((noseTip.x - rightEye.x) ** 2 + (noseTip.y - rightEye.y) ** 2);
    
    const yaw = Math.atan2(noseTipToRightEye - noseTipToLeftEye, eyeDistance) * (180 / Math.PI);

    // Calculate pitch (up-down rotation)
    const noseLength = Math.sqrt((noseTip.x - noseBase.x) ** 2 + (noseTip.y - noseBase.y) ** 2);
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    const pitch = Math.atan2(noseTip.y - eyeCenterY, noseLength) * (180 / Math.PI);

    // Calculate roll (tilt)
    const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);
    const roll = Math.atan(eyeSlope) * (180 / Math.PI);

    return { pitch, yaw, roll };
  };

  // Analyze facial features for emotions
  const analyzeFacialMetrics = useCallback((landmarks: any[]): FaceAnalysisMetrics => {
    if (!landmarks || landmarks.length < 468) {
      return {
        attention: 0,
        positivity: 0,
        confidence: 0,
        arousal: 50, // neutral
        eyeGaze: { looking_forward: false, gaze_direction: 'unknown' },
        headPose: { pitch: 0, yaw: 0, roll: 0 },
        facialFeatures: { smile_intensity: 0, eye_openness: 0, eyebrow_position: 0 }
      };
    }

    // Eye landmarks
    const leftEye = [33, 7, 163, 144, 145, 153];
    const rightEye = [362, 382, 381, 380, 374, 373];
    
    // Calculate metrics
    const ear = calculateEAR(landmarks, leftEye, rightEye);
    const mar = calculateMAR(landmarks);
    const headPose = calculateHeadPose(landmarks);

    // Eye openness (0-1 scale, normalized to 0-100)
    const eyeOpenness = Math.min(100, Math.max(0, (ear - 0.15) * 500)); // Normal EAR is around 0.25-0.3

    // Smile intensity based on mouth aspect ratio
    const smileIntensity = Math.min(100, Math.max(0, (mar - 0.03) * 1000));

    // Eyebrow position (simplified)
    const leftBrow = landmarks[70];
    const rightBrow = landmarks[107];
    const leftEyeCenter = landmarks[33];
    const rightEyeCenter = landmarks[263];
    
    const leftBrowHeight = leftEyeCenter.y - leftBrow.y;
    const rightBrowHeight = rightEyeCenter.y - rightBrow.y;
    const avgBrowHeight = (leftBrowHeight + rightBrowHeight) / 2;
    const eyebrowPosition = Math.min(100, Math.max(0, avgBrowHeight * 500));

    // Calculate attention (based on gaze and head pose)
    const gazeForward = Math.abs(headPose.yaw) < 15 && Math.abs(headPose.pitch) < 10;
    const attention = gazeForward ? 
      Math.min(100, 80 + (eyeOpenness * 0.2)) : 
      Math.max(0, 60 - Math.abs(headPose.yaw) - Math.abs(headPose.pitch));

    // Calculate positivity (based on smile and eye features)
    const positivity = Math.min(100, (smileIntensity * 0.7) + (eyeOpenness * 0.2) + (eyebrowPosition * 0.1));

    // Calculate confidence (based on stability and posture)
    const poseStability = 100 - Math.min(100, Math.abs(headPose.roll) * 2);
    const confidence = Math.min(100, (poseStability * 0.6) + (attention * 0.4));

    // Calculate arousal (Happy = high positive, Uncomfortable = low)
    let arousal = 50; // neutral base
    if (smileIntensity > 30) {
      arousal = Math.min(100, 50 + (smileIntensity * 0.8)); // Happy
    } else if (eyeOpenness < 30 || Math.abs(headPose.yaw) > 20) {
      arousal = Math.max(0, 50 - ((50 - eyeOpenness) * 0.5) - (Math.abs(headPose.yaw) * 0.8)); // Uncomfortable
    }

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
        smile_intensity: Math.round(smileIntensity),
        eye_openness: Math.round(eyeOpenness),
        eyebrow_position: Math.round(eyebrowPosition)
      }
    };
  }, []);

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    if (!isActive || isInitialized) return;

    const initFaceMesh = async () => {
      try {
        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
          if (!canvasRef.current || !results.multiFaceLandmarks) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            
            // Analyze facial metrics
            const metrics = analyzeFacialMetrics(landmarks);
            onAnalysis(metrics);

            // Optional: Draw landmarks for debugging (disabled in production)
            // Drawing is commented out to focus on analysis metrics
          }
        });

        faceMeshRef.current = faceMesh;

        // Initialize camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && videoRef.current) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });

          cameraRef.current = camera;
          await camera.start();
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing MediaPipe Face Mesh:', error);
      }
    };

    initFaceMesh();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isActive, videoRef, onAnalysis, analyzeFacialMetrics, isInitialized]);

  // Handle active state changes
  useEffect(() => {
    if (!isActive && cameraRef.current) {
      cameraRef.current.stop();
      setIsInitialized(false);
    }
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: process.env.NODE_ENV === 'development' ? 0.3 : 0
      }}
    />
  );
}