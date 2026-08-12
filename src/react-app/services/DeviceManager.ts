/**
 * Device Manager Service
 * 
 * Manages device fingerprinting and session conflict detection.
 * 
 * **Feature: exam-security-enhancements**
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 8.1**
 */

import { Fetch } from '../usefetch';

export interface DeviceInfo {
  fingerprint: string;
  type: string;
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  userAgent: string;
  ipAddress?: string;
}

export interface ConflictInfo {
  device_type: string;
  browser: string;
  os: string;
  login_timestamp: string;
  last_activity: string;
  device_fingerprint: string;
  screen_resolution?: string;
}

export interface DeviceCheckResponse {
  has_conflict: boolean;
  conflict_info: ConflictInfo | null;
  device_fingerprint: string;
}

export interface LogoutDeviceResponse {
  message: string;
  new_session: {
    device_fingerprint: string;
    device_type: string;
    browser: string;
    os: string;
    screen_resolution: string;
    timezone: string;
    created_at: string;
    last_activity: string;
  };
}

class DeviceManager {
  /**
   * Generate a unique device fingerprint based on browser and hardware characteristics.
   * 
   * **Feature: exam-security-enhancements, Property 33: Device fingerprint composition**
   * **Validates: Requirements 8.1**
   */
  generateFingerprint(deviceInfo: Omit<DeviceInfo, 'fingerprint'>): string {
    const components = [
      deviceInfo.userAgent,
      deviceInfo.screenResolution,
      deviceInfo.timezone,
      deviceInfo.type,
      deviceInfo.browser,
      deviceInfo.os,
    ];
    
    // Create a simple hash from the components
    const fingerprint = components.join('|');
    return this.simpleHash(fingerprint);
  }

  /**
   * Simple hash function for generating fingerprints
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Detect browser information from user agent
   */
  private detectBrowser(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('Firefox/')) {
      const version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
      return `Firefox ${version}`;
    } else if (ua.includes('Edg/')) {
      const version = ua.match(/Edg\/(\d+)/)?.[1] || '';
      return `Edge ${version}`;
    } else if (ua.includes('Chrome/')) {
      const version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
      return `Chrome ${version}`;
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      const version = ua.match(/Version\/(\d+)/)?.[1] || '';
      return `Safari ${version}`;
    }
    
    return 'Unknown Browser';
  }

  /**
   * Detect operating system from user agent
   */
  private detectOS(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('Windows NT 10.0')) return 'Windows 10';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.2')) return 'Windows 8';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';
    if (ua.includes('Mac OS X')) {
      const version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
      return `macOS ${version}`;
    }
    if (ua.includes('Android')) {
      const version = ua.match(/Android (\d+)/)?.[1] || '';
      return `Android ${version}`;
    }
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      const version = ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || '';
      return `iOS ${version}`;
    }
    if (ua.includes('Linux')) return 'Linux';
    
    return 'Unknown OS';
  }

  /**
   * Detect device type (mobile, tablet, desktop)
   */
  private detectDeviceType(): string {
    const ua = navigator.userAgent;
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Collect comprehensive device information.
   * 
   * **Feature: exam-security-enhancements, Property 3: Device information completeness**
   * **Validates: Requirements 1.3**
   */
  getDeviceInfo(): DeviceInfo {
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userAgent = navigator.userAgent;
    const browser = this.detectBrowser();
    const os = this.detectOS();
    const type = this.detectDeviceType();

    const deviceInfoWithoutFingerprint = {
      type,
      browser,
      os,
      screenResolution,
      timezone,
      userAgent,
    };

    const fingerprint = this.generateFingerprint(deviceInfoWithoutFingerprint);

    return {
      ...deviceInfoWithoutFingerprint,
      fingerprint,
    };
  }

  /**
   * Check for device conflicts with the backend.
   * 
   * **Feature: exam-security-enhancements, Property 2: Device conflict detection**
   * **Validates: Requirements 1.2**
   */
  async checkForConflict(): Promise<DeviceCheckResponse> {
    const deviceInfo = this.getDeviceInfo();

    const requestData = {
      user_agent: deviceInfo.userAgent,
      screen_resolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      device_type: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
    };

    try {
      const response = await Fetch('/api/auth/check-device/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Device check failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking device conflict:', error);
      throw error;
    }
  }

  /**
   * Logout the previous device and create a new session for the current device.
   * 
   * **Feature: exam-security-enhancements, Property 4: Device session swap atomicity**
   * **Validates: Requirements 1.4**
   */
  async logoutPreviousDevice(oldFingerprint: string): Promise<LogoutDeviceResponse> {
    const deviceInfo = this.getDeviceInfo();

    const requestData = {
      device_fingerprint: oldFingerprint,
      new_device_info: {
        user_agent: deviceInfo.userAgent,
        screen_resolution: deviceInfo.screenResolution,
        timezone: deviceInfo.timezone,
        device_type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      },
    };

    try {
      const response = await Fetch('/api/auth/logout-device/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Device logout failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging out previous device:', error);
      throw error;
    }
  }

  /**
   * Get all active sessions for the current user.
   */
  async getActiveSessions() {
    try {
      const response = await Fetch('/api/auth/active-sessions/', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get active sessions: ${response.status}`);
      }

      const data = await response.json();
      return data.sessions;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * Invalidate a specific device session.
   */
  async invalidateSession(fingerprint: string) {
    try {
      const response = await Fetch(`/api/auth/session/${fingerprint}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to invalidate session: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();
export default DeviceManager;
