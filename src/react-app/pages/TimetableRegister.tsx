import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Users,
  Clock,
} from 'lucide-react';
import { api } from '../hooks/useApi';

export default function TimetableRegister() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

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
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      setSuccess('Account created successfully!');
      setTimeout(() => navigate('/onboarding'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.email?.[0] || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Cpu, title: 'AI-Powered Scheduling', desc: 'Intelligent algorithms create optimal timetables' },
    { icon: Users, title: 'Teacher Management', desc: 'Effortlessly manage staff and their availability' },
    { icon: Clock, title: 'Conflict-Free Scheduling', desc: 'Automatic detection and resolution of conflicts' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Timetable Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-teal-900 via-cyan-900 to-emerald-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"
            >
              <Calendar className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold text-white">IntelliSchedule</span>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Start Scheduling
                <span className="block bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Smarter Today
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                Join hundreds of institutions already using IntelliSchedule to create 
                perfect timetables without conflicts.
              </p>
            </motion.div>

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
                    <benefit.icon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-slate-400 text-sm">
            Join 5,000+ scheduling administrators worldwide
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 mb-4 shadow-lg shadow-cyan-500/30"
            >
              <Calendar className="w-7 h-7 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-900">IntelliSchedule</h2>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create account</h2>
            <p className="text-slate-600">Get started with your scheduling platform</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Registration failed</p>
                    <p className="text-sm text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Success!</p>
                    <p className="text-sm text-emerald-600 mt-0.5">{success}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                  placeholder="admin@institution.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                  placeholder="schedule_admin"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full px-4 pr-12 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                <input
                  name="passwordConfirm"
                  type="password"
                  required
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 text-cyan-600 bg-slate-100 border-slate-300 rounded focus:ring-cyan-500"
                />
                <p className="text-sm text-slate-600">
                  I agree to the{' '}
                  <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-cyan-600 hover:text-cyan-700 font-medium">Privacy Policy</a>
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
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

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-slate-500">
              © 2024 IntelliSchedule. Powered by{' '}
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