import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { api } from '../hooks/useApi';
import { Camera, AlertTriangle, CheckCircle, EyeOff } from 'lucide-react';

interface ViolationData {
  type: string;
  confidence?: number;
  message?: string;
  timestamp?: Date;
}

interface WebcamMonitorProps {
  attemptId: number;
  onViolationDetected?: (violation: ViolationData) => void;
  captureInterval?: number; // in seconds
  showPreview?: boolean;
  className?: string;
}

const WebcamMonitor: React.FC<WebcamMonitorProps> = ({
  attemptId,
  onViolationDetected,
  captureInterval = 30,
  showPreview = true,
  className = ''
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isActive, setIsActive] = useState(false);
  const [lastCapture, setLastCapture] = useState<Date | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'error'>('idle');

  // Capture and analyze snapshot
  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current || !isActive) return;

    try {
      setDetectionStatus('detecting');
      
      // Capture image
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Convert to base64 for backend
      const base64Data = imageSrc.split(',')[1];

      // Send to backend for analysis
      const response = await api.post(`/exams/attempts/${attemptId}/proctoring/snapshot/`, {
        image_data: base64Data,
        timestamp: new Date().toISOString(),
        metadata: {
            user_agent: navigator.userAgent,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            window_size: `${window.innerWidth}x${window.innerHeight}`
          }
        });

      const data = response.data;
        const analysis = data.analysis;

        // Update violation count
        if (data.violation_count !== undefined) {
          setViolationCount(data.violation_count);
        }

        // Check for violations
        if (analysis && analysis.violations && analysis.violations.length > 0) {
          analysis.violations.forEach((violation: { type: string; confidence?: number; message?: string }) => {
            if (onViolationDetected) {
              onViolationDetected({
                type: violation.type,
                confidence: violation.confidence,
                message: violation.message,
                timestamp: new Date(),
                analysis: analysis
              });
            }
          });
        }

        setLastCapture(new Date());
    } catch (error) {
      console.error('Error capturing/analyzing snapshot:', error);
      setDetectionStatus('error');
    } finally {
      setDetectionStatus('idle');
    }
  }, [attemptId, isActive, onViolationDetected]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsActive(true);
    setCameraError(null);
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsActive(false);
  }, []);

  // Periodic capture
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      captureAndAnalyze();
    }, captureInterval * 1000);

    // Initial capture
    captureAndAnalyze();

    return () => clearInterval(interval);
  }, [isActive, captureInterval, captureAndAnalyze]);

  // Handle camera errors
  const handleCameraError = useCallback((error: string | DOMException) => {
    setCameraError(error.toString());
    setIsActive(false);
    setDetectionStatus('error');
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getStatusColor = () => {
    if (cameraError) return 'text-red-600 bg-red-50 border-red-200';
    if (violationCount > 0) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (isActive) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = () => {
    if (cameraError) return <AlertTriangle className="w-4 h-4" />;
    if (violationCount > 0) return <AlertTriangle className="w-4 h-4" />;
    if (isActive) return <CheckCircle className="w-4 h-4" />;
    return <Camera className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (cameraError) return 'Camera Error';
    if (violationCount > 0) return `${violationCount} Violations`;
    if (isActive) return 'Monitoring';
    return 'Inactive';
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className={`p-3 rounded-full shadow-lg border-2 ${getStatusColor()} hover:shadow-xl transition-all`}
          title="Expand webcam monitor"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Proctoring</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </div>
          
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Minimize"
          >
            <EyeOff className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Camera Preview */}
      {showPreview && (
        <div className="p-3">
          {cameraError ? (
            <div className="w-48 h-36 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-red-600">Camera Error</p>
                <p className="text-xs text-red-500 mt-1">{cameraError}</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Webcam
                ref={webcamRef}
                width={192}
                height={144}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 192,
                  height: 144,
                  facingMode: 'user'
                }}
                onUserMediaError={handleCameraError}
                className="rounded-lg border border-gray-200"
              />
              
              {detectionStatus === 'detecting' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs">Analyzing...</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Info */}
      <div className="px-3 pb-3 space-y-2">
        {lastCapture && (
          <div className="text-xs text-gray-500">
            Last capture: {formatTime(lastCapture)}
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          Capture interval: {captureInterval}s
        </div>

        {violationCount > 0 && (
          <div className="text-xs text-orange-600 font-medium">
            ⚠️ {violationCount} violation{violationCount !== 1 ? 's' : ''} detected
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <button
              onClick={startMonitoring}
              className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              Start
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="flex-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          )}
          
          <button
            onClick={captureAndAnalyze}
            disabled={!isActive || detectionStatus === 'detecting'}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Capture
          </button>
        </div>
      </div>

      {/* Warning Overlay */}
      {violationCount > 0 && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{violationCount}</span>
        </div>
      )}
    </div>
  );
};

export default WebcamMonitor;

