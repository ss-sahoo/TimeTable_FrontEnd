import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import {
  Camera,
  CheckCircle,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  User,
  FileText,
  Play,
  Loader2,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wifi,
  MonitorCheck,
  Clock,
  RefreshCw,
  Smile,
  AlertCircle
} from 'lucide-react';
import Webcam from 'react-webcam';
import { useApi, api } from '../hooks/useApi';

interface Exam {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  enable_webcam_proctoring: boolean;
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
  const webcamRef = useRef<Webcam>(null);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const attemptId = searchParams.get('attempt');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
      title: 'Camera Setup',
      description: 'Position your camera and verify it\'s working properly',
      completed: false
    },
    {
      id: 2,
      title: 'Face Verification',
      description: 'Capture a clear photo of your face for identity verification',
      completed: false
    },
    {
      id: 3,
      title: 'Instructions',
      description: 'Read and accept the exam instructions and rules',
      completed: false
    },
    {
      id: 4,
      title: 'Ready to Start',
      description: 'All checks completed. You\'re ready to begin the exam',
      completed: false
    }
  ]);

  useEffect(() => {
    // Request camera permission
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      setCameraPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission(false);
    }
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setFaceVerified(true);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setFaceVerified(false);
  };

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
      const responseMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(responseMessage || 'Failed to start exam');
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
        return cameraPermission;
      case 2:
        return faceVerified;
      case 3:
        return instructionsAccepted;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                <Sparkles className="h-4 w-4" />
                Camera Setup
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">Let’s verify your camera</h3>
              <p className="mx-auto max-w-2xl text-sm text-slate-600">
                Position your webcam at eye level and ensure your face is well lit. We’ll confirm video feed quality before biometric checks.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-100/50">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="relative p-6">
                  <div className="rounded-3xl bg-slate-900/95 p-4 shadow-inner shadow-slate-900/50">
                    {cameraPermission ? (
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/70 bg-black">
                        <Webcam
                          ref={webcamRef}
                          width={640}
                          height={420}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{
                            width: 640,
                            height: 420,
                            facingMode: 'user'
                          }}
                          className="w-full rounded-2xl"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                          <Check className="h-3 w-3" />
                          Feed Active
                        </div>
                        <div className="absolute inset-x-0 -bottom-16 flex justify-center">
                          <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 px-4 py-2 text-xs text-slate-200 shadow-lg shadow-slate-900/50">
                            <Smile className="h-4 w-4 text-emerald-300" />
                            Maintain a neutral posture and stay centered
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/70 text-center">
                        <Camera className="h-14 w-14 text-slate-400" />
                        <h4 className="mt-4 text-lg font-semibold text-white">Camera access required</h4>
                        <p className="mt-2 max-w-xs text-sm text-slate-400">
                          Grant webcam permission to proceed with our secure, proctored exam environment.
                        </p>
                        <button
                          onClick={requestCameraPermission}
                          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
                        >
                          <Camera className="h-4 w-4" />
                          Enable Camera
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-blue-100 bg-white/85 p-6 shadow-lg shadow-blue-100/40 backdrop-blur">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Readiness Checklist</h4>
                  <p className="mt-2 text-sm text-slate-600">
                    Review these quick checks to ensure your monitoring environment is compliant.
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      { icon: Smile, label: 'Look straight into the camera and keep your face evenly lit.' },
                      { icon: Shield, label: 'Remove hats, sunglasses, and reflective accessories.' },
                      { icon: Wifi, label: 'Verify a stable internet connection for uninterrupted streaming.' },
                      { icon: MonitorCheck, label: 'Close unrelated applications and disable on-screen notifications.' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-3 text-sm text-blue-900">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Exam Snapshot</h4>
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{exam.title}</p>
                        <p className="text-xs text-slate-500">Secure proctoring enabled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{exam.duration_minutes} minutes</p>
                        <p className="text-xs text-slate-500">Allocated exam duration</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <p className="font-medium text-blue-900">
                        Setup calibrates your space for live AI invigilation and integrity enforcement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                <ShieldCheck className="h-4 w-4" />
                Identity Verification
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">Capture a clear identity snapshot</h3>
              <p className="mx-auto max-w-2xl text-sm text-slate-600">
                Align your face within the frame. This quick photo confirms who is taking the exam and powers continuous monitoring.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-100/40">
                <div className="p-6">
                  <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-blue-100 bg-blue-50/60">
                    {capturedImage ? (
                      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/70 shadow-lg shadow-emerald-200/30">
                        <img
                          src={capturedImage}
                          alt="Captured face"
                          className="h-[320px] w-[420px] object-cover"
                        />
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Snapshot saved
                        </div>
                        <div className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-100">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                          Matches requirement
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-inner shadow-blue-200/50">
                        <Webcam
                          ref={webcamRef}
                          width={420}
                          height={320}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{
                            width: 420,
                            height: 320,
                            facingMode: 'user'
                          }}
                          className="h-[320px] w-[420px] rounded-xl border border-blue-100 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {capturedImage ? (
                      <>
                        <button
                          onClick={retakePhoto}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retake photo
                        </button>
                        <button
                          onClick={nextStep}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Looks great — continue
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={capturePhoto}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
                      >
                        <Camera className="h-4 w-4" />
                        Capture identity snapshot
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Photo guidelines</h4>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {[
                      'Frame your face and shoulders; keep the background clutter-free.',
                      'Use consistent, front-facing lighting without harsh shadows.',
                      'Remove reflective eyewear and ensure your eyes are clearly visible.',
                      'Avoid filters or camera effects that alter your appearance.'
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-xl border border-blue-50 bg-blue-50/60 px-3 py-2">
                        <CheckCircle className="mt-1 h-3.5 w-3.5 text-blue-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-lg shadow-emerald-100/40">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <Shield className="h-5 w-5" />
                    <h4 className="text-xs font-semibold uppercase tracking-[0.35em]">Privacy & Security</h4>
                  </div>
                  <p className="text-sm text-emerald-800">
                    The captured frame is encrypted and used only to confirm your identity during proctored monitoring. It is purged after the compliance window closes.
                  </p>
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-white/70 px-3 py-2 text-xs text-emerald-700">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <span>Contact your invigilator immediately if you need to re-register or encounter visual accessibility concerns.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                <FileText className="h-4 w-4" />
                Exam Protocol
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">Review the integrity guidelines</h3>
              <p className="mx-auto max-w-2xl text-sm text-slate-600">
                These rules keep every candidate on a level playing field. Read them carefully and confirm your commitment before moving ahead.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                <div className="rounded-t-3xl border-b border-slate-100 bg-slate-50 px-6 py-4 text-left">
                  <h4 className="text-sm font-semibold text-slate-900">Exam rules & instructions</h4>
                  <p className="text-xs text-slate-500">Your activity is monitored and deviations are auto-flagged for review.</p>
                </div>
                <div className="max-h-[360px] space-y-6 overflow-y-auto px-6 py-6 text-sm text-slate-600">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">General conduct</h5>
                    <ul className="mt-3 space-y-2">
                      {[
                        'You have ' + (exam?.duration_minutes ?? 0) + ' minutes to complete the exam.',
                        'Do not switch tabs, resize the browser, or leave your workspace.',
                        'External assistance, notes, or secondary devices are prohibited.',
                        'Keep your face visible to the camera throughout the session.',
                        'Communicating with others constitutes a violation.'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Technical readiness</h5>
                    <ul className="mt-3 space-y-2">
                      {[
                        'Maintain a stable internet connection and keep your device charged.',
                        'Disable pop-ups, notifications, and screen recording applications.',
                        'Close unrelated tabs, documents, or collaboration tools.',
                        'Choose a quiet, well-lit environment with minimal distractions.'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">Violations & consequences</h5>
                    <ul className="mt-3 space-y-2">
                      {[
                        'Tab switches, audio spikes, or camera absence are logged as alerts.',
                        'Repeated violations may pause or terminate the exam attempt.',
                        'All sessions are recorded; suspicious behavior is escalated to human reviewers.',
                        'Confirmed breaches can result in score invalidation and disciplinary action.'
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-amber-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Monitoring coverage</h4>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      <p className="leading-tight">
                        AI-assisted proctoring watches for face absence, gaze shifts, and screen focus.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <p className="leading-tight">
                        Live invigilators can intervene instantly if anomalies are detected.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <Wifi className="h-4 w-4 text-slate-400" />
                      <p className="leading-tight">
                        Connectivity drops are timestamped; frequent disruptions may flag your attempt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow-lg shadow-blue-100/40">
                  <div className="flex items-center gap-3 text-blue-700">
                    <ShieldAlert className="h-5 w-5" />
                    <h4 className="text-xs font-semibold uppercase tracking-[0.35em]">Compliance acknowledgement</h4>
                  </div>
                  <p className="mt-3 text-sm text-blue-900">
                    By proceeding, you confirm that you understand the monitoring terms and agree to maintain exam integrity for the full duration.
                  </p>
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/80 px-4 py-3">
                    <input
                      type="checkbox"
                      id="accept-instructions"
                      checked={instructionsAccepted}
                      onChange={(e) => setInstructionsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="accept-instructions" className="text-sm text-slate-700">
                      I have reviewed the integrity rules, technical requirements, and consequences. I agree to comply for the entire session.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                Ready to launch
              </div>
              <h3 className="text-2xl font-semibold text-slate-900">Everything looks perfect</h3>
              <p className="mx-auto max-w-2xl text-sm text-slate-600">
                Review the final checklist below, then use the Start Exam button to enter the secure environment.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-100/50">
                <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Setup summary</h4>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    { icon: Camera, label: 'Camera feed verified and active' },
                    { icon: User, label: 'Identity snapshot captured successfully' },
                    { icon: FileText, label: 'Exam instructions acknowledged' },
                    { icon: ShieldCheck, label: 'Environment aligned with integrity requirements' }
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800">
                      <Icon className="h-4 w-4 text-emerald-500" />
                      <p>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Final reminders</h4>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    {[
                      'Stay within camera view and maintain focus on the screen.',
                      'Keep only permitted materials on your desk.',
                      'Silence phones and smart devices to avoid auto-flags.',
                      'If you experience technical issues, notify support immediately.'
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 text-blue-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-blue-200/40">
                  <div className="rounded-3xl bg-slate-900 px-6 py-5 text-sm text-slate-200">
                    <p className="font-semibold text-white">When you’re ready, click “Start Exam” below.</p>
                    <p className="mt-2 text-xs text-slate-300">
                      The secure browser will launch in fullscreen mode. Exiting prematurely will pause monitoring and may require re-entry.
                    </p>
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-slate-200">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-400" />
          <p className="text-sm text-slate-400">Preparing your secure exam setup…</p>
        </div>
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="max-w-sm rounded-3xl border border-red-500/30 bg-red-500/10 px-8 py-10 text-center shadow-2xl shadow-red-900/50 backdrop-blur">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-lg font-semibold text-white">Unable to load exam details</h2>
          <p className="mt-2 text-sm text-red-100/80">Please refresh this page or contact your invigilator.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute top-1/3 right-[-180px] h-[420px] w-[420px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[360px] w-[360px] rounded-full bg-sky-400/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/10 p-8 text-slate-200 shadow-2xl shadow-slate-900/50 backdrop-blur">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-200/80">Proctored Exam Setup</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{exam.title}</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Complete each validation step to activate your secure exam attempt.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-200/80">Attempt Summary</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {attemptData ? `Attempt #${attemptData.attempt_number}` : 'New Attempt'}
              </p>
              <p className="text-xs text-slate-300/90">
                {attemptData ? `Status: ${attemptData.status.replace(/_/g, ' ')}` : 'Status: Not started'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/85 shadow-[0_30px_120px_-60px_rgba(59,130,246,0.6)] backdrop-blur-xl">
          <div className="border-b border-white/20 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-4">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.id);
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                            status === 'completed'
                              ? 'border-emerald-400 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/40'
                              : status === 'current'
                                ? 'border-blue-500 bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-200/50'
                                : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          {status === 'completed' ? <Check className="h-4 w-4" /> : step.id}
                        </div>
                        <div className="hidden sm:block">
                          <p
                            className={`text-xs font-semibold uppercase tracking-[0.3em] ${
                              status === 'current' ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[11px] text-slate-400">{step.description}</p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden flex-1 sm:block">
                          <div
                            className={`h-px w-full ${
                              status === 'completed' ? 'bg-gradient-to-r from-emerald-300 to-blue-300' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="ml-auto text-right text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Step {currentStep} of {steps.length}
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {renderStepContent()}

            <div className="flex flex-col gap-4 border-t border-slate-200/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  currentStep === 1
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-slate-900 text-white shadow-md shadow-slate-900/40 hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
                {steps[currentStep - 1].title}
              </div>

              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    canProceed()
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500'
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-xl shadow-emerald-500/40 transition hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500"
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
  );
};

export default ExamSetup;

