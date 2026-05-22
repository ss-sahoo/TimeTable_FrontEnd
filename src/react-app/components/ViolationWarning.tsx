import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Timer, ChevronRight, Info } from 'lucide-react';

interface ViolationWarningProps {
  isOpen: boolean;
  violation: {
    type: string;
    confidence: number;
    message: string;
    timestamp: Date;
    analysis?: Record<string, unknown>;
  } | null;
  violationCount: number;
  maxViolations: number;
  onAcknowledge: () => void;
  onClose: () => void;
}

const ViolationWarning: React.FC<ViolationWarningProps> = ({
  isOpen,
  violation,
  violationCount,
  maxViolations,
  onAcknowledge,
}) => {
  const [countdown, setCountdown] = useState(5); // Reduced to 5s for better UX, but keeping it mandatory
  const [canAcknowledge, setCanAcknowledge] = useState(false);

  useEffect(() => {
    if (isOpen && violation) {
      setCountdown(5);
      setCanAcknowledge(false);

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanAcknowledge(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, violation]);

  if (!isOpen || !violation) return null;

  const getViolationContent = (type: string) => {
    const defaultData = {
      title: 'Security Violation Detected',
      description: 'Your recent action has been flagged by the proctoring system.',
      instruction: 'Please adhere to the exam guidelines to avoid automatic disqualification.'
    };

    switch (type) {
      case 'tab_switch':
        return {
          title: 'Browser Focus Lost',
          description: 'You switched away from the examination window.',
          instruction: 'The exam must remain in active focus. Do not navigate away from this page.'
        };
      case 'multiple_faces':
        return {
          title: 'Multiple Persons Detected',
          description: 'Our AI proctor detected more than one person in your camera frame.',
          instruction: 'Ensure you are alone in a private, well-lit room.'
        };
      case 'mobile_detected':
        return {
          title: 'Unauthorized Device',
          description: 'A mobile phone or electronic device was detected in your frame.',
          instruction: 'Remove all electronic devices from your workspace immediately.'
        };
      case 'looking_away':
        return {
          title: 'Attention Divergence',
          description: 'Repeated instances of looking away from the screen were recorded.',
          instruction: 'Maintain visual focus on the exam screen at all times.'
        };
      default:
        return defaultData;
    }
  };

  const content = getViolationContent(violation.type);
  const remainingCount = maxViolations - violationCount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={canAcknowledge ? onAcknowledge : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {/* Top Banner */}
          <div className="bg-red-600 dark:bg-red-500 p-4 flex items-center gap-3 text-white">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Official Security Warning</h3>
            <div className="ml-auto flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/20">
              <span className="text-xs font-bold">Severity: High</span>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex-shrink-0 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{content.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {content.description}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide">
                  <Info className="w-4 h-4 text-blue-600" />
                  Corrective Action Required
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {content.instruction}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Incident No.</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">#{violationCount}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                  <p className={`text-lg font-bold ${remainingCount <= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                    {remainingCount} Left
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={!canAcknowledge}
                onClick={onAcknowledge}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 ${canAcknowledge
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
              >
                {canAcknowledge ? (
                  <>
                    I Acknowledge & Understand
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Timer className="w-4 h-4 animate-spin" />
                    Reviewing Information ({countdown}s)
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold mt-2">
                This verification is electronically recorded
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViolationWarning;
