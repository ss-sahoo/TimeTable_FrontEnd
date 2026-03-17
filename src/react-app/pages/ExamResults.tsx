import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from "react-toastify";
import {
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Eye,
  AlertTriangle,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  ArrowLeft,
  Star,
  Percent,
  Timer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Share2,
  Zap,
  Filter,
  FileText,
  Printer,
  Loader2,
  Camera,
} from 'lucide-react';
import LaTeXRenderer from '../components/LaTeXRenderer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnswerSheetBranding {
  logo_url?: string | null;
  primary_hex?: string;
}

interface AnswerSheetInfo {
  url: string | null;
  generated_at?: string | null;
  branding?: AnswerSheetBranding;
  grading?: {
    percentage?: number;
    marks_obtained?: number;
    total_marks?: number;
    grade?: string;
    remarks?: string;
  };
  invigilator_placeholders?: { label: string; value: string }[];
  question_breakdown?: {
    question_number: number;
    question_text: string;
    student_answer: string;
    correct_answer: string;
    marks_obtained: number;
    max_marks: number;
  }[];
}

interface ExamResult {
  attempt: {
    id: number;
    exam_title: string;
    student_name: string;
    status: string;
    score: number;
    percentage: number;
    time_spent: number;
    submitted_at: string;
    violations_count: number;
    exam_end_date: string;
    started_at: string;
    exam_duration_minutes: number;
  };
  overall_score: number;
  total_questions: number;
  percentage: number;
  section_results: {
    [key: string]: {
      section_name: string;
      question_type: string;
      score: number | null;
      max_marks: number;
      status: 'available' | 'pending_review';
      feedback: string;
    };
  };
  detailed_answers: {
    [key: string]: {
      question_number?: number;
      question_text: string;
      question_type: string;
      subject?: string;
      user_answer: string;
      correct_answer: string;
      is_correct: boolean;
      marks_obtained: number;
      max_marks: number;
      explanation: string;
    };
  };
  submitted_at: string;
  time_spent: number;
  answer_sheet_pdf?: AnswerSheetInfo | null;
}

const ExamResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const { user } = useAuthContext();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'sections'>('overview');
  const [detailFilter, setDetailFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [downloading, setDownloading] = useState(false);
  const [resultsNowAvailable, setResultsNowAvailable] = useState(false);
  const answerSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load exam result for the attempt ID
    loadExamResult();
  }, [attemptId, navigate]);

  // Auto-refresh when hidden results become available
  useEffect(() => {
    const hiddenResult = result as any;
    if (hiddenResult?.status === 'hidden' && hiddenResult?.available_at) {
      const availableAt = new Date(hiddenResult.available_at).getTime();
      const now = Date.now();
      const delay = availableAt - now;

      if (delay <= 0) {
        setResultsNowAvailable(true);
        return;
      }

      setResultsNowAvailable(false);
      const timer = setTimeout(() => {
        setResultsNowAvailable(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setResultsNowAvailable(false);
    }
  }, [result]);

  const loadExamResult = async () => {
    try {
      console.log('Loading exam results for attempt:', attemptId);
      const response = await api.get(`/exams/attempts/${attemptId}/results/`);
      const data = response.data;
      console.log('Exam results data:', data);
      setResult(data);
    } catch (error) {
      console.error('Error loading exam results:', error);
      const errorResponse = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: unknown; status?: number } }).response
        : undefined;
      console.error('Error details:', errorResponse?.data);
      console.error('Error status:', errorResponse?.status);
      if (errorResponse?.status === 404) {
        setError('Exam results not found');
      } else if (errorResponse?.status === 403) {
        setError('Access denied - you cannot view these results');
      } else {
        setError('Failed to load exam results');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if this is an early submission from URL params
  const urlParams = new URLSearchParams(location.search);
  const isEarlySubmission = urlParams.get('early') === 'true';

  // Check if exam time has completed
  const isExamTimeCompleted = () => {
    if (!result?.attempt) return false;
    
    const now = new Date();
    const examEndTime = new Date(result.attempt.exam_end_date);
    const attemptStartTime = new Date(result.attempt.started_at);
    const examDurationMs = result.attempt.exam_duration_minutes * 60 * 1000;
    const attemptEndTime = new Date(attemptStartTime.getTime() + examDurationMs);
    
    // Exam time is completed if either the global exam end time has passed
    // OR the individual attempt duration has elapsed
    return now >= examEndTime || now >= attemptEndTime;
  };

  const parseAnswerSheetPayload = (payload?: any): AnswerSheetInfo | null => {
    if (!payload) {
      return null;
    }
    return {
      url: payload.url ?? payload.pdf_url ?? null,
      generated_at: payload.generated_at ?? null,
      branding: payload.branding,
      grading: payload.grading,
      invigilator_placeholders: payload.invigilator_placeholders,
      question_breakdown: payload.question_breakdown,
    };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 60) return { level: 'Satisfactory', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const sectionValues = useMemo(
    () => (result ? Object.values(result.section_results || {}) : []),
    [result]
  );
  const totalMarks = useMemo(
    () => sectionValues.reduce((sum, section) => sum + (section.max_marks || 0), 0),
    [sectionValues]
  );
  const availableSections = useMemo(
    () => sectionValues.filter(section => section.status === 'available'),
    [sectionValues]
  );
  const pendingSections = useMemo(
    () => sectionValues.filter(section => section.status === 'pending_review'),
    [sectionValues]
  );
  const totalAvailableScore = useMemo(
    () => availableSections.reduce((sum, section) => sum + (section.score || 0), 0),
    [availableSections]
  );
  const detailedEntries = useMemo(() => {
    if (!result) return [];
    const entries = Object.entries(result.detailed_answers || {}).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    // Deduplicate entries by question_number and subject
    // Prefer entries with actual user answers over empty ones
    const uniqueMap = new Map<string, typeof entries[0]>();
    entries.forEach((entry) => {
      const uniqueKey = `${entry.subject || 'General'}-${entry.question_number || entry.id}`;
      const existing = uniqueMap.get(uniqueKey);

      if (!existing) {
        // First occurrence - add it
        uniqueMap.set(uniqueKey, entry);
      } else {
        // Prefer entry with actual user_answer over empty one
        const existingHasAnswer = existing.user_answer && existing.user_answer.trim() !== '';
        const newHasAnswer = entry.user_answer && entry.user_answer.trim() !== '';

        if (!existingHasAnswer && newHasAnswer) {
          // Replace with entry that has an actual answer
          uniqueMap.set(uniqueKey, entry);
        }
      }
    });

    let uniqueEntries = Array.from(uniqueMap.values());

    // Sort by subject and then by question number
    uniqueEntries.sort((a, b) => {
      const subjectA = (a.subject || 'General').toLowerCase();
      const subjectB = (b.subject || 'General').toLowerCase();
      if (subjectA !== subjectB) {
        return subjectA.localeCompare(subjectB);
      }
      const numA = a.question_number || 0;
      const numB = b.question_number || 0;
      return numA - numB;
    });

    // Apply filter
    if (detailFilter === 'correct') {
      return uniqueEntries.filter((entry) => entry.is_correct);
    }
    if (detailFilter === 'incorrect') {
      return uniqueEntries.filter((entry) => !entry.is_correct);
    }
    return uniqueEntries;
  }, [result, detailFilter]);
  const accuracy = useMemo(() => {
    if (!result || totalMarks === 0) return 0;
    return ((result.attempt?.score || 0) / totalMarks) * 100;
  }, [result, totalMarks]);
  const attemptPercentageValue = useMemo(() => {
    const raw = result?.attempt?.percentage;
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const fallback = Number(result?.percentage);
    return Number.isFinite(fallback) ? fallback : 0;
  }, [result]);
  const performance = useMemo(
    () => getPerformanceLevel(attemptPercentageValue),
    [attemptPercentageValue]
  );
  const canDownloadAnswerSheet = activeTab === 'detailed' && detailedEntries.length > 0;

  const RenderStudentAnswer = ({ answer }: { answer: string }) => {
    // Check for empty or whitespace-only answers
    if (!answer || answer.trim() === '') {
      return <span className="text-slate-400 italic">Not attempted</span>;
    }

    try {
      const parsed = JSON.parse(answer);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.selected_choice) {
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Selected: {parsed.selected_choice}</span>
              </div>

              {parsed.parts && parsed.parts[parsed.selected_choice] ? (
                <div className="space-y-3 pl-3 border-l-2 border-slate-200">
                  {Object.entries(parsed.parts[parsed.selected_choice]).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Part {parseInt(key) + 1}</span>
                      <div className="text-sm text-slate-900 mt-1">
                        {value ? <LaTeXRenderer content={String(value)} /> : <span className="text-slate-400 italic">No answer provided</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-900">
                  {parsed.text ? <LaTeXRenderer content={parsed.text} /> : <span className="text-slate-400 italic">No text response provided</span>}
                </div>
              )}
            </div>
          );
        }
      }
    } catch (e) {
      // Not a JSON or not our structured format, fall back to LaTeX rendering
    }

    // Render with LaTeX support for math formulas
    return <LaTeXRenderer content={answer} />;
  };

  const handleDownloadPdf = async () => {
    if (!answerSheetRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(answerSheetRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeTitle = attempt.exam_title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      pdf.save(`exam-results-${safeTitle}-attempt-${attempt.id}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Unable to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading exam results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Results</h2>
          <p className="text-sm text-slate-600 mb-4">{error || 'Results not available'}</p>
          <button
            onClick={() => navigate(`${basePath}/student-dashboard`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle early submission - show success message but no results until exam time completes
  if (result && isEarlySubmission && !isExamTimeCompleted()) {
    const examEndTime = new Date(result.attempt.exam_end_date);
    const attemptStartTime = new Date(result.attempt.started_at);
    const examDurationMs = result.attempt.exam_duration_minutes * 60 * 1000;
    const attemptEndTime = new Date(attemptStartTime.getTime() + examDurationMs);
    
    // Use the earlier of the two end times
    const actualEndTime = examEndTime < attemptEndTime ? examEndTime : attemptEndTime;
    
    // Check if this was a violation-based submission
    const isViolationSubmission = result.attempt.violations_count >= 5;
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-lg w-full text-center">
          <div className={`w-20 h-20 ${isViolationSubmission ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {isViolationSubmission ? (
              <AlertTriangle className="w-10 h-10 text-red-600" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {isViolationSubmission ? 'Exam Auto-Submitted Due to Violations' : 'Exam Submitted Successfully!'}
          </h2>
          <div className={`${isViolationSubmission ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} border rounded-xl p-4 mb-6`}>
            <p className={`${isViolationSubmission ? 'text-red-800' : 'text-green-800'} font-medium`}>
              {isViolationSubmission 
                ? `Your exam was automatically submitted due to ${result.attempt.violations_count} security violations.`
                : 'Your exam has been submitted and saved successfully.'
              }
            </p>
          </div>
          <div className="space-y-4 text-left mb-8">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-green-100 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">Your answers have been recorded and will be evaluated.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-blue-100 rounded-full">
                <Clock className="w-3 h-3 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">
                Results will be available after the exam time completes: <br/>
                <span className="font-semibold text-slate-900">{actualEndTime.toLocaleString()}</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-3 h-3 text-yellow-600" />
              </div>
              <p className="text-sm text-slate-600">
                {isViolationSubmission 
                  ? 'Results are withheld until all students complete the exam to maintain fairness.'
                  : 'Early submissions do not show results immediately to maintain exam integrity.'
                }
              </p>
            </div>
            {isViolationSubmission && (
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-red-100 rounded-full">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-sm text-slate-600">
                  <strong>Security violations detected:</strong> {result.attempt.violations_count} violations were recorded during your exam.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`${basePath}/student-dashboard`)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle hidden results (enforced on backend)
  if ((result as any).status === 'hidden') {
    const hiddenData = result as any;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-lg w-full text-center">
          {resultsNowAvailable ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Results Are Now Available!</h2>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
                <p className="text-green-800 font-medium">
                  The exam period has ended. Your results are ready to view.
                </p>
              </div>
              <button
                onClick={() => {
                  setResultsNowAvailable(false);
                  setLoading(true);
                  loadExamResult();
                }}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                View Results
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Results Pending</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  {hiddenData.message}
                </p>
              </div>
              <div className="space-y-4 text-left mb-8">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm text-slate-600">Your exam has been successfully submitted and stored.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  </div>
                  <p className="text-sm text-slate-600">Answers are being evaluated and rank will be calculated once all students finish.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-blue-100 rounded-full">
                    <Calendar className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Scheduled Release: <span className="font-semibold text-slate-900">{new Date(hiddenData.available_at).toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(`${basePath}/student-dashboard`)}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setLoading(true);
                    loadExamResult();
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const { attempt } = result;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Exam Results</h1>
                <p className="text-sm text-slate-600">{attempt.exam_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Always show View Snapshots button for proctored exams */}
              <button
                onClick={() => navigate(`${basePath}/proctoring-snapshots/${attemptId}`)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${attempt.violations_count > 0
                  ? 'bg-red-50 hover:bg-red-100 text-red-700'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                  }`}
                title="View Proctoring Snapshots"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">View Snapshots</span>
                <span className="sm:hidden">Snapshots</span>
                {attempt.violations_count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
                    {attempt.violations_count}
                  </span>
                )}
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Download Results">
                <Download className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Share Results">
                <Share2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Overall Grade</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 ${getGradeColor(attemptPercentageValue)}`}>
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{getGrade(attemptPercentageValue)}</h2>
                    <p className={`text-sm font-medium ${performance.color}`}>{performance.level}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:w-1/2">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs uppercase tracking-wide text-blue-600">Score</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{attempt.score || 0}</p>
                  <p className="text-xs text-blue-700">out of {totalMarks || result.total_questions}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs uppercase tracking-wide text-emerald-600">Accuracy</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{accuracy.toFixed(1)}%</p>
                  <p className="text-xs text-emerald-700">
                    {availableSections.length} sections graded
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 uppercase">Time Spent</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{formatTime(attempt.time_spent)}</p>
                <p className="text-xs text-slate-500">Duration</p>
              </div>
              <button
                onClick={() => navigate(`${basePath}/proctoring-snapshots/${attemptId}`)}
                className="p-3 border border-slate-100 rounded-xl bg-slate-50 text-left w-full transition-all hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                title="Click to view proctoring snapshots"
              >
                <p className="text-xs text-slate-500 uppercase">Violations</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold text-slate-900">{attempt.violations_count}</p>
                  <Camera className={`w-4 h-4 ${attempt.violations_count > 0 ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
                <p className="text-xs text-slate-500">Click to view</p>
              </button>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 uppercase">Questions Attempted</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{result.total_questions}</p>
                <p className="text-xs text-slate-500">Across sections</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 uppercase">Marks Awarded</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{totalAvailableScore}</p>
                <p className="text-xs text-slate-500">Graded sections</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl text-white p-6 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Instant Report</p>
              <h3 className="text-xl font-semibold mt-2">{attempt.exam_title}</h3>
              <p className="text-sm text-indigo-100 mt-1">{attempt.student_name}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2">
                <span>Total Marks</span>
                <span className="font-semibold">{totalMarks || '--'}</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2">
                <span>Submitted On</span>
                <span className="font-semibold">{new Date(attempt.submitted_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 rounded-xl px-3 py-2">
                <span>Pending Sections</span>
                <span className="font-semibold">{pendingSections.length}</span>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading || !canDownloadAnswerSheet}
              className="no-print flex items-center justify-center gap-2 rounded-xl bg-white text-indigo-700 font-semibold py-3 hover:bg-indigo-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing PDF...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  {canDownloadAnswerSheet ? 'Download Answer Sheet' : 'Open Detailed Tab'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <div className="flex space-x-1 p-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'sections', label: 'Sections', icon: BookOpen },
                { id: 'detailed', label: 'Detailed', icon: Eye }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Exam Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Exam Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Student:</span>
                        <span className="font-medium">{attempt.student_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Submitted:</span>
                        <span className="font-medium">{new Date(attempt.submitted_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`font-medium ${attempt.status === 'submitted' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                          {attempt.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      Performance Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Questions:</span>
                        <span className="font-medium">{result.total_questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Correct Answers:</span>
                        <span className="font-medium">{result.overall_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sections Graded:</span>
                        <span className="font-medium">{availableSections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Under Review:</span>
                        <span className="font-medium">{pendingSections.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Results Summary */}
                {availableSections.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Graded Sections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableSections.map((section, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm">{section.section_name}</h4>
                              <p className="text-xs text-slate-600">{section.question_type.toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-semibold text-green-600">
                                {section.score || 0}/{section.max_marks}
                              </p>
                              <p className="text-xs text-slate-500">{section.feedback}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Results */}
                {pendingSections.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Under Review
                    </h3>
                    <div className="space-y-2">
                      {pendingSections.map((section, index) => (
                        <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm">{section.section_name}</h4>
                              <p className="text-xs text-slate-600">{section.question_type.toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-semibold text-orange-600">Pending</p>
                              <p className="text-xs text-slate-500">{section.feedback}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs uppercase text-green-600">Sections Graded</p>
                    <p className="text-3xl font-bold text-green-800 mt-2">{availableSections.length}</p>
                    <p className="text-sm text-green-700">Total score {totalAvailableScore}/{totalMarks}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs uppercase text-orange-600">Pending Review</p>
                    <p className="text-3xl font-bold text-orange-800 mt-2">{pendingSections.length}</p>
                    <p className="text-sm text-orange-700">Awaiting manual evaluation</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs uppercase text-blue-600">Average Accuracy</p>
                    <p className="text-3xl font-bold text-blue-800 mt-2">{attemptPercentageValue.toFixed(1)}%</p>
                    <p className="text-sm text-blue-700">Across graded sections</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {availableSections.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Graded Sections
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availableSections.map((section, index) => (
                          <div key={index} className="p-3 rounded-xl bg-white border border-green-100 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{section.section_name}</p>
                                <p className="text-xs text-slate-500">{section.question_type.toUpperCase()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  {section.score || 0}/{section.max_marks}
                                </p>
                                <p className="text-xs text-slate-500">{section.feedback}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingSections.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Pending Review
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pendingSections.map((section, index) => (
                          <div key={index} className="p-3 rounded-xl bg-white border border-orange-100 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{section.section_name}</p>
                                <p className="text-xs text-slate-500">{section.question_type.toUpperCase()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-orange-600 uppercase">Pending</p>
                                <p className="text-xs text-slate-500">{section.feedback}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Answers Tab */}
            {activeTab === 'detailed' && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-600" />
                    <div className="flex gap-2">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'correct', label: 'Correct' },
                        { id: 'incorrect', label: 'Incorrect' },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setDetailFilter(filter.id as typeof detailFilter)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${detailFilter === filter.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Printable answer sheet view
                  </div>
                </div>

                {!detailedEntries || detailedEntries.length === 0 ? (
                  <div className="text-center py-10 text-sm text-slate-600">
                    Detailed answers are not available for this exam.
                  </div>
                ) : (
                  <div ref={answerSheetRef} className="space-y-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    {/* Cover / Exam Overview */}
                    <div className="border-b border-slate-200 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-blue-500">Answer Sheet</p>
                          <h2 className="text-2xl font-bold text-slate-900 mt-1">{attempt.exam_title}</h2>
                          <p className="text-sm text-slate-500">Attempt #{attempt.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-600">{attempt.student_name}</p>
                          <p className="text-xs text-slate-500">{new Date(attempt.submitted_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase text-slate-400">Institute Status</p>
                          <p className="font-semibold text-slate-900">{attempt.status.replace('_', ' ').toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Total Marks</p>
                          <p className="font-semibold text-slate-900">{totalMarks || result.total_questions}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Duration</p>
                          <p className="font-semibold text-slate-900">{formatTime(attempt.time_spent)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Performance summary for PDF */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Score', value: `${attempt.score || 0} / ${totalMarks || result.total_questions}` },
                        { label: 'Accuracy', value: `${accuracy.toFixed(1)}%` },
                        { label: 'Violations', value: `${attempt.violations_count}` },
                        { label: 'Sections graded', value: `${availableSections.length}` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-xs uppercase text-slate-400">{item.label}</p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Question breakdown */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Detailed Responses</h3>
                        <p className="text-xs text-slate-500">{detailedEntries.length} questions listed</p>
                      </div>

                      <div className="space-y-4">
                        {detailedEntries.map((detail, index) => {
                          // Check if we need to show a subject header
                          const prevSubject = index > 0 ? detailedEntries[index - 1].subject : null;
                          const currentSubject = detail.subject || 'General';
                          const showSubjectHeader = currentSubject !== prevSubject;

                          return (
                            <React.Fragment key={detail.id || index}>
                              {showSubjectHeader && (
                                <div className="flex items-center gap-3 pt-4 pb-2">
                                  <div className="h-px flex-1 bg-slate-200" />
                                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider px-3 py-1 bg-blue-50 rounded-full">
                                    {currentSubject}
                                  </h4>
                                  <div className="h-px flex-1 bg-slate-200" />
                                </div>
                              )}
                              <div
                                key={detail.id || index}
                                className="print-block-avoid border border-slate-200 rounded-2xl bg-white shadow-sm p-5 space-y-4"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                        {detail.subject || 'General'}
                                      </span>
                                      <p className="text-xs uppercase text-slate-500 font-medium">Question {detail.question_number || index + 1}</p>
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-900">{detail.question_type.replace(/_/g, ' ').toUpperCase()}</h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-semibold text-slate-700">
                                      Marks {detail.marks_obtained}/{detail.max_marks}
                                    </span>
                                    <span
                                      className={`px-4 py-1 rounded-full text-xs font-semibold ${detail.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}
                                    >
                                      {detail.is_correct ? 'Correct' : 'Incorrect'}
                                    </span>
                                    {(detail as any).evaluation_status === 'ai_evaluated' && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase">
                                        AI Evaluated
                                      </span>
                                    )}
                                    {(detail as any).evaluation_status === 'auto_evaluated' && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">
                                        Auto Graded
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                  <LaTeXRenderer content={detail.question_text} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                    <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Student Answer</p>
                                    <div className="text-sm text-emerald-900">
                                      <RenderStudentAnswer answer={detail.user_answer} />
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Correct Answer</p>
                                    <div className="text-sm text-blue-900">
                                      <LaTeXRenderer content={detail.correct_answer} />
                                    </div>
                                  </div>
                                </div>
                                {detail.explanation && (
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700">
                                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                                      {(detail as any).evaluation_status === 'ai_evaluated' ? (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                          AI Evaluation Feedback
                                        </>
                                      ) : 'Explanation / Feedback'}
                                    </p>
                                    <div className="prose prose-sm max-w-none">
                                      <LaTeXRenderer content={detail.explanation} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate(`${basePath}/student-analytics`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
