import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ViolationToastProps {
  violation: {
    type: string;
    timestamp: Date;
    severity?: string;
    metadata?: {
      action?: string;
      [key: string]: unknown;
    };
  } | null;
  onClose: () => void;
  remainingViolations?: number;
}

const ViolationToast: React.FC<ViolationToastProps> = ({ violation, onClose, remainingViolations }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (violation) {
      setIsVisible(true);

      // Auto-hide after 6 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 400);
      }, 6000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [violation, onClose]);

  if (!violation) return null;

  const getViolationDetails = (type: string) => {
    switch (type) {
      case 'copy_paste':
        return { title: 'Restricted Action', message: 'Copy/Paste is disabled during the exam.', icon: <ShieldAlert className="w-5 h-5" /> };
      case 'right_click':
        return { title: 'Restricted Action', message: 'Right-click menu is locked for security.', icon: <ShieldAlert className="w-5 h-5" /> };
      case 'tab_switch':
        return { title: 'Focus Warning', message: 'Switching tabs is strictly prohibited.', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'window_blur':
        return { title: 'Focus Lost', message: 'Please keep the exam window active.', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'fullscreen_exit':
        return { title: 'Format Warning', message: 'Exam must be taken in Fullscreen mode.', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'multiple_faces':
        return { title: 'Proctoring Alert', message: 'Multiple people detected in frame.', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'no_face':
        return { title: 'Proctoring Alert', message: 'Face not detected. Please stay in view.', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'mobile_detected':
        return { title: 'Device Alert', message: 'Mobile device detected in frame.', icon: <ShieldAlert className="w-5 h-5" /> };
      case 'gaze_left':
      case 'gaze_right':
      case 'gaze_up':
      case 'gaze_down':
      case 'head_turned_left':
      case 'head_turned_right':
      case 'head_looking_up':
      case 'head_looking_down':
        return { title: 'Attention Warning', message: 'Please maintain focus on the exam screen.', icon: <AlertTriangle className="w-5 h-5" /> };
      case 'eyes_closed':
        return { title: 'Attention Warning', message: 'Eyes appear to be closed or not visible.', icon: <AlertTriangle className="w-5 h-5" /> };
      default:
        return { title: 'Security Alert', message: 'A security violation has been recorded.', icon: <AlertTriangle className="w-5 h-5" /> };
    }
  };

  const details = getViolationDetails(violation.type);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          className="fixed top-24 right-6 z-[100] w-full max-w-sm"
        >
          <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-red-200 dark:border-red-900/50 rounded-2xl shadow-2xl p-4 flex gap-4 group">
            {/* Severity bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />

            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
              {details.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {details.title}
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                </h4>
                <button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                {details.message}
              </p>

              {remainingViolations !== undefined && (
                <div className="mt-2 py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50">
                  <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {remainingViolations <= 0
                      ? "LIMIT EXCEEDED! SUBMITTING EXAM..."
                      : remainingViolations === 1
                        ? "LAST WARNING! 1 violation left before auto-submit."
                        : `${remainingViolations} violations left before auto-submit.`
                    }
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Incident Logged
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {violation.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViolationToast;
