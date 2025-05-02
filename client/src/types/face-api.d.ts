declare module 'face-api.js' {
  export const nets: {
    tinyFaceDetector: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceLandmark68Net: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceRecognitionNet: {
      loadFromUri: (uri: string) => Promise<void>;
    };
    faceExpressionNet: {
      loadFromUri: (uri: string) => Promise<void>;
    };
  };

  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  export function matchDimensions(canvas: HTMLCanvasElement, dimensions: { width: number; height: number }): void;
  export function detectAllFaces(input: HTMLVideoElement | HTMLCanvasElement, options: any): DetectionsWithFaceLandmarks;
  export function resizeResults(detections: any, dimensions: { width: number; height: number }): any;
  export const draw: {
    drawDetections(canvas: HTMLCanvasElement, detections: any): void;
    drawFaceExpressions(canvas: HTMLCanvasElement, detections: any): void;
  };

  interface DetectionsWithFaceLandmarks {
    withFaceLandmarks(): DetectionsWithFaceLandmarks;
    withFaceExpressions(): any;
  }
} 