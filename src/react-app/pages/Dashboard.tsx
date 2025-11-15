import { Link } from 'react-router';
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Calendar,
  BarChart3,
  Building2,
  Mail,
  UserCheck,
  Shield,
  Zap
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { SkeletonDashboard } from '../components/SkeletonLoader';

interface DashboardStats {
  total_exams: number;
  active_exams: number;
  published_exams: number;
  draft_exams: number;
  total_students: number;
  total_attempts: number;
  completed_attempts: number;
  in_progress_attempts: number;
  disqualified_attempts: number;
  average_score: number;
  total_violations: number;
  total_questions: number;
  verified_questions: number;
}

interface RecentExam {
  id: number;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  total_questions: number;
  total_marks: number;
  created_at: string;
  description: string;
}

interface RecentAttempt {
  id: number;
  exam_title: string;
  student_name: string;
  status: string;
  score: string;
  percentage: string;
  violations_count: number;
  created_at: string;
}

interface AdminDashboardData {
  stats: DashboardStats;
  recent_exams: RecentExam[];
  recent_attempts: RecentAttempt[];
  institute: {
    id: number;
    name: string;
  };
}

export default function Dashboard() {
  const { user } = useAuthContext();

  // Fetch admin dashboard data from API
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useApi<AdminDashboardData>('/exams/admin-dashboard/');

  // Use dashboard data or defaults
  const stats = dashboardData?.stats || {
    total_exams: 0,
    active_exams: 0,
    published_exams: 0,
    draft_exams: 0,
    total_students: 0,
    total_attempts: 0,
    completed_attempts: 0,
    in_progress_attempts: 0,
    disqualified_attempts: 0,
    average_score: 0,
    total_violations: 0,
    total_questions: 0,
    verified_questions: 0,
  };

  const recentExams = dashboardData?.recent_exams || [];
  const recentAttempts = dashboardData?.recent_attempts || [];
  const institute = dashboardData?.institute;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'published':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getQuickActions = () => {
        const baseActions = [
          {
            title: 'Create New Exam',
            description: 'Set up a new examination',
            icon: Plus,
            href: '/exams/create',
            color: 'bg-blue-600',
          },
          {
            title: 'Create Pattern',
            description: 'Define exam structure and sections',
            icon: Zap,
            href: '/patterns/create',
            color: 'bg-blue-600',
          },
          {
            title: 'Add Questions',
            description: 'Add questions to question bank',
            icon: BookOpen,
            href: '/questions/create',
            color: 'bg-blue-600',
          },
          {
            title: 'View Analytics',
            description: 'Check exam performance',
            icon: BarChart3,
            href: '/analytics',
            color: 'bg-blue-600',
          },
        ];

    // Add role-specific actions
    if (user?.role === 'super_admin' || user?.role === 'institute_admin') {
      baseActions.push({
        title: 'Manage Institute',
        description: 'Manage institute settings and users',
        icon: Building2,
        href: '/institute/manage',
        color: 'bg-blue-600',
      });
    }

    if (user?.role === 'super_admin' || user?.role === 'institute_admin' || user?.role === 'exam_admin') {
      baseActions.push({
        title: 'Manage Users',
        description: 'View and manage users',
        icon: Users,
        href: '/users',
        color: 'bg-blue-600',
      });
    }

    if (user?.role === 'super_admin') {
      baseActions.push({
        title: 'Create Institute',
        description: 'Create a new institute',
        icon: Building2,
        href: '/institute/create',
        color: 'bg-blue-600',
      });
    }

    return baseActions;
  };

  // Loading state
  if (dashboardLoading) {
    return <SkeletonDashboard />;
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">Error Loading Dashboard</h1>
          <p className="text-slate-600 dark:text-gray-400 mb-6">{dashboardError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">
              Welcome back, {user?.first_name || 'User'}!
            </h1>
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Here's what's happening with your exams today.
            </p>
            {user?.institute_name && (
              <div className="mt-3 flex items-center gap-2 text-slate-600 dark:text-gray-400">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">
                  {user.institute_name} • {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Institute Information */}
      {institute && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{institute.name}</h2>
                <p className="text-sm text-slate-600 dark:text-gray-400">Your Institute</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Shield className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-gray-400">Total Students</p>
                <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{stats.total_students}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-gray-400">Total Exams</p>
                <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{stats.total_exams}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-gray-400">Total Attempts</p>
                <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{stats.total_attempts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {user && !institute && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900">Join an Institute</h3>
              <p className="text-sm text-amber-700">You're not part of any institute yet</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/institute/search"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Search Institutes
            </Link>
            <Link
              to="/institute/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Institute
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_students}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Completed Attempts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.completed_attempts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Attempts</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_attempts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Average Score</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.average_score}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Questions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_questions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
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
              <div className="space-y-3">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-gray-100">{exam.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/exams/${exam.id}`}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-gray-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Quick Actions</h2>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {getQuickActions().map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="block p-3 bg-slate-50 dark:bg-gray-900 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center shadow-md`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{action.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-gray-400">{action.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attempts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Recent Results</h2>
            <Link
              to="/results"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-5">
          {recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-gray-100">{attempt.exam_title}</p>
                      <p className="text-sm text-slate-600 dark:text-gray-400">{attempt.student_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      attempt.status === 'submitted' ? 'bg-green-100 text-green-700' :
                      attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      attempt.status === 'disqualified' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {attempt.status.replace('_', ' ').toUpperCase()}
                    </div>
                    {attempt.score && (
                      <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                        Score: {attempt.score} ({attempt.percentage}%)
                      </p>
                    )}
                    {attempt.violations_count > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {attempt.violations_count} violations
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No recent attempts</h3>
              <p className="text-slate-600 dark:text-gray-400">Exam attempts will appear here once students start taking exams.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Upcoming Events</h2>
        </div>
        <div className="p-5">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No upcoming events</h3>
            <p className="text-slate-600 dark:text-gray-400">Your upcoming exams and deadlines will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
