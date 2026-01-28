import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router';
import {
  ArrowLeft,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Calendar,
  BookOpen,
  AlertTriangle,
  User,
  FileText,
  Shield,
  Flag,
  Play,
  Search,
  MoreVertical,
  RefreshCw,
  Settings,
  Star,
  Timer,
  AlertCircle,
  Info
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface ExamAttempt {
  id: number;
  student: number;
  student_name: string;
  attempt_number: number;
  status: string;
  started_at: string;
  submitted_at?: string;
  time_spent: number;
  score?: number;
  percentage?: number;
  rank?: number;
  violations_count: number;
  answers?: Record<string, unknown>;
}

interface ExamDashboardData {
  exam: {
    id: number;
    title: string;
    description: string;
    status: string;
    start_date: string;
    end_date: string;
    duration_minutes: number;
    total_marks: number;
    total_questions: number;
  };
  statistics: {
    total_invited: number;
    total_started: number;
    total_completed: number;
    average_score: number;
  };
  recent_attempts: ExamAttempt[];
}


const ExamAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const basePath = isSuperAdminPath ? '/superadmin' : '';

  const [dashboardData, setDashboardData] = useState<ExamDashboardData | null>(null);
  const [allAttempts, setAllAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attempts' | 'questions' | 'violations'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  const loadExamData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Load exam dashboard data
      const dashboardResponse = await api.get(`/exams/exams/${examId}/dashboard/`);
      setDashboardData(dashboardResponse.data);

      // Load all attempts
      const attemptsResponse = await api.get(`/exams/exams/${examId}/attempts/`);
      console.log('Attempts API response:', attemptsResponse.data);

      // Handle different response structures
      let attemptsData = attemptsResponse.data;
      if (attemptsData && typeof attemptsData === 'object') {
        // If it's wrapped in a results array (pagination)
        if (Array.isArray(attemptsData.results)) {
          attemptsData = attemptsData.results;
        }
        // If it's already an array, use it directly
        else if (Array.isArray(attemptsData)) {
          // Keep as is
        }
        // If it's a single object, wrap it in an array
        else if (attemptsData.id) {
          attemptsData = [attemptsData];
        }
        // If it's empty or null, use empty array
        else {
          attemptsData = [];
        }
      } else if (Array.isArray(attemptsData)) {
        // Direct array response (no pagination)
        // Keep as is
      } else {
        attemptsData = [];
      }

      setAllAttempts(attemptsData);

    } catch (error: unknown) {
      console.error('Error loading exam data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load exam data');
      setAllAttempts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId, loadExamData]);

  const refreshData = async () => {
    setRefreshing(true);
    await loadExamData();
    setRefreshing(false);
  };

  // Filter and sort attempts
  const filteredAndSortedAttempts = React.useMemo(() => {
    const filtered = allAttempts.filter(attempt => {
      const matchesSearch = attempt.student_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || attempt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'student_name':
          aValue = a.student_name;
          bValue = b.student_name;
          break;
        case 'score':
          aValue = a.percentage || 0;
          bValue = b.percentage || 0;
          break;
        case 'time_spent':
          aValue = a.time_spent;
          bValue = b.time_spent;
          break;
        case 'violations_count':
          aValue = a.violations_count;
          bValue = b.violations_count;
          break;
        default:
          aValue = new Date(a.started_at).getTime();
          bValue = new Date(b.started_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [allAttempts, searchTerm, statusFilter, sortBy, sortOrder]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load exam data'}</p>
          <button
            onClick={() => navigate(`${basePath}/exams`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const { exam, statistics, recent_attempts } = dashboardData;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`${basePath}/exams`)}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      {exam.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {exam.total_questions} questions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="px-4 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 text-slate-700 font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
              <Link
                to={`${basePath}/exams/${examId}`}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                View Exam
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3, count: statistics?.total_invited || 0 },
              { id: 'attempts', label: 'All Attempts', icon: Users, count: allAttempts.length },
              { id: 'questions', label: 'Question Analysis', icon: BookOpen, count: exam?.total_questions || 0 },
              { id: 'violations', label: 'Violations', icon: Shield, count: allAttempts.filter(a => a.violations_count > 0).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'attempts' | 'questions' | 'violations')}
                className={`group flex items-center gap-3 py-4 px-6 rounded-xl font-medium text-sm transition-all duration-200 relative ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                  }`} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Modern Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Invited</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics.total_invited}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">Students</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Started</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics.total_started}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Play className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {statistics.total_invited > 0 ? Math.round((statistics.total_started / statistics.total_invited) * 100) : 0}% participation
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-slate-900">{statistics.total_completed}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {statistics.total_started > 0 ? Math.round((statistics.total_completed / statistics.total_started) * 100) : 0}% completion
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-7 h-7 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {statistics.average_score ? parseFloat(String(statistics.average_score)).toFixed(1) : '0'}%
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500">Overall performance</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-7 h-7 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Attempts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Violations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recent_attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.student_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Attempt #{attempt.attempt_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                            {getStatusIcon(attempt.status)}
                            {attempt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.percentage ? `${parseFloat(String(attempt.percentage)).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(attempt.time_spent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attempt.violations_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Flag className="w-3 h-3" />
                              {attempt.violations_count}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setActiveTab('attempts');
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attempts' && (
          <div className="space-y-6">
            {/* Modern Search and Filter Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm">
              <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  >
                    <option value="started_at">Sort by Date</option>
                    <option value="student_name">Sort by Name</option>
                    <option value="score">Sort by Score</option>
                    <option value="time_spent">Sort by Time</option>
                    <option value="violations_count">Sort by Violations</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 text-sm"
                  >
                    {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">All Exam Results</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {filteredAndSortedAttempts.length} of {allAttempts.length} results
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Settings className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Violations
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-slate-200/60">
                    {Array.isArray(filteredAndSortedAttempts) && filteredAndSortedAttempts.map((attempt) => (
                      <tr key={attempt.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                                <User className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {attempt.student_name}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <span>#{attempt.attempt_number}</span>
                                {attempt.rank && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500" />
                                      #{attempt.rank}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {new Date(attempt.started_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(attempt.started_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(attempt.status)}`}>
                            {getStatusIcon(attempt.status)}
                            {attempt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {attempt.percentage ? (
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">
                                {parseFloat(String(attempt.percentage)).toFixed(1)}%
                              </div>
                              <div className="w-12 bg-slate-200 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(parseFloat(String(attempt.percentage)), 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-slate-900">
                            <Timer className="w-3 h-3 text-slate-400" />
                            {formatTime(attempt.time_spent)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {attempt.violations_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer">
                              <Flag className="w-3 h-3" />
                              {attempt.violations_count}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              Clean
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`${basePath}/exam-results/${attempt.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                              <Eye className="w-3 h-3" />
                              Results
                            </Link>
                            <Link
                              to={`${basePath}/exam-review/${attempt.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            >
                              <FileText className="w-3 h-3" />
                              Review
                            </Link>
                            {attempt.violations_count > 0 && (
                              <button
                                onClick={() => setActiveTab('violations')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                              >
                                <Shield className="w-3 h-3" />
                                Violations
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!Array.isArray(filteredAndSortedAttempts) || filteredAndSortedAttempts.length === 0) && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                    <Users className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No Matching Attempts' : 'No Attempts Yet'}
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search criteria or filters to find attempts.'
                      : 'No students have attempted this exam yet. Check back after the exam period begins.'
                    }
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Question Analysis</h3>
                <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                  Detailed analysis of each question's performance will be available here.
                  This feature shows question difficulty, common wrong answers, and accuracy statistics.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-blue-800 font-semibold mb-2">Coming Soon</p>
                      <p className="text-blue-700 text-sm">
                        Question-level analytics including difficulty analysis, common misconceptions,
                        and performance metrics for each question will be available in a future update.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-200 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Security Violations</h3>
                <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                  Security violations and proctoring data will be displayed here.
                  This includes tab switching, fullscreen exits, and other security breaches.
                </p>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200/60">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-yellow-800 font-semibold mb-2">Note</p>
                      <p className="text-yellow-700 text-sm">
                        Violation details are available through the individual attempt views.
                        Click on "View Violations" in the attempts table to see detailed violation logs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamAnalytics;
