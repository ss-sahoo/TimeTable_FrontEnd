import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getErrorMessage } from '../hooks/useApi';

// Device Manager for fingerprinting
const deviceManager = {
  getDeviceInfo: () => {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      browser: (() => {
        const ua = navigator.userAgent;
        if (ua.indexOf("Firefox") > -1) return "Firefox";
        if (ua.indexOf("Chrome") > -1) return "Chrome";
        if (ua.indexOf("Safari") > -1) return "Safari";
        return "Unknown";
      })(),
      os: (() => {
        const ua = navigator.userAgent;
        if (ua.indexOf("Win") > -1) return "Windows";
        if (ua.indexOf("Mac") > -1) return "MacOS";
        if (ua.indexOf("Linux") > -1) return "Linux";
        if (ua.indexOf("Android") > -1) return "Android";
        if (ua.indexOf("iOS") > -1) return "iOS";
        return "Unknown";
      })()
    };
  }
};

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  institute_id: string | null;
  institute_name: string | null;
  center_id: string | null;
  onboarding_required?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (identifier: string, password: string, role?: string, forceSwitch?: boolean) => Promise<User>;
  loginWithGoogle: (credential: string, forceSwitch?: boolean, signupRole?: string, onboardingIntent?: string, instituteName?: string) => Promise<User & { onboarding_required?: boolean }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  userRole: string | null;
  deviceConflict: any;
  setDeviceConflict: React.Dispatch<React.SetStateAction<any>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceConflict, setDeviceConflict] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user_data');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string, role?: string, forceSwitch: boolean = false) => {
    setLoading(true);
    try {
      const deviceInfo = deviceManager.getDeviceInfo();

      const response = await api.post('/auth/login/', {
        identifier,
        password,
        role,
        force_login: forceSwitch,
        user_agent: deviceInfo.userAgent,
        screen_resolution: deviceInfo.screenResolution,
        timezone: deviceInfo.timezone,
        device_type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
      });

      const { refresh, access, user: userData, device_session } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_data', JSON.stringify(userData));

      if (device_session?.device_fingerprint) {
        localStorage.setItem('device_fingerprint', device_session.device_fingerprint);
      }

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return userData;
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.has_conflict) {
        setDeviceConflict({
          conflictInfo: error.response.data.conflict_info,
          credentials: { identifier, password, role }
        });
        setLoading(false);
        throw new Error('DEVICE_CONFLICT');
      }

      setLoading(false);
      throw new Error(getErrorMessage(error, 'Login failed. Please check your credentials.'));
    }
  };

  const loginWithGoogle = async (credential: string, forceSwitch: boolean = false, signupRole?: string, onboardingIntent?: string, instituteName?: string) => {
    setLoading(true);
    try {
      const deviceInfo = deviceManager.getDeviceInfo();

      const response = await api.post('/auth/google/login/', {
        credential,
        user_agent: deviceInfo.userAgent,
        screen_resolution: deviceInfo.screenResolution,
        timezone: deviceInfo.timezone,
        device_type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        force_login: forceSwitch,
        signup_role: signupRole,
        onboarding_intent: onboardingIntent,
        institute_name: instituteName,
      });

      const { tokens, user: userData, device_session, onboarding_required } = response.data;

      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user_data', JSON.stringify(userData));

      if (device_session?.device_fingerprint) {
        localStorage.setItem('device_fingerprint', device_session.device_fingerprint);
      }

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      return { ...userData, onboarding_required };
    } catch (error: any) {
      console.error("Google login failed:", error);

      if (error.response?.status === 409 && error.response?.data?.has_conflict) {
        setDeviceConflict({
          conflictInfo: error.response.data.conflict_info,
          googleCredential: credential,
        });
        setLoading(false);
        throw new Error('DEVICE_CONFLICT');
      }

      setLoading(false);
      throw new Error(getErrorMessage(error, 'Google login failed. Please try again.'));
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (logoutError) {
      console.log('Backend logout failed, continuing with frontend cleanup', logoutError);
    }

    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    setUser(null);
    setIsAuthenticated(false);
  };

  const userRole = user ? user.role?.toLowerCase() : null;

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      login,
      loginWithGoogle,
      logout,
      isAuthenticated,
      loading,
      userRole,
      deviceConflict,
      setDeviceConflict
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
