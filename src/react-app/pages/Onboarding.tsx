import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Sparkles,
  AlertCircle,
  Zap,
  BookOpen,
  BarChart3,
  Shield,
  Clock,
  Award,
} from 'lucide-react';
import { api } from '../hooks/useApi';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [instituteData, setInstituteData] = useState({
    name: '',
    domain: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
  });

  const navigate = useNavigate();

  const handleChoice = (selectedChoice: 'create' | 'join') => {
    setChoice(selectedChoice);
    setStep(2);
  };

  const handleInstituteInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInstituteData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };


  const validateInstituteForm = () => {
    if (!instituteData.name.trim()) {
      setError('Institute name is required');
      return false;
    }
    if (!instituteData.contact_email.trim()) {
      setError('Contact email is required');
      return false;
    }
    return true;
  };

  const handleCreateInstitute = async () => {
    if (!validateInstituteForm()) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/institutes/', instituteData);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || err.message || 'Failed to create institute');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const features = [
    { icon: BookOpen, label: 'Create Exams', color: 'from-blue-500 to-cyan-500' },
    { icon: Users, label: 'Manage Users', color: 'from-violet-500 to-purple-500' },
    { icon: BarChart3, label: 'Analytics', color: 'from-emerald-500 to-teal-500' },
    { icon: Shield, label: 'Proctoring', color: 'from-orange-500 to-red-500' },
  ];

  const steps = [
    { num: 1, label: 'Choose' },
    { num: 2, label: 'Setup' },
    { num: 3, label: 'Done' },
  ];


  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-indigo-900 via-blue-900 to-violet-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-10 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white">DashoExams</span>
          </div>


          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
                Let's Get You
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  Started
                </span>
              </h1>
              <p className="text-base text-slate-300 mb-8 leading-relaxed">
                Set up your institute and start creating exams in minutes.
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white font-medium text-sm">{feature.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s.num
                      ? 'bg-white text-indigo-900'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 transition-colors ${step > s.num ? 'bg-white' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Right Panel - Content */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-4 shadow-lg shadow-indigo-500/30"
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-900">DashoExams</h2>
            {/* Mobile Progress */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {steps.map((s, index) => (
                <div key={s.num} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      step >= s.num
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-colors ${step > s.num ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Welcome & Choice */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mb-6 shadow-xl shadow-indigo-500/30"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Welcome to DashoExams! 🎉
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Let's get you set up in just a few steps
                  </p>
                </div>


                <div className="space-y-4">
                  {/* Create Institute Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice('create')}
                    className="w-full group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-2xl p-6 text-left transition-all shadow-xl shadow-indigo-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="flex-shrink-0 w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">Create Institute</h3>
                        <p className="text-indigo-100 text-sm">
                          Set up your organization and invite members
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>

                  {/* Join Institute Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice('join')}
                    className="w-full group relative overflow-hidden bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-2xl p-6 text-left transition-all shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center group-hover:from-indigo-100 group-hover:to-violet-100 transition-colors">
                        <Users className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">
                          Join Existing Institute
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Wait for an invitation or request to join
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                  >
                    Skip for now →
                  </button>
                </div>
              </motion.div>
            )}


            {/* Step 2: Create Institute Form */}
            {step === 2 && choice === 'create' && (
              <motion.div
                key="step2-create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back
                </button>

                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Create Your Institute
                  </h2>
                  <p className="text-slate-600">Tell us about your organization</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-600 mt-0.5">{error}</p>
                    </div>
                  </motion.div>
                )}

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
                  <div className="space-y-5">
                    {/* Institute Name */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Institute Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={instituteData.name}
                        onChange={handleInstituteInputChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="e.g., Tech University"
                        className={`w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all ${
                          focusedField === 'name' ? 'ring-2 ring-indigo-500/20' : ''
                        }`}
                        required
                      />
                    </div>


                    {/* Domain */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Domain <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className={`relative rounded-xl transition-all ${focusedField === 'domain' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="domain"
                          value={instituteData.domain}
                          onChange={handleInstituteInputChange}
                          onFocus={() => setFocusedField('domain')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="e.g., university.edu"
                          className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <div className={`relative rounded-xl transition-all ${focusedField === 'contact_email' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="contact_email"
                          value={instituteData.contact_email}
                          onChange={handleInstituteInputChange}
                          onFocus={() => setFocusedField('contact_email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="contact@university.edu"
                          className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700 list-none flex items-center gap-2 py-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs group-open:rotate-45 transition-transform">+</span>
                        Add more details (optional)
                      </summary>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-4 pl-2 border-l-2 border-indigo-100"
                      >
                        {/* Contact Phone */}
                        <div className="pl-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="tel"
                              name="contact_phone"
                              value={instituteData.contact_phone}
                              onChange={handleInstituteInputChange}
                              placeholder="+1234567890"
                              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        {/* Address */}
                        <div className="pl-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                            <textarea
                              name="address"
                              value={instituteData.address}
                              onChange={handleInstituteInputChange}
                              placeholder="123 Main Street, City, Country"
                              rows={2}
                              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                            />
                          </div>
                        </div>

                        {/* Website */}
                        <div className="pl-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                          <input
                            type="url"
                            name="website"
                            value={instituteData.website}
                            onChange={handleInstituteInputChange}
                            placeholder="https://university.edu"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          />
                        </div>

                        {/* Description */}
                        <div className="pl-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                          <textarea
                            name="description"
                            value={instituteData.description}
                            onChange={handleInstituteInputChange}
                            placeholder="Brief description of your institute..."
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                          />
                        </div>
                      </motion.div>
                    </details>
                  </div>


                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleCreateInstitute}
                    disabled={loading}
                    className="w-full mt-8 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Institute...
                      </>
                    ) : (
                      <>
                        Create Institute
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Join Institute Info */}
            {step === 2 && choice === 'join' && (
              <motion.div
                key="step2-join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back
                </button>

                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl mb-6 shadow-xl shadow-violet-500/30"
                  >
                    <Users className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Join an Institute</h2>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    You'll need an invitation from an institute admin to join. Once they send you an invitation, you'll receive it via email.
                  </p>

                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 mb-8 text-left">
                    <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      What's next?
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Ask your institute admin to send you an invitation',
                        'Check your email for the invitation link',
                        'Accept the invitation to join the institute',
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-indigo-700">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-indigo-600">{index + 1}</span>
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSkip}
                    className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Go to Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}


            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-6 shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">All Set! 🎉</h2>
                  <p className="text-slate-600 mb-2">Your institute has been created successfully!</p>
                  <p className="text-sm text-slate-500 mb-8">
                    You are now the <span className="font-semibold text-indigo-600">Institute Admin</span>
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100"
                >
                  <h3 className="font-semibold text-slate-900 mb-5 flex items-center justify-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    What you can do now
                  </h3>
                  <div className="grid gap-4">
                    {[
                      { icon: Users, text: 'Invite teachers and students to your institute', color: 'from-blue-500 to-cyan-500' },
                      { icon: BookOpen, text: 'Create exam patterns and manage exams', color: 'from-violet-500 to-purple-500' },
                      { icon: Sparkles, text: 'Start creating questions and question banks', color: 'from-emerald-500 to-teal-500' },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-4 text-left bg-white rounded-xl p-4 shadow-sm"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm text-slate-700">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleComplete}
                  className="w-full py-4 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <p className="text-xs text-slate-500">
              © 2024 DashoExams. Powered by{' '}
              <a
                href="https://diracai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
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
