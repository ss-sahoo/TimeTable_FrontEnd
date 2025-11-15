import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock, Shield, Eye } from 'lucide-react';

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
  onClose
}) => {
  const [countdown, setCountdown] = useState(10);
  const [canAcknowledge, setCanAcknowledge] = useState(false);

  useEffect(() => {
    if (isOpen && violation) {
      setCountdown(10);
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

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'tab_switch':
        return <Eye className="w-6 h-6" />;
      case 'multiple_faces':
        return <AlertTriangle className="w-6 h-6" />;
      case 'no_face':
        return <AlertTriangle className="w-6 h-6" />;
      case 'looking_away':
        return <Eye className="w-6 h-6" />;
      case 'mobile_detected':
        return <AlertTriangle className="w-6 h-6" />;
      case 'copy_paste':
        return <AlertTriangle className="w-6 h-6" />;
      case 'fullscreen_exit':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getViolationTitle = (type: string) => {
    switch (type) {
      case 'tab_switch':
        return 'Tab Switch Detected';
      case 'window_blur':
        return 'Window Lost Focus';
      case 'multiple_faces':
        return 'Multiple People Detected';
      case 'no_face':
        return 'No Face Detected';
      case 'looking_away':
        return 'Looking Away Detected';
      case 'mobile_detected':
        return 'Mobile Device Detected';
      case 'copy_paste':
        return 'Copy/Paste Attempt';
      case 'fullscreen_exit':
        return 'Exited Fullscreen Mode';
      case 'right_click':
        return 'Right-Click Attempt';
      case 'keyboard_shortcut':
        return 'Blocked Keyboard Shortcut';
      default:
        return 'Security Violation';
    }
  };

  const getViolationSeverity = (type: string) => {
    switch (type) {
      case 'multiple_faces':
      case 'mobile_detected':
        return 'high';
      case 'tab_switch':
      case 'looking_away':
      case 'no_face':
        return 'medium';
      case 'copy_paste':
      case 'right_click':
      case 'keyboard_shortcut':
        return 'low';
      default:
        return 'medium';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getViolationGuidance = (type: string) => {
    switch (type) {
      case 'tab_switch':
        return 'Please return to the exam tab immediately. Do not switch tabs during the exam.';
      case 'window_blur':
        return 'Please return focus to the exam window. Keep the exam window active at all times.';
      case 'multiple_faces':
        return 'Only one person should be visible in the camera. Please ensure you are alone in the room.';
      case 'no_face':
        return 'Please position yourself so your face is clearly visible in the camera.';
      case 'looking_away':
        return 'Please keep your attention on the exam screen. Avoid looking away from the monitor.';
      case 'mobile_detected':
        return 'Please remove any mobile devices from the exam area. Mobile phones are not allowed.';
      case 'copy_paste':
        return 'Copy and paste functions are disabled during the exam. Please type your answers directly.';
      case 'fullscreen_exit':
        return 'Please return to fullscreen mode. The exam must be taken in fullscreen.';
      case 'right_click':
        return 'Right-click is disabled during the exam. Please use the provided interface.';
      case 'keyboard_shortcut':
        return 'This keyboard shortcut is not allowed during the exam. Please use the provided controls.';
      default:
        return 'Please follow the exam guidelines to avoid further violations.';
    }
  };

  if (!isOpen || !violation) {
    return null;
  }

  const severity = getViolationSeverity(violation.type);
  const severityColor = getSeverityColor(severity);
  const remainingViolations = maxViolations - violationCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 ${severityColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getViolationIcon(violation.type)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getViolationTitle(violation.type)}
                </h3>
                <p className="text-sm text-gray-600">
                  Violation #{violationCount} of {maxViolations}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Violation Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Violation Details</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{violation.message}</p>
            <div className="text-xs text-gray-500">
              Confidence: {Math.round(violation.confidence * 100)}% • 
              Time: {violation.timestamp.toLocaleTimeString()}
            </div>
          </div>

          {/* Guidance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">What to do:</span>
            </div>
            <p className="text-sm text-blue-800">
              {getViolationGuidance(violation.type)}
            </p>
          </div>

          {/* Violation Count Warning */}
          {remainingViolations <= 2 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Warning</span>
              </div>
              <p className="text-sm text-red-800">
                {remainingViolations === 0 
                  ? 'You have reached the maximum number of violations. Your exam may be disqualified.'
                  : `You have ${remainingViolations} violation${remainingViolations === 1 ? '' : 's'} remaining before potential disqualification.`
                }
              </p>
            </div>
          )}

          {/* Countdown */}
          {!canAcknowledge && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Please read this warning carefully. You can acknowledge in {countdown} seconds.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onAcknowledge}
            disabled={!canAcknowledge}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
              canAcknowledge
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canAcknowledge ? 'I Understand' : `Acknowledge in ${countdown}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationWarning;

