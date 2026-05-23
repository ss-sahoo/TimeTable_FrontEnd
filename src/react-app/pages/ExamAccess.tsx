import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import {
  Key,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  Monitor,
  Shield,
  ArrowRight,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  FileText,
  Brain
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface Exam {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  require_fullscreen: boolean;
  enable_webcam_proctoring: boolean;
  disable_copy_paste: boolean;
  disable_right_click: boolean;
  is_flexible?: boolean;
  exam_mode?: 'online' | 'offline_omr' | 'offline_subjective';
  omr_sheet_file?: string;
  omr_sheet_generated?: boolean;
}

interface SystemCheck {
  camera: boolean;
  fullscreen: boolean;
  notifications: boolean;
  microphone: boolean;
}

const ExamAccess: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemChecks, setSystemChecks] = useState<SystemCheck>({
    camera: false,
    fullscreen: false,
    notifications: false,
    microphone: false
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canStart, setCanStart] = useState(false);
  const [omrFile, setOmrFile] = useState<File | null>(null);
  const [omrUploading, setOmrUploading] = useState(false);
  const [omrSuccess, setOmrSuccess] = useState(false);
  const [omrSubmissions, setOmrSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Subjective Upload State
  const [subjectiveFile, setSubjectiveFile] = useState<File | null>(null);
  const [subjectiveUploading, setSubjectiveUploading] = useState(false);
  const [subjectiveSuccess, setSubjectiveSuccess] = useState(false);

  const { data: examData, loading: examLoading, error: examError } = useApi<Exam>(`/exams/exams/${examId}/`);

  useEffect(() => {
    if (examData) {
      setExam(examData);
      checkSystemRequirements(examData);
    }
  }, [examData]);

  useEffect(() => {
    if (exam) {
      const updateTimer = () => {
        const now = new Date();
        const startDate = new Date(exam.start_date);
        const endDate = new Date(exam.end_date);

        console.log('Exam timing check:', {
          now: now.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: now >= startDate && now <= endDate
        });

        if (now < startDate) {
          // Exam hasn't started yet - show countdown to start
          setTimeRemaining(Math.max(0, Math.floor((startDate.getTime() - now.getTime()) / 1000)));
          setCanStart(false);
        } else if (now > endDate) {
          // Exam has ended
          setTimeRemaining(0);
          setCanStart(false);
        } else {
          // Exam is active - show time remaining in exam duration
          setTimeRemaining(Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000)));
          setCanStart(true);
        }
      };

      // Run immediately
      updateTimer();

      // Then set up interval
      const interval = setInterval(updateTimer, 1000);

      if (exam.exam_mode === 'offline_omr' || exam.exam_mode === 'offline_subjective') {
        fetchSubmissions();
      }

      return () => clearInterval(interval);
    }
  }, [exam]);

  const checkSystemRequirements = async (examDetails?: Exam) => {
    const requiresCamera = !!examDetails?.enable_webcam_proctoring;
    const requiresFullscreen = !!examDetails?.require_fullscreen;

    const checks: SystemCheck = {
      camera: !requiresCamera,
      fullscreen: !requiresFullscreen,
      notifications: false,
      microphone: !requiresCamera
    };

    // Check camera - improved permission handling
    try {
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        console.log('Camera access requires HTTPS');
        checks.camera = !requiresCamera;
      } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera API not available');
        checks.camera = !requiresCamera;
      } else if (requiresCamera) {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        checks.camera = true;
        // Stop the stream immediately after checking
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error: any) {
      console.log('Camera not available or permission denied:', error);
      checks.camera = !requiresCamera;
    }

    // Check fullscreen API
    if (requiresFullscreen) {
      checks.fullscreen = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      );
    } else {
      checks.fullscreen = true;
    }

    // Check notifications
    checks.notifications = 'Notification' in window && Notification.permission !== 'denied';

    // Check microphone
    if (requiresCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        checks.microphone = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.log('Microphone not available:', error);
      }
    } else {
      checks.microphone = true;
    }

    setSystemChecks(checks);
  };

  const handleSubjectiveUpload = async () => {
    if (!subjectiveFile || !exam) return;

    setSubjectiveUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', subjectiveFile);
      formData.append('auto_evaluate', 'true');

      await api.post(`/ai-evaluation/${exam.id}/upload-answer-sheet/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubjectiveSuccess(true);
      setSubjectiveFile(null);
      fetchSubmissions(); // Update list
    } catch (err: any) {
      console.error('Failed to upload subjective answer sheet:', err);
      setError(err.response?.data?.error || 'Failed to upload answer sheet. Please try again.');
    } finally {
      setSubjectiveUploading(false);
    }
  };


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/exams/validate-access/', {
        access_code: accessCode
      });

      const data = response.data;

      if (data.access_granted) {
        setExam(data.exam);
        checkSystemRequirements(data.exam);
      } else {
        setError(data.error || 'Invalid access code');
      }
    } catch (error) {
      setError('Failed to validate access code');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        setError('Camera access requires HTTPS. Please use https://localhost:5174 or enable HTTPS in your development server.');
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use Chrome, Firefox, or Edge.');
        return;
      }

      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      // Update camera status
      setSystemChecks(prev => ({ ...prev, camera: true }));

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Also request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
        setSystemChecks(prev => ({ ...prev, notifications: Notification.permission === 'granted' }));
      }

      setError(null); // Clear any previous errors

    } catch (error: any) {
      console.error('Permission request failed:', error);

      let errorMessage = 'Failed to get camera permission. ';

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access in your browser settings and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access is not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }

      setError(errorMessage);
    }
  };

  const handleStartExam = () => {
    if (!canStart) {
      return;
    }

    if (exam?.enable_webcam_proctoring && !systemChecks.camera) {
      setError('Camera access is required before starting this proctored exam.');
      return;
    }

    // Navigate to pre-exam setup
    navigate(`/exam-setup/${exam?.id}`);
  };

  const handleOMRUpload = async () => {
    if (!omrFile || !exam) return;

    setOmrUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('files', omrFile);
      formData.append('auto_evaluate', 'true');

      await api.post(`/omr/submissions/upload/${exam.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setOmrSuccess(true);
      setOmrFile(null);
      fetchSubmissions(); // Update list
    } catch (err: any) {
      console.error('Failed to upload OMR:', err);
      setError(err.response?.data?.error || 'Failed to upload OMR sheet. Please try again.');
    } finally {
      setOmrUploading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!examId || !exam) return;
    try {
      setLoadingSubmissions(true);
      let endpoint = '';
      if (exam.exam_mode === 'offline_omr') {
        endpoint = `/omr/submissions/?exam_id=${examId}`;
      } else if (exam.exam_mode === 'offline_subjective') {
        endpoint = `/ai-evaluation/${examId}/submissions/`;
      }

      if (!endpoint) return;

      const response = await api.get(endpoint);
      setOmrSubmissions(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };


  if (examLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading exam: {examError || 'Exam not found'}</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Access</h1>
            <p className="text-gray-600">Verify your access and check system requirements</p>
          </div>

          {/* Exam Info Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                <p className="text-gray-600 mb-4">{exam.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="text-lg font-semibold text-gray-900">{exam.duration_minutes} minutes</div>
                {exam.is_flexible && (
                  <div className="mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
                      Flexible Window
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Starts: {new Date(exam.start_date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Ends: {new Date(exam.end_date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Proctored: {exam.enable_webcam_proctoring ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Availability UI */}
            {timeRemaining > 0 && (
              <div className={`rounded-xl p-6 mb-8 border-2 ${exam.is_flexible ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
                {exam.is_flexible ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2 text-indigo-800">
                      <Clock className="w-6 h-6" />
                      <span className="text-xl font-bold">Flexible Exam Window Active</span>
                    </div>
                    <p className="text-indigo-700 font-medium">
                      You can start this exam anytime before it closes on <span className="font-bold underline">{new Date(exam.end_date).toLocaleString()}</span>.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                      <Clock className="w-5 h-5" />
                      Duration: {exam.duration_minutes} Minutes
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">
                        {new Date() < new Date(exam.start_date) ? 'Exam starts in: ' : 'Time remaining: '}
                      </span>
                    </div>
                    <span className="text-3xl font-bold text-blue-900 font-mono">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Access Code Form (if needed) */}
          {!examId && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Enter Access Code
              </h3>

              <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter your exam access code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !accessCode.trim()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Validate Access
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* System Requirements Check - Hide for offline exams */}
          {exam.exam_mode === 'online' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                System Requirements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${systemChecks.camera ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                  <Camera className={`w-5 h-5 ${systemChecks.camera ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Camera</div>
                    <div className={`text-sm ${systemChecks.camera ? 'text-green-600' : 'text-red-600'}`}>
                      {systemChecks.camera ? 'Available' : 'Required for proctoring'}
                    </div>
                  </div>
                  {systemChecks.camera ? (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 ml-auto" />
                  )}
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg border ${systemChecks.fullscreen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                  <Monitor className={`w-5 h-5 ${systemChecks.fullscreen ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Fullscreen Mode</div>
                    <div className={`text-sm ${systemChecks.fullscreen ? 'text-green-600' : 'text-red-600'}`}>
                      {systemChecks.fullscreen ? 'Supported' : 'Not supported'}
                    </div>
                  </div>
                  {systemChecks.fullscreen ? (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 ml-auto" />
                  )}
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg border ${systemChecks.notifications ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <Shield className={`w-5 h-5 ${systemChecks.notifications ? 'text-green-600' : 'text-yellow-600'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Notifications</div>
                    <div className={`text-sm ${systemChecks.notifications ? 'text-green-600' : 'text-yellow-600'}`}>
                      {systemChecks.notifications ? 'Enabled' : 'Recommended'}
                    </div>
                  </div>
                  {systemChecks.notifications ? (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 ml-auto" />
                  )}
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg border ${systemChecks.microphone ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <Camera className={`w-5 h-5 ${systemChecks.microphone ? 'text-green-600' : 'text-yellow-600'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Microphone</div>
                    <div className={`text-sm ${systemChecks.microphone ? 'text-green-600' : 'text-yellow-600'}`}>
                      {systemChecks.microphone ? 'Available' : 'Optional'}
                    </div>
                  </div>
                  {systemChecks.microphone ? (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 ml-auto" />
                  )}
                </div>
              </div>

              {(!systemChecks.camera || !systemChecks.notifications) && (
                <div className="mb-4">
                  <button
                    onClick={handleRequestPermissions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Request Permissions
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Notice
            </h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• This exam is monitored and recorded for security purposes</li>
              <li>• Do not switch tabs or minimize the browser window</li>
              <li>• Ensure you are in a quiet, well-lit environment</li>
              <li>• Keep your face visible to the camera at all times</li>
              <li>• Any suspicious activity may result in exam disqualification</li>
            </ul>
          </div>

          {/* Start Exam or OMR Upload Button */}
          <div className="text-center">
            {exam?.exam_mode === 'offline_omr' ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">OMR Exam Instructions</h3>
                  <p className="text-gray-600 mb-4">This is an offline OMR-based exam. Please follow the steps below:</p>
                  <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                    <button
                      onClick={() => window.open(`/api/exams/exams/${exam.id}/question-paper/`, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all font-semibold"
                    >
                      <Download className="w-5 h-5" />
                      Download Question Paper
                    </button>
                    {exam.omr_sheet_file && (
                      <a
                        href={exam.omr_sheet_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold"
                      >
                        <Download className="w-5 h-5" />
                        Download OMR Sheet
                      </a>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Upload Scanned Answer Sheet</h4>

                  {omrSuccess ? (
                    <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h5 className="text-lg font-bold text-green-800 mb-1">Upload Successful!</h5>
                      <p className="text-green-700 mb-4">Your OMR sheet has been submitted for evaluation. You will receive your results shortly.</p>
                      <button
                        onClick={() => navigate('/student-dashboard')}
                        className="text-green-700 font-semibold hover:underline"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-w-md mx-auto">
                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${omrFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className={`w-8 h-8 mb-2 ${omrFile ? 'text-blue-600' : 'text-gray-400'}`} />
                            <p className="text-sm text-gray-700">
                              {omrFile ? omrFile.name : 'Click to select scanned OMR (PDF/Image)'}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*"
                            onChange={(e) => setOmrFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      {omrFile && (
                        <button
                          onClick={handleOMRUpload}
                          disabled={omrUploading}
                          className="w-full max-w-md px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-bold transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          {omrUploading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          {omrUploading ? 'Uploading...' : 'Submit Answer Sheet'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Submissions List */}
                <div className="mt-12 text-left">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Your Submissions
                  </h4>

                  {loadingSubmissions ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : omrSubmissions.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No submissions found yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {omrSubmissions.map((sub) => (
                        <div key={sub.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sub.status === 'completed' ? 'bg-green-100 text-green-600' :
                              sub.status === 'processing' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                              }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Submission #{sub.id}</p>
                              <p className="text-xs text-gray-500">{new Date(sub.created_at).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {sub.score !== null && (
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{sub.score}/{sub.max_score}</p>
                                <p className="text-xs text-green-600 font-medium">{((sub.score / sub.max_score) * 100).toFixed(0)}% Accuracy</p>
                              </div>
                            )}

                            <div className="text-right flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sub.status === 'completed' ? 'bg-green-100 text-green-700' :
                                sub.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {sub.status}
                              </span>
                              {sub.status === 'completed' && (
                                <button
                                  onClick={() => navigate(`/exam-results/exam/${exam.id}`)}
                                  className="text-[10px] text-blue-600 font-bold hover:underline"
                                >
                                  VIEW DETAILED RESULT
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : exam?.exam_mode === 'offline_subjective' ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Subjective Exam Instructions</h3>
                  <p className="text-gray-600 mb-4">This is an offline subjective exam. Please follow the steps below:</p>
                  <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                    <button
                      onClick={() => window.open(`/api/exams/exams/${exam.id}/question-paper/`, '_blank')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all font-semibold"
                    >
                      <Download className="w-5 h-5" />
                      Download Question Paper
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Upload Handwritten Answer Sheet</h4>

                  {subjectiveSuccess ? (
                    <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h5 className="text-lg font-bold text-green-800 mb-1">Upload Successful!</h5>
                      <p className="text-green-700 mb-4">Your answer sheet has been submitted for AI evaluation. This may take a minute.</p>
                      <button
                        onClick={() => {
                          setSubjectiveSuccess(false);
                          fetchSubmissions();
                        }}
                        className="text-green-700 font-semibold hover:underline"
                      >
                        Upload Another Sheet / Refresh Submissions
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-w-md mx-auto">
                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${subjectiveFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className={`w-8 h-8 mb-2 ${subjectiveFile ? 'text-blue-600' : 'text-gray-400'}`} />
                            <p className="text-sm text-gray-700">
                              {subjectiveFile ? subjectiveFile.name : 'Click to select answer sheet (PDF/Image)'}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*"
                            onChange={(e) => setSubjectiveFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>

                      {subjectiveFile && (
                        <button
                          onClick={handleSubjectiveUpload}
                          disabled={subjectiveUploading}
                          className="w-full max-w-md px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-bold transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          {subjectiveUploading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          {subjectiveUploading ? 'Processing with AI...' : 'Submit for AI Evaluation'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Submissions List */}
                <div className="mt-12 text-left">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Your AI Evaluations
                  </h4>

                  {loadingSubmissions ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : omrSubmissions.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No submissions found yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {omrSubmissions.map((sub) => (
                        <div key={sub.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                              <Brain className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Evaluation #{sub.id}</p>
                              <p className="text-xs text-gray-500">{new Date(sub.created_at).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {sub.score !== null && (
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">{sub.score}/{sub.evaluation_result.max_score}</p>
                                <p className="text-xs text-green-600 font-medium">{sub.percentage?.toFixed(1)}% Score</p>
                              </div>
                            )}

                            <div className="text-right flex flex-col items-end gap-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                                COMPLETED
                              </span>
                              <button
                                onClick={() => navigate(`/exam-results/exam/${exam.id}`)}
                                className="text-[10px] text-blue-600 font-bold hover:underline"
                              >
                                VIEW REPORT
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Existing Online Exam logic */}

                <button
                  onClick={handleStartExam}
                  disabled={!canStart || (exam?.enable_webcam_proctoring && !systemChecks.camera)}
                  className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center gap-3 mx-auto ${canStart && (exam?.enable_webcam_proctoring ? systemChecks.camera : true)
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <ArrowRight className="w-5 h-5" />
                  {canStart ? 'Proceed to Pre-Exam Setup' : 'Exam Not Yet Available'}
                </button>
              </>
            )}

            {!canStart && timeRemaining > 0 && (
              <p className="text-gray-500 mt-2">
                {new Date() < new Date(exam.start_date)
                  ? `Exam will be available in ${formatTime(timeRemaining)}`
                  : 'Exam has ended'
                }
              </p>
            )}

            {canStart && exam?.enable_webcam_proctoring && !systemChecks.camera && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  <strong>Camera Required:</strong> Camera access is required to start this proctored exam.
                </p>
                <p className="text-red-500 text-xs mt-1">
                  If you're having issues, make sure you're using <strong>localhost</strong> or <strong>HTTPS</strong>.
                </p>
                <p className="text-red-500 text-xs">
                  Click "Request Permissions" above to try again.
                </p>
              </div>
            )}

            {/* Fallback Start Button - Always visible for testing */}
            {!canStart && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm mb-2">
                  <strong>Testing Mode:</strong> If the exam should be available, you can force start it below.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      console.log('Force starting exam...');
                      navigate(`/exam-setup/${exam?.id}`);
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Force Start Exam (Testing)
                  </button>
                  <button
                    onClick={() => {
                      console.log('Going to secure exam view...');
                      navigate(`/secure-exam/1`); // Using a test attempt ID
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Exam Interface (Testing)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAccess;


