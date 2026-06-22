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
  Send,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Monitor
} from 'lucide-react';
import useExamSecurity from '../hooks/useExamSecurity';
import ProctoringOverlay from '../components/ProctoringOverlay';
import ViolationToast from '../components/ViolationToast';
import LaTeXRenderer from '../components/LaTeXRenderer';
import ViolationsPanel from '../components/ViolationsPanel';
import { api, getErrorMessage } from '../hooks/useApi';

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
  structure?: any;
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
    proctoring_snapshot_interval: number;
    allow_tab_switching: boolean;
    end_date: string;
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
  time_remaining?: number;
  max_violations_allowed: number;
  violations_count: number;
}

interface Answer {
  question_id: number;
  answer: string | string[];
  is_flagged: boolean;
  time_spent: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const isAttemptSubmitted = (attempt: ExamAttempt | null) =>
  attempt?.status === 'submitted' || attempt?.status === 'auto_submitted';

/**
 * Compute a stable deadline (ms since epoch) from the attempt data.
 * Priority:
 *  1. started_at + duration_minutes   (most reliable)
 *  2. end_date from exam
 *  3. time_remaining (fallback)
 */
const computeDeadline = (attempt: ExamAttempt): number | null => {
  if (attempt.started_at && attempt.exam.duration_minutes) {
    const startMs = new Date(attempt.started_at).getTime();
    if (!isNaN(startMs)) {
      return startMs + attempt.exam.duration_minutes * 60 * 1000;
    }
  }
  if (attempt.exam.end_date) {
    const endMs = new Date(attempt.exam.end_date).getTime();
    if (!isNaN(endMs)) return endMs;
  }
  if (attempt.time_remaining !== undefined && attempt.time_remaining > 0) {
    return Date.now() + attempt.time_remaining * 1000;
  }
  return null;
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────

interface ConfirmSubmitModalProps {
  isOpen: boolean;
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ConfirmSubmitModal: React.FC<ConfirmSubmitModalProps> = ({
  isOpen,
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
  isSubmitting
}) => {
  if (!isOpen) return null;

  const unanswered = totalCount - answeredCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-8"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              Finish Exam?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Are you sure you want to finish the exam? This action cannot be undone.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{answeredCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 mt-1">Answered</p>
              </div>
              <div className={`${unanswered > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'} border rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${unanswered > 0 ? 'text-red-600' : 'text-slate-400'}`}>{unanswered}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${unanswered > 0 ? 'text-red-600/70' : 'text-slate-400'}`}>Unanswered</p>
              </div>
            </div>

            {unanswered > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 mb-6">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  You have <strong>{unanswered}</strong> unanswered question{unanswered > 1 ? 's' : ''}. Unanswered questions will receive no marks.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                No, Resume
              </button>
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Yes, Finish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [isWebcamMinimized, setIsWebcamMinimized] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Pre-exam flow states
  const [examStarted, setExamStarted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Deadline-based timer: absolute ms timestamp when exam ends
  const deadlineRef = useRef<number | null>(null);
  // Guard so auto-submit fires only once
  const autoSubmitFiredRef = useRef(false);
  // Resync interval ref
  const resyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Security hook
  const {
    logViolation,
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
    initialViolationCount: examAttempt?.violations_count || 0
  });

  // Load exam data on mount
  useEffect(() => {
    loadExamData();
  }, [attemptId]);

  // Auto-start exam when data is ready
  useEffect(() => {
    if (examAttempt && questions.length > 0 && !examStarted) {
      const timer = setTimeout(() => setExamStarted(true), 500);
      return () => clearTimeout(timer);
    }
  }, [examAttempt, questions.length, examStarted]);

  // ── Timer: tick every second against the fixed deadline ──────────────────
  useEffect(() => {
    if (!examAttempt || !deadlineRef.current) return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((deadlineRef.current! - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0 && !autoSubmitFiredRef.current) {
        autoSubmitFiredRef.current = true;
        handleAutoSubmit();
      }
    };

    tick(); // immediate first tick
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [examAttempt, deadlineRef.current]);

  // ── Periodic resync with server every 30s ────────────────────────────────
  useEffect(() => {
    if (!attemptId || !examAttempt) return;

    const resync = async () => {
      try {
        const response = await api.get(`/exams/attempts/${attemptId}/`);
        const refreshed = response.data as ExamAttempt;

        // If already submitted, redirect
        if (isAttemptSubmitted(refreshed)) {
          navigate(`/exam-results/${attemptId}`, { replace: true });
          return;
        }

        // Recompute deadline from fresh server data
        const newDeadline = computeDeadline(refreshed);
        if (newDeadline && newDeadline > Date.now()) {
          deadlineRef.current = newDeadline;
        }

        setExamAttempt(prev => prev ? { ...prev, ...refreshed } : refreshed);
      } catch (err) {
        console.error('Timer resync failed:', err);
      }
    };

    resyncIntervalRef.current = setInterval(resync, 30_000);
    return () => {
      if (resyncIntervalRef.current) clearInterval(resyncIntervalRef.current);
    };
  }, [attemptId, examAttempt, navigate]);

  // ── Auto-save every 30s ───────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => autoSaveAnswers(), 30_000);
    return () => clearInterval(interval);
  }, [answers]);

  // ── Back-button / page-show guard ─────────────────────────────────────────
  useEffect(() => {
    if (!attemptId) return;

    const verifyAttemptStatus = async () => {
      try {
        const response = await api.get(`/exams/attempts/${attemptId}/`);
        const latest = response.data as ExamAttempt;
        if (isAttemptSubmitted(latest)) {
          navigate(`/exam-results/${attemptId}`, { replace: true });
        }
      } catch (err) {
        console.error('Failed to verify exam attempt status:', err);
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      // persisted = true means page was restored from bfcache
      void verifyAttemptStatus();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [attemptId, navigate]);

  // ── Violations toast ──────────────────────────────────────────────────────
  // Per user requirement: Hide AI/Proctoring violations but SHOW Tab Switch to students
  const lastViolationTimeShown = useRef<number>(0);
  useEffect(() => {
    if (violations.length > 0) {
      const latest = violations[violations.length - 1];
      const ts = latest.timestamp.getTime();

      // Filter what's visible to the student (Whitelist approach)
      const VISIBLE_TO_STUDENT = ['tab_switch', 'window_blur', 'tab_hidden', 'fullscreen_exit'];
      if (!VISIBLE_TO_STUDENT.includes(latest.type)) return;

      // VISIBLE violations: Tab switch, Fullscreen exit
      if (ts > lastViolationTimeShown.current) {
        lastViolationTimeShown.current = ts;
        setCurrentToastViolation(latest);
      }
    }
  }, [violations]);

  const handleCloseToast = useCallback(() => setCurrentToastViolation(null), []);

  // ── Load exam data ────────────────────────────────────────────────────────
  const loadExamData = async () => {
    try {
      const attemptResponse = await api.get(`/exams/attempts/${attemptId}/`);
      const attemptData: ExamAttempt = attemptResponse.data;

      // Redirect immediately if already submitted
      if (isAttemptSubmitted(attemptData)) {
        navigate(`/exam-results/${attemptId}`, { replace: true });
        return;
      }

      setExamAttempt(attemptData);

      // Compute and store deadline
      const deadline = computeDeadline(attemptData);
      if (deadline !== null) {
        const remaining = Math.round((deadline - Date.now()) / 1000);
        if (remaining <= 0) {
          setIsExpired(true);
          setLoading(false);
          return;
        }
        deadlineRef.current = deadline;
        setTimeRemaining(remaining);
      }

      const examId = attemptData.exam.id;
      let mappedQuestions: Question[] = [];

      try {
        const questionsResponse = await api.get(`/questions/exams/${examId}/questions/`);
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
                structure: q.structure ?? {},
              };
            })
            .filter((q: Question) => Boolean(q.question_text));
        }
      } catch (err) {
        console.error('Failed to load questions from primary endpoint:', err);
      }

      // Fallback
      if (mappedQuestions.length === 0) {
        const questionsResponse = await api.get('/questions/questions/', { params: { exam: examId, page_size: 1000 } });
        const rawQuestions = Array.isArray(questionsResponse.data)
          ? questionsResponse.data
          : (questionsResponse.data?.results ?? questionsResponse.data ?? []);

        mappedQuestions = rawQuestions
          .map((item: any) => ({
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
            structure: item.structure ?? {},
          }))
          .filter((q: Question) => Boolean(q.question_text));
      }

      mappedQuestions.sort((a, b) => {
        const numA = a.question_number_in_pattern ?? a.question_number ?? 0;
        const numB = b.question_number_in_pattern ?? b.question_number ?? 0;
        return numA - numB;
      });

      setQuestions(mappedQuestions);

      if ((attemptData as any).answers) {
        const existingAnswers = new Map<number, Answer>();
        Object.entries((attemptData as any).answers).forEach(([questionId, answer]: [string, any]) => {
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

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const autoSaveAnswers = async () => {
    if (answers.size === 0) return;
    setAutoSaveStatus('saving');
    try {
      await api.post(`/exams/attempts/${attemptId}/auto-save/`, {
        answers: Object.fromEntries(answers)
      });
      setAutoSaveStatus('saved');
    } catch {
      setAutoSaveStatus('error');
    }
  };

  // ── Answer handlers ───────────────────────────────────────────────────────
  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    const current = answers.get(questionId) || {
      question_id: questionId,
      answer: '',
      is_flagged: false,
      time_spent: 0
    };
    setAnswers(prev => new Map(prev.set(questionId, { ...current, answer })));
  };

  const handleFlagToggle = (questionId: number) => {
    const current = answers.get(questionId) || {
      question_id: questionId,
      answer: '',
      is_flagged: false,
      time_spent: 0
    };
    setAnswers(prev => new Map(prev.set(questionId, { ...current, is_flagged: !current.is_flagged })));
  };

  const handleQuestionNavigation = (index: number) => setCurrentQuestionIndex(index);

  const handleViolationDetected = (violation: any) => {
    logViolation(violation.type, {
      message: violation.message,
      confidence: violation.confidence,
      ...violation.analysis
    }, true);
  };

  const handleViolationAcknowledged = () => {
    setShowViolationWarning(false);
    setCurrentViolation(null);
  };

  // ── Submit (called after confirmation) ───────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const submissionData = {
        attempt_id: parseInt(attemptId!),
        answers: Object.fromEntries(answers)
      };
      await api.post('/exams/submit-exam/', submissionData);
      // Use replace so exam page is removed from history stack
      navigate(`/exam-results/${attemptId}`, { replace: true });
    } catch (error: any) {
      setError(getErrorMessage(error, 'Failed to submit exam'));
      setIsSubmitting(false);
    }
  };

  // Auto-submit (timer expiry) — no confirmation prompt
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const submissionData = {
        attempt_id: parseInt(attemptId!),
        answers: Object.fromEntries(answers)
      };
      await api.post('/exams/submit-exam/', submissionData);
      navigate(`/exam-results/${attemptId}`, { replace: true });
    } catch (error: any) {
      setError(getErrorMessage(error, 'Failed to auto-submit exam'));
      setIsSubmitting(false);
    }
  };

  // Open confirmation modal (for manual submit buttons)
  const handleSubmitRequest = () => {
    if (isSubmitting) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await handleSubmit();
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  // ── Formatting ────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const questionStats = useMemo(() => {
    const stats = { answered: 0, flagged: 0, notVisited: 0 };
    questions.forEach(q => {
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

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
        <p className="text-slate-600 dark:text-slate-400 font-bold tracking-widest text-xs uppercase">Initializing Assessment Environment</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assessment Expired</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
          This assessment session has reached its time limit or the scheduled end date has passed. You can no longer make any changes.
        </p>
        <button
          onClick={() => navigate(`/exam-results/${attemptId}`)}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          View Results
        </button>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

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
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Security</p>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 uppercase">Active Monitoring</span>
              </div>
            </div>
          </div>


          {/* Timer — no pause button (server controls time) */}
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 min-w-[120px] justify-center">
              <Clock className={`w-4 h-4 ${timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
              <span className={`text-lg font-mono font-bold leading-none ${timeRemaining < 300 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Final Submit button → opens confirmation modal */}
          <button
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />
            }
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

                  {/* Structured Question Content */}
                  {currentQuestion?.structure?.is_nested && (
                    <div className="mt-8 space-y-6">
                      <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-full" />

                      {currentQuestion.structure.nested_type === 'internal_choice' ? (
                        <div className="space-y-8">
                          {(currentQuestion.structure.parts || []).map((part: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden">
                              <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Choice {part.label || String.fromCharCode(65 + idx)}</span>
                                {part.marks && <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg">+{part.marks} Marks</span>}
                              </div>
                              <div className="p-6 space-y-4">
                                {part.description && <p className="text-xs text-slate-400 italic mb-2">Note: {part.description}</p>}
                                <div className="text-base text-slate-700 dark:text-slate-300">
                                  <LaTeXRenderer content={part.question_text || ''} />
                                </div>

                                {(part.parts || []).map((subPart: any, spIdx: number) => (
                                  <div key={spIdx} className="mt-4 pl-4 border-l-2 border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-slate-500">{subPart.label || String.fromCharCode(97 + spIdx)})</span>
                                      <span className="text-[10px] text-slate-400">({subPart.marks} marks)</span>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                      <LaTeXRenderer content={subPart.question_text || ''} />
                                    </div>
                                  </div>
                                ))}

                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  <p className="text-xs text-slate-500 font-medium">Answer this choice?</p>
                                  <button
                                    onClick={() => {
                                      let currentAns: any = {};
                                      try { currentAns = JSON.parse(currentAnswer?.answer as string || '{}'); } catch (e) { currentAns = { text: currentAnswer?.answer }; }
                                      currentAns.selected_choice = part.label || `Choice ${String.fromCharCode(65 + idx)}`;
                                      handleAnswerChange(currentQuestion.id, JSON.stringify(currentAns));
                                    }}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${(function () {
                                      let sel = '';
                                      try { sel = JSON.parse(currentAnswer?.answer as string || '{}').selected_choice; } catch (e) { }
                                      return sel === (part.label || `Choice ${String.fromCharCode(65 + idx)}`);
                                    })()
                                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                  >
                                    {(function () {
                                      let sel = '';
                                      try { sel = JSON.parse(currentAnswer?.answer as string || '{}').selected_choice; } catch (e) { }
                                      return sel === (part.label || `Choice ${String.fromCharCode(65 + idx)}`);
                                    })() ? 'Selected' : 'Select Choice'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {(currentQuestion.structure.parts || []).map((part: any, idx: number) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold shrink-0">
                                {part.label || String.fromCharCode(97 + idx)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Part {part.label || String.fromCharCode(97 + idx)}</span>
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">{part.marks} Marks</span>
                                </div>
                                <div className="text-base text-slate-700 dark:text-slate-300">
                                  <LaTeXRenderer content={part.question_text || ''} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                    <div className="space-y-6">
                      {currentQuestion?.structure?.is_nested ? (
                        <div className="space-y-6">
                          {(function () {
                            let selected = '';
                            try { selected = JSON.parse(currentAnswer?.answer as string || '{}').selected_choice; } catch (e) { }

                            if (!selected) {
                              return (
                                <div className="p-12 text-center rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Choice Selection Required</h4>
                                  <p className="text-slate-500 text-sm mt-2">Please select an option from the choices above to provide your answer.</p>
                                </div>
                              );
                            }

                            const parts = currentQuestion.structure.parts || [];
                            const nestedType = currentQuestion.structure.nested_type;

                            if (nestedType === 'internal_choice') {
                              const selectedPart = parts.find((p: any, idx: number) => (p.label || `Choice ${String.fromCharCode(65 + idx)}`) === selected);

                              if (selectedPart) {
                                return (
                                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Your Response for {selected}</h4>
                                      <button
                                        onClick={() => {
                                          let currentAns: any = {};
                                          try { currentAns = JSON.parse(currentAnswer?.answer as string || '{}'); } catch (e) { }
                                          delete currentAns.selected_choice;
                                          handleAnswerChange(currentQuestion.id, JSON.stringify(currentAns));
                                        }}
                                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                                      >
                                        Change Selection
                                      </button>
                                    </div>

                                    {(selectedPart.parts || []).length > 0 ? (
                                      <div className="space-y-6">
                                        {(selectedPart.parts).map((subPart: any, spIdx: number) => (
                                          <div key={spIdx} className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Part {subPart.label || String.fromCharCode(97 + spIdx)}</label>
                                            <textarea
                                              placeholder={`Write answer for part ${subPart.label || String.fromCharCode(97 + spIdx)}...`}
                                              value={(function () {
                                                try {
                                                  const data = JSON.parse(currentAnswer?.answer as string || '{}');
                                                  return data.parts?.[selected]?.[spIdx] || '';
                                                } catch (e) { return ''; }
                                              })()}
                                              onChange={(e) => {
                                                let data: any = {};
                                                try { data = JSON.parse(currentAnswer?.answer as string || '{}'); } catch (e) { }
                                                if (!data.parts) data.parts = {};
                                                if (!data.parts[selected]) data.parts[selected] = {};
                                                data.parts[selected][spIdx] = e.target.value;
                                                handleAnswerChange(currentQuestion.id, JSON.stringify(data));
                                              }}
                                              className="w-full h-32 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-transparent rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-lg resize-none"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <textarea
                                        placeholder={`Write your response for ${selected} here...`}
                                        value={(function () {
                                          try {
                                            const data = JSON.parse(currentAnswer?.answer as string || '{}');
                                            return data.text || '';
                                          } catch (e) { return currentAnswer?.answer; }
                                        })()}
                                        onChange={(e) => {
                                          let data: any = {};
                                          try {
                                            data = JSON.parse(currentAnswer?.answer as string || '{}');
                                            data.text = e.target.value;
                                          } catch (e) {
                                            data = { selected_choice: selected, text: e.target.value };
                                          }
                                          handleAnswerChange(currentQuestion.id, JSON.stringify(data));
                                        }}
                                        className="w-full h-64 px-8 py-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-transparent rounded-[32px] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-lg leading-relaxed resize-none"
                                      />
                                    )}
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <textarea
                          placeholder="Input your response here..."
                          value={currentAnswer?.answer || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="w-full h-64 px-8 py-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-transparent rounded-[32px] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-lg leading-relaxed resize-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    {autoSaveStatus === 'saving' ? 'Syncing...' : 'Autosave Active'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuestionNavigation(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-white transition-all disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    onClick={() => handleQuestionNavigation(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all ${currentQuestionIndex === questions.length - 1 ? 'hidden' : ''}`}
                  >
                    Save & Next
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Finish Assessment → opens confirmation modal */}
                  {currentQuestionIndex === questions.length - 1 && (
                    <button
                      onClick={handleSubmitRequest}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
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
                      className={`h-11 rounded-xl text-xs font-bold transition-all border-2 flex items-center justify-center relative ${isCurrent
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-inner'
                        : isFlagged
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : isAnswered
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50'
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

      {/* 
        Webcam proctoring — ProctoringOverlay is ALWAYS mounted (when webcam enabled) to keep 
        the capture engine alive. When minimized, it's hidden via CSS but screenshots keep running.
      */}
      {examAttempt?.exam.enable_webcam_proctoring && (
        <div className={`fixed z-50 transition-all duration-300 ${isWebcamMinimized ? 'bottom-4 left-1/2 -translate-x-1/2' : 'bottom-6 left-6'}`}>
          {/* Minimized pill shown on top of the hidden overlay */}
          {isWebcamMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-2xl border-2 border-white dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <Monitor className="w-4 h-4 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Camera Active • Recording</span>
              </div>
              <button
                onClick={() => setIsWebcamMinimized(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-all"
                title="Maximize camera"
              >
                <Maximize className="w-4 h-4 text-white" />
              </button>
            </motion.div>
          )}

          {/* 
            CRITICAL: We MUST NOT use 'display: none' here. 
            Browsers stop rendering the video element if it's hidden with display:none, 
            which results in pitch-black snapshots.
            Instead, we move it far off-screen to keep the stream active for the capture engine.
          */}
          <div className={isWebcamMinimized ? "fixed -left-[9999px] opacity-0 pointer-events-none" : "block"}>
            <ProctoringOverlay
              attemptId={parseInt(attemptId!)}
              screenshotIntervalSec={examAttempt?.exam.proctoring_snapshot_interval || 15}
              enableAudio={true}
              enableVideoRecording={true}
              onViolation={handleViolationDetected}
              externalViolations={violations}
            />
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      <ConfirmSubmitModal
        isOpen={showConfirmModal}
        answeredCount={questionStats.answered}
        totalCount={questions.length}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Only show toast if it's not a silent violation */}
      {currentToastViolation && (
        <ViolationToast
          violation={currentToastViolation}
          onClose={handleCloseToast}
        />
      )}


      <ViolationsPanel
        attemptId={parseInt(attemptId!)}
        isOpen={showViolationsPanel}
        onClose={() => setShowViolationsPanel(false)}
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