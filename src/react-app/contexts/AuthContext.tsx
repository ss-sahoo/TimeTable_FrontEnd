import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '@/react-app/hooks/useApi';
import { jwtDecode } from 'jwt-decode';

interface Institute {
  id: number;
  name: string;
  domain?: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

interface User {
  id: number | string;
  email: string;
  role: 'super_admin' | 'SUPER_ADMIN' | 'institute_admin' | 'admin' | 'ADMIN' | 'exam_admin' | 'teacher' | 'TEACHER' | 'student' | 'STUDENT' | 'staff' | 'STAFF';
  institute_id?: number | string;
  institute?: Institute; // Full institute object from API
  institute_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // From API response
  get_full_name?: string;
  username?: string;
  center_id?: string;
  phone?: string;
  // Add other user-related fields as needed
}

interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
  institute_id?: number | null;
  institute_name?: string | null;
  first_name?: string;
  last_name?: string;
  exp: number;
  iat: number;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (identifier: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  userRole: User['role'] | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromTokens = async () => {
      const accessToken = localStorage.getItem('access_token');

      if (accessToken) {
        try {
          const decodedToken = jwtDecode<JWTPayload>(accessToken);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp && decodedToken.exp < currentTime) {
            // Token expired, try to refresh
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              try {
                const response = await api.post('/auth/token/refresh/', {
                  refresh: refreshToken
                });
                localStorage.setItem('access_token', response.data.access);
                // Fetch fresh user data from API
                const userResponse = await api.get('/auth/profile/');
                setUser(userResponse.data);
                setIsAuthenticated(true);
                setLoading(false);
                return;
              } catch (refreshError) {
                console.error("Failed to refresh token:", refreshError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setIsAuthenticated(false);
                setUser(null);
                setLoading(false);
                return;
              }
            } else {
              // No refresh token, clear everything
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setIsAuthenticated(false);
              setUser(null);
              setLoading(false);
              return;
            }
          }

          // Token is valid, try to get user data from localStorage first, then API
          try {
            const storedUserData = localStorage.getItem('user_data');
            if (storedUserData) {
              const parsedUser = JSON.parse(storedUserData);
              setUser(parsedUser);
              setIsAuthenticated(true);
              setLoading(false);

              // Background fetch to ensure data is fresh (e.g. institute details)
              try {
                const userResponse = await api.get('/auth/profile/');
                if (JSON.stringify(userResponse.data) !== storedUserData) {
                  setUser(userResponse.data);
                  localStorage.setItem('user_data', JSON.stringify(userResponse.data));
                }
              } catch (bgError) {
                console.warn("Background profile fetch failed:", bgError);
              }
              return;
            }
          } catch (localError) {
            console.warn("Failed to parse stored user data:", localError);
          }

          // If not in localStorage, try to fetch from API
          try {
            const userResponse = await api.get('/auth/profile/');
            setUser(userResponse.data);
            localStorage.setItem('user_data', JSON.stringify(userResponse.data));
            setIsAuthenticated(true);
          } catch (apiError) {
            console.error("Failed to fetch user profile:", apiError);
            // If API call fails, try to use token data as fallback
            const fallbackUser = {
              id: decodedToken.user_id,
              email: decodedToken.email,
              role: (decodedToken.role as User['role']) || 'student',
              institute_id: decodedToken.institute_id ?? undefined,
              institute_name: decodedToken.institute_name ?? undefined,
              first_name: decodedToken.first_name,
              last_name: decodedToken.last_name,
              get_full_name: `${decodedToken.first_name || ''} ${decodedToken.last_name || ''}`.trim(),
            };
            setUser(fallbackUser);
            localStorage.setItem('user_data', JSON.stringify(fallbackUser));
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Failed to decode access token:", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUserFromTokens();
  }, []);

  const login = async (identifier: string, password: string, role?: string) => {
    setLoading(true);
    try {
      let response;

      // Determine which login endpoint to use based on role
      if (role === 'super_admin' || role === 'SUPER_ADMIN') {
        // Super Admin login endpoint - use timetable auth endpoint
        response = await api.post('/timetable/auth/superadmin/login/', {
          username: identifier,  // Can be email or username
          password
        });
      } else if (role === 'admin' || role === 'institute_admin' || role === 'ADMIN') {
        // Admin login endpoint - use timetable auth endpoint
        response = await api.post('/timetable/auth/admin/login/', {
          username: identifier,  // Can be email or username
          password
        });
      } else if (role === 'teacher' || role === 'TEACHER') {
        // Teacher login endpoint (supports teacher_code, email, or username) - use timetable auth endpoint
        response = await api.post('/timetable/auth/teacher/login/', {
          username: identifier,  // Can be email, username, or teacher_code
          password
        });
      } else {
        // Generic login endpoint (for student, staff, or if role not specified)
        response = await api.post('/auth/login/', {
          email: identifier,  // Generic login requires email
          password
        });
      }

      // Handle response format differences
      let access, refresh, userData;

      if (response.data.tokens) {
        // Role-based login returns { tokens: { access, refresh }, user: {...} }
        access = response.data.tokens.access;
        refresh = response.data.tokens.refresh;
        userData = response.data.user;
      } else {
        // Generic login returns { access, refresh, user: {...} }
        access = response.data.access;
        refresh = response.data.refresh;
        userData = response.data.user;
      }

      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Store full user data in localStorage for easy access
      localStorage.setItem('user_data', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);

      return userData;
    } catch (error: any) {
      console.error("Login failed:", error);
      logout(); // Ensure no stale tokens/user data
      setLoading(false);

      // Extract error message from response
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear server-side session
      await api.post('/auth/logout/');
    } catch (logoutError) {
      // Even if backend logout fails, continue with frontend cleanup
      console.log('Backend logout failed, continuing with frontend cleanup', logoutError);
    }

    // Clear all frontend storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.clear(); // Clear any other stored data

    // Clear session storage as well
    sessionStorage.clear();

    // Clear any cookies (if any)
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  const userRole = user ? user.role : null;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated, loading, userRole }}>
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
