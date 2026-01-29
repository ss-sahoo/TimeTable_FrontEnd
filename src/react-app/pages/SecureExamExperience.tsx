/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
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
  Minimize,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
  Pause,
  Monitor
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
  student_name?: string;
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
  const [isPaused, setIsPaused] = useState(false);

  // Pre-exam flow states
  const [examStarted, setExamStarted] = useState(false);

  // Security hook
  const {
    violations,
    violationCount,
    isDisqualified,
    isFullscreen,
    requestFullscreen
  } = useExamSecurity(parseInt(attemptId!), {
    maxViolations: examAttempt?.max_violations_allowed || 10,
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

  // Auto-start exam
  useEffect(() => {
    if (examAttempt && questions.length > 0 && !examStarted) {
      const timer = setTimeout(() => {
        setExamStarted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [examAttempt, questions.length, examStarted]);

  // Timer effect
  useEffect(() => {
    if (!examAttempt || isPaused) return;

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
  }, [examAttempt, isPaused]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      autoSaveAnswers();
    }, 30000);

    return () => clearInterval(interval);
  }, [answers]);

  // Listen for new violations and show toast
  useEffect(() => {
    if (violations.length > 0) {
      const latestViolation = violations[violations.length - 1];
      setCurrentToastViolation(latestViolation);
    }
  }, [violations]);

  const loadExamData = async () => {
    try {
      const attemptEndpoint = `/exams/attempts/${attemptId}/`;
      const attemptResponse = await api.get(attemptEndpoint);
      const attemptData = attemptResponse.data;
      setExamAttempt(attemptData);

      const examId = attemptData.exam.id;
      let mappedQuestions: Question[] = [];

      try {
        const questionsEndpoint = `/questions/exams/${examId}/questions/`;
        const questionsResponse = await api.get(questionsEndpoint);

        const examQuestions = Array.isArray(questionsResponse.data)
          ? questionsResponse.data
          : (questionsResponse.data?.results ?? []);

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
        console.error('Failed to load questions:', err);
      }

      // Fallback logic
      if (mappedQuestions.length === 0) {
        const params = { exam: examId, page_size: 1000 };
        const questionsResponse = await api.get('/questions/questions/', { params });
        const rawQuestions = Array.isArray(questionsResponse.data)
          ? questionsResponse.data
          : (questionsResponse.data?.results ?? questionsResponse.data ?? []);

        mappedQuestions = rawQuestions.map((item: any) => ({
          id: item.id,
          question_text: item.question_text ?? '',
          question_type: item.question_type ?? 'mcq',
          options: Array.isArray(item.options) ? item.options : [],
          correct_answer: item.correct_answer ?? '',
          explanation: item.explanation ?? '',
          marks: item.marks ?? 0,
          subject: item.subject ?? '',
          pattern_section: item.pattern_section ?? null,
          question_number: item.question_number ?? null,
          question_number_in_pattern: item.question_number_in_pattern ?? null,
          section_name: item.pattern_section_name ?? '',
          negative_marks: item.negative_marks ?? null,
        })).filter((q: Question) => Boolean(q.question_text));
      }

      mappedQuestions.sort((a, b) => {
        const numA = a.question_number_in_pattern ?? a.question_number ?? 0;
        const numB = b.question_number_in_pattern ?? b.question_number ?? 0;
        return numA - numB;
      });

      setQuestions(mappedQuestions);

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
      await api.post(`/exams/attempts/${attemptId}/auto-save/`, {
        answers: answersObject
      });
      setAutoSaveStatus('saved');
    } catch (error: any) {
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

    const newAnswer = { ...currentAnswer, answer };
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
      await api.post('/exams/submit-exam/', submissionData);
      navigate(`/exam-results/${attemptId}`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questionStats = useMemo(() => {
    const stats = { answered: 0, flagged: 0, notVisited: 0 };
    questions.forEach((q) => {
      const ans = answers.get(q.id);
      if (!ans || !ans.answer) stats.notVisited++;
      else {
        stats.answered++;
        if (ans.is_flagged) stats.flagged++;
      }
    });
    return stats;
  }, [answers, questions]);

  const subjectSummaries = useMemo(() => {
    const map = new Map<string, any>();
    questions.forEach((q, idx) => {
      const key = (q.subject || 'General').trim();
      if (!map.has(key)) map.set(key, { key, name: key, questionIndices: [], answered: 0, total: 0 });
      const s = map.get(key);
      s.questionIndices.push(idx);
      s.total++;
      if (answers.get(q.id)?.answer) s.answered++;
    });
    return Array.from(map.values()).sort((a, b) => a.questionIndices[0] - b.questionIndices[0]);
  }, [questions, answers]);

  const filteredQuestionIndices = useMemo(() => {
    if (activeSubject === 'All') return questions.map((_, i) => i);
    return subjectSummaries.find(s => s.key === activeSubject)?.questionIndices || [];
  }, [activeSubject, subjectSummaries, questions]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
        <p className="text-slate-600 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">Initializing Assessment Environment</p>
      </div>
    );
  }

  if (isDisqualified) return <ViolationWarning isOpen={true} violation={{ type: 'disqualified', message: 'Maximum violations reached.', timestamp: new Date(), confidence: 1 }} violationCount={violationCount} maxViolations={examAttempt?.max_violations_allowed || 10} onAcknowledge={() => navigate('/student-dashboard')} onClose={() => { }} />;

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 select-none">
      {/* Premium Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 shadow-sm transition-all">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1 line-clamp-1">{examAttempt?.exam.title}</h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Candidate: {examAttempt?.student_name || 'Student Session'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Status</p>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase">Live Connection</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Attempted</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{questionStats.answered} / {questions.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 min-w-[120px] justify-center`}>
              <Clock className={`w-4 h-4 ${timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
              <span className={`text-lg font-mono font-bold leading-none ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 transition-all"
              title="Temporary Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Final Submit
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Center: Question Area */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col overflow-hidden"
            >
              {/* Question Header */}
              <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-bold">
                    Q{currentQuestionIndex + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Question {currentQuestionIndex + 1} of {questions.length}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{currentQuestion?.subject}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">{currentQuestion?.marks} Marks</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleFlagToggle(currentQuestion.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentAnswer?.is_flagged ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'}`}
                >
                  <Flag className={`w-3.5 h-3.5 ${currentAnswer?.is_flagged ? 'fill-current' : ''}`} />
                  {currentAnswer?.is_flagged ? 'Flagged for Review' : 'Mark for Review'}
                </button>
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 question-scroll">
                <div className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[24px] border border-slate-100 dark:border-slate-800">
                  <LaTeXRenderer content={currentQuestion?.question_text || ''} />
                </div>

                <div className="space-y-4">
                  {currentQuestion?.question_type.includes('mcq') && currentQuestion.options.map((opt: any, i) => {
                    const text = typeof opt === 'string' ? opt : opt.text;
                    const isSelected = currentQuestion?.question_type === 'multiple_mcq'
                      ? (currentAnswer?.answer || '').toString().split('|').includes(text)
                      : currentAnswer?.answer === text;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (currentQuestion.question_type === 'multiple_mcq') {
                            const cur = (currentAnswer?.answer || '').toString().split('|').filter(Boolean);
                            const updated = cur.includes(text) ? cur.filter(a => a !== text) : [...cur, text];
                            handleAnswerChange(currentQuestion.id, updated.join('|'));
                          } else {
                            handleAnswerChange(currentQuestion.id, text);
                          }
                        }}
                        className={`w-full group text-left px-6 py-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-500/5' : 'border-slate-100 bg-white hover:border-blue-200 dark:bg-slate-800 dark:border-transparent'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-200 dark:border-slate-600 group-hover:border-blue-300'}`}>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>{String.fromCharCode(65 + i)}</span>
                        </div>
                        <div className="flex-1 text-slate-700 dark:text-slate-200 font-medium">
                          <LaTeXRenderer content={text} />
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      </button>
                    );
                  })}

                  {currentQuestion?.question_type === 'numerical' && (
                    <div className="max-w-xs">
                      <input
                        type="number"
                        placeholder="Type numerical value..."
                        value={currentAnswer?.answer || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-transparent rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-lg font-bold"
                      />
                    </div>
                  )}

                  {currentQuestion?.question_type === 'subjective' && (
                    <textarea
                      placeholder="Input your response here..."
                      value={currentAnswer?.answer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-full h-64 px-8 py-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-transparent rounded-[32px] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-lg leading-relaxed resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuestionNavigation(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-white transition-all disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl">
                    <div className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {autoSaveStatus === 'saving' ? 'Syncing...' : 'Autosave Active'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleQuestionNavigation(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all ${currentQuestionIndex === questions.length - 1 ? 'hidden' : ''}`}
                  >
                    Save & Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {currentQuestionIndex === questions.length - 1 && (
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Finish Assessment
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Right: Progress & Subject Navigation */}
        <aside className="w-16 md:w-80 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Sections</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveSubject('All')}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between ${activeSubject === 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                  All Subjects
                  <span className={`text-[10px] opacity-60 ${activeSubject === 'All' ? 'text-white' : ''}`}>{questions.length}</span>
                </button>
                {subjectSummaries.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActiveSubject(s.key)}
                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center justify-between ${activeSubject === s.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                  >
                    <span className="truncate pr-2">{s.name}</span>
                    <span className={`text-[10px] opacity-60 ${activeSubject === s.key ? 'text-white' : ''}`}>{s.total}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 question-scroll">
              <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
                {filteredQuestionIndices.map(idx => {
                  const q = questions[idx];
                  const ans = answers.get(q.id);
                  const isAnswered = ans && ans.answer;
                  const isFlagged = ans && ans.is_flagged;
                  const isCurrent = idx === currentQuestionIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionNavigation(idx)}
                      className={`h-11 rounded-xl text-xs font-bold transition-all border-2 flex items-center justify-center relative ${isCurrent ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-inner' :
                          isFlagged ? 'border-amber-400 bg-amber-50 text-amber-700' :
                            isAnswered ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                              'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50'
                        }`}
                    >
                      {idx + 1}
                      {isFlagged && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500">Answered</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{questionStats.answered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500">Flagged</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{questionStats.flagged}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500">Unanswered</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{questionStats.notVisited}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Proctoring & Violation UI */}
      <WebcamMonitor
        attemptId={parseInt(attemptId!)}
        onViolationDetected={handleViolationDetected}
        captureInterval={5}
        showPreview={true}
      />

      <ViolationWarning
        isOpen={showViolationWarning}
        violation={currentViolation}
        violationCount={violationCount}
        maxViolations={examAttempt?.max_violations_allowed || 10}
        onAcknowledge={handleViolationAcknowledged}
        onClose={handleViolationAcknowledged}
      />

      <ViolationToast
        violation={currentToastViolation}
        onClose={() => setCurrentToastViolation(null)}
      />

      <style>{`
        .question-scroll::-webkit-scrollbar { width: 6px; }
        .question-scroll::-webkit-scrollbar-track { background: transparent; }
        .question-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        dark .question-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

export default SecureExamExperience;
