import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Zap,
  AlertCircle,
  Star,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import DeviceConflictModal from '../components/DeviceConflictModal';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, deviceConflict, setDeviceConflict } = useAuthContext();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Helper function to get dashboard route based on role
  const getDashboardRoute = (role: string): string => {
    // For timetable domain, always go to timetable page regardless of role
    if (window.location.hostname === 'timetable.dashoapp.com') {
      return '/timetable';
    }

    const normalizedRole = role?.toLowerCase();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let loggedInUser: any = null;

      // Try role-specific endpoints first (admin, super_admin, teacher, student)
      const roleAttempts = ['admin', 'super_admin', 'teacher', 'student'];
      let loginSuccess = false;

      for (const roleType of roleAttempts) {
        try {
          loggedInUser = await login(formData.email, formData.password, roleType);
          loginSuccess = true;
          break;
        } catch (roleError: any) {
          console.log('Role login error:', roleError.message);
          // Check if this is a device conflict
          if (roleError.message === 'DEVICE_CONFLICT') {
            console.log('Device conflict detected in login component!');
            setLoading(false);
            return; // Just return, the modal will show via deviceConflict state
          }
          // Continue to next role
          continue;
        }
      }

      // If role-specific login failed, try generic login
      if (!loginSuccess) {
        try {
          loggedInUser = await login(formData.email, formData.password);
        } catch (genericError: any) {
          console.log('Generic login error:', genericError.message);
          // Check if this is a device conflict
          if (genericError.message === 'DEVICE_CONFLICT') {
            console.log('Device conflict detected in generic login!');
            setLoading(false);
            return; // Just return, the modal will show via deviceConflict state
          }
          throw genericError;
        }
      }

      // Redirect based on user role
      if (loggedInUser?.role) {
        const dashboardRoute = getDashboardRoute(loggedInUser.role);
        console.log('Login successful, redirecting to:', dashboardRoute, 'User role:', loggedInUser.role);
        setLoading(false);
        navigate(dashboardRoute);
      } else {
        console.warn('No role found in user data, redirecting to default dashboard', loggedInUser);
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
      // Retry login with stored credentials and force switch flag
      const { identifier, password, role } = deviceConflict.credentials;
      const loggedInUser = await login(identifier, password, role, true); // true = forceSwitch

      // Clear device conflict state
      setDeviceConflict(null);

      // Redirect based on user role
      if (loggedInUser?.role) {
        const dashboardRoute = getDashboardRoute(loggedInUser.role);
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
    setShowDeviceConflict(false);
    setError('Login cancelled. Please use your other device or contact support.');
  };

  return (
    <div className="h-screen flex overflow-hidden">
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
        {/* Abstract SVG Background */}
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

        {/* Logo Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-10 h-10 flex items-center justify-center border border-white/10">
            <img
              src="/examlogo.png"
              alt="Exam Logo"
              className="w-8 h-8 object-contain mx-auto"
            />          </div>
          <span className="font-bold text-xl tracking-tight">DashoExams</span>
        </motion.div>

        {/* Testimonial / Trust Section */}
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
            {/* Stars */}
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
                src="https://ui-avatars.com/api/?name=Dr+Sarah+Chen&background=random"
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

          {/* Trusted By Logos (Subtle) */}
          <div className="mt-8 flex gap-6 opacity-60">
            <div className="h-6 w-20 bg-white/20 rounded"></div>
            <div className="h-6 w-20 bg-white/20 rounded"></div>
            <div className="h-6 w-20 bg-white/20 rounded"></div>
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-indigo-200">
          © 2024 DashoExams Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 lg:p-12 overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-4 h-4" fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-slate-900">DashoExams</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Please enter your details to sign in.</p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#00A4EF" d="M11.4 24H0V12.6h11.4V24z" />
                <path fill="#FFB900" d="M24 24H12.6V12.6H24V24z" />
                <path fill="#F25022" d="M11.4 11.4H0V0h11.4v11.4z" />
                <path fill="#7FBA00" d="M24 11.4H12.6V0H24v11.4z" />
              </svg>
              Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-400">Or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
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

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
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

            {/* Password Input */}
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
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

            {/* Remember Me & Forgot Password */}
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
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
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

            {/* Submit Button */}
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

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer Links */}
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
