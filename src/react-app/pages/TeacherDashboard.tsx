import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Calendar,
  BarChart3,
  Building2,
  Globe,
  Mail,
  UserCheck,
  Shield,
  Zap,
  Edit,
  Trash2,
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Activity
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

interface TeacherStats {
  total_exams: number;
  active_exams: number;
  total_students: number;
  total_attempts: number;
  average_score: number;
  total_violations: number;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  max_attempts: number;
  is_public: boolean;
  created_at: string;
  pattern: {
    id: number;
    name: string;
    total_questions: number;
    total_duration: number;
    total_marks: number;
  };
  institute_name: string;
  created_by_name: string;
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

export default function TeacherDashboard() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<TeacherStats>({
    total_exams: 0,
    active_exams: 0,
    total_students: 0,
    total_attempts: 0,
    average_score: 0,
    total_violations: 0,
  });

  // Fetch teacher dashboard data
  const { data: exams, loading: examsLoading, error: examsError } = useApi<{results: Exam[]}>('/exams/exams/');
  const { data: attempts, loading: attemptsLoading, error: attemptsError } = useApi<ExamAttempt[]>('/exams/attempts/');

  // Calculate stats from API data
  useEffect(() => {
    if (exams && attempts) {
      const totalExams = exams.results.length;
      const activeExams = exams.results.filter(exam => exam.status === 'active').length;
      const totalAttempts = attempts.length;
      const averageScore = attempts.length > 0 
        ? attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / attempts.length 
        : 0;
      const totalViolations = attempts.reduce((sum, attempt) => sum + (attempt.violations_count || 0), 0);
      
      setStats({
        total_exams: totalExams,
        active_exams: activeExams,
        total_students: new Set(attempts.map(a => a.student.id)).size,
        total_attempts: totalAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        total_violations: totalViolations,
      });
    }
  }, [exams, attempts]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Teacher Dashboard</h1>
              <p className="text-slate-600 dark:text-gray-400 mt-2">
                Welcome back, {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/exams/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </Link>
              <Link
                to="/patterns"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Patterns
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Exams</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_exams}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Active Exams</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.active_exams}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_students}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Attempts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_attempts}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.average_score}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Violations</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_violations}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Exams */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
              <div className="p-5 border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Recent Exams</h2>
                  <Link
                    to="/exams"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="p-5">
                {examsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-slate-600 dark:text-gray-400 text-sm">Loading exams...</p>
                    </div>
                  </div>
                ) : examsError ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 text-sm">Failed to load exams</p>
                      <p className="text-slate-500 text-xs mt-1">{examsError}</p>
                    </div>
                  </div>
                ) : exams?.results.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-gray-400 text-sm">No exams created yet</p>
                      <p className="text-slate-500 text-xs mt-1">Create your first exam to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exams?.results.slice(0, 5).map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-slate-900 dark:text-gray-100">{exam.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(exam.status)}`}>
                              {getStatusIcon(exam.status)}
                              {exam.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(exam.start_date)}
                            </div>
                            <div>{exam.total_questions} questions</div>
                            <div>{exam.total_marks} marks</div>
                            <div>{exam.duration_minutes} min</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/exams/${exam.id}/analytics`}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/exams/${exam.id}`}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:text-gray-400 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/exams/${exam.id}/edit`}
                            className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                            title="Edit Exam"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Attempts */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
              <div className="p-5 border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Recent Attempts</h2>
                  <Link
                    to="/exams/attempts"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="p-5">
                {attemptsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-slate-600 dark:text-gray-400 text-sm">Loading attempts...</p>
                    </div>
                  </div>
                ) : attemptsError ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 text-sm">Failed to load attempts</p>
                    </div>
                  </div>
                ) : attempts?.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-gray-400 text-sm">No attempts yet</p>
                      <p className="text-slate-500 text-xs mt-1">Students will appear here when they take exams</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts?.slice(0, 5).map((attempt) => (
                      <div key={attempt.id} className="p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-gray-100 text-sm">
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
                        <p className="text-xs text-slate-600 dark:text-gray-400 mb-1">{attempt.exam.title}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Score: {attempt.percentage || 0}%</span>
                          <span>{formatDate(attempt.submitted_at || attempt.started_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Quick Actions</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/exams/create"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-gray-100">Create Exam</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Set up a new exam</p>
                  </div>
                </Link>

                <Link
                  to="/patterns"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-gray-100">Manage Patterns</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Create exam patterns</p>
                  </div>
                </Link>

                <Link
                  to="/questions"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-gray-100">Question Bank</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Manage questions</p>
                  </div>
                </Link>

                <Link
                  to="/analytics"
                  className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
                >
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-gray-100">Analytics</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">View detailed reports</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
