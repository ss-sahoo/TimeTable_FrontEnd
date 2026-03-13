/**
 * Device Manager Usage Example
 * 
 * This file demonstrates how to integrate the DeviceManager and DeviceConflictModal
 * into a login flow or authentication component.
 * 
 * **Feature: exam-security-enhancements**
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
 */

import { useState, useEffect } from 'react';
import { deviceManager, ConflictInfo } from '../services/DeviceManager';
import DeviceConflictModal from '../components/DeviceConflictModal';
import { toast } from "react-toastify";

/**
 * Example component showing how to use DeviceManager in a login flow
 */
export default function DeviceManagerExample() {
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  useEffect(() => {
    // Get device info on component mount
    const info = deviceManager.getDeviceInfo();
    setDeviceInfo(JSON.stringify(info, null, 2));
  }, []);

  /**
   * Example: Check for device conflicts after successful authentication
   * This should be called after the user successfully logs in
   */
  const handleCheckDeviceConflict = async () => {
    try {
      console.log('Checking for device conflicts...');
      const response = await deviceManager.checkForConflict();

      if (response.has_conflict && response.conflict_info) {
        console.log('Device conflict detected:', response.conflict_info);
        setConflictInfo(response.conflict_info);
        setShowConflictModal(true);
      } else {
        console.log('No device conflict. User can proceed.');
        toast.error('No device conflict detected. Login successful!');
      }
    } catch (error) {
      console.error('Error checking device conflict:', error);
      toast.error('Error checking device conflict. Please try again.');
    }
  };

  /**
   * Handle device switch - logout previous device and create new session
   * 
   * **Feature: exam-security-enhancements, Property 4: Device session swap atomicity**
   * **Validates: Requirements 1.4**
   */
  const handleSwitchDevice = async () => {
    if (!conflictInfo) return;

    try {
      console.log('Switching device...');
      const response = await deviceManager.logoutPreviousDevice(
        conflictInfo.device_fingerprint
      );

      console.log('Device switched successfully:', response);
      setShowConflictModal(false);
      setConflictInfo(null);
      toast.error('Device switched successfully! You can now proceed.');
    } catch (error) {
      console.error('Error switching device:', error);
      throw error; // Let the modal handle the error display
    }
  };

  /**
   * Handle cancel - reject login and maintain existing session
   * 
   * **Feature: exam-security-enhancements, Property 5: Session preservation on cancel**
   * **Validates: Requirements 1.5**
   */
  const handleCancelSwitch = () => {
    console.log('Device switch cancelled. Existing session preserved.');
    setShowConflictModal(false);
    setConflictInfo(null);
    toast.error('Login cancelled. Your existing session on the other device is still active.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Device Manager Example</h1>

      <div className="space-y-6">
        {/* Device Info Display */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Device Information</h2>
          <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto">
            {deviceInfo}
          </pre>
        </div>

        {/* Test Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Device Conflict Detection</h2>
          <p className="text-slate-600 mb-4">
            Click the button below to simulate checking for device conflicts after login.
            This would normally be called automatically after successful authentication.
          </p>
          <button
            onClick={handleCheckDeviceConflict}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Check for Device Conflicts
          </button>
        </div>

        {/* Integration Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Integration Instructions</h2>
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Step 1:</strong> After successful login (when you receive the auth token),
              call <code className="bg-blue-100 px-2 py-1 rounded">deviceManager.checkForConflict()</code>
            </p>
            <p>
              <strong>Step 2:</strong> If <code className="bg-blue-100 px-2 py-1 rounded">has_conflict</code> is true,
              show the DeviceConflictModal with the conflict info
            </p>
            <p>
              <strong>Step 3:</strong> Handle the user's choice:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                If they choose "Switch Device", call{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">deviceManager.logoutPreviousDevice()</code>
              </li>
              <li>
                If they choose "Cancel", reject the login and preserve the existing session
              </li>
            </ul>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Code Example</h2>
          <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto">
{`// In your login component:
import { deviceManager } from '@/react-app/services/DeviceManager';
import DeviceConflictModal from '@/react-app/components/DeviceConflictModal';

const handleLogin = async (credentials) => {
  try {
    // 1. Authenticate user
    const authResponse = await loginAPI(credentials);
    localStorage.setItem('access_token', authResponse.token);
    
    // 2. Check for device conflicts
    const deviceCheck = await deviceManager.checkForConflict();
    
    if (deviceCheck.has_conflict) {
      // 3. Show conflict modal
      setConflictInfo(deviceCheck.conflict_info);
      setShowConflictModal(true);
    } else {
      // 4. No conflict - proceed to dashboard
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const handleSwitchDevice = async () => {
  await deviceManager.logoutPreviousDevice(
    conflictInfo.device_fingerprint
  );
  setShowConflictModal(false);
  navigate('/dashboard');
};

const handleCancelSwitch = () => {
  setShowConflictModal(false);
  // Logout current attempt
  localStorage.removeItem('access_token');
};

return (
  <>
    {/* Your login form */}
    <DeviceConflictModal
      isOpen={showConflictModal}
      conflictInfo={conflictInfo}
      onSwitchDevice={handleSwitchDevice}
      onCancel={handleCancelSwitch}
    />
  </>
);`}
          </pre>
        </div>
      </div>

      {/* Device Conflict Modal */}
      <DeviceConflictModal
        isOpen={showConflictModal}
        conflictInfo={conflictInfo}
        onSwitchDevice={handleSwitchDevice}
        onCancel={handleCancelSwitch}
      />
    </div>
  );
}
