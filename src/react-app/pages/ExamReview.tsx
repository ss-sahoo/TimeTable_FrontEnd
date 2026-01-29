import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router';
import { api } from '../hooks/useApi';
import {
  ArrowLeft,
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
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Save,
  Send,
  Download,
  Printer,
  Flag,
  Star,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter
} from 'lucide-react';
import LaTeXRenderer from '../components/LaTeXRenderer';

interface ExamReviewData {
  attempt: {
    id: number;
    exam: {
      id: number;
      title: string;
      description: string;
      total_questions: number;
      total_marks: number;
      duration_minutes: number;
      pattern: {
        sections: Array<{
          id: number;
          name: string;
          subject: string;
          question_type: string;
          start_question: number;
          end_question: number;
          marks_per_question: number;
        }>;
      };
    };
    exam_title: string;
    student: number;
    student_name: string;
    student_email: string;
    attempt_number: number;
    status: string;
    started_at: string;
    submitted_at: string;
    time_spent: number;
    score: string;
    percentage: string;
    rank: number | null;
    ip_address: string;
    violations_count: number;
    max_violations_allowed: number;
    proctoring_enabled: boolean;
    fullscreen_required: boolean;
    is_completed: boolean;
    time_remaining: number;
    created_at: string;
    updated_at: string;
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
      question_id: number;
      question_text: string;
      question_type: string;
      user_answer: string;
      correct_answer: string;
      explanation: string;
      marks: number;
      user_marks: number | null;
      is_correct: boolean;
      time_spent: number;
      is_flagged: boolean;
      options?: Array<{
        text: string;
        is_correct: boolean;
        is_selected: boolean;
      }>;
    };
  };
  submitted_at: string;
  time_spent: number;
}

interface Violation {
  id: number;
  violation_type: string;
  violation_type_display: string;
  timestamp: string;
  screenshot: string | null;
  metadata: any;
}

const ExamReview: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const [reviewData, setReviewData] = useState<ExamReviewData | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'violations' | 'feedback'>('overview');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [marks, setMarks] = useState<{ [key: string]: number }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadExamReview();
    }
  }, [attemptId]);

  const loadExamReview = async () => {
    try {
      setLoading(true);

      // Load exam results
      const resultsResponse = await api.get(`/exams/attempts/${attemptId}/results/`);
      setReviewData(resultsResponse.data);

      // Load violations
      try {
        const violationsResponse = await api.get(`/exams/attempts/${attemptId}/violations/history/`);
        setViolations(violationsResponse.data.violations || []);
      } catch (violationsError) {
        console.warn('Could not load violations:', violationsError);
        setViolations([]);
      }

    } catch (error: any) {
      console.error('Error loading exam review:', error);
      setError(error.message || 'Failed to load exam review');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'auto_submitted':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'disqualified':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'auto_submitted':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'disqualified':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'single_mcq':
        return <Target className="w-4 h-4" />;
      case 'multiple_mcq':
        return <Target className="w-4 h-4" />;
      case 'subjective':
        return <FileText className="w-4 h-4" />;
      case 'numerical':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'single_mcq':
        return 'bg-blue-100 text-blue-800';
      case 'multiple_mcq':
        return 'bg-purple-100 text-purple-800';
      case 'subjective':
        return 'bg-green-100 text-green-800';
      case 'numerical':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const saveFeedback = async () => {
    try {
      setSaving(true);
      // TODO: Implement feedback saving API
      console.log('Saving feedback:', feedback);
      console.log('Saving marks:', marks);
      // For now, just show success message
      alert('Feedback saved successfully!');
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  const exportResults = () => {
    if (!reviewData) return;

    const exportData = {
      student: reviewData.attempt.student_name,
      exam: reviewData.attempt.exam_title,
      score: reviewData.overall_score,
      percentage: reviewData.percentage,
      time_spent: reviewData.time_spent,
      submitted_at: reviewData.submitted_at,
      answers: reviewData.detailed_answers,
      violations: violations
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-review-${reviewData.attempt.student_name}-${reviewData.attempt.exam_title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading exam review...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Exam Review</h3>
                <p className="text-red-600 mt-1">{error || 'Exam review data not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { attempt } = reviewData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Exam Review</h1>
                <p className="text-gray-600 mt-1">
                  Reviewing {attempt.student_name}'s attempt of "{attempt.exam_title}"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Student & Exam Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{attempt.student_name}</p>
                  <p className="text-sm text-gray-500">ID: {attempt.student}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-900">Started: {formatDate(attempt.started_at)}</p>
                  <p className="text-sm text-gray-500">Submitted: {formatDate(attempt.submitted_at)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <p className="text-sm text-gray-900">Time Spent: {formatTime(attempt.time_spent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{attempt.exam_title}</p>
                  <p className="text-sm text-gray-500">{attempt.exam.description}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Target className="w-5 h-5 text-gray-400 mr-3" />
                <p className="text-sm text-gray-900">
                  {attempt.exam.total_questions} questions • {attempt.exam.total_marks} marks
                </p>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <p className="text-sm text-gray-900">Duration: {attempt.exam.duration_minutes} minutes</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score</span>
                <span className="font-semibold text-gray-900">
                  {reviewData.overall_score} / {attempt.exam.total_marks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Percentage</span>
                <span className="font-semibold text-gray-900">{reviewData.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                  {getStatusIcon(attempt.status)}
                  <span className="ml-1">{attempt.status.replace('_', ' ')}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Violations</span>
                <span className={`font-semibold ${attempt.violations_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {attempt.violations_count} / {attempt.max_violations_allowed}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'questions', name: 'Questions & Answers', icon: BookOpen },
                { id: 'violations', name: 'Violations', icon: AlertTriangle },
                { id: 'feedback', name: 'Feedback', icon: MessageSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Section-wise Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(reviewData.section_results).map(([sectionId, section]) => (
                    <div key={sectionId} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{section.section_name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(section.question_type)}`}>
                          {getQuestionTypeIcon(section.question_type)}
                          <span className="ml-1">{section.question_type.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-medium">
                            {section.score !== null ? section.score : 'Pending'} / {section.max_marks}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${section.status === 'available' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                            {section.status === 'available' ? 'Graded' : 'Pending Review'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Questions & Answers</h3>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(reviewData.detailed_answers).map(([questionId, answer]) => (
                    <div key={questionId} className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Q{answer.question_id}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuestionTypeColor(answer.question_type)}`}>
                            {getQuestionTypeIcon(answer.question_type)}
                            <span className="ml-1">{answer.question_type.replace('_', ' ')}</span>
                          </span>
                          <span className="text-sm text-gray-500">{answer.marks} marks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {answer.is_flagged && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Flag className="w-3 h-3 mr-1" />
                              Flagged
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {answer.is_correct ? <CheckCircle className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                          <div className="bg-white p-4 rounded-lg border">
                            <LaTeXRenderer content={answer.question_text} />
                          </div>
                        </div>

                        {answer.options && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                            <div className="bg-white p-4 rounded-lg border">
                              {answer.options.map((option, index) => (
                                <div key={index} className={`flex items-center gap-2 p-2 rounded ${option.is_selected ? 'bg-blue-50' : ''
                                  }`}>
                                  <span className={`w-4 h-4 rounded-full border-2 ${option.is_correct ? 'bg-green-500 border-green-500' :
                                    option.is_selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                    }`}></span>
                                  <LaTeXRenderer content={option.text} />
                                  {option.is_correct && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Student's Answer:</h4>
                            <div className="bg-white p-4 rounded-lg border">
                              <LaTeXRenderer content={answer.user_answer} />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                            <div className="bg-white p-4 rounded-lg border">
                              <LaTeXRenderer content={answer.correct_answer} />
                            </div>
                          </div>
                        </div>

                        {answer.explanation && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                            <div className="bg-white p-4 rounded-lg border">
                              <LaTeXRenderer content={answer.explanation} />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Time spent: {formatTime(answer.time_spent)}</span>
                            <span>Marks: {answer.user_marks !== null ? answer.user_marks : 'Pending'} / {answer.marks}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'violations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Proctoring Violations</h3>

                {violations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Violations Detected</h3>
                    <p className="text-gray-600">The student followed all exam rules properly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {violations.map((violation) => (
                      <div key={violation.id} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-red-900">{violation.violation_type_display}</h4>
                              <p className="text-sm text-red-700 mt-1">
                                Detected at: {formatDate(violation.timestamp)}
                              </p>
                              {violation.metadata && (
                                <div className="mt-2 text-xs text-red-600">
                                  <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(violation.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                          {violation.screenshot && (
                            <button className="text-red-600 hover:text-red-800">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Teacher Feedback</h3>
                  <button
                    onClick={saveFeedback}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Feedback'}
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(reviewData.detailed_answers).map(([questionId, answer]) => (
                    <div key={questionId} className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Question {answer.question_id}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Max marks: {answer.marks}</span>
                          <input
                            type="number"
                            min="0"
                            max={answer.marks}
                            step="0.5"
                            placeholder="Marks"
                            value={marks[questionId] || answer.user_marks || ''}
                            onChange={(e) => setMarks({ ...marks, [questionId]: parseFloat(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <LaTeXRenderer content={answer.question_text} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback for this question:
                        </label>
                        <textarea
                          value={feedback[questionId] || ''}
                          onChange={(e) => setFeedback({ ...feedback, [questionId]: e.target.value })}
                          placeholder="Provide feedback for the student's answer..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamReview;
