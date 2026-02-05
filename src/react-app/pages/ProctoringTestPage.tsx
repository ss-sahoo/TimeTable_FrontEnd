import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle, Eye, EyeOff, Users, Activity, Zap } from 'lucide-react';

interface ViolationLog {
  timestamp: string;
  type: string;
  severity: string;
  message: string;
  confidence: number;
}

interface AnalysisResult {
  success: boolean;
  faces_detected: number;
  violations: Array<{
    type: string;
    severity: string;
    message: string;
    confidence: number;
  }>;
  gaze_direction?: {
    horizontal: string;
    vertical: string;
  };
  head_pose?: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  processing_time?: number;
}

const ProctoringTestPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [violations, setViolations] = useState<ViolationLog[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsActive(true);

        // Start capturing and analyzing every 3 seconds
        intervalRef.current = setInterval(() => {
          captureAndAnalyze();
        }, 3000);

        console.log('✓ Camera started successfully');
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('Failed to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    console.log('✓ Camera stopped');
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    // Send to backend for analysis
    try {
      const response = await fetch('http://0.0.0.0:8000/api/exams/test-proctoring/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: imageData,
          timestamp: new Date().toISOString()
        })
      });

      const result: AnalysisResult = await response.json();

      setCurrentAnalysis(result);
      setSnapshotCount(prev => prev + 1);

      // Log violations
      if (result.violations && result.violations.length > 0) {
        const newViolations = result.violations.map(v => ({
          timestamp: new Date().toLocaleTimeString(),
          type: v.type,
          severity: v.severity,
          message: v.message,
          confidence: v.confidence
        }));

        setViolations(prev => [...newViolations, ...prev].slice(0, 50)); // Keep last 50
        setViolationCount(prev => prev + newViolations.length);

        // Console log for debugging
        console.log('🚨 VIOLATION DETECTED:', newViolations);
      } else {
        console.log('✓ Clean snapshot - No violations');
      }

    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const clearLogs = () => {
    setViolations([]);
    setViolationCount(0);
    setSnapshotCount(0);
  };

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'no_face': return '👤';
      case 'multiple_faces': return '👥';
      case 'looking_left': return '👈';
      case 'looking_right': return '👉';
      case 'looking_up': return '👆';
      case 'looking_down': return '👇';
      default: return '⚠️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MediaPipe Proctoring Test
          </h1>
          <p className="text-slate-300">Real-time AI-powered exam monitoring with 90%+ accuracy</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Camera className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Snapshots</p>
                <p className="text-2xl font-bold">{snapshotCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Violations</p>
                <p className="text-2xl font-bold">{violationCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Faces Detected</p>
                <p className="text-2xl font-bold">{currentAnalysis?.faces_detected ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Processing</p>
                <p className="text-2xl font-bold">
                  {currentAnalysis?.processing_time ? `${(currentAnalysis.processing_time * 1000).toFixed(0)}ms` : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Feed */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Live Camera Feed
              </h2>
              <div className="flex gap-2">
                {!isActive ? (
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Camera is off</p>
                    <p className="text-sm text-slate-500 mt-2">Click "Start Camera" to begin testing</p>
                  </div>
                </div>
              )}
              {isActive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              )}
            </div>

            {/* Current Analysis */}
            {currentAnalysis && (
              <div className="mt-4 space-y-3">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-semibold mb-2 text-slate-300">Current Analysis</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Status</p>
                      <p className="font-medium flex items-center gap-2">
                        {currentAnalysis.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            Success
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Failed
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Faces</p>
                      <p className="font-medium">{currentAnalysis.faces_detected}</p>
                    </div>
                    {currentAnalysis.gaze_direction && (
                      <>
                        <div>
                          <p className="text-slate-400">Gaze Horizontal</p>
                          <p className="font-medium">{currentAnalysis.gaze_direction.horizontal}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Gaze Vertical</p>
                          <p className="font-medium">{currentAnalysis.gaze_direction.vertical}</p>
                        </div>
                      </>
                    )}
                    {currentAnalysis.head_pose && (
                      <>
                        <div>
                          <p className="text-slate-400">Head Yaw</p>
                          <p className="font-medium">{currentAnalysis.head_pose.yaw.toFixed(1)}°</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Head Pitch</p>
                          <p className="font-medium">{currentAnalysis.head_pose.pitch.toFixed(1)}°</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Violation Logs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Violation Logs
              </h2>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {violations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No violations detected</p>
                  <p className="text-sm text-slate-500 mt-1">All clear! Keep monitoring...</p>
                </div>
              ) : (
                violations.map((violation, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${violation.severity === 'high'
                        ? 'bg-red-500/20 border-red-500/50'
                        : violation.severity === 'medium'
                          ? 'bg-orange-500/20 border-orange-500/50'
                          : 'bg-yellow-500/20 border-yellow-500/50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getViolationIcon(violation.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">
                            {violation.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">{violation.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-300">{violation.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${violation.severity === 'high'
                              ? 'bg-red-600'
                              : violation.severity === 'medium'
                                ? 'bg-orange-600'
                                : 'bg-yellow-600'
                            }`}>
                            {violation.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {Math.round(violation.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            Testing Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">What to Test:</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Look left/right to test gaze detection</li>
                <li>• Look up/down to test vertical gaze</li>
                <li>• Turn your head to test head pose</li>
                <li>• Move away to test face detection</li>
                <li>• Have someone join to test multiple faces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Expected Behavior:</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Snapshots captured every 3 seconds</li>
                <li>• Violations logged in real-time</li>
                <li>• Processing time ~15-50ms</li>
                <li>• 90%+ accuracy on violations</li>
                <li>• Console logs show detailed info</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ProctoringTestPage;
