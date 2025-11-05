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
  Loader2
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

  const { data: examData, loading: examLoading, error: examError } = useApi(`/exams/exams/${examId}/`);

  useEffect(() => {
    if (examData) {
      setExam(examData);
      checkSystemRequirements();
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

      return () => clearInterval(interval);
    }
  }, [exam]);

  const checkSystemRequirements = async () => {
    const checks: SystemCheck = {
      camera: false,
      fullscreen: false,
      notifications: false,
      microphone: false
    };

    // Check camera - improved permission handling
    try {
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        console.log('Camera access requires HTTPS');
        checks.camera = false;
      } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera API not available');
        checks.camera = false;
      } else {
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
      checks.camera = false;
    }

    // Check fullscreen API
    checks.fullscreen = !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );

    // Check notifications
    checks.notifications = 'Notification' in window && Notification.permission !== 'denied';

    // Check microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      checks.microphone = true;
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.log('Microphone not available:', error);
    }

    setSystemChecks(checks);
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
        checkSystemRequirements();
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
    if (!canStart || !systemChecks.camera) {
      return;
    }

    // Navigate to pre-exam setup
    navigate(`/exam-setup/${exam?.id}`);
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

            {/* Countdown Timer */}
            {timeRemaining > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {new Date() < new Date(exam.start_date) ? 'Exam starts in: ' : 'Time remaining: '}
                  </span>
                  <span className="text-2xl font-bold text-blue-900 font-mono">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
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

          {/* System Requirements Check */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              System Requirements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                systemChecks.camera ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
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

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                systemChecks.fullscreen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
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

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                systemChecks.notifications ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
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

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                systemChecks.microphone ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
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

          {/* Start Exam Button */}
          <div className="text-center">
            {/* Debug Information */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>Can Start: {canStart ? 'Yes' : 'No'}</p>
              <p>Camera Available: {systemChecks.camera ? 'Yes' : 'No'}</p>
              <p>Time Remaining: {formatTime(timeRemaining)}</p>
              <p>Current Time: {new Date().toLocaleString()}</p>
              <p>Exam Start: {exam ? new Date(exam.start_date).toLocaleString() : 'N/A'}</p>
              <p>Exam End: {exam ? new Date(exam.end_date).toLocaleString() : 'N/A'}</p>
              <p>Protocol: {window.location.protocol}</p>
              <p>Hostname: {window.location.hostname}</p>
              <p>getUserMedia Support: {navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'Yes' : 'No'}</p>
            </div>

            <button
              onClick={handleStartExam}
              disabled={!canStart || !systemChecks.camera}
              className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center gap-3 mx-auto ${
                canStart && systemChecks.camera
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {!canStart ? (
                <>
                  <Clock className="w-5 h-5" />
                  Exam Not Available Yet
                </>
              ) : !systemChecks.camera ? (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Camera Required
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Start Exam
                </>
              )}
            </button>
            
            {!canStart && timeRemaining > 0 && (
              <p className="text-gray-500 mt-2">
                {new Date() < new Date(exam.start_date) 
                  ? `Exam will be available in ${formatTime(timeRemaining)}`
                  : 'Exam has ended'
                }
              </p>
            )}
            
            {canStart && !systemChecks.camera && (
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


