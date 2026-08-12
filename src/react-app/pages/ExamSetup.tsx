import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import {
  CheckCircle,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Play,
  Loader2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Target,
  BookOpen
} from 'lucide-react';
import { useApi, api, getErrorMessage } from '../hooks/useApi';

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  question_type: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  enable_webcam_proctoring: boolean;
  total_marks?: number;
  total_questions?: number;
  pattern?: {
    id: number;
    name: string;
    sections: PatternSection[];
  };
}

interface ExamAttempt {
  id: number;
  status: string;
  attempt_number: number;
  exam: Exam;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const ExamSetup: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const attemptId = searchParams.get('attempt');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);

  // Use useApi hook to fetch exam data
  const attemptEndpoint = attemptId ? `/exams/attempts/${attemptId}/` : '';
  const { data: attemptData, loading: attemptLoading, error: attemptError } = useApi<ExamAttempt>(
    attemptEndpoint,
    [attemptEndpoint]
  );

  const examEndpoint = attemptId ? '' : `/exams/exams/${examId}/`;
  const { data: examResponse, loading: examLoading, error: examError } = useApi<Exam>(
    examEndpoint,
    [examEndpoint]
  );

  const exam = useMemo<Exam | null>(() => {
    if (attemptData?.exam) {
      return attemptData.exam;
    }
    return examResponse ?? null;
  }, [attemptData, examResponse]);

  const [steps] = useState<SetupStep[]>([
    {
      id: 1,
      title: 'Exam Information & Terms',
      description: 'Review exam details and accept terms & conditions',
      completed: false
    }
  ]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startExam = async () => {
    if (attemptId) {
      navigate(`/secure-exam/${attemptId}`);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/exams/start-exam/', {
        exam_id: parseInt(examId!, 10)
      });

      const newAttemptId = response?.data?.attempt?.id;
      if (newAttemptId) {
        navigate(`/secure-exam/${newAttemptId}`);
      } else {
        setError('Failed to initialize exam attempt. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Start exam error:', error);
      setError(getErrorMessage(error, 'Failed to start exam'));
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return instructionsAccepted;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="h-full flex flex-col">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                <FileText className="h-4 w-4" />
                Exam Information & Terms
              </div>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">Review exam details and accept terms</h3>
              <p className="mt-2 text-sm text-slate-600">
                Please review the exam information and instructions carefully.
              </p>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-y-auto">
              <div className="col-span-8 flex flex-col">
                <div className="rounded-xl border border-slate-200 bg-white shadow-md">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <h4 className="text-sm font-semibold text-slate-900">Exam Details</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Title</p>
                        <p className="text-sm font-medium text-slate-900 mt-1 truncate">{exam?.title}</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Duration</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">{exam?.duration_minutes} min</p>
                      </div>
                    </div>
                    
                    {exam?.description && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 mb-1.5">Description</p>
                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">{exam.description}</p>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <h5 className="text-sm font-semibold text-slate-900 mb-2">Exam Rules</h5>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {[
                          `You have ${exam?.duration_minutes ?? 0} minutes to complete.`,
                          'Do not switch tabs or resize browser.',
                          'External assistance is prohibited.',
                          'Keep face visible to camera.',
                          'No communication with others.'
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-4 space-y-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-md">
                  <div className="flex items-center gap-2 text-blue-700 mb-3">
                    <ShieldAlert className="h-4 w-4" />
                    <h4 className="text-xs font-semibold uppercase tracking-[0.3em]">Terms & Conditions</h4>
                  </div>
                  <p className="text-xs text-blue-900 mb-3 leading-relaxed">
                    By proceeding, you confirm understanding of monitoring terms and agree to maintain exam integrity.
                  </p>
                  <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2.5">
                    <input
                      type="checkbox"
                      id="accept-instructions"
                      checked={instructionsAccepted}
                      onChange={(e) => setInstructionsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="accept-instructions" className="text-xs text-slate-700 leading-relaxed">
                      I have reviewed the exam rules and agree to comply for the entire session.
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-3">Monitoring</h4>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      <p className="leading-relaxed">AI-assisted proctoring</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <p className="leading-relaxed">Live invigilators</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLoading = attemptId ? attemptLoading : examLoading;
  const loadError = attemptId ? attemptError : examError;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center text-slate-700">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-600">Preparing your secure exam setup…</p>
        </div>
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4">
        <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 px-8 py-10 text-center shadow-lg">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-lg font-semibold text-slate-900">Unable to load exam details</h2>
          <p className="mt-2 text-sm text-slate-600">Please refresh this page or contact your invigilator.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <div className="relative h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Proctored Exam Setup</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 truncate">{exam.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Attempt</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">
                  {attemptData ? `#${attemptData.attempt_number}` : 'New'}
                </p>
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Step {currentStep}/{steps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Exam Details Summary */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-3">
          <div className="grid grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Duration</p>
                <p className="text-sm font-semibold text-slate-900">{exam.duration_minutes} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Questions</p>
                <p className="text-sm font-semibold text-slate-900">{exam.total_questions || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total Marks</p>
                <p className="text-sm font-semibold text-slate-900">{exam.total_marks || 'N/A'}</p>
              </div>
            </div>
            {exam.pattern?.sections && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Subjects</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Set(exam.pattern.sections.map(s => s.subject)).size}
                  </p>
                </div>
              </div>
            )}
            {exam.pattern?.sections && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Subject List</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(exam.pattern.sections.map(s => s.subject))).slice(0, 3).map((subject) => (
                    <span key={subject} className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {subject}
                    </span>
                  ))}
                  {Array.from(new Set(exam.pattern.sections.map(s => s.subject))).length > 3 && (
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      +{Array.from(new Set(exam.pattern.sections.map(s => s.subject))).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
                        status === 'completed'
                          ? 'border-emerald-400 bg-emerald-500 text-white shadow-sm'
                          : status === 'current'
                            ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {status === 'completed' ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.25em] ${
                          status === 'current' ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1">
                      <div
                        className={`h-px ${
                          status === 'completed' ? 'bg-gradient-to-r from-emerald-300 to-blue-300' : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full p-4">
            <div className="h-full w-full rounded-xl border border-slate-200 bg-white shadow-lg flex flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              </div>
            )}

                {renderStepContent()}
              </div>

              {/* Footer Actions */}
              <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      currentStep === 1
                        ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'bg-slate-700 text-white shadow-sm hover:bg-slate-600'
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {steps[currentStep - 1].title}
                  </div>

                  {currentStep < steps.length ? (
                    <button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                        canProceed()
                          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-500'
                          : 'cursor-not-allowed bg-slate-200 text-slate-400'
                      }`}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={startExam}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-400"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Launching…
                        </>
                      ) : (
                        <>
                          Start Exam
                          <Play className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSetup;

