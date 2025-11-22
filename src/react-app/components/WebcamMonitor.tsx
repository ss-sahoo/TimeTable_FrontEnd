import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, AlertTriangle, CheckCircle, EyeOff } from 'lucide-react';
import useProctoringCamera, { CameraStatusPayload } from '../hooks/useProctoringCamera';

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
  autoStart?: boolean;
  onStatusChange?: (payload: CameraStatusPayload) => void;
}

const WebcamMonitor: React.FC<WebcamMonitorProps> = ({
  attemptId,
  onViolationDetected,
  captureInterval = 30,
  showPreview = true,
  className = '',
  autoStart = true,
  onStatusChange
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const {
    isActive,
    cameraStatus,
    cameraError,
    detectionStatus,
    lastCapture,
    violationCount,
    startMonitoring,
    stopMonitoring,
    captureSnapshot,
    handleCameraError,
    handleUserMedia,
    permissionState
  } = useProctoringCamera({
    attemptId,
    webcamRef,
    captureIntervalMs: captureInterval * 1000,
    autoStart,
    onViolationDetected,
    onStatusChange
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const getStatusColor = () => {
    if (cameraError || cameraStatus === 'error') return 'text-red-600 bg-red-50 border-red-200';
    if (violationCount > 0) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (isActive) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = () => {
    if (cameraError || cameraStatus === 'error') return <AlertTriangle className="w-4 h-4" />;
    if (violationCount > 0) return <AlertTriangle className="w-4 h-4" />;
    if (isActive) return <CheckCircle className="w-4 h-4" />;
    return <Camera className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (cameraError || cameraStatus === 'error') return 'Camera Error';
    if (violationCount > 0) return `${violationCount} Violations`;
    if (isActive) return 'Monitoring';
    if (permissionState === 'prompt') return 'Awaiting Permission';
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
                onUserMedia={handleUserMedia}
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
            onClick={captureSnapshot}
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

