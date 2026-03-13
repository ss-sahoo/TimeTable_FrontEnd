import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Users,
  Award,
  Check,
} from 'lucide-react';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';

export default function Register() {
  const { setUser } = useAuthContext();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    return true;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      };

      const response = await api.post('/auth/register/', userData);

      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Set user in context and localStorage
      const userInfo = response.data.user;
      localStorage.setItem('user_data', JSON.stringify(userInfo));
      setUser(userInfo);

      setSuccess('Account created successfully!');
      setTimeout(() => navigate('/onboarding'), 1500);
    } catch (err: any) {
      // Handle various error response formats
      const errorData = err.response?.data;
      let errorMessage = 'Registration failed. Please try again.';

      if (errorData) {
        if (errorData.password?.[0]) {
          errorMessage = `Password: ${errorData.password[0]}`;
        } else if (errorData.email?.[0]) {
          errorMessage = errorData.email[0];
        } else if (errorData.username?.[0]) {
          errorMessage = errorData.username[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength();


  const benefits = [
    { icon: Shield, title: 'Secure Platform', desc: 'Enterprise-grade security for your exams' },
    { icon: Users, title: 'Unlimited Users', desc: 'Add students and teachers without limits' },
    { icon: Award, title: 'Smart Analytics', desc: 'AI-powered insights and reports' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
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
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg "
            >
              <div className="w-12 h-12 flex items-center justify-center mx-auto">
                <img
                  src="/examlogo.png"
                  alt="Exam Logo"
                  className="w-8 h-8 object-contain rounded-md"
                />
              </div>
            </motion.div>
            <span className="text-2xl font-bold text-white">DashoExams</span>
          </div>


          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Start Your
                <span className="block bg-gradient-to-r from-violet-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Journey Today
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                Join thousands of institutions already using DashoExams to streamline
                their examination process.
              </p>
            </motion.div>

            {/* Benefits */}
            <div className="space-y-5">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-slate-400 text-sm">
            Join 10,000+ educators worldwide
          </div>
        </div>
      </div>


      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-violet-50/30 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg "
            >
              <div className="w-12 h-12 flex items-center justify-center mx-auto">
                <img
                  src="/examlogo.png"
                  alt="Exam Logo"
                  className="w-8 h-8 object-contain rounded-md"
                />
              </div>
            </motion.div>
            <h2 className="text-xl font-bold text-slate-900">DashoExams</h2>
          </div>

          {/* Back to Login */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create account</h2>
            <p className="text-slate-600">Get started with your free account</p>
          </motion.div>


          {/* Register Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    <p className="text-sm font-medium text-red-800">Registration failed</p>
                    <p className="text-sm text-red-600 mt-0.5">{error}</p>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Success!</p>
                    <p className="text-sm text-emerald-600 mt-0.5">{success}</p>
                  </div>
                </motion.div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                  <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'firstName' ? 'ring-2 ring-violet-500/20' : ''}`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className={`h-4 w-4 transition-colors ${focusedField === 'firstName' ? 'text-violet-500' : 'text-slate-400'}`} />
                    </div>
                    <input
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full px-3 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all ${focusedField === 'lastName' ? 'ring-2 ring-violet-500/20' : ''}`}
                    placeholder="Doe"
                  />
                </div>
              </div>


              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-violet-500/20' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-violet-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className={`block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all ${focusedField === 'username' ? 'ring-2 ring-violet-500/20' : ''}`}
                  placeholder="johndoe"
                />
              </div>


              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-violet-500/20' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-violet-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-12 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    placeholder="Create a strong password"
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
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-slate-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Password strength: <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>


              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'passwordConfirm' ? 'ring-2 ring-violet-500/20' : ''}`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${focusedField === 'passwordConfirm' ? 'text-violet-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    name="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.passwordConfirm}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('passwordConfirm')}
                    onBlur={() => setFocusedField(null)}
                    className="block w-full pl-12 pr-12 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </button>
                </div>
                {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
                  <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 text-violet-600 bg-slate-100 border-slate-300 rounded focus:ring-violet-500"
                />
                <p className="text-sm text-slate-600">
                  I agree to the{' '}
                  <a href="#" className="text-violet-600 hover:text-violet-700 font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-violet-600 hover:text-violet-700 font-medium">Privacy Policy</a>
                </p>
              </div>


              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-slate-500">
              © 2024 DashoExams. Powered by{' '}
              <a
                href="https://diracai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors"
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
