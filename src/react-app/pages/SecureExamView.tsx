import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { CameraStatusPayload, ProctoringIncidentPayload } from '../hooks/useProctoringCamera';

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
  pattern_section?: number | null;
  question_number?: number | null;
  question_number_in_pattern?: number | null;
  section_name?: string;
  negative_marks?: number | null;
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
    end_date: string;
    shuffle_questions: boolean;
    shuffle_sections: boolean;
    shuffle_subjects: boolean;
    shuffle_options: boolean;
    shuffle_seed_per_student: boolean;
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
  violations_count: number;
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
  const [cameraStatusInfo, setCameraStatusInfo] = useState<CameraStatusPayload>({ status: 'idle' });
  const [cameraIncidents, setCameraIncidents] = useState<ProctoringIncidentPayload[]>([]);
  // Webcam is disabled for now as per user request
  const webcamRequired = false;

  // Exam started state - auto-start when component loads
  const [examStarted, setExamStarted] = useState(false);

  // Security hook - configured based on exam settings
  const {
    logViolation,
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
    initialViolationCount: examAttempt?.violations_count || 0
  });

  // Load exam data and auto-start exam
  useEffect(() => {
    loadExamData();
  }, [attemptId]);

  // Auto-start exam once data is loaded
  useEffect(() => {
    if (examAttempt && questions.length > 0 && !examStarted) {
      // Small delay to ensure everything is ready, then start exam
      const timer = setTimeout(() => {
        setExamStarted(true);
      }, 1000); // 1 second delay for smooth transition
      return () => clearTimeout(timer);
    }
  }, [examAttempt, questions.length, examStarted]);

  // Timer effect
  useEffect(() => {
    if (!examAttempt) return;

    const calculateTime = () => {
      const now = new Date();
      const startTime = new Date(examAttempt.started_at);
      const endTime = new Date(examAttempt.exam.end_date);

      // Calculate remaining time based on attempt duration
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remainingByDuration = (examAttempt.exam.duration_minutes * 60) - elapsed;

      // Calculate remaining time based on absolute exam end date
      const remainingByEndDate = Math.floor((endTime.getTime() - now.getTime()) / 1000);

      // Use the stricter (smaller) remaining time
      const remaining = Math.min(remainingByDuration, remainingByEndDate);

      if (remaining <= 0) {
        setTimeRemaining(0);
        handleAutoSubmit();
        return false; // Should stop the interval
      }

      setTimeRemaining(remaining);
      return true;
    };

    // Run once immediately
    if (!calculateTime()) return;

    const interval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(interval);
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


  // Listen for new violations and show toast
  const lastViolationTimeShown = useRef<number>(0);
  useEffect(() => {
    if (violations.length > 0) {
      const latestViolation = violations[violations.length - 1];
      const timestamp = latestViolation.timestamp.getTime();

      if (timestamp > lastViolationTimeShown.current) {
        lastViolationTimeShown.current = timestamp;
        console.log('🚨 SHOWING NEW VIOLATION:', latestViolation.type);
        setCurrentToastViolation(latestViolation);
      }
    }
  }, [violations]);

  // Handle auto-submission on disqualification
  useEffect(() => {
    if (isDisqualified && !isSubmitting) {
      console.log('🚫 DISQUALIFIED: Initiating auto-submit');
      handleAutoSubmit();
    }
  }, [isDisqualified]);

  const handleCloseToast = useCallback(() => {
    setCurrentToastViolation(null);
  }, []);

  const loadExamData = async () => {
    try {
      // Load exam attempt details
      const attemptEndpoint = `/exams/attempts/${attemptId}/`;
      console.log('🔵 API CALL #1: GET', attemptEndpoint);
      const attemptResponse = await api.get(attemptEndpoint);
      const attemptData = attemptResponse.data;
      console.log('✅ API RESPONSE #1:', JSON.stringify(attemptData, null, 2));
      setExamAttempt(attemptData);

      console.log('==== EXAM ATTEMPT LOADED ====');
      console.log('Exam ID:', attemptData.exam.id);
      console.log('Exam Title:', attemptData.exam.title);
      console.log('Max Violations Allowed:', attemptData.max_violations_allowed);
      console.log('=================================');

      const examId = attemptData.exam.id;

      let mappedQuestions: Question[] = [];

      try {
        const questionsEndpoint = `/questions/exams/${examId}/questions/`;
        console.log('🔵 API CALL #2: GET', questionsEndpoint);
        const questionsResponse = await api.get(questionsEndpoint);
        console.log('✅ API RESPONSE #2 (RAW):', JSON.stringify(questionsResponse.data, null, 2));

        const examQuestions = Array.isArray(questionsResponse.data)
          ? questionsResponse.data
          : (questionsResponse.data?.results ?? []);

        console.log('📊 Parsed Questions Array Length:', examQuestions.length);
        console.log('📋 First Question Sample:', examQuestions[0] ? JSON.stringify(examQuestions[0], null, 2) : 'No questions');

        if (examQuestions.length > 0) {
          mappedQuestions = examQuestions
            .map((item: any, index: number) => {
              const q = item.question || {};
              const normalizedOptions =
                Array.isArray(q.options) ? q.options : q.options ? [q.options] : [];

              return {
                id: q.id ?? item.question_id ?? index,
                question_text: q.question_text ?? '',
                question_type: q.question_type ?? 'mcq',
                options: normalizedOptions,
                correct_answer: q.correct_answer ?? '',
                explanation: q.explanation ?? '',
                marks: item.marks ?? q.marks ?? 0,
                subject: q.subject ?? '',
                pattern_section: q.pattern_section ?? null,
                question_number: item.question_number ?? q.question_number ?? null,
                question_number_in_pattern: q.question_number_in_pattern ?? item.order ?? null,
                section_name: item.section_name ?? '',
                negative_marks: item.negative_marks ?? q.negative_marks ?? null,
              };
            })
            .filter((question: Question) => Boolean(question.question_text));
        }
      } catch (err) {
        console.error(`❌ Failed to load exam-question mappings for exam ${examId}:`, err);
      }

      if (mappedQuestions.length === 0) {
        console.log('⚠️ No questions from primary endpoint, trying fallback...');
        try {
          const params = { exam: examId, page_size: 1000 };
          const fallbackEndpoint = '/questions/questions/';
          console.log('🔵 API CALL #3 (FALLBACK): GET', fallbackEndpoint, 'with params:', params);
          const questionsResponse = await api.get(fallbackEndpoint, { params });
          console.log('✅ API RESPONSE #3 (RAW):', JSON.stringify(questionsResponse.data, null, 2));

          const rawQuestions = Array.isArray(questionsResponse.data)
            ? questionsResponse.data
            : (questionsResponse.data?.results ?? questionsResponse.data ?? []);

          console.log('📊 Fallback Questions Array Length:', rawQuestions.length);

          mappedQuestions = rawQuestions
            .map((item: any) => {
              const normalizedOptions =
                Array.isArray(item.options) ? item.options : item.options ? [item.options] : [];

              return {
                id: item.id,
                question_text: item.question_text ?? '',
                question_type: item.question_type ?? 'mcq',
                options: normalizedOptions,
                correct_answer: item.correct_answer ?? '',
                explanation: item.explanation ?? '',
                marks: item.marks ?? 0,
                subject: item.subject ?? '',
                pattern_section: item.pattern_section ?? null,
                question_number: item.question_number ?? null,
                question_number_in_pattern: item.question_number_in_pattern ?? null,
                section_name: item.pattern_section_name ?? '',
                negative_marks: item.negative_marks ?? null,
              };
            })
            .filter((question: Question) => Boolean(question.question_text));
        } catch (err) {
          console.error(`❌ Failed to load questions list for exam ${examId}:`, err);
        }
      }

      if (mappedQuestions.length === 0 && attemptData.exam.pattern?.id) {
        const patternId = attemptData.exam.pattern.id;
        console.log('⚠️ Still no questions, trying pattern fallback...');
        console.log('Pattern ID:', patternId);

        try {
          const patternEndpoint = `/patterns/patterns/${patternId}/questions/`;
          console.log('🔵 API CALL #4 (PATTERN FALLBACK): GET', patternEndpoint);
          const questionsResponse = await api.get(patternEndpoint);
          console.log('✅ API RESPONSE #4 (RAW):', JSON.stringify(questionsResponse.data, null, 2));

          const sections = questionsResponse.data?.sections_with_questions ?? [];
          console.log('📊 Pattern Sections Count:', sections.length);

          sections.forEach((section: any) => {
            const sectionQuestions = Array.isArray(section.questions) ? section.questions : [];
            sectionQuestions.forEach((question: any) => {
              const normalizedOptions =
                Array.isArray(question.options)
                  ? question.options
                  : question.options
                    ? [question.options]
                    : [];

              mappedQuestions.push({
                id: question.id,
                question_text: question.question_text ?? '',
                question_type: question.question_type ?? 'mcq',
                options: normalizedOptions,
                correct_answer: question.correct_answer ?? '',
                explanation: question.explanation ?? '',
                marks: question.marks ?? section.section?.marks_per_question ?? 0,
                subject: question.subject ?? section.section?.subject ?? '',
                pattern_section: question.pattern_section ?? section.section?.id ?? null,
                question_number: question.question_number ?? null,
                question_number_in_pattern: question.question_number_in_pattern ?? null,
                section_name: section.section?.name ?? '',
                negative_marks: question.negative_marks ?? null,
              });
            });
          });
        } catch (err) {
          console.error(`❌ Failed to load pattern questions for pattern ${patternId}:`, err);
        }
      }

      console.log('🎯 FINAL MAPPED QUESTIONS COUNT:', mappedQuestions.length);
      console.log('🎯 FINAL MAPPED QUESTIONS COUNT:', mappedQuestions.length);

      const isShuffleEnabled = attemptData.exam.shuffle_questions ||
        attemptData.exam.shuffle_sections ||
        attemptData.exam.shuffle_subjects;

      if (!isShuffleEnabled) {
        console.log('Sorting questions by pattern order...');
        mappedQuestions.sort((a, b) => {
          const numA = a.question_number_in_pattern ?? a.question_number ?? 0;
          const numB = b.question_number_in_pattern ?? b.question_number ?? 0;
          return numA - numB;
        });
      } else {
        console.log('Skipping sort: Shuffling is enabled, respecting backend order.');
      }

      setQuestions(mappedQuestions);

      // Load existing answers
      if (attemptData.answers) {
        const existingAnswers = new Map();
        Object.entries(attemptData.answers).forEach(([questionId, answer]: [string, any]) => {
          existingAnswers.set(parseInt(questionId, 10), answer);
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
      const autoSaveEndpoint = `/exams/attempts/${attemptId}/auto-save/`;

      console.log('🔵 API CALL (AUTO-SAVE): POST', autoSaveEndpoint);
      console.log('💾 Auto-save payload:', {
        totalAnswers: answers.size,
        answers: answersObject
      });

      await api.post(autoSaveEndpoint, {
        answers: answersObject
      });

      console.log('✅ Auto-save successful');
      setAutoSaveStatus('saved');
    } catch (error: any) {
      console.error('❌ Auto-save failed:', error);
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

  const handleViolationDetected = (violation: any) => {
    // We log it via the security hook which handles cooldowns and state
    logViolation(violation.type, {
      message: violation.message,
      confidence: violation.confidence,
      ...violation.analysis
    }, true);
  };

  const handleCameraStatusChange = useCallback((payload: CameraStatusPayload) => {
    setCameraStatusInfo(payload);
    if (payload.incident) {
      setCameraIncidents(prev => [payload.incident!, ...prev].slice(0, 10));
    }

    if (webcamRequired && payload.status === 'error' && payload.error) {
      logViolation('no_face', {
        source: 'camera_monitor',
        reason: payload.error
      });
    }
  }, [logViolation, webcamRequired]);

  const handleViolationAcknowledged = () => {
    setShowViolationWarning(false);
    setCurrentViolation(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (webcamRequired && cameraStatusInfo.status !== 'active') {
      setCurrentToastViolation({
        type: 'camera_error',
        timestamp: new Date(),
        metadata: {
          action: 'Enable webcam monitoring before submitting'
        }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        attempt_id: parseInt(attemptId!),
        answers: Object.fromEntries(answers)
      };

      const submitEndpoint = '/exams/submit-exam/';
      console.log('🔵 API CALL (SUBMIT): POST', submitEndpoint);
      console.log('📤 Submission payload:', {
        attemptId: attemptId,
        totalAnswers: answers.size,
        submissionData: submissionData
      });

      const response = await api.post(submitEndpoint, submissionData);

      console.log('✅ Submission successful!');
      console.log('📥 Submission response:', JSON.stringify(response.data, null, 2));

      navigate(`/exam-results/${attemptId}`);
    } catch (error: any) {
      console.error('❌ Submission failed:', error);
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

  // Frontend disqualification screen removed per user request:
  /*
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
  */

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

  // Show brief loading/starting message while exam initializes
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <Flag className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Starting Exam...</h2>
          <p className="text-sm text-slate-600">Please wait while we prepare your exam environment</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion?.id);
  const isCameraRequired = webcamRequired;
  const cameraHealthy = !isCameraRequired || cameraStatusInfo.status === 'active';
  const latestCameraIncident = cameraIncidents[0];
  const cameraStatusLabel = (cameraStatusInfo.status || 'idle').toUpperCase();
  const cameraStatusMessage = cameraHealthy
    ? 'Webcam monitoring is active.'
    : cameraStatusInfo.error ||
    'Please allow and keep your webcam active throughout the exam.';
  const formatIncidentTime = (timestamp?: string) => {
    if (!timestamp) return 'just now';
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? 'just now' : parsed.toLocaleTimeString();
  };

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

            {/* Violation count - Always visible */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowViolationsPanel(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-md active:scale-95 ${violationCount > 3
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  : violationCount > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  }`}
                title="View security logs"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${violationCount > 3 ? 'bg-red-500 animate-pulse' : violationCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-xs font-bold uppercase">
                  {violationCount} Security Records
                </span>
              </button>
            </div>

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

      {isCameraRequired && (
        <div
          className={`mx-4 mt-4 mb-2 rounded-lg border p-4 ${cameraHealthy
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Webcam monitoring required</p>
              <p className="text-xs opacity-80">{cameraStatusMessage}</p>
              {!cameraHealthy && latestCameraIncident && (
                <p className="text-xs mt-2 opacity-80">
                  Last incident: <span className="font-semibold">{latestCameraIncident.event_type}</span> at{' '}
                  {formatIncidentTime(latestCameraIncident.timestamp)}
                </p>
              )}
            </div>
            <div className="text-xs font-bold tracking-wide uppercase">
              Status: {cameraStatusLabel}
            </div>
          </div>
        </div>
      )}

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
                    className={`p-2 rounded-lg transition-colors ${currentAnswer?.is_flagged
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
                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${currentAnswer?.answer === optionText
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
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAnswer?.answer === optionText
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
                          className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected
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
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
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
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${currentAnswer?.answer === option
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
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAnswer?.answer === option
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
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${index === currentQuestionIndex
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
      {isCameraRequired && (
        <WebcamMonitor
          attemptId={parseInt(attemptId!)}
          onViolationDetected={handleViolationDetected}
          captureInterval={30}
          showPreview={false}
          autoStart={webcamRequired}
          onStatusChange={handleCameraStatusChange}
          className="hidden"
        />
      )}

      <ViolationsPanel
        attemptId={parseInt(attemptId || '0')}
        isOpen={showViolationsPanel}
        onClose={() => setShowViolationsPanel(false)}
      />

      {/* Violation Toast Notification */}
      <ViolationToast
        violation={currentToastViolation}
        onClose={handleCloseToast}
        remainingViolations={examAttempt ? (examAttempt.max_violations_allowed - violationCount) : undefined}
      />
    </div>
  );
};

export default SecureExamView;
