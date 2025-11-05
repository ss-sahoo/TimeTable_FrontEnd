import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Clock, 
  Flag, 
  CheckCircle, 
  AlertTriangle, 
  Save,
  Send,
  Eye,
  EyeOff,
  Maximize,
  Minimize
} from 'lucide-react';
import useExamSecurity from '../hooks/useExamSecurity';
import WebcamMonitor from '../components/WebcamMonitor';
import ViolationWarning from '../components/ViolationWarning';
import ViolationToast from '../components/ViolationToast';
import LaTeXRenderer from '../components/LaTeXRenderer';
import ViolationsPanel from '../components/ViolationsPanel';
import { api } from '../hooks/useApi';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: Array<string | {
    id?: number;
    text: string;
    is_correct: boolean;
  }>;
  correct_answer: string;
  explanation: string;
  marks: number;
  subject: string;
  pattern_section: number;
}

interface ExamAttempt {
  id: number;
  exam: {
    id: number;
    title: string;
    duration_minutes: number;
    is_public: boolean;
    allow_late_submission: boolean;
    require_fullscreen: boolean;
    disable_copy_paste: boolean;
    disable_right_click: boolean;
    enable_webcam_proctoring: boolean;
    allow_tab_switching: boolean;
    pattern: {
      sections: Array<{
        id: number;
        name: string;
        start_question: number;
        end_question: number;
        question_type: string;
      }>;
    };
  };
  status: string;
  started_at: string;
  time_spent: number;
  max_violations_allowed: number;
}

interface Answer {
  question_id: number;
  answer: string | string[];
  is_flagged: boolean;
  time_spent: number;
}

const SecureExamView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<any>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);
  const [showViolationsPanel, setShowViolationsPanel] = useState(false);
  const [currentToastViolation, setCurrentToastViolation] = useState<any>(null);
  
  // Pre-exam flow states
  const [examStarted, setExamStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Security hook - configured based on exam settings
  const {
    violations,
    violationCount,
    isDisqualified,
    isFullscreen,
    requestFullscreen
  } = useExamSecurity(parseInt(attemptId!), {
    maxViolations: examAttempt?.max_violations_allowed || 5,
    enableTabMonitoring: examAttempt ? !examAttempt.exam.allow_tab_switching : true,
    enableFullscreenEnforcement: examAttempt?.exam.require_fullscreen || false,
    enableCopyPasteBlocking: examAttempt?.exam.disable_copy_paste || false,
    enableRightClickBlocking: examAttempt?.exam.disable_right_click || false,
    enableContextMenuBlocking: examAttempt?.exam.disable_right_click || false,
  });

  // Load exam data
  useEffect(() => {
    loadExamData();
  }, [attemptId]);

  // Timer effect
  useEffect(() => {
    if (!examAttempt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(examAttempt.started_at);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = (examAttempt.exam.duration_minutes * 60) - elapsed;
      
      setTimeRemaining(Math.max(0, remaining));
      
      if (remaining <= 0) {
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [examAttempt]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      autoSaveAnswers();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [answers]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Listen for new violations and show toast
  useEffect(() => {
    if (violations.length > 0) {
      const latestViolation = violations[violations.length - 1];
      console.log('🚨 VIOLATION DETECTED:', {
        type: latestViolation.type,
        timestamp: latestViolation.timestamp,
        metadata: latestViolation.metadata,
        totalViolations: violations.length
      });
      setCurrentToastViolation(latestViolation);
    }
  }, [violations]);

  const loadExamData = async () => {
    try {
      // Load exam attempt details
      const attemptResponse = await api.get(`/exams/attempts/${attemptId}/`);
      const attemptData = attemptResponse.data;
      setExamAttempt(attemptData);

      // Log exam permissions for debugging
      console.log('==== EXAM PERMISSIONS LOADED ====');
      console.log('Exam ID:', attemptData.exam.id);
      console.log('Exam Title:', attemptData.exam.title);
      console.log('Public Exam:', attemptData.exam.is_public);
      console.log('Allow Late Submission:', attemptData.exam.allow_late_submission);
      console.log('Require Fullscreen:', attemptData.exam.require_fullscreen);
      console.log('Disable Copy/Paste:', attemptData.exam.disable_copy_paste);
      console.log('Disable Right Click:', attemptData.exam.disable_right_click);
      console.log('Enable Webcam Proctoring:', attemptData.exam.enable_webcam_proctoring);
      console.log('Allow Tab Switching:', attemptData.exam.allow_tab_switching);
      console.log('Max Violations Allowed:', attemptData.max_violations_allowed);
      console.log('=================================');

      // Load questions
      if (attemptData.exam && attemptData.exam.pattern?.id) {
        // Get questions for this exam's pattern using the dedicated endpoint
        const patternId = attemptData.exam.pattern.id;
        console.log('Loading questions for pattern:', patternId);
        
        try {
          const questionsResponse = await api.get(`/patterns/patterns/${patternId}/questions/`);
          const questionsData = questionsResponse.data;
          
          console.log('Pattern questions response:', questionsData);
          
          // The endpoint returns { sections_with_questions: [...] }
          let allQuestions: any[] = [];
          
          if (questionsData.sections_with_questions && Array.isArray(questionsData.sections_with_questions)) {
            // Extract all questions from all sections
            questionsData.sections_with_questions.forEach((section: any) => {
              if (section.questions && Array.isArray(section.questions)) {
                allQuestions = allQuestions.concat(section.questions);
              }
            });
          }
          
          // Sort questions by question_number_in_pattern in ascending order
          allQuestions.sort((a: any, b: any) => {
            const numA = a.question_number_in_pattern || a.id || 0;
            const numB = b.question_number_in_pattern || b.id || 0;
            return numA - numB;
          });
          
          console.log(`Loaded ${allQuestions.length} questions from pattern ${patternId}`);
          console.log('Questions:', allQuestions.map((q: any) => `Q${q.question_number_in_pattern}:${q.question_type}`));
          
          setQuestions(allQuestions);
        } catch (err) {
          console.error('Failed to load pattern questions:', err);
          setQuestions([]);
        }
      } else {
        console.error('Exam data is missing pattern:', attemptData);
        setQuestions([]);
      }

      // Load existing answers
      if (attemptData.answers) {
        const existingAnswers = new Map();
        Object.entries(attemptData.answers).forEach(([questionId, answer]: [string, any]) => {
          existingAnswers.set(parseInt(questionId), answer);
        });
        setAnswers(existingAnswers);
      }

      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const autoSaveAnswers = async () => {
    if (answers.size === 0) return;

    setAutoSaveStatus('saving');
    try {
      const answersObject = Object.fromEntries(answers);
      
      console.log('💾 Auto-saving answers...', {
        totalAnswers: answers.size,
        answers: answersObject
      });

      await api.post(`/exams/attempts/${attemptId}/auto-save/`, {
        answers: answersObject
      });

      console.log('✓ Auto-save successful');
      setAutoSaveStatus('saved');
    } catch (error: any) {
      console.error('✗ Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  };

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    const currentAnswer = answers.get(questionId) || {
      question_id: questionId,
      answer: '',
      is_flagged: false,
      time_spent: 0
    };

    const newAnswer = {
      ...currentAnswer,
      answer
    };

    console.log('📝 Answer changed:', {
      questionId,
      questionType: currentQuestion?.question_type,
      answer: answer,
      previousAnswer: currentAnswer.answer
    });

    setAnswers(prev => new Map(prev.set(questionId, newAnswer)));
  };

  const handleFlagToggle = (questionId: number) => {
    const currentAnswer = answers.get(questionId) || {
      question_id: questionId,
      answer: '',
      is_flagged: false,
      time_spent: 0
    };

    setAnswers(prev => new Map(prev.set(questionId, {
      ...currentAnswer,
      is_flagged: !currentAnswer.is_flagged
    })));
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setPhotoError('Unable to access webcam. Please allow camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhotoFromWebcam = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setPhotoError('Camera not ready. Please refresh the page.');
      return;
    }

    // Check if video is actually playing
    if (videoRef.current.readyState !== 4) {
      setPhotoError('Camera is still loading. Please wait a moment and try again.');
      return;
    }

    setCapturingPhoto(true);
    setPhotoError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        console.log('Uploading photo to backend...');
        
        // Upload photo to backend
        const response = await api.post(`/exams/attempts/${attemptId}/proctoring/snapshot/`, {
          image_data: photoDataUrl,
          timestamp: new Date().toISOString(),
          metadata: { type: 'identity_verification', source: 'pre_exam' }
        });

        console.log('Photo upload response:', response.data);

        if (response.data) {
          setCapturedPhoto(photoDataUrl);
          setPhotoTaken(true);
          stopWebcam(); // Stop camera after capture
        }
      }
    } catch (err: any) {
      console.error('Error capturing photo:', err);
      console.error('Error details:', err.response?.data);
      
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.message || 
                       Object.values(err.response?.data || {}).join(', ') ||
                       'Failed to capture photo. Please try again.';
      setPhotoError(errorMsg);
    } finally {
      setCapturingPhoto(false);
    }
  };

  const handleViolationDetected = (violation: any) => {
    setCurrentViolation(violation);
    setShowViolationWarning(true);
  };

  const handleViolationAcknowledged = () => {
    setShowViolationWarning(false);
    setCurrentViolation(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        attempt_id: parseInt(attemptId!),
        answers: Object.fromEntries(answers)
      };
      
      console.log('=== SUBMITTING EXAM ===');
      console.log('Attempt ID:', attemptId);
      console.log('Total questions answered:', answers.size);
      console.log('Answers being submitted:', submissionData.answers);
      console.log('API endpoint:', '/exams/submit-exam/');
      
      const response = await api.post('/exams/submit-exam/', submissionData);
      
      console.log('Submission successful!');
      console.log('Response:', response.data);
      console.log('======================');

      navigate(`/exam-results/${attemptId}`);
    } catch (error: any) {
      console.error('Submission failed:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmit();
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

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeRemaining <= 900) return 'text-orange-600'; // Last 15 minutes
    return 'text-green-600';
  };

  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) return 'not-visited';
    
    const answer = answers.get(question.id);
    if (!answer || !answer.answer) return 'not-visited';
    if (answer.is_flagged) return 'flagged';
    return 'answered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
      case 'flagged': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
      case 'not-visited': return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
      default: return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error || !examAttempt) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Exam not found'}</p>
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

  if (isDisqualified) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exam Disqualified</h1>
          <p className="text-red-600 dark:text-red-400 mb-4">
            You have exceeded the maximum number of violations allowed.
          </p>
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Questions Available</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This exam doesn't have any questions assigned yet.
          </p>
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

  // Pre-exam Instructions Screen
  if (!examStarted && showInstructions) {
    // Get pattern sections for display
    const patternSections = examAttempt?.exam.pattern?.sections || [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl h-[95vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {/* Header - Fixed */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">{examAttempt?.exam.title}</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">Read the instructions carefully before starting</p>
          </div>

          {/* Content Area - Scrollable if needed */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-700">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{questions.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Questions</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center border border-purple-200 dark:border-purple-700">
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{examAttempt?.exam.duration_minutes}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Minutes</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center border border-green-200 dark:border-green-700">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{patternSections.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sections</p>
                  </div>
                </div>

                {/* Exam Structure */}
                {patternSections.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Exam Structure:</h3>
                    <div className="space-y-1.5">
                      {patternSections.map((section, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                          <span className="font-medium text-gray-900 dark:text-white">{section.name}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Q{section.start_question}-{section.end_question}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Instructions */}
              <div className="bg-blue-50 dark:bg-gray-700/50 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
                <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">Important Instructions:</h2>
            
                <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Timer cannot be paused once started</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Auto-save every 30 seconds</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Navigate freely between questions</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Flag questions for review</span>
                  </p>
                  {examAttempt?.exam.require_fullscreen && (
                    <p className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">⚠</span>
                      <span className="text-yellow-700 dark:text-yellow-300"><strong>Fullscreen required</strong></span>
                    </p>
                  )}
                  {!examAttempt?.exam.allow_tab_switching && (
                    <p className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      <span className="text-red-600 dark:text-red-400 font-bold">⚠</span>
                      <span className="text-red-700 dark:text-red-300"><strong>No tab switching</strong> - Violations recorded</span>
                    </p>
                  )}
                  {examAttempt?.exam.enable_webcam_proctoring && (
                    <p className="flex items-start gap-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">📷</span>
                      <span className="text-purple-700 dark:text-purple-300"><strong>Webcam proctoring</strong> enabled</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-4">
            {/* Policy Agreement */}
            <label className="flex items-start gap-3 cursor-pointer bg-blue-50 dark:bg-gray-700/50 p-4 rounded-lg border border-blue-200 dark:border-gray-600">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                I have read and understood the instructions. I agree to follow all exam rules and policies. 
                I understand that any violation may result in disqualification.
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowInstructions(false);
                  startWebcam(); // Start webcam when moving to photo screen
                }}
                disabled={!agreedToPolicy}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Continue to Photo Verification →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Photo Capture Screen
  if (!examStarted && !photoTaken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Photo Verification</h1>
          
          <div className="bg-purple-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6 border border-purple-200 dark:border-gray-600">
            <p className="text-gray-700 dark:text-gray-300 text-center mb-4 text-sm">
              Please capture your photo for identity verification
            </p>
            
            {!capturedPhoto ? (
              <div className="space-y-4">
                {/* Webcam Preview */}
                <div className="relative bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                {photoError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                    <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {photoError}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={capturePhotoFromWebcam}
                  disabled={capturingPhoto}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {capturingPhoto ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      📸 Capture Photo
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show captured photo */}
                <div className="bg-gray-900 rounded-xl overflow-hidden border-2 border-green-300 dark:border-green-600">
                  <img src={capturedPhoto} alt="Captured" className="w-full h-64 object-cover" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <p className="text-green-600 dark:text-green-400 font-semibold text-sm">Photo captured and uploaded successfully!</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowInstructions(true);
                setPhotoTaken(false);
                setCapturedPhoto(null);
                stopWebcam();
              }}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all font-semibold text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => setExamStarted(true)}
              disabled={!photoTaken}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Flag className="w-5 h-5" />
              🏁 Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion?.id);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{examAttempt.exam.title}</h1>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className={`text-lg font-mono ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auto-save status */}
            <div className="flex items-center gap-2">
              {autoSaveStatus === 'saving' && <Save className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}
              {autoSaveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />}
              {autoSaveStatus === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {autoSaveStatus === 'saving' ? 'Saving...' : 
                 autoSaveStatus === 'saved' ? 'Saved' : 'Save Error'}
              </span>
            </div>

            {/* Violation count */}
            {violationCount > 0 && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{violationCount} violations</span>
                <button
                  onClick={() => setShowViolationsPanel(true)}
                  className="ml-2 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                  title="View violation details"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={requestFullscreen}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
              title="Request Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Question Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {currentQuestion && (
            <div className="max-w-4xl mx-auto">
              {/* Question Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {(currentQuestion as any).subject || 'General'}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleFlagToggle(currentQuestion.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      currentAnswer?.is_flagged 
                        ? 'bg-yellow-500 text-white shadow-lg' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    title="Flag for review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-lg leading-relaxed text-gray-900 dark:text-white">
                  <LaTeXRenderer content={currentQuestion.question_text} />
                </div>
              </div>

              {/* Answer Options - Single MCQ */}
              {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'single_mcq') && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    // Handle both string and object options
                    const optionText = typeof option === 'string' ? option : option.text;
                    const optionId = typeof option === 'object' && option.id ? option.id : index;
                    
                    return (
                      <label
                        key={optionId}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          currentAnswer?.answer === optionText
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={optionText}
                          checked={currentAnswer?.answer === optionText}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            currentAnswer?.answer === optionText
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400 dark:border-gray-500'
                          }`}>
                            {currentAnswer?.answer === optionText && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            <LaTeXRenderer content={optionText} />
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Answer Options - Multiple MCQ (Checkboxes) */}
              {currentQuestion.question_type === 'multiple_mcq' && (() => {
                // For multiple MCQ, answer is stored as "option1|option2|option3"
                const selectedAnswers = currentAnswer?.answer ? String(currentAnswer.answer).split('|').filter(a => a) : [];
                
                return (
                <div className="space-y-3">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-3">
                    ✓ Select all correct options (multiple answers allowed)
                  </p>
                  {currentQuestion.options.map((option, index) => {
                    // Handle both string and object options
                    const optionText = typeof option === 'string' ? option : option.text;
                    const optionId = typeof option === 'object' && option.id ? option.id : index;
                    
                    const isSelected = selectedAnswers.includes(optionText);
                    
                    return (
                      <label
                        key={optionId}
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`question-${currentQuestion.id}-${index}`}
                          value={optionText}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentAnswers = currentAnswer?.answer ? String(currentAnswer.answer).split('|') : [];
                            let newAnswers;
                            if (e.target.checked) {
                              // Add to selected answers
                              newAnswers = [...currentAnswers, optionText];
                            } else {
                              // Remove from selected answers
                              newAnswers = currentAnswers.filter(a => a !== optionText);
                            }
                            // Join with | separator
                            handleAnswerChange(currentQuestion.id, newAnswers.join('|'));
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-400 dark:border-gray-500'
                          }`}>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            <LaTeXRenderer content={optionText} />
                          </span>
                        </div>
                      </label>
                    );
                  })}
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Selected: {selectedAnswers.length > 0 ? selectedAnswers.join(', ') : 'None'}
                  </p>
                </div>
                );
              })()}

              {currentQuestion.question_type === 'numerical' && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <input
                    type="number"
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white text-lg"
                    placeholder="Enter your numerical answer"
                    step="0.01"
                  />
                </div>
              )}

              {currentQuestion.question_type === 'subjective' && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <textarea
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 dark:text-white"
                    placeholder="Enter your answer here..."
                  />
                </div>
              )}

              {currentQuestion.question_type === 'true_false' && (
                <div className="space-y-3">
                  {['True', 'False'].map((option) => (
                    <label
                      key={option}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        currentAnswer?.answer === option
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={currentAnswer?.answer === option}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentAnswer?.answer === option
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-400 dark:border-gray-500'
                        }`}>
                          {currentAnswer?.answer === option && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{option}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'fill_blank' && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={currentAnswer?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white text-lg"
                    placeholder="Fill in the blank..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Type your answer in the blank space provided
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Palette */}
        {showQuestionPalette && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Question Palette</h3>
              <button
                onClick={() => setShowQuestionPalette(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {Array.isArray(questions) && questions.map((question, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={question.id}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      index === currentQuestionIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                        : getStatusColor(status)
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Q{index + 1}</span>
                      {answers.get(question.id)?.is_flagged && (
                        <Flag className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {(question as any).subject || 'General'} • {question.marks}m
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Legend</h4>
              <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"></div>
                  <span>Not Visited</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Palette Button */}
        {!showQuestionPalette && (
          <button
            onClick={() => setShowQuestionPalette(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-xl text-gray-700 dark:text-white"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Webcam Monitor */}
      <WebcamMonitor
        attemptId={parseInt(attemptId!)}
        onViolationDetected={handleViolationDetected}
        captureInterval={30}
        showPreview={true}
      />

      {/* Violation Warning Modal */}
      <ViolationWarning
        isOpen={showViolationWarning}
        violation={currentViolation}
        violationCount={violationCount}
        maxViolations={examAttempt.max_violations_allowed}
        onAcknowledge={handleViolationAcknowledged}
        onClose={handleViolationAcknowledged}
      />

      <ViolationsPanel
        attemptId={parseInt(attemptId || '0')}
        isOpen={showViolationsPanel}
        onClose={() => setShowViolationsPanel(false)}
      />

      {/* Violation Toast Notification */}
      <ViolationToast
        violation={currentToastViolation}
        onClose={() => setCurrentToastViolation(null)}
      />
    </div>
  );
};

export default SecureExamView;

