import * as faceapi from 'face-api.js';

interface FaceDetectionResult {
  faceCount: number;
  faceDetected: boolean;
  eyesDetected: boolean;
  lookingAway: boolean;
  confidence: number;
  faceBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  eyePositions?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
  };
}

interface ObjectDetectionResult {
  mobileDetected: boolean;
  confidence: number;
  objects: Array<{
    class: string;
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

class FaceDetectionService {
  private modelsLoaded = false;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Load face-api.js models
      const MODEL_URL = '/models'; // You'll need to serve these models from your public folder
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      ]);

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('Face detection models loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load face detection models:', error);
      return false;
    }
  }

  async detectFaces(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult> {
    if (!this.modelsLoaded) {
      await this.initialize();
    }

    if (!this.modelsLoaded) {
      return {
        faceCount: 0,
        faceDetected: false,
        eyesDetected: false,
        lookingAway: false,
        confidence: 0
      };
    }

    try {
      // Detect faces with landmarks
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length === 0) {
        return {
          faceCount: 0,
          faceDetected: false,
          eyesDetected: false,
          lookingAway: false,
          confidence: 0
        };
      }

      const face = detections[0]; // Use the first (largest) face
      const landmarks = face.landmarks;
      
      // Get face bounding box
      const faceBox = face.detection.box;
      
      // Get eye positions
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      const leftEyeCenter = this.getCenterPoint(leftEye);
      const rightEyeCenter = this.getCenterPoint(rightEye);
      
      // Calculate if looking away (simplified heuristic)
      const lookingAway = this.isLookingAway(leftEyeCenter, rightEyeCenter, faceBox);
      
      // Check if eyes are clearly visible
      const eyesDetected = this.areEyesVisible(leftEye, rightEye);

      return {
        faceCount: detections.length,
        faceDetected: true,
        eyesDetected,
        lookingAway,
        confidence: face.detection.score,
        faceBox: {
          x: faceBox.x,
          y: faceBox.y,
          width: faceBox.width,
          height: faceBox.height
        },
        eyePositions: {
          leftEye: leftEyeCenter,
          rightEye: rightEyeCenter
        }
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        faceCount: 0,
        faceDetected: false,
        eyesDetected: false,
        lookingAway: false,
        confidence: 0
      };
    }
  }

  async detectObjects(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<ObjectDetectionResult> {
    if (!this.modelsLoaded) {
      await this.initialize();
    }

    if (!this.modelsLoaded) {
      return {
        mobileDetected: false,
        confidence: 0,
        objects: []
      };
    }

    try {
      // Use SSD MobileNet for object detection
      const detections = await faceapi.detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options());
      
      // For now, we'll use a simplified approach
      // In a real implementation, you'd use a proper object detection model
      const mobileObjects = detections.filter(() => {
        // This is a placeholder - you'd need to train a model to detect mobile phones
        // or use a pre-trained model like COCO-SSD
        return false; // Placeholder
      });

      return {
        mobileDetected: mobileObjects.length > 0,
        confidence: mobileObjects.length > 0 ? mobileObjects[0].score : 0,
        objects: mobileObjects.map(obj => ({
          class: 'mobile_phone',
          confidence: obj.score,
          bbox: {
            x: obj.box.x,
            y: obj.box.y,
            width: obj.box.width,
            height: obj.box.height
          }
        }))
      };
    } catch (error) {
      console.error('Object detection error:', error);
      return {
        mobileDetected: false,
        confidence: 0,
        objects: []
      };
    }
  }

  private getCenterPoint(points: faceapi.Point[]): { x: number; y: number } {
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }

  private isLookingAway(
    leftEye: { x: number; y: number },
    rightEye: { x: number; y: number },
    faceBox: faceapi.Box
  ): boolean {
    // Calculate the center of the face
    const faceCenterX = faceBox.x + faceBox.width / 2;
    const faceCenterY = faceBox.y + faceBox.height / 2;
    
    // Calculate the center point between the eyes
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    
    // Calculate the distance from eye center to face center
    const distanceX = Math.abs(eyeCenterX - faceCenterX);
    const distanceY = Math.abs(eyeCenterY - faceCenterY);
    
    // If eyes are significantly off-center, consider it looking away
    const thresholdX = faceBox.width * 0.3; // 30% of face width
    const thresholdY = faceBox.height * 0.2; // 20% of face height
    
    return distanceX > thresholdX || distanceY > thresholdY;
  }

  private areEyesVisible(
    leftEye: faceapi.Point[],
    rightEye: faceapi.Point[]
  ): boolean {
    // Check if both eyes have enough visible points
    const minVisiblePoints = 4; // Minimum points needed to consider an eye visible
    
    return leftEye.length >= minVisiblePoints && rightEye.length >= minVisiblePoints;
  }

  // Utility method to create image element from canvas or video
  createImageElement(source: HTMLCanvasElement | HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = source.width || source.videoWidth || 640;
    canvas.height = source.height || source.videoHeight || 480;
    
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    
    return canvas;
  }

  // Utility method to create image element from base64 data
  createImageFromBase64(base64Data: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `data:image/jpeg;base64,${base64Data}`;
    });
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();

// Export types
export type { FaceDetectionResult, ObjectDetectionResult };

