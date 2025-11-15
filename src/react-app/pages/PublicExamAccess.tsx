import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  Phone,
  Play,
  Shield,
  ShieldOff,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface PublicExam {
  id: number;
  exam_id: number;
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
  public_allow_multiple_devices: boolean;
  public_allowed_ip_ranges: string[];
  public_token_expires_at?: string | null;
}

interface ExamAccessForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  agree_to_terms: boolean;
}

interface AccessGrantedPayload {
  access_token: string;
  refresh_token: string;
  exam_id: number;
  exam: {
    id: number;
    title: string;
    duration_minutes: number;
    total_questions: number;
    total_marks: number;
  };
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    institute?: {
      id: number;
      name: string;
    };
  };
  message: string;
}

export default function PublicExamAccess() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<PublicExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
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
  const [accessPayload, setAccessPayload] = useState<AccessGrantedPayload | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const [startExamError, setStartExamError] = useState<string | null>(null);

  // Fetch exam details
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        if (!token) {
          setError('Invalid exam link');
          return;
        }

        const response = await api.get(`/exams/public-access/${token}/`);
        const examData = response.data;

        setExam({
          ...examData,
          id: examData.exam_id,
        });
      } catch (err: any) {
        const responseMessage = err?.response?.data?.error;
        const fallbackMessage = err?.message === 'Network Error'
          ? 'We could not connect to the exam server. Please check your connection and try again.'
          : 'Failed to load exam details';
        setError(responseMessage || fallbackMessage);
        console.error('Error fetching exam:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchExam();
    }
  }, [token]);

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
    setSubmitSuccess(null);

    try {
      const response = await api.post('/exams/public-access/', {
        token: token || '',
        ...formData,
      });

      const data: AccessGrantedPayload = response.data;

      // Persist tokens for subsequent API calls and protected routes
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem(
        'public_exam_user',
        JSON.stringify({
          ...data.user,
          accessed_at: new Date().toISOString(),
          exam_id: data.exam_id,
        })
      );

      setAccessPayload(data);
      setSubmitSuccess('Great! You are verified for this session. When you are ready, continue to the secure exam.');
      setSubmitError(null);
    } catch (err) {
      setSubmitError('Failed to start exam. Please try again.');
      console.error('Error starting exam:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToExam = async () => {
    if (!exam || !accessPayload) return;

    setStartingExam(true);
    setStartExamError(null);

    try {
      const response = await api.post('/exams/start-exam/', {
        exam_id: exam.id,
      });

      const attemptId = response?.data?.attempt?.id;

      if (attemptId) {
        // Persist metadata to restore context if tab reloads
        sessionStorage.setItem(
          'active_public_exam_session',
          JSON.stringify({
            examId: exam.id,
            attemptId,
            title: exam.title,
            startedAt: new Date().toISOString(),
          })
        );

        // Use hard redirect so AuthContext rehydrates with new tokens immediately
        window.location.href = `/exam-setup/${exam.id}?attempt=${attemptId}&public=1`;
      } else {
        setStartExamError('We received an unexpected response. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to initiate secure exam:', err);
      setStartExamError(err?.response?.data?.error || 'Unable to create an exam session right now.');
    } finally {
      setStartingExam(false);
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

  const examMetrics = useMemo(() => {
    if (!exam) return [];

    return [
      {
        label: 'Duration',
        value: `${exam.duration_minutes} mins`,
        icon: Clock,
      },
      {
        label: 'Questions',
        value: exam.total_questions,
        icon: BookOpen,
      },
      {
        label: 'Total Marks',
        value: exam.total_marks,
        icon: Target,
      },
      {
        label: 'Max Attempts',
        value: exam.max_attempts,
        icon: Shield,
      },
    ];
  }, [exam]);

  const timeline = [
    {
      title: 'Access & Verification',
      description: 'Complete identity verification and accept integrity guidelines.',
    },
    {
      title: 'Secure Exam Environment',
      description: 'System checks your device, webcam and network before launch.',
    },
    {
      title: 'Attempt the Exam',
      description: 'Answer all questions within the allotted time under supervision.',
    },
    {
      title: 'Submit & Confirmation',
      description: 'Review your responses, submit and receive confirmation instantly.',
    },
    {
      title: 'Results & Feedback',
      description: 'Track your performance once evaluation is complete.',
    },
  ];

  const errorExperience = useMemo(() => {
    if (!error) return null;

    const normalized = error.toLowerCase();

    if (normalized.includes('ended')) {
      return {
        title: 'This exam session has concluded',
        subtitle: 'The examination window is closed and no longer accepts new candidates.',
        badge: 'Exam ended',
        icon: CheckCircle,
        tone: 'ended'
      };
    }

    if (normalized.includes('not started')) {
      return {
        title: 'You’re a bit early!',
        subtitle: 'The secure exam environment will be available once the scheduled start time arrives.',
        badge: 'Exam not started',
        icon: Calendar,
        tone: 'upcoming'
      };
    }

    if (normalized.includes('expired')) {
      return {
        title: 'This link has expired',
        subtitle: 'The public access link you used is no longer valid. Request a fresh access link from the exam organiser.',
        badge: 'Link expired',
        icon: ShieldOff,
        tone: 'expired'
      };
    }

    if (normalized.includes('not publicly accessible')) {
      return {
        title: 'Restricted access exam',
        subtitle: 'This assessment is limited to invited candidates only. Please contact your invigilator for access.',
        badge: 'Restricted exam',
        icon: Shield,
        tone: 'restricted'
      };
    }

    return {
      title: 'We couldn’t load this exam',
      subtitle: 'Something unexpected happened while preparing your exam experience. Refresh the page or try again shortly.',
      badge: 'Try again',
      icon: AlertCircle,
      tone: 'default'
    };
  }, [error]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
        <div className="relative text-center text-slate-600">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-blue-500/60 border-t-transparent" />
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-600/80">
            Preparing your exam experience…
          </p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute bottom-10 right-12 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        </div>
        <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-2xl shadow-blue-100/50">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
            {errorExperience?.icon ? (
              <errorExperience.icon className="h-10 w-10" />
            ) : (
              <AlertCircle className="h-10 w-10" />
            )}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
            {errorExperience?.badge || 'Status update'}
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-slate-900">
            {errorExperience?.title || 'Exam not available'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {errorExperience?.subtitle || error}
          </p>
          {error && errorExperience?.subtitle !== error && (
            <p className="mt-2 text-xs text-slate-400">({error})</p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
            >
              Go to dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
          >
              Try again
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-24 bg-sky-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Secure Candidate Portal
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          {/* Overview Pane */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-blue-100/40">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-blue-500">
                    Public Exam Access
                  </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">{exam.title}</h1>
                    {exam.institute_name && (
                      <p className="mt-1 text-sm text-slate-500">
                        Hosted by {exam.institute_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.3em] text-blue-600">
                  Exam ID #{exam.exam_id}
                </div>
              </div>

              {exam.description && (
                <p className="mt-6 text-sm leading-relaxed text-slate-600">
                  {exam.description}
                </p>
              )}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {examMetrics.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="rounded-xl bg-white p-2 shadow-sm">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-blue-500">
                        {label}
                      </p>
                      <p className="text-base font-medium text-slate-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-slate-700 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Opens</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(exam.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Closes</p>
                    <p className="text-sm font-medium text-slate-900">{formatDate(exam.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                      Delivered By
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {exam.created_by_name || 'Invigilator'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                      Attempts Allowed
                    </p>
                    <p className="text-sm font-medium text-slate-900">{exam.max_attempts}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div className="flex items-center gap-2 text-slate-900">
                <Shield className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold">Exam Security & Integrity</h2>
              </div>
              <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Proctored Environment
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed">
                    Live monitoring with AI checks ensures authentic participation and flags suspicious behaviour in real time.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Users className="h-4 w-4 text-blue-600" />
                    Identity Verification
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed">
                    We validate your details against secure records before granting exam access.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Target className="h-4 w-4 text-blue-600" />
                    Time-Bound Session
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed">
                    The exam timer starts the moment you enter the secure environment and cannot be paused.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Globe className="h-4 w-4 text-blue-600" />
                    Location Controls
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed">
                    Access is restricted to approved networks and device configurations for fairness.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-lg shadow-slate-200/60">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-blue-600" />
                What Happens Next
              </h3>
              <div className="space-y-4">
                {timeline.map((item, idx) => (
                  <div
                    key={item.title}
                    className="relative pl-8"
                  >
                    <div className="absolute left-0 top-1 flex h-full flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700">
                        {idx + 1}
                      </div>
                      {idx !== timeline.length - 1 && (
                        <div className="mt-1 h-full w-px bg-gradient-to-b from-blue-200 to-transparent" />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Pane */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-blue-100/40">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Confirm Your Identity</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  We use these details to personalise your exam session and share your results. Please ensure everything matches your official records.
                </p>
              </div>

              {!accessPayload ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first_name"
                        className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        First Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="e.g. Priya"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="last_name"
                        className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="e.g. Sharma"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="student_id"
                      className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Student ID
                    </label>
                    <input
                      type="text"
                      id="student_id"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <label className="flex items-start gap-3 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        id="agree_to_terms"
                        name="agree_to_terms"
                        checked={formData.agree_to_terms}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        I confirm that the information provided is accurate and I agree to follow the exam rules, proctoring requirements and honour code for this assessment.
                      </span>
                    </label>
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      <AlertCircle className="mt-0.5 h-5 w-5" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !formData.agree_to_terms}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Verify & Continue
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-emerald-700">Access granted</p>
                      <p className="text-xs leading-relaxed text-emerald-600">
                        {submitSuccess}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-900">Next steps</p>
                    <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                      <li>We will launch secure exam setup in the next screen.</li>
                      <li>Complete camera, microphone and environment checks.</li>
                      <li>Enter fullscreen proctoring to begin attempting questions.</li>
                    </ol>
                  </div>

                  {startExamError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <p>{startExamError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleContinueToExam}
                    disabled={startingExam}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-400/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {startingExam ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Preparing secure exam…
                      </>
                    ) : (
                      <>
                        Enter secure exam environment
                        <Play className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-lg shadow-slate-200/60">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Please remember</h3>
              <ul className="space-y-2 text-xs leading-relaxed">
                <li>• Complete the exam within the allotted time once the secure session starts.</li>
                <li>• Your webcam and screen activity may be monitored throughout.</li>
                <li>• External resources or assistance are strictly prohibited.</li>
                <li>• Any violation may lead to immediate disqualification.</li>
                <li>• Your details are protected and only used for administering this exam.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
