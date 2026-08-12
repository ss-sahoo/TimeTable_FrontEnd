import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Eye, EyeOff, Clock, Mouse, Keyboard, Monitor } from 'lucide-react';
import { api } from '../hooks/useApi';

interface Violation {
  id: number;
  violation_type: string;
  violation_type_display: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface ViolationsPanelProps {
  attemptId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ViolationsPanel: React.FC<ViolationsPanelProps> = ({ attemptId, isOpen, onClose }) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/exams/attempts/${attemptId}/violations/history/`);
      const allViolations = response.data.violations || [];
      // FILTER: Only show tab and window-related violations to the student
      const studentVisibleViolations = allViolations.filter((v: any) =>
        ['tab_switch', 'window_blur', 'tab_hidden', 'fullscreen_exit'].includes(v.violation_type)
      );
      setViolations(studentVisibleViolations);
    } catch (err) {
      setError('Failed to load violations');
      console.error('Error fetching violations:', err);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (isOpen) {
      fetchViolations();
    }
  }, [isOpen, attemptId, fetchViolations]);

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'window_blur':
        return <Monitor className="w-4 h-4" />;
      case 'right_click':
        return <Mouse className="w-4 h-4" />;
      case 'keyboard_shortcut':
        return <Keyboard className="w-4 h-4" />;
      case 'tab_switch':
        return <Monitor className="w-4 h-4" />;
      case 'copy_paste':
        return <Keyboard className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'window_blur':
        return 'text-yellow-600 bg-yellow-100';
      case 'right_click':
        return 'text-red-600 bg-red-100';
      case 'keyboard_shortcut':
        return 'text-red-600 bg-red-100';
      case 'tab_switch':
        return 'text-orange-600 bg-orange-100';
      case 'copy_paste':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getViolationDescription = (violation: Violation) => {
    const { violation_type, metadata } = violation;

    switch (violation_type) {
      case 'window_blur':
        return 'Window lost focus - you may have switched to another application';
      case 'right_click':
        return `Right-click detected at coordinates (${metadata.x}, ${metadata.y})`;
      case 'keyboard_shortcut':
        return `Keyboard shortcut detected: ${metadata.keyCombo || 'Unknown'}`;
      case 'tab_switch':
        return 'Tab switching detected';
      case 'copy_paste':
        return 'Copy/paste operation detected';
      default:
        return 'Security violation detected';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Security Violations</h2>
              <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
                {violations.length} violations
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <EyeOff className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading violations...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchViolations}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No violations detected. Keep up the good work!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <div
                  key={violation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getViolationColor(violation.violation_type)}`}>
                      {getViolationIcon(violation.violation_type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {violation.violation_type_display}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getViolationColor(violation.violation_type)}`}>
                          {violation.violation_type}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-2">
                        {getViolationDescription(violation)}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(violation.timestamp)}</span>
                      </div>

                      {violation.metadata && Object.keys(violation.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View technical details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(violation.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Violations are automatically detected and logged for security purposes.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationsPanel;
