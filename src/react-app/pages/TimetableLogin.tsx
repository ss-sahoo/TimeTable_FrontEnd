import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Cpu,
  Users,
  Clock,
  Building2,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import DeviceConflictModal from '../components/DeviceConflictModal';

export default function TimetableLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, deviceConflict, setDeviceConflict } = useAuthContext();
  const navigate = useNavigate();

  interface SubdomainInstitute {
    id: number;
    name: string;
    logo: string | null;
    subdomain: string;
    website: string | null;
    description: string | null;
  }

  const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInstitute | null>(null);
  const [subdomainLoading, setSubdomainLoading] = useState(true);

  const getSubdomain = () => {
    if (typeof window === 'undefined') return null;
    const hostname = window.location.hostname;

    // Support testing subdomain locally using URL query parameter: ?subdomain=mit
    const urlParams = new URLSearchParams(window.location.search);
    const qaSubdomain = urlParams.get('subdomain');
    if (qaSubdomain) return qaSubdomain;

    if (hostname === 'localhost' || hostname === '127.0.0.1') return null;

    const ROOT_DOMAIN = 'exams.dashoapp.com';
    const TIMETABLE_DOMAIN = 'timetable.dashoapp.com';

    if (hostname !== ROOT_DOMAIN && hostname !== TIMETABLE_DOMAIN) {
      if (hostname.endsWith('.' + ROOT_DOMAIN)) {
        return hostname.replace('.' + ROOT_DOMAIN, '');
      }
      if (hostname.endsWith('.' + TIMETABLE_DOMAIN)) {
        return hostname.replace('.' + TIMETABLE_DOMAIN, '');
      }
      if (hostname.endsWith('.localhost')) {
        return hostname.replace('.localhost', '');
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchSubdomainInfo = async () => {
      const subdomain = getSubdomain();
      if (!subdomain) {
        setSubdomainLoading(false);
        return;
      }

      try {
        const response = await api.get(`/auth/institutes/by-subdomain/${subdomain}/`);
        setSubdomainInfo(response.data);
      } catch (err) {
        console.error('Failed to fetch subdomain institute branding:', err);
      } finally {
        setSubdomainLoading(false);
      }
    };

    fetchSubdomainInfo();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Helper function to get dashboard route based on role
  // NOTE: No onboarding redirect here — onboarding is only for Google auth new signups.
  const getDashboardRoute = (user: any): string => {
    // For timetable domain, always go to timetable page regardless of role
    if (window.location.hostname === 'timetable.dashoapp.com') {
      return '/timetable';
    }

    // Handle string role for backward compatibility or accidental usage
    const role = typeof user === 'string' ? user : user?.role;

    switch (role) {
      case 'super_admin':
      case 'SUPER_ADMIN':
        return '/superadmin/dashboard';
      case 'admin':
      case 'ADMIN':
      case 'institute_admin':
        return '/center-admin/dashboard';
      case 'teacher':
      case 'TEACHER':
        return '/teacher';
      case 'student':
      case 'STUDENT':
        return '/student-dashboard';
      default:
        return '/timetable';
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
        const dashboardRoute = getDashboardRoute(loggedInUser);
        console.log('Login successful, redirecting to:', dashboardRoute, 'User role:', loggedInUser.role);
        setLoading(false);
        navigate(dashboardRoute);
      } else {
        console.warn('No role found in user data, redirecting to timetable', loggedInUser);
        setLoading(false);
        navigate('/timetable');
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
      if (loggedInUser) {
        const dashboardRoute = getDashboardRoute(loggedInUser);
        navigate(dashboardRoute);
      } else {
        navigate('/timetable');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch device. Please try again.');
    }
  };

  const handleCancelDeviceSwitch = () => {
    setDeviceConflict(null);
    setError('Login cancelled. Please use your other device or contact support.');
  };

  const features = [
    { icon: Cpu, text: 'AI-Powered Scheduling', color: 'from-cyan-500 to-teal-500' },
    { icon: Users, text: 'Teacher Management', color: 'from-emerald-500 to-green-500' },
    { icon: Clock, text: 'Conflict-Free Timetables', color: 'from-teal-500 to-cyan-500' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Device Conflict Modal */}
      {deviceConflict && (
        <DeviceConflictModal
          isOpen={true}
          conflictInfo={deviceConflict.conflictInfo}
          onSwitchDevice={handleSwitchDevice}
          onCancel={handleCancelDeviceSwitch}
        />
      )}

      {/* Left Panel - Timetable Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-teal-900 to-cyan-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {subdomainInfo ? (
              <>
                {subdomainInfo.logo ? (
                  <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-2xl bg-white p-1 shadow-lg">
                    <img
                      src={subdomainInfo.logo}
                      alt={`${subdomainInfo.name} Logo`}
                      className="w-full h-full object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <span className="text-2xl font-bold text-white">{subdomainInfo.name}</span>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                >
                  <Calendar className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-2xl font-bold text-white">IntelliSchedule</span>
              </>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {subdomainInfo ? subdomainInfo.name : 'Smart Scheduling'}
                <span className="block bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  {subdomainInfo ? 'Branded Portal' : 'Made Simple'}
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                {subdomainInfo
                  ? (subdomainInfo.description || `Welcome to ${subdomainInfo.name}'s schedule and timetable portal. View schedules, manage lessons, and plan sessions.`)
                  : 'Generate perfect timetables in minutes with AI-powered scheduling. Manage teachers, batches, and eliminate conflicts effortlessly.'}
              </p>
            </motion.div>

            {/* Features */}
            {!subdomainInfo && (
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {subdomainInfo && subdomainInfo.website && (
              <div className="mt-4">
                <a
                  href={subdomainInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium border border-cyan-500/30 rounded-xl px-4 py-2 bg-cyan-950/20"
                >
                  Visit Official Website
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-slate-400 text-sm">
            {subdomainInfo ? `Official portal for ${subdomainInfo.name}` : 'Trusted by 200+ educational institutions'}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            {subdomainInfo ? (
              <div className="inline-flex flex-col items-center">
                {subdomainInfo.logo ? (
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-lg p-1 border border-slate-100">
                    <img
                      src={subdomainInfo.logo}
                      alt={`${subdomainInfo.name} Logo`}
                      className="w-full h-full object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 mb-4 shadow-lg shadow-cyan-500/30">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-slate-900">{subdomainInfo.name}</h2>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 mb-4 shadow-lg shadow-cyan-500/30"
                >
                  <Calendar className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900">IntelliSchedule</h2>
              </>
            )}
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {subdomainInfo ? `Welcome to ${subdomainInfo.name}` : 'Welcome back'}
            </h2>
            <p className="text-slate-600">
              {subdomainInfo ? 'Sign in to access your dashboard' : 'Sign in to access your timetable dashboard'}
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3"
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

              {/* Email/Username Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email, Username, or Teacher Code
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-cyan-500/20' : ''
                  }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-cyan-500' : 'text-slate-400'
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
                    className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                    placeholder="email@institution.edu, username, or teacher code"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-cyan-500/20' : ''
                  }`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-cyan-500' : 'text-slate-400'
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
                    className="block w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cyan-600 bg-slate-100 border-slate-300 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-700 hover:to-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">New to IntelliSchedule?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
            >
              <Sparkles className="w-4 h-4" />
              Create an account
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-slate-500">
              © 2024 {subdomainInfo ? subdomainInfo.name : 'IntelliSchedule'}. Powered by{' '}
              <a
                href="https://diracai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                DiracAI
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}