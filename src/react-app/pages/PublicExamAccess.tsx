import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  BookOpen,
  User,
  Mail,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Eye,
  Play,
  Building2,
  Globe,
  Shield
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface PublicExam {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  max_attempts: number;
  is_public: boolean;
  institute_name: string;
  pattern: {
    id: number;
    name: string;
    total_questions: number;
    total_duration: number;
    total_marks: number;
  };
  created_by_name: string;
}

interface ExamAccessForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  agree_to_terms: boolean;
}

export default function PublicExamAccess() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<PublicExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExamAccessForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    student_id: '',
    agree_to_terms: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch exam details
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/exams/exams/${examId}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Exam not found or no longer available');
          } else {
            setError('Failed to load exam details');
          }
          return;
        }

        const examData = await response.json();
        
        // Check if exam is public and within time window
        const now = new Date();
        const startDate = new Date(examData.start_date);
        const endDate = new Date(examData.end_date);
        
        if (!examData.is_public) {
          setError('This exam is not publicly accessible');
          return;
        }
        
        if (now < startDate) {
          setError('This exam has not started yet');
          return;
        }
        
        if (now > endDate) {
          setError('This exam has ended');
          return;
        }
        
        setExam(examData);
      } catch (err) {
        setError('Failed to load exam details');
        console.error('Error fetching exam:', err);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agree_to_terms) {
      setSubmitError('You must agree to the terms and conditions');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Create a temporary user session for the exam
      const response = await fetch('http://localhost:8000/api/exams/public-access/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_id: examId,
          ...formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSubmitError(errorData.detail || 'Failed to start exam');
        return;
      }

      const data = await response.json();
      
      // Redirect to exam with temporary access token
      navigate(`/public-exam/${examId}?token=${data.access_token}`);
      
    } catch (err) {
      setSubmitError('Failed to start exam. Please try again.');
      console.error('Error starting exam:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Not Available</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Public Exam Access</h1>
          </div>
          <p className="text-slate-600">Enter your details to access this exam</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exam Information */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Exam Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 text-lg">{exam.title}</h3>
                <p className="text-slate-600 text-sm mt-1">{exam.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(exam.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(exam.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Questions</p>
                    <p className="text-sm font-medium text-slate-900">{exam.total_questions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-sm font-medium text-slate-900">{exam.duration_minutes} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Total Marks</p>
                    <p className="text-sm font-medium text-slate-900">{exam.total_marks}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Max Attempts</p>
                    <p className="text-sm font-medium text-slate-900">{exam.max_attempts}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">{exam.institute_name}</span>
                </div>
                <p className="text-xs text-slate-500">Created by {exam.created_by_name}</p>
              </div>
            </div>
          </div>

          {/* Access Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Enter Your Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number (optional)"
                />
              </div>

              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-slate-700 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your student ID (optional)"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agree_to_terms"
                  name="agree_to_terms"
                  checked={formData.agree_to_terms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="agree_to_terms" className="text-sm text-slate-600">
                  I agree to the exam terms and conditions, and understand that my exam session will be monitored for academic integrity.
                </label>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !formData.agree_to_terms}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Starting Exam...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Exam
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mt-8 bg-slate-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Exam Terms and Conditions</h3>
          <div className="text-sm text-slate-600 space-y-2">
            <p>• You must complete the exam within the specified time limit</p>
            <p>• Your exam session will be monitored for academic integrity</p>
            <p>• You are not allowed to use external resources or communicate with others during the exam</p>
            <p>• Any violation of exam rules may result in disqualification</p>
            <p>• Your personal information will be used only for exam administration purposes</p>
            <p>• By starting the exam, you agree to these terms and conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
