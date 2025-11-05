import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  User,
  FileText,
  Play,
  Loader2
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

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const ExamSetup: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);

  // Use useApi hook to fetch exam data
  const { data: exam, loading: examLoading, error: examError } = useApi(`/exams/exams/${examId}/`);

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
    setLoading(true);
    
    try {
      // Start the exam attempt using the configured API instance
      const response = await api.post('/exams/start-exam/', {
        exam_id: parseInt(examId!)
      });

      // Navigate to secure exam interface
      navigate(`/secure-exam/${response.data.attempt.id}`);
    } catch (error: any) {
      console.error('Start exam error:', error);
      setError(error.response?.data?.error || 'Failed to start exam');
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
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Camera Setup</h3>
              <p className="text-gray-600">
                Please ensure your camera is working and positioned correctly. 
                Your face should be clearly visible in the frame.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                {cameraPermission ? (
                  <div className="border-2 border-green-500 rounded-lg overflow-hidden">
                    <Webcam
                      ref={webcamRef}
                      width={320}
                      height={240}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 320,
                        height: 240,
                        facingMode: 'user'
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      Camera Active
                    </div>
                  </div>
                ) : (
                  <div className="w-80 h-60 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Camera not available</p>
                      <button
                        onClick={requestCameraPermission}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enable Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Camera Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure good lighting on your face</li>
                <li>• Position camera at eye level</li>
                <li>• Keep your face centered in the frame</li>
                <li>• Remove any hats or sunglasses</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Face Verification</h3>
              <p className="text-gray-600">
                Take a clear photo of your face for identity verification during the exam.
              </p>
            </div>

            <div className="flex justify-center">
              {capturedImage ? (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured face"
                    className="w-80 h-60 object-cover border-2 border-green-500 rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    Photo Captured
                  </div>
                </div>
              ) : (
                <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
                  <Webcam
                    ref={webcamRef}
                    width={320}
                    height={240}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 320,
                      height: 240,
                      facingMode: 'user'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {capturedImage ? (
                <>
                  <button
                    onClick={retakePhoto}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Retake Photo
                  </button>
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Use This Photo
                  </button>
                </>
              ) : (
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Exam Instructions</h3>
              <p className="text-gray-600">
                Please read and understand the following exam rules and instructions.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-900 mb-4">Exam Rules & Instructions:</h4>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">General Rules:</h5>
                  <ul className="space-y-1 ml-4">
                    <li>• You have {exam?.duration_minutes} minutes to complete this exam</li>
                    <li>• Do not switch tabs or minimize the browser window</li>
                    <li>• Do not use any external resources or devices</li>
                    <li>• Keep your face visible to the camera at all times</li>
                    <li>• Do not communicate with anyone during the exam</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Technical Requirements:</h5>
                  <ul className="space-y-1 ml-4">
                    <li>• Maintain a stable internet connection</li>
                    <li>• Ensure your device has sufficient battery</li>
                    <li>• Close all unnecessary applications</li>
                    <li>• Use a quiet, well-lit environment</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Violations & Consequences:</h5>
                  <ul className="space-y-1 ml-4">
                    <li>• Tab switching or window minimization will be recorded</li>
                    <li>• Multiple violations may result in exam disqualification</li>
                    <li>• All activities are monitored and recorded</li>
                    <li>• Suspicious behavior will be flagged for review</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="accept-instructions"
                checked={instructionsAccepted}
                onChange={(e) => setInstructionsAccepted(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="accept-instructions" className="text-sm text-gray-700">
                I have read and understood the exam rules and instructions. I agree to follow all guidelines and understand the consequences of violations.
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start</h3>
              <p className="text-gray-600">
                All setup steps have been completed successfully. You're ready to begin the exam.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-3">Setup Summary:</h4>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Camera verified and working</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Face photo captured for verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Exam instructions read and accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>System requirements met</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Final Reminders:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure you have a stable internet connection</li>
                <li>• Close all unnecessary applications and tabs</li>
                <li>• Find a quiet, well-lit environment</li>
                <li>• Have your ID ready if required</li>
                <li>• The exam will start immediately when you click "Start Exam"</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (examLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading exam setup...</p>
        </div>
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load exam details</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Setup</h1>
            <p className="text-gray-600">{exam.title}</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    getStepStatus(step.id) === 'completed' 
                      ? 'bg-green-600 border-green-600 text-white'
                      : getStepStatus(step.id) === 'current'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {getStepStatus(step.id) === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      getStepStatus(step.id) === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <h2 className="text-lg font-semibold text-gray-900">{steps[currentStep - 1].title}</h2>
              <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentStep === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  canProceed()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={startExam}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSetup;

