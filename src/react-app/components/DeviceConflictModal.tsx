/**
 * Device Conflict Modal Component
 * 
 * Displays device conflict information and allows users to switch devices or cancel.
 * 
 * **Feature: exam-security-enhancements**
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
 */

import { useState } from 'react';
import { X, Smartphone, Monitor, Tablet, AlertTriangle } from 'lucide-react';
import { ConflictInfo } from '../services/DeviceManager';

interface DeviceConflictModalProps {
  isOpen: boolean;
  conflictInfo: ConflictInfo | null;
  onSwitchDevice: () => Promise<void>;
  onCancel: () => void;
}

export default function DeviceConflictModal({
  isOpen,
  conflictInfo,
  onSwitchDevice,
  onCancel,
}: DeviceConflictModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !conflictInfo) return null;

  const handleSwitchDevice = async () => {
    setLoading(true);
    setError(null);

    try {
      await onSwitchDevice();
    } catch (err) {
      setError('Failed to switch device. Please try again.');
      console.error('Error switching device:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  // Get device icon based on type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-8 h-8 text-blue-500" />;
      case 'tablet':
        return <Tablet className="w-8 h-8 text-blue-500" />;
      case 'desktop':
      default:
        return <Monitor className="w-8 h-8 text-blue-500" />;
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Device Conflict Detected</h2>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-600">
            You are already logged in on another device. You can only be logged in on one device at a time.
          </p>

          {/* Current Device Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getDeviceIcon(conflictInfo.device_type)}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-slate-900">Currently Active Device</h3>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device Type:</span>
                    <span className="text-slate-900 font-medium capitalize">
                      {conflictInfo.device_type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-500">Browser:</span>
                    <span className="text-slate-900 font-medium">{conflictInfo.browser}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operating System:</span>
                    <span className="text-slate-900 font-medium">{conflictInfo.os}</span>
                  </div>

                  {conflictInfo.screen_resolution && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Screen Resolution:</span>
                      <span className="text-slate-900 font-medium">
                        {conflictInfo.screen_resolution}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Logged in:</span>
                    <span className="text-slate-900 font-medium">
                      {formatTimestamp(conflictInfo.login_timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Activity:</span>
                    <span className="text-slate-900 font-medium">
                      {formatTimestamp(conflictInfo.last_activity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Switching to this device will log out the other device immediately.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSwitchDevice}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Switching...</span>
              </>
            ) : (
              'Switch to This Device'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
