/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

const SecureExamExperience: React.FC = () => {
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
  const [activeSubject, setActiveSubject] = useState<string>('All');
  
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

  // Hide palette by default on small screens for better focus
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowQuestionPalette(false);
    }
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

      console.log('==== EXAM ATTEMPT LOADED ====');
      console.log('Exam ID:', attemptData.exam.id);
      console.log('Exam Title:', attemptData.exam.title);
      console.log('Max Violations Allowed:', attemptData.max_violations_allowed);
      console.log('=================================');

      const examId = attemptData.exam.id;

      let mappedQuestions: Question[] = [];

      try {
        const questionsResponse = await api.get(`/questions/exams/${examId}/questions/`);
        const examQuestions = Array.isArray(questionsResponse.data)
          ? questionsResponse.data
          : (questionsResponse.data?.results ?? []);

        console.log(`Exam questions endpoint returned ${examQuestions.length} records for exam ${examId}`);

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
        console.error(`Failed to load exam-question mappings for exam ${examId}:`, err);
      }

      if (mappedQuestions.length === 0) {
        try {
          const params = { exam: examId, page_size: 1000 };
          const questionsResponse = await api.get('/questions/questions/', { params });
          const rawQuestions = Array.isArray(questionsResponse.data)
            ? questionsResponse.data
            : (questionsResponse.data?.results ?? questionsResponse.data ?? []);

          console.log(`General questions endpoint returned ${rawQuestions.length} records for exam ${examId}`);

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
          console.error(`Failed to load questions list for exam ${examId}:`, err);
        }
      }

      if (mappedQuestions.length === 0 && attemptData.exam.pattern?.id) {
        const patternId = attemptData.exam.pattern.id;
        console.log('Falling back to pattern questions for pattern:', patternId);

        try {
          const questionsResponse = await api.get(`/patterns/patterns/${patternId}/questions/`);
          const sections = questionsResponse.data?.sections_with_questions ?? [];

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
          console.error(`Failed to load pattern questions for pattern ${patternId}:`, err);
        }
      }

      mappedQuestions.sort((a, b) => {
        const numA = a.question_number_in_pattern ?? a.question_number ?? 0;
        const numB = b.question_number_in_pattern ?? b.question_number ?? 0;
        return numA - numB;
      });

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

  const questionStats = useMemo(() => {
    const base = {
      answered: 0,
      flagged: 0,
      notVisited: 0,
      subjects: {} as Record<string, { total: number; answered: number; flagged: number }>
    };

    questions.forEach((question) => {
      const subjectKey = question.subject || 'General';
      if (!base.subjects[subjectKey]) {
        base.subjects[subjectKey] = { total: 0, answered: 0, flagged: 0 };
      }
      base.subjects[subjectKey].total += 1;

      const answer = answers.get(question.id);
      if (!answer || !answer.answer) {
        base.notVisited += 1;
        return;
      }

      base.subjects[subjectKey].answered += 1;
      if (answer.is_flagged) {
        base.flagged += 1;
        base.subjects[subjectKey].flagged += 1;
      } else {
        base.answered += 1;
      }
    });

    return base;
  }, [answers, questions]);

  interface SubjectSummary {
    key: string;
    name: string;
    questionIds: number[];
    questionIndices: number[];
    answered: number;
    flagged: number;
    total: number;
  }

  const subjectSummaries: SubjectSummary[] = useMemo(() => {
    const map = new Map<string, SubjectSummary>();

    questions.forEach((question, index) => {
      const subjectKey = (question.subject || 'General').trim();
      if (!map.has(subjectKey)) {
        map.set(subjectKey, {
          key: subjectKey,
          name: subjectKey,
          questionIds: [],
          questionIndices: [],
          answered: 0,
          flagged: 0,
          total: 0
        });
      }
      const summary = map.get(subjectKey)!;
      summary.questionIds.push(question.id);
      summary.questionIndices.push(index);
      summary.total += 1;

      const answer = answers.get(question.id);
      if (answer?.answer) summary.answered += 1;
      if (answer?.is_flagged) summary.flagged += 1;
    });

    return Array.from(map.values()).sort(
      (a, b) => (a.questionIndices[0] ?? 0) - (b.questionIndices[0] ?? 0)
    );
  }, [questions, answers]);

  const subjectSummaryEntries = useMemo(() => subjectSummaries.map(summary => ({
    name: summary.name,
    answered: summary.answered,
    total: summary.total,
    flagged: summary.flagged
  })), [subjectSummaries]);

  const paletteSubjects = useMemo(() => (
    activeSubject === 'All'
      ? subjectSummaries
      : subjectSummaries.filter(summary => summary.key === activeSubject)
  ), [activeSubject, subjectSummaries]);

  const activeSubjectIndexList = useMemo(() => {
    if (activeSubject === 'All') {
      return questions.map((_, index) => index);
    }
    const summary = subjectSummaries.find(item => item.key === activeSubject);
    return summary ? summary.questionIndices : [];
  }, [activeSubject, subjectSummaries, questions]);

  useEffect(() => {
    if (activeSubject === 'All') return;
    const exists = subjectSummaries.some(summary => summary.key === activeSubject);
    if (!exists) {
      setActiveSubject('All');
    }
  }, [activeSubject, subjectSummaries]);

  useEffect(() => {
    if (activeSubject === 'All') return;
    const summary = subjectSummaries.find(item => item.key === activeSubject);
    if (summary && !summary.questionIndices.includes(currentQuestionIndex)) {
      const nextIndex = summary.questionIndices[0];
      if (typeof nextIndex === 'number') {
        setCurrentQuestionIndex(nextIndex);
      }
    }
  }, [activeSubject, subjectSummaries, currentQuestionIndex]);

  const handleSubjectFilterChange = useCallback((subjectKey: string) => {
    setActiveSubject(subjectKey);
    if (subjectKey === 'All') return;

    const summary = subjectSummaries.find(item => item.key === subjectKey);
    if (summary && !summary.questionIndices.includes(currentQuestionIndex)) {
      const nextIndex = summary.questionIndices[0];
      if (typeof nextIndex === 'number') {
        setCurrentQuestionIndex(nextIndex);
      }
    }
  }, [subjectSummaries, currentQuestionIndex]);

  const totalQuestions = questions.length;
  const attemptedCount = totalQuestions - questionStats.notVisited;
  const progressPercent = totalQuestions === 0 ? 0 : Math.round((attemptedCount / totalQuestions) * 100);

  const handleNextQuestion = () => {
    if (activeSubject === 'All' || activeSubjectIndexList.length === 0) {
      setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
      return;
    }

    setCurrentQuestionIndex((prev) => {
      const currentPos = activeSubjectIndexList.indexOf(prev);
      if (currentPos === -1) {
        return activeSubjectIndexList[0] ?? prev;
      }
      const nextPos = (currentPos + 1) % activeSubjectIndexList.length;
      return activeSubjectIndexList[nextPos] ?? prev;
    });
  };

  const handlePreviousQuestion = () => {
    if (activeSubject === 'All' || activeSubjectIndexList.length === 0) {
      setCurrentQuestionIndex((prev) => (prev - 1 + questions.length) % questions.length);
      return;
    }

    setCurrentQuestionIndex((prev) => {
      const currentPos = activeSubjectIndexList.indexOf(prev);
      if (currentPos === -1) {
        return activeSubjectIndexList[0] ?? prev;
      }
      const prevPos = (currentPos - 1 + activeSubjectIndexList.length) % activeSubjectIndexList.length;
      return activeSubjectIndexList[prevPos] ?? prev;
    });
  };

  const paletteStatusStyles: Record<string, string> = {
    answered: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-200',
    flagged: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200',
    'not-visited': 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
  };

  const getPaletteTileClasses = (status: string, isActive: boolean) => {
    const base = paletteStatusStyles[status] || paletteStatusStyles['not-visited'];
    return `${base} ${isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''}`;
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
  const currentSubject = currentQuestion?.subject || 'General';
  const currentSection = currentQuestion?.section_name || 'Section';
  const currentNegativeMarks = currentQuestion?.negative_marks ?? null;
  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400 mb-1">Secure Exam Session</p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{examAttempt.exam.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Attempt ID #{examAttempt.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className={`text-lg font-mono ${getTimeColor()}`}>{formatTime(timeRemaining)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Time Remaining</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
              <p className="text-lg font-semibold">{attemptedCount}/{totalQuestions}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Attempted ({progressPercent}%)</p>
            </div>

            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2">
              {autoSaveStatus === 'saving' && <Save className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}
              {autoSaveStatus === 'saved' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {autoSaveStatus === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
              <div>
                <p className="text-sm font-medium">
                  {autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Saved' : 'Save Error'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Auto-save</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={requestFullscreen}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Request fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-4 h-[calc(100vh-104px)] flex gap-4 overflow-hidden">
        <section className="flex-1 flex flex-col gap-4 overflow-hidden">
          {currentQuestion && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Question</p>
                  <p className="text-lg font-semibold">Q{currentQuestionIndex + 1} / {totalQuestions}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Subject</p>
                  <p className="text-lg font-semibold">{currentSubject}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Section</p>
                  <p className="text-lg font-semibold">{currentSection}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Marks</p>
                    <p className="text-lg font-semibold">{currentQuestion.marks}</p>
                  </div>
                  {currentNegativeMarks !== null && (
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Negative</p>
                      <p className="text-lg font-semibold text-rose-500">-{currentNegativeMarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {subjectSummaries.length > 1 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm px-4 py-3 flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => handleSubjectFilterChange('All')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                      activeSubject === 'All'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    All Subjects
                  </button>
                  {subjectSummaries.map(summary => (
                    <button
                      key={`subject-chip-${summary.key}`}
                      onClick={() => handleSubjectFilterChange(summary.key)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-2 ${
                        activeSubject === summary.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{summary.name}</span>
                      <span className="text-[10px] opacity-80">{summary.answered}/{summary.total}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {currentQuestion.question_type === 'multiple_mcq' ? 'Multiple Select' : currentQuestion.question_type.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      {currentSubject}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleFlagToggle(currentQuestion.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                      currentAnswer?.is_flagged
                        ? 'bg-amber-500/90 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    {currentAnswer?.is_flagged ? 'Flagged for Review' : 'Mark for Review'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 question-scroll">
                  <div className="text-lg leading-relaxed text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-5">
                    <LaTeXRenderer content={currentQuestion.question_text} />
                  </div>

                  {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'single_mcq') && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const optionText = typeof option === 'string' ? option : option.text;
                        const optionId = typeof option === 'object' && option.id ? option.id : index;

                        return (
                          <label
                            key={optionId}
                            className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${currentAnswer?.answer === optionText
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-500'}`}
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
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {currentAnswer?.answer === optionText && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <span className="text-sm text-slate-900 dark:text-white">
                                <LaTeXRenderer content={optionText} />
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.question_type === 'multiple_mcq' && (() => {
                    const selectedAnswers = currentAnswer?.answer ? String(currentAnswer.answer).split('|').filter(Boolean) : [];
                    return (
                      <div className="space-y-3">
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-3">
                          Select all correct options (multiple answers allowed)
                        </p>
                        {currentQuestion.options.map((option, index) => {
                          const optionText = typeof option === 'string' ? option : option.text;
                          const optionId = typeof option === 'object' && option.id ? option.id : index;
                          const isSelected = selectedAnswers.includes(optionText);

                          return (
                            <label
                              key={optionId}
                              className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-slate-500'}`}
                            >
                              <input
                                type="checkbox"
                                name={`question-${currentQuestion.id}-${index}`}
                                value={optionText}
                                checked={isSelected}
                                onChange={(e) => {
                                  const currentAnswers = currentAnswer?.answer ? String(currentAnswer.answer).split('|') : [];
                                  const newAnswers = e.target.checked
                                    ? [...currentAnswers, optionText]
                                    : currentAnswers.filter(a => a !== optionText);
                                  handleAnswerChange(currentQuestion.id, newAnswers.join('|'));
                                }}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-sm text-slate-900 dark:text-white">
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
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                      <input
                        type="number"
                        value={currentAnswer?.answer || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        placeholder="Enter your numerical answer"
                        step="0.01"
                      />
                    </div>
                  )}

                  {currentQuestion.question_type === 'subjective' && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                      <textarea
                        value={currentAnswer?.answer || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="w-full h-48 p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Write your answer here..."
                      />
                    </div>
                  )}

                  {currentQuestion.question_type === 'true_false' && (
                    <div className="space-y-3">
                      {['True', 'False'].map((option) => (
                        <label
                          key={option}
                          className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                            currentAnswer?.answer === option
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-500'
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
                              currentAnswer?.answer === option ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {currentAnswer?.answer === option && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className="text-sm font-medium">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.question_type === 'fill_blank' && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                      <input
                        type="text"
                        value={currentAnswer?.answer || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        placeholder="Fill in the blank..."
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Type your answer in the blank space provided
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-2 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Answered: {questionStats.answered}
                    </span>
                    <span className="flex items-center gap-2 text-amber-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Flagged: {questionStats.flagged}
                    </span>
                    <span className="flex items-center gap-2 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Remaining: {questionStats.notVisited}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePreviousQuestion}
                      className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {showQuestionPalette && (
          <aside className="hidden lg:flex w-[340px] xl:w-[360px] flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 flex flex-col h-[60%]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Question Navigator</p>
                  <p className="text-lg font-semibold">Palette</p>
                </div>
                <button
                  onClick={() => setShowQuestionPalette(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {subjectSummaries.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3">
                  <button
                    onClick={() => handleSubjectFilterChange('All')}
                    className={`px-3 py-1.5 text-[11px] rounded-full border font-semibold ${
                      activeSubject === 'All'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {subjectSummaries.map(summary => (
                    <button
                      key={`palette-chip-${summary.key}`}
                      onClick={() => handleSubjectFilterChange(summary.key)}
                      className={`px-3 py-1.5 text-[11px] rounded-full border font-semibold ${
                        activeSubject === summary.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200'
                      }`}
                    >
                      {summary.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {paletteSubjects.length > 0 ? paletteSubjects.map(summary => (
                  <div key={`palette-section-${summary.key}`} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{summary.name}</p>
                        <p className="text-xs text-slate-500">{summary.answered}/{summary.total} answered • {summary.flagged} flagged</p>
                      </div>
                      {activeSubject === 'All' && (
                        <button
                          onClick={() => handleSubjectFilterChange(summary.key)}
                          className="text-[11px] text-blue-600 font-semibold"
                        >
                          Focus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {summary.questionIndices.map(questionIndex => {
                        const question = questions[questionIndex];
                        const status = getQuestionStatus(questionIndex);
                        return (
                          <button
                            key={`palette-${question.id}`}
                            onClick={() => handleQuestionNavigation(questionIndex)}
                            className={`h-16 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${getPaletteTileClasses(status, questionIndex === currentQuestionIndex)}`}
                          >
                            <span>Q{questionIndex + 1}</span>
                            <span className="text-[11px] text-slate-500">{question.marks}m</span>
                            {answers.get(question.id)?.is_flagged && <span className="text-[10px] text-amber-500 font-bold">⚑</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500">No subjects available.</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Answered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span> Flagged
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span> Not Visited
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Subject Overview</p>
                <span className="text-xs font-semibold text-blue-600">{subjectSummaryEntries.length} Subjects</span>
              </div>
              <div className="space-y-3">
                {subjectSummaryEntries.length > 0 ? subjectSummaryEntries.map(summary => (
                  <div key={summary.name} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-2xl px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold">{summary.name}</p>
                      <p className="text-xs text-slate-500">{summary.answered}/{summary.total} attempted</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600">{summary.flagged} flagged</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Subject information not provided.</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Proctoring</p>
                <span className={`px-3 py-1 text-xs rounded-full font-semibold ${violationCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {violationCount > 0 ? 'Attention' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Violations recorded: {violationCount} / {examAttempt.max_violations_allowed}
              </p>
              {violationCount > 0 && (
                <button
                  onClick={() => setShowViolationsPanel(true)}
                  className="w-full px-3 py-2 rounded-2xl text-xs font-semibold bg-amber-500/90 text-white hover:bg-amber-500 transition-colors"
                >
                  Review Violations
                </button>
              )}
              {violationCount === 0 && (
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Compliant so far
                </div>
              )}
            </div>
          </aside>
        )}

        {showQuestionPalette && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm">
            <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-950 rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Question Navigator</p>
                  <p className="text-lg font-semibold">Palette</p>
                </div>
                <button
                  onClick={() => setShowQuestionPalette(false)}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                {paletteSubjects.length > 0 ? paletteSubjects.map(summary => (
                  <div key={`mobile-section-${summary.key}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">{summary.name}</p>
                      {activeSubject === 'All' && (
                        <button
                          onClick={() => handleSubjectFilterChange(summary.key)}
                          className="text-[11px] text-blue-600 font-semibold"
                        >
                          Focus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {summary.questionIndices.map(questionIndex => {
                        const question = questions[questionIndex];
                        const status = getQuestionStatus(questionIndex);
                        return (
                          <button
                            key={`mobile-${question.id}`}
                            onClick={() => {
                              handleQuestionNavigation(questionIndex);
                              setShowQuestionPalette(false);
                            }}
                            className={`h-14 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${getPaletteTileClasses(status, questionIndex === currentQuestionIndex)}`}
                          >
                            <span>Q{questionIndex + 1}</span>
                            <span className="text-[10px] text-slate-500">{question.marks}m</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500">No subjects available.</p>
                )}
              </div>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Subjects</p>
                {subjectSummaryEntries.length > 0 ? subjectSummaryEntries.map(summary => (
                  <div key={`mobile-summary-${summary.name}`} className="flex items-center justify-between text-sm">
                    <span>{summary.name}</span>
                    <span className="text-xs text-slate-500">{summary.answered}/{summary.total} attempted</span>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500">No subject metadata</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!showQuestionPalette && (
          <button
            onClick={() => setShowQuestionPalette(true)}
            className="fixed bottom-6 right-6 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-2 text-sm font-semibold"
          >
            <Eye className="w-4 h-4" />
            Open Navigator
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

export default SecureExamExperience;

