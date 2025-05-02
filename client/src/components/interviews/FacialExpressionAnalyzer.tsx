import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface EmotionData {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  surprised: number;
  disgusted: number;
}

interface FacialExpressionAnalyzerProps {
  onEmotionDetected: (emotions: EmotionData) => void;
  isActive: boolean;
}

export function FacialExpressionAnalyzer({ onEmotionDetected, isActive }: FacialExpressionAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      
      console.log('Starting to load face-api.js models from', MODEL_URL);
      
      try {
        // Load models one by one for better error handling
        console.log('Loading TinyFaceDetector model...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('TinyFaceDetector model loaded');
        
        console.log('Loading FaceLandmark68Net model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('FaceLandmark68Net model loaded');
        
        console.log('Loading FaceRecognitionNet model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log('FaceRecognitionNet model loaded');
        
        console.log('Loading FaceExpressionNet model...');
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        console.log('FaceExpressionNet model loaded');
        
        setModelsLoaded(true);
        console.log('All face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
      }
    };

    loadModels();

    // Clean up on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start webcam and facial recognition when models are loaded and component is active
  useEffect(() => {
    if (!modelsLoaded || !isActive) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640,
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStream(stream);
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    startVideo();
  }, [modelsLoaded, isActive]);

  // Set up facial expression detection once video is playing
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Only run detection if video is playing
    if (video.paused || video.ended) return;

    let animationFrameId: number;
    let lastDetectionTime = 0;
    const detectionInterval = 200; // Detect every 200ms for more responsive UI

    const detectExpressions = async () => {
      const now = Date.now();
      
      if (now - lastDetectionTime >= detectionInterval) {
        lastDetectionTime = now;
        
        if (video.readyState === 4) {
          // Get video dimensions
          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          faceapi.matchDimensions(canvas, displaySize);

          try {
            // Detect faces with expressions
            const detections = await faceapi.detectAllFaces(
              video, 
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 320, // Smaller input size for better performance
                scoreThreshold: 0.5 // Lower threshold to detect faces more easily
              })
            )
            .withFaceLandmarks()
            .withFaceExpressions();

            // Resize detections to match canvas size
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            
            // Clear canvas
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw detections (optional - comment out in production for better performance)
            // faceapi.draw.drawDetections(canvas, resizedDetections);
            // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            
            // If a face is detected, send emotion data
            if (detections.length > 0) {
              const emotions = detections[0].expressions;
              
              // Ensure we send data with all required properties
              const emotionData: EmotionData = {
                neutral: emotions.neutral || 0,
                happy: emotions.happy || 0,
                sad: emotions.sad || 0,
                angry: emotions.angry || 0,
                fearful: emotions.fearful || 0,
                surprised: emotions.surprised || 0,
                disgusted: emotions.disgusted || 0
              };
              
              // Ensure we don't have NaN values
              Object.keys(emotionData).forEach(key => {
                if (isNaN(emotionData[key as keyof EmotionData])) {
                  emotionData[key as keyof EmotionData] = 0;
                }
              });
              
              // Send emotion data to parent component
              onEmotionDetected(emotionData);
            } else {
              // If no face detected, provide default neutral values
              onEmotionDetected({
                neutral: 0.8,
                happy: 0.1,
                sad: 0.05,
                angry: 0.05,
                fearful: 0.05,
                surprised: 0.05,
                disgusted: 0.05
              });
            }
          } catch (error) {
            console.error('Error detecting expressions:', error);
          }
        }
      }

      // Continue detection loop
      animationFrameId = requestAnimationFrame(detectExpressions);
    };

    video.addEventListener('play', () => {
      animationFrameId = requestAnimationFrame(detectExpressions);
    });

    // Clean up on effect cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [modelsLoaded, isActive, onEmotionDetected]);

  return (
    <div className="facial-expression-analyzer">
      {/* Hidden video */}
      <video 
        ref={videoRef}
        className="hidden"
        autoPlay
        muted
        playsInline
        onLoadedMetadata={() => console.log('Video metadata loaded')}
      />
      {/* Canvas overlay */}
      <canvas 
        ref={canvasRef} 
        className={isActive ? "absolute top-0 left-0 z-10 opacity-0" : "hidden"}
      />
    </div>
  );
}

export default FacialExpressionAnalyzer; 