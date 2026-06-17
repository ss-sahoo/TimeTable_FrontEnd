import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Zap,
  AlertCircle,
  Star,
  Users,
  Shield,
  Building2,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import DeviceConflictModal from '../components/DeviceConflictModal';

// Google Client ID – set via env or fallback
export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [signupRole, setSignupRole] = useState<'student' | 'institution'>('student');
  const [instituteName, setInstituteName] = useState('');

  const GOOGLE_CLIENT_ID =
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
    '976886272254-0qajikvplhfa5hhl8vv24tgn4kbtf1a5.apps.googleusercontent.com';

  const { login, loginWithGoogle, deviceConflict, setDeviceConflict } = useAuthContext();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Helper function to get dashboard route based on role
  const getDashboardRoute = (user: any): string => {
    if (window.location.hostname === 'timetable.dashoapp.com') {
      return '/timetable';
    }

    if (!user?.institute_id && !user?.institute) {
      return '/onboarding';
    }

    const normalizedRole = user?.role?.toLowerCase();

    switch (normalizedRole) {
      case 'super_admin':
      case 'superadmin':
        return '/superadmin/dashboard';
      case 'admin':
      case 'institute_admin':
      case 'center_admin':
        return '/center-admin/dashboard';
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student-dashboard';
      default:
        return '/dashboard';
    }
  };

  // --- Google Sign-In handler ---
  const handleGoogleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      setError('');

      try {
        // Store intent BEFORE calling loginWithGoogle
        if (signupRole === 'institution') {
          sessionStorage.setItem('onboarding_intent', 'create');
          sessionStorage.setItem('pending_institute_name', instituteName);
        } else {
          sessionStorage.setItem('onboarding_intent', 'join');
          sessionStorage.removeItem('pending_institute_name');
        }

        const result = await loginWithGoogle(
          response.credential,
          false,
          signupRole === 'institution' ? 'super_admin' : 'student',
          signupRole === 'institution' ? 'create' : 'join',
          instituteName
        );

        if (result.onboarding_required) {
          navigate('/onboarding');
          return;
        }

        const dashboardRoute = getDashboardRoute(result);
        navigate(dashboardRoute);
      } catch (err: any) {
        if (err.message === 'DEVICE_CONFLICT') {
          // Modal will show via context state
          setGoogleLoading(false);
          return;
        }
        setError(err.message || 'Google login failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    [navigate, loginWithGoogle, signupRole],
  );

  // Load Google Identity Services script
  useEffect(() => {
    const initializeGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        // Use a small delay to ensure the container is in the DOM
        setTimeout(() => {
          const container = document.getElementById('google-btn-container');
          if (container) {
            (window as any).google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              width: container.offsetWidth,
              text: signupRole === 'institution' ? 'signup_with' : 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
        }, 100);
      }
    };

    if (document.getElementById('google-gsi-script')) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [handleGoogleCredentialResponse, signupRole]);

  const handleGoogleClick = () => {
    // Validate institute name first if roles is institution
    if (signupRole === 'institution' && !instituteName) {
      setError('Please enter your Institute Name before continuing with Google.');
      const element = document.getElementById('instituteName');
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // With renderButton, the click is handled by the Google iframe
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let loggedInUser: any = null;
      const roleAttempts = ['admin', 'super_admin', 'teacher', 'student'];
      let loginSuccess = false;

      for (const roleType of roleAttempts) {
        try {
          loggedInUser = await login(formData.email, formData.password, roleType);
          loginSuccess = true;
          break;
        } catch (roleError: any) {
          if (roleError.message === 'DEVICE_CONFLICT') {
            setLoading(false);
            return;
          }
          continue;
        }
      }

      if (!loginSuccess) {
        try {
          loggedInUser = await login(formData.email, formData.password);
        } catch (genericError: any) {
          if (genericError.message === 'DEVICE_CONFLICT') {
            setLoading(false);
            return;
          }
          throw genericError;
        }
      }

      if (loggedInUser?.role) {
        const dashboardRoute = getDashboardRoute(loggedInUser.role);
        setLoading(false);
        navigate(dashboardRoute);
      } else {
        setLoading(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSwitchDevice = async () => {
    if (!deviceConflict) return;

    try {
      let loggedInUser: any = null;

      if (deviceConflict.googleCredential) {
        // Handle Google switch
        loggedInUser = await loginWithGoogle(deviceConflict.googleCredential, true);
      } else {
        // Handle regular switch
        const { identifier, password, role } = deviceConflict.credentials;
        loggedInUser = await login(identifier, password, role, true);
      }

      setDeviceConflict(null);

      if (loggedInUser) {
        const dashboardRoute = getDashboardRoute(loggedInUser);
        navigate(dashboardRoute);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch device. Please try again.');
    }
  };

  const handleCancelDeviceSwitch = () => {
    setDeviceConflict(null);
    setError('Login cancelled. Please use your other device or contact support.');
  };

  return (
    <div className="h-screen flex overflow-hidden text-slate-900">
      {/* Device Conflict Modal */}
      {deviceConflict && (
        <DeviceConflictModal
          isOpen={true}
          conflictInfo={deviceConflict.conflictInfo}
          onSwitchDevice={handleSwitchDevice}
          onCancel={handleCancelDeviceSwitch}
        />
      )}

      {/* LEFT SIDE: Brand & Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white"
        style={{
          backgroundColor: '#312e81',
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)
          `
        }}
      >
        <div className="absolute inset-0 z-0 opacity-30">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgb(79, 70, 229)', stopOpacity: 0 }} />
                <stop offset="100%" style={{ stopColor: 'rgb(79, 70, 229)', stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-lg bg-white/5">
            <img
              src="/examlogo.png"
              alt="Exam Logo"
              className="w-8 h-8 object-contain mx-auto"
            />
          </div>
          <span className="font-bold text-xl tracking-tight">DashoExams</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <div
            className="p-8 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex gap-1 mb-4 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4" fill="currentColor" />
              ))}
            </div>

            <blockquote className="text-lg font-medium leading-relaxed mb-6">
              "DashoExams transformed how we handle high-stakes assessments. The AI proctoring is seamless, and the analytics give us insights we never had before."
            </blockquote>

            <div className="flex items-center gap-4">
              <img
                src="https://ui-avatars.com/api/?name=Ipsit+Panda&background=random"
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-white/20"
              />
              <div>
                <p className="font-bold text-sm">Prof. Ipsit Panda</p>
                <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
                  Physics HOD, DiracAI Coaching
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-indigo-200">
          © 2024 DashoExams Inc. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-4 h-4" fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-slate-900">DashoExams</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Please enter your details to sign in.</p>
          </div>

          {/* Role Selector (Primarily for first-time Google signups) */}
          {/* <div className="flex p-1 bg-slate-100 rounded-xl mb-6 relative">
            <motion.div
              className="absolute inset-y-1 bg-white rounded-lg shadow-sm z-0"
              initial={false}
              animate={{
                x: signupRole === 'student' ? '0%' : '100%',
                width: 'calc(50% - 4px)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => setSignupRole('student')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${signupRole === 'student' ? 'text-indigo-600' : 'text-slate-500'
                }`}
            >
              <Users className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setSignupRole('institution')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-colors ${signupRole === 'institution' ? 'text-indigo-600' : 'text-slate-500'
                }`}
            >
              <Shield className="w-4 h-4" />
              Institution
            </button>
          </div> */}

          <AnimatePresence>
            {signupRole === 'institution' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Institute / School Name <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'instituteName' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className={`h-4 w-4 transition-colors ${focusedField === 'instituteName' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <input
                    id="instituteName"
                    name="instituteName"
                    type="text"
                    required
                    value={instituteName}
                    onChange={(e) => {
                      setInstituteName(e.target.value);
                      setError('');
                    }}
                    onFocus={() => setFocusedField('instituteName')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="e.g. Stanford University"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full">
            <div
              id="google-btn-container"
              className="min-h-[40px] flex justify-center"
              onClick={handleGoogleClick}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400 font-medium">Or continue with email</span>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Authentication failed</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email or Teacher ID
              </label>
              <div className={`relative group rounded-lg transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-indigo-500/20' : ''
                }`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm"
                  placeholder="name@institution.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
              </div>
              <div className={`relative group rounded-lg transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-indigo-500/20' : ''
                }`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign in to Dashboard'
                )}
              </motion.button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <div className="flex justify-center gap-6 text-xs text-slate-400">
            <a href="https://www.termsfeed.com/live/d118fde1-02b7-4e48-bcfe-2bb352516ff7" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Help Center</a>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Powered by{' '}
            <a
              href="https://diracai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              DiracAI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
