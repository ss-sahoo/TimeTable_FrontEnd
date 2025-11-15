import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ViolationToastProps {
  violation: {
    type: string;
    timestamp: Date;
    metadata?: {
      action?: string;
      [key: string]: unknown;
    };
  } | null;
  onClose: () => void;
}

const ViolationToast: React.FC<ViolationToastProps> = ({ violation, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (violation) {
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [violation, onClose]);

  if (!violation) return null;

  const getViolationMessage = (type: string) => {
    switch (type) {
      case 'copy_paste':
        return 'Copy/Paste Detected';
      case 'right_click':
        return 'Right Click Detected';
      case 'tab_switch':
        return 'Tab Switch Detected';
      case 'window_blur':
        return 'Window Focus Lost';
      case 'fullscreen_exit':
        return 'Fullscreen Exited';
      case 'keyboard_shortcut':
        return 'Blocked Shortcut Used';
      default:
        return 'Violation Detected';
    }
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-red-600 text-white rounded-lg shadow-2xl p-4 min-w-[300px] max-w-[400px] border-2 border-red-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm mb-1">⚠️ Violation Warning</h4>
            <p className="text-sm opacity-90">{getViolationMessage(violation.type)}</p>
            {violation.metadata?.action && (
              <p className="text-xs opacity-75 mt-1">
                Action: {violation.metadata.action}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-xs opacity-75">
          This action has been logged. Multiple violations may result in disqualification.
        </div>
      </div>
    </div>
  );
};

export default ViolationToast;

