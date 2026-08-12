import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import {
  BookOpen,
  TrendingUp,
  AlertCircle,
  Eye,
  BarChart3,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface ExamAnalytics {
  id: number;
  title: string;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  total_violations: number;
  status: string;
  start_date: string;
  end_date: string;
  total_questions: number;
  total_marks: number;
}

interface ExamAttempt {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  exam: {
    id: number;
    title: string;
  };
  status: string;
  score: number;
  percentage: number;
  time_spent: number;
  violations_count: number;
  started_at: string;
  submitted_at: string;
}

export default function TeacherAnalytics() {
  const { examId } = useParams<{ examId: string }>();
  const [, setSelectedExam] = useState<ExamAnalytics | null>(null);

  // Fetch exams and attempts data
  const { data: exams, loading: examsLoading, error: examsError } = useApi<{results: ExamAnalytics[]}>('/exams/exams/');
  const { data: attempts, loading: attemptsLoading, error: attemptsError } = useApi<ExamAttempt[]>('/exams/attempts/');

  // Calculate analytics for each exam
  useEffect(() => {
    if (exams && attempts) {
      const updatedExams = exams.results.map(exam => {
        const examAttempts = attempts.filter(attempt => attempt.exam.id === exam.id);
        const completedAttempts = examAttempts.filter(attempt => attempt.status === 'submitted');
        
        const totalAttempts = examAttempts.length;
        const averageScore = completedAttempts.length > 0 
          ? completedAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / completedAttempts.length 
          : 0;
        const completionRate = totalAttempts > 0 ? (completedAttempts.length / totalAttempts) * 100 : 0;
        const totalViolations = examAttempts.reduce((sum, attempt) => sum + (attempt.violations_count || 0), 0);

        return {
          ...exam,
          total_attempts: totalAttempts,
          average_score: Math.round(averageScore * 100) / 100,
          completion_rate: Math.round(completionRate * 100) / 100,
          total_violations: totalViolations,
        };
      });

      // Update exams with calculated analytics
      exams.results = updatedExams;

      // Set selected exam if examId is provided
      if (examId) {
        const exam = updatedExams.find(e => e.id === parseInt(examId));
        setSelectedExam(exam || null);
      }
    }
  }, [exams, attempts, examId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'published':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (examsLoading || attemptsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (examsError || attemptsError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">Error Loading Analytics</h1>
          <p className="text-slate-600 dark:text-gray-400 mb-6">{examsError || attemptsError}</p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Exam Analytics</h1>
              <p className="text-slate-600 dark:text-gray-400 mt-2">
                Comprehensive analytics and insights for your exams
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Exams</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{exams?.results.length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Attempts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">
                  {exams?.results.reduce((sum, exam) => sum + exam.total_attempts, 0) || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">
                  {exams?.results.length > 0 
                    ? Math.round((exams.results.reduce((sum, exam) => sum + exam.average_score, 0) / exams.results.length) * 100) / 100
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Violations</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">
                  {exams?.results.reduce((sum, exam) => sum + exam.total_violations, 0) || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Exam Analytics Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Exam Performance Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Exam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Violations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {exams?.results.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-gray-100">{exam.title}</div>
                        <div className="text-sm text-slate-500">
                          {exam.total_questions} questions • {exam.total_marks} marks
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-gray-100">
                      {exam.total_attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getScoreColor(exam.average_score)}`}>
                        {exam.average_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-gray-100">
                      {exam.completion_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-gray-100">
                      {exam.total_violations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/exams/${exam.id}/analytics`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Detailed Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/exams/${exam.id}`}
                          className="text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:text-gray-100"
                          title="View Exam Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attempts */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Recent Results</h2>
          </div>
          <div className="p-5">
            {attempts?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-gray-400">No exam attempts yet</p>
                <p className="text-slate-500 text-sm mt-1">Students will appear here when they take exams</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts?.slice(0, 10).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-slate-900 dark:text-gray-100">
                          {attempt.student.first_name} {attempt.student.last_name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.status === 'submitted' ? 'bg-green-100 text-green-700' :
                          attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {attempt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
                        <span>{attempt.exam.title}</span>
                        <span>Score: {attempt.percentage || 0}%</span>
                        <span>Time: {Math.floor((attempt.time_spent || 0) / 60)}m</span>
                        {attempt.violations_count > 0 && (
                          <span className="text-red-600">{attempt.violations_count} violations</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(attempt.submitted_at || attempt.started_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
