import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  AlertCircle
} from 'lucide-react';
import { api } from '../hooks/useApi';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleInstituteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInstituteData(prev => ({ ...prev, [name]: value }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Step 1: Welcome & Choice */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                Welcome to ExamFlow! 🎉
              </h1>
              <p className="text-slate-600 text-lg">
                Let's get you set up in just a few steps
              </p>
            </div>

            <div className="space-y-4">
              {/* Create Institute Option */}
              <button
                onClick={() => handleChoice('create')}
                className="w-full group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">Create Institute</h3>
                    <p className="text-blue-100 text-sm">
                      Set up your organization and invite members
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              {/* Join Institute Option */}
              <button
                onClick={() => handleChoice('join')}
                className="w-full group relative overflow-hidden bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-6 text-left transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      Join Existing Institute
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Wait for an invitation or request to join
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create Institute Form */}
        {step === 2 && choice === 'create' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Create Your Institute
              </h2>
              <p className="text-slate-600">
                Tell us about your organization
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Institute Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Institute Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={instituteData.name}
                  onChange={handleInstituteInputChange}
                  placeholder="e.g., Tech University"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Domain (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Domain (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="domain"
                    value={instituteData.domain}
                    onChange={handleInstituteInputChange}
                    placeholder="e.g., university.edu"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="contact_email"
                    value={instituteData.contact_email}
                    onChange={handleInstituteInputChange}
                    placeholder="contact@university.edu"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Optional Fields - Collapsible */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 list-none flex items-center gap-2">
                  <span>+ Add more details (optional)</span>
                </summary>
                <div className="mt-4 space-y-4 pl-2">
                  {/* Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        name="contact_phone"
                        value={instituteData.contact_phone}
                        onChange={handleInstituteInputChange}
                        placeholder="+1234567890"
                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <textarea
                        name="address"
                        value={instituteData.address}
                        onChange={handleInstituteInputChange}
                        placeholder="123 Main Street, City, Country"
                        rows={2}
                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={instituteData.website}
                      onChange={handleInstituteInputChange}
                      placeholder="https://university.edu"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={instituteData.description}
                      onChange={handleInstituteInputChange}
                      placeholder="Brief description of your institute..."
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </details>
            </div>

            <button
              onClick={handleCreateInstitute}
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Institute...
                </>
              ) : (
                <>
                  Create Institute
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Join Institute Info */}
        {step === 2 && choice === 'join' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Join an Institute
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                You'll need an invitation from an institute admin to join. Once they send you an invitation, you'll receive it via email.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">What's next?</h3>
                <ul className="text-sm text-blue-700 space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Ask your institute admin to send you an invitation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Check your email for the invitation link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Accept the invitation to join the institute</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleSkip}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                All Set! 🎉
              </h2>
              <p className="text-slate-600 mb-2">
                Your institute has been created successfully!
              </p>
              <p className="text-sm text-slate-500 mb-8">
                You are now the <span className="font-semibold text-blue-600">Institute Admin</span>
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-slate-900 mb-4">What you can do now:</h3>
                <div className="grid gap-3 text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">Invite teachers and students to your institute</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">Create exam patterns and manage exams</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-700">Start creating questions and question banks</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

