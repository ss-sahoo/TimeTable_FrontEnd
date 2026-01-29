import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle, CheckCircle, EyeOff, Maximize2, Minimize2, Settings, X } from 'lucide-react';
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
  captureInterval?: number;
  showPreview?: boolean;
  className?: string;
  autoStart?: boolean;
  onStatusChange?: (payload: CameraStatusPayload) => void;
}

const WebcamMonitor: React.FC<WebcamMonitorProps> = ({
  attemptId,
  onViolationDetected,
  captureInterval = 5,
  showPreview = true,
  className = '',
  autoStart = true,
  onStatusChange
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const getStatusDetails = () => {
    if (cameraError || cameraStatus === 'error') return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Camera Error', icon: <AlertTriangle className="w-3 h-3" /> };
    if (violationCount > 0) return { color: 'text-amber-500', bg: 'bg-amber-500/10', label: `${violationCount} Violations`, icon: <AlertTriangle className="w-3 h-3" /> };
    if (isActive) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'System Active', icon: <CheckCircle className="w-3 h-3" /> };
    return { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Idle', icon: <Camera className="w-3 h-3" /> };
  };

  const status = getStatusDetails();

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className={`p-4 rounded-full shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 group hover:scale-105 transition-all`}
          >
            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${status.bg} ${status.color}`}>
              <Camera className="w-4 h-4" />
              {violationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {violationCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pr-2 group-hover:text-blue-600 transition-colors">
              Proctoring Active
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Proctor Feed
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video Area */}
            <div className="aspect-video bg-black relative">
              {showPreview ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover"
                  />
                  {/* Scanning Overlay */}
                  {detectionStatus === 'detecting' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-blue-500/10 flex flex-col items-center justify-center backdrop-blur-[1px]"
                    >
                      <div className="w-full h-0.5 bg-blue-500/40 absolute top-0 animate-[scan_2s_infinite]" />
                      <div className="bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">
                        Analyzing
                      </div>
                    </motion.div>
                  )}
                  {cameraError && (
                    <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center p-4">
                      <p className="text-[10px] text-white text-center font-bold">{cameraError}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <EyeOff className="w-6 h-6 text-slate-700" />
                  <span className="text-[10px] text-slate-500">Preview Disabled</span>
                </div>
              )}
            </div>

            {/* Status Footer */}
            <div className="p-3 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={`flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800 ${status.bg} ${status.color}`}>
                  {status.icon}
                  <span className="text-[10px] font-bold uppercase tracking-tight truncate">{status.label}</span>
                </div>
                {lastCapture && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[9px] font-medium leading-none">Live</span>
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {!isActive ? (
                  <button
                    onClick={startMonitoring}
                    className="col-span-2 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Activate System
                  </button>
                ) : (
                  <>
                    <button
                      onClick={captureSnapshot}
                      className="py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Force Capture
                    </button>
                    <button
                      onClick={stopMonitoring}
                      className="py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
                    >
                      Standby
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Settings Overlay */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 bg-white dark:bg-slate-900 p-4"
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">Settings</span>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-900"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Interval</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{captureInterval}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Permission</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 uppercase`}>{permissionState}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
                    Visual AI and attention tracking are fully active. Data is encrypted and logged to session ID #{attemptId}.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(144px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WebcamMonitor;
