# Device Manager Frontend Implementation

## Overview

This document describes the frontend implementation of the Device Manager component for the ExamFlow platform. The Device Manager handles device fingerprinting, conflict detection, and device session management to ensure students can only be logged in on one device at a time.

**Feature:** exam-security-enhancements  
**Validates:** Requirements 1.2, 1.3, 1.4, 1.5, 8.1

## Components

### 1. DeviceManager Service (`src/react-app/services/DeviceManager.ts`)

A singleton service that manages device fingerprinting and communicates with the backend API.

#### Key Methods

##### `getDeviceInfo(): DeviceInfo`
Collects comprehensive device information including:
- Device type (mobile, tablet, desktop)
- Browser name and version
- Operating system
- Screen resolution
- Timezone
- User agent string
- Device fingerprint (generated hash)

**Validates:** Requirements 1.3, 8.1

##### `generateFingerprint(deviceInfo): string`
Generates a unique device fingerprint by hashing:
- User agent
- Screen resolution
- Timezone
- Device type
- Browser
- Operating system

**Validates:** Requirements 8.1

##### `checkForConflict(): Promise<DeviceCheckResponse>`
Checks with the backend if there's an existing active session on another device.

Returns:
```typescript
{
  has_conflict: boolean;
  conflict_info: ConflictInfo | null;
  device_fingerprint: string;
}
```

**Validates:** Requirements 1.2

##### `logoutPreviousDevice(oldFingerprint): Promise<LogoutDeviceResponse>`
Atomically logs out the previous device and creates a new session for the current device.

**Validates:** Requirements 1.4

##### `getActiveSessions(): Promise<DeviceSession[]>`
Retrieves all active device sessions for the current user.

##### `invalidateSession(fingerprint): Promise<void>`
Invalidates a specific device session by fingerprint.

### 2. DeviceConflictModal Component (`src/react-app/components/DeviceConflictModal.tsx`)

A modal dialog that displays device conflict information and allows users to switch devices or cancel.

#### Props

```typescript
interface DeviceConflictModalProps {
  isOpen: boolean;
  conflictInfo: ConflictInfo | null;
  onSwitchDevice: () => Promise<void>;
  onCancel: () => void;
}
```

#### Features

- **Device Information Display**: Shows detailed information about the currently active device
  - Device type with icon (mobile, tablet, desktop)
  - Browser name and version
  - Operating system
  - Screen resolution
  - Login timestamp
  - Last activity timestamp

- **User Actions**:
  - **Switch to This Device**: Logs out the previous device and creates a new session
  - **Cancel**: Rejects the login attempt and preserves the existing session

- **Error Handling**: Displays error messages if device switching fails

- **Loading States**: Shows loading indicator during device switch operation

**Validates:** Requirements 1.2, 1.3, 1.4, 1.5

## Integration Guide

### Step 1: Import Required Components

```typescript
import { deviceManager } from '@/react-app/services/DeviceManager';
import DeviceConflictModal from '@/react-app/components/DeviceConflictModal';
```

### Step 2: Add State Management

```typescript
const [showConflictModal, setShowConflictModal] = useState(false);
const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
```

### Step 3: Check for Conflicts After Login

```typescript
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
```

### Step 4: Handle Device Switch

```typescript
const handleSwitchDevice = async () => {
  if (!conflictInfo) return;
  
  try {
    await deviceManager.logoutPreviousDevice(
      conflictInfo.device_fingerprint
    );
    setShowConflictModal(false);
    navigate('/dashboard');
  } catch (error) {
    console.error('Error switching device:', error);
    // Error is handled by the modal
  }
};
```

### Step 5: Handle Cancel

```typescript
const handleCancelSwitch = () => {
  setShowConflictModal(false);
  setConflictInfo(null);
  // Optionally logout current attempt
  localStorage.removeItem('access_token');
};
```

### Step 6: Render the Modal

```typescript
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
);
```

## API Endpoints Used

### POST `/api/auth/check-device/`
Checks for device conflicts.

**Request:**
```json
{
  "user_agent": "Mozilla/5.0...",
  "screen_resolution": "1920x1080",
  "timezone": "America/New_York",
  "device_type": "desktop",
  "browser": "Chrome 120",
  "os": "Windows 10"
}
```

**Response:**
```json
{
  "has_conflict": true,
  "conflict_info": {
    "device_type": "mobile",
    "browser": "Safari 17",
    "os": "iOS 17",
    "login_timestamp": "2024-01-20T10:30:00Z",
    "last_activity": "2024-01-20T12:45:00Z",
    "device_fingerprint": "abc123..."
  },
  "device_fingerprint": "xyz789..."
}
```

### POST `/api/auth/logout-device/`
Logs out a specific device and creates a new session.

**Request:**
```json
{
  "device_fingerprint": "abc123...",
  "new_device_info": {
    "user_agent": "Mozilla/5.0...",
    "screen_resolution": "1920x1080",
    "timezone": "America/New_York",
    "device_type": "desktop",
    "browser": "Chrome 120",
    "os": "Windows 10"
  }
}
```

**Response:**
```json
{
  "message": "Device logged out successfully",
  "new_session": {
    "device_fingerprint": "xyz789...",
    "device_type": "desktop",
    "browser": "Chrome 120",
    "os": "Windows 10",
    "created_at": "2024-01-20T13:00:00Z",
    "last_activity": "2024-01-20T13:00:00Z"
  }
}
```

### GET `/api/auth/active-sessions/`
Retrieves all active sessions for the current user.

**Response:**
```json
{
  "sessions": [
    {
      "device_fingerprint": "abc123...",
      "device_type": "desktop",
      "browser": "Chrome 120",
      "os": "Windows 10",
      "created_at": "2024-01-20T10:30:00Z",
      "last_activity": "2024-01-20T12:45:00Z"
    }
  ]
}
```

### DELETE `/api/auth/session/{fingerprint}/`
Invalidates a specific device session.

**Response:**
```json
{
  "message": "Session invalidated successfully"
}
```

## Device Detection

### Browser Detection
Detects and extracts version information for:
- Firefox
- Edge
- Chrome
- Safari

### Operating System Detection
Detects:
- Windows (7, 8, 8.1, 10)
- macOS (with version)
- Android (with version)
- iOS (with version)
- Linux

### Device Type Detection
Classifies devices as:
- **Desktop**: Standard computers
- **Tablet**: iPads, Android tablets
- **Mobile**: Smartphones

## Security Considerations

1. **Fingerprint Generation**: Uses multiple device characteristics to create a unique identifier
2. **Server-Side Validation**: All device checks are validated on the backend
3. **Atomic Operations**: Device switching is atomic - either both operations succeed or both fail
4. **Session Preservation**: Cancelling preserves the existing session without changes
5. **Error Handling**: All API calls include proper error handling and user feedback

## Testing

See `src/react-app/examples/DeviceManagerExample.tsx` for a complete working example that demonstrates:
- Device information collection
- Conflict detection
- Device switching
- Cancel handling
- Error scenarios

## Files Created

1. `src/react-app/services/DeviceManager.ts` - Core service
2. `src/react-app/components/DeviceConflictModal.tsx` - UI component
3. `src/react-app/examples/DeviceManagerExample.tsx` - Usage example

## Requirements Validation

- ✅ **Requirement 1.2**: Device conflict detection implemented
- ✅ **Requirement 1.3**: Complete device information display
- ✅ **Requirement 1.4**: Atomic device session swap
- ✅ **Requirement 1.5**: Session preservation on cancel
- ✅ **Requirement 8.1**: Device fingerprint composition

## Next Steps

To integrate this into the login flow:

1. Import the DeviceManager and DeviceConflictModal into your login component
2. Add the device conflict check after successful authentication
3. Show the modal if a conflict is detected
4. Handle the user's choice (switch or cancel)
5. Navigate to the appropriate page based on the outcome

See the example file for a complete implementation reference.
