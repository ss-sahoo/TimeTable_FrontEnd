import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import {
  BookOpen,
  TrendingUp,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  BarChart3,
  UserCheck,
  Shield,
  CheckCircle,
  Play,
  Activity,
  FileText,
  Award,
  Search,
  ChevronRight,
  Camera,
  Monitor,
  RefreshCw,
  Timer,
  Percent,
  History,
  Info,
  Mail,
  Phone,
  Building2,
  MapPin
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { SkeletonStudentDashboard } from '../components/SkeletonLoader';

interface StudentStats {
  total_exams_attempted: number;
  average_score: number;
  total_violations: number;
  current_rank: number;
}

interface StudentExam {
  id: number;
  title: string;
  exam_title?: string;
  exam_id?: number;
  description?: string;
  start_date: string;
  end_date: string;
  total_questions: number;
  total_marks: number;
  duration_minutes?: number;
  max_attempts?: number;
  used_attempts?: number;
  time_remaining?: number;
  can_start?: boolean;
  can_resume?: boolean;
  started_at?: string;
  submitted_at?: string;
  score?: number;
  percentage?: number;
  time_spent?: number;
  violations_count?: number;
  status?: string;
}

interface StudentDashboardData {
  stats: StudentStats;
  available_exams: StudentExam[];
  scheduled_exams: StudentExam[];
  ongoing_exams: StudentExam[];
  completed_exams: StudentExam[];
  disqualified_exams: StudentExam[];
}

export default function StudentDashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // State for exam management section
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'results'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch student dashboard data from API
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useApi<StudentDashboardData>('/exams/student-dashboard/');

  // Use student dashboard data
  const stats = dashboardData?.stats || {
    total_exams_attempted: 0,
    average_score: 0,
    total_violations: 0,
    current_rank: 1,
  };

  const availableExams = dashboardData?.available_exams || [];
  const scheduledExams = dashboardData?.scheduled_exams || [];
  const ongoingExams = dashboardData?.ongoing_exams || [];
  const completedExams = dashboardData?.completed_exams || [];
  const disqualifiedExams = dashboardData?.disqualified_exams || [];

  const formatDate = (dateString: string) => {
    // Parse the UTC date string and display as-is without conversion
    const date = new Date(dateString);

    // Extract components directly from UTC time
    const year = date.getUTCFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    // Format to 12-hour time
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, '0');

    return `${month} ${day}, ${year}, ${hour12}:${minuteStr} ${period}`;
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleStartExam = async (examId: number) => {
    try {
      const response = await api.post('/exams/start-exam/', {
        exam_id: examId
      });

      if (response.data.attempt) {
        // Redirect to secure exam view with the attempt ID
        navigate(`/secure-exam/${response.data.attempt.id}`);
      }
    } catch (error: unknown) {
      console.error('Failed to start exam:', error);
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to start exam. Please try again.';
      alert(errorMessage);
    }
  };

  const handleResumeExam = (examId: number) => {
    // Navigate to secure exam view for ongoing exam
    navigate(`/secure-exam/${examId}`);
  };

  const handleViewResults = (examId: number) => {
    // Navigate to exam results page using exam ID
    navigate(`/exam-results/exam/${examId}`);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort exams
  const getFilteredAndSortedExams = (exams: StudentExam[]) => {
    const filtered = exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort exams
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
        case 'score':
          comparison = (a.score || 0) - (b.score || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const currentExams = getFilteredAndSortedExams([...availableExams, ...scheduledExams, ...ongoingExams]);
  const historyExams = getFilteredAndSortedExams([...completedExams, ...disqualifiedExams]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="w-full py-4 sm:py-6">
        {/* Profile & Institute Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-8 -mt-8"></div>

            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0 z-10">
              {user?.first_name?.charAt(0) || user?.full_name?.charAt(0) || 'S'}
            </div>

            <div className="flex-1 text-center sm:text-left z-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student'}
                </h1>
                <span className="inline-flex px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full w-fit mx-auto sm:mx-0">
                  Student
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 dark:text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 dark:text-gray-400 text-sm">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 dark:text-gray-400 text-sm">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span>Username: {user?.username || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-full -mr-6 -mt-6"></div>

            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Campus Information
            </h3>

            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Institute</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {user?.institute?.name || user?.institute_name || 'Generic Institute'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Center</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {user?.center_name || 'Main Center'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Exams Attempted</p>
                <p className="text-xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_exams_attempted}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Average Score</p>
                <p className="text-xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.average_score}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Current Rank</p>
                <p className="text-xl font-bold text-slate-900 dark:text-gray-100 mt-1">#{stats.current_rank}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Violations</p>
                <p className="text-xl font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total_violations}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center shadow-sm">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-gray-400">Disqualified</p>
                <p className="text-xl font-bold text-slate-900 dark:text-gray-100 mt-1">{disqualifiedExams.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* My Exams Section */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100">My Exams</h2>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Manage your current and past exams</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/student-analytics')}
                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium flex items-center gap-2 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mt-4">
                {[
                  { id: 'current', name: 'Current Exams', count: currentExams.length, icon: Play },
                  { id: 'history', name: 'Exam History', count: historyExams.length, icon: History },
                  { id: 'results', name: 'Results & Analytics', count: completedExams.length, icon: BarChart3 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'current' | 'history' | 'results')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600 dark:text-gray-400'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-slate-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search exams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="submitted">Submitted</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="title">Sort by Title</option>
                    <option value="score">Sort by Score</option>
                    <option value="status">Sort by Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-gray-900 transition-colors"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {dashboardLoading ? (
                <SkeletonStudentDashboard />
              ) : dashboardError ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 text-lg font-medium">Failed to load exams</p>
                    <p className="text-slate-500 mt-2">{dashboardError}</p>
                    <button
                      onClick={refreshData}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Current Exams Tab */}
                  {activeTab === 'current' && (
                    <div className="space-y-4">
                      {currentExams.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <h3 className="text-base font-medium text-slate-900 dark:text-gray-100 mb-2">No Current Exams</h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">You don't have any available or ongoing exams at the moment.</p>
                        </div>
                      ) : (
                        currentExams.map((exam) => (
                          <div key={exam.id} className="bg-white rounded-lg border border-slate-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">{exam.title}</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${(exam.status === 'available' || exam.can_start) ? 'bg-green-100 text-green-700' :
                                    exam.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                      exam.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                    {(exam.status === 'available' || exam.can_start) ? <Play className="w-3 h-3" /> :
                                      exam.status === 'in_progress' ? <Activity className="w-3 h-3" /> :
                                        exam.status === 'scheduled' ? <Clock className="w-3 h-3" /> :
                                          <Clock className="w-3 h-3" />}
                                    {(exam.status === 'available' || exam.can_start) ? 'Available' :
                                      exam.status === 'in_progress' ? 'In Progress' :
                                        exam.status === 'scheduled' ? 'Scheduled' :
                                          'Unknown'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(exam.start_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <FileText className="w-4 h-4" />
                                    <span>{exam.total_questions} questions</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <Award className="w-4 h-4" />
                                    <span>{exam.total_marks} marks</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <Timer className="w-4 h-4" />
                                    <span>{exam.duration_minutes} min</span>
                                  </div>
                                </div>

                                {/* Security Features */}
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <Shield className="w-4 h-4 text-green-600" />
                                    <span>AI Proctoring</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <Camera className="w-4 h-4 text-blue-600" />
                                    <span>Camera Monitoring</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                    <Monitor className="w-4 h-4 text-purple-600" />
                                    <span>Screen Recording</span>
                                  </div>
                                </div>

                                {exam.description && (
                                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">{exam.description}</p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 ml-6">
                                {(exam.status === 'available' || exam.can_start) && (
                                  <button
                                    onClick={() => handleStartExam(exam.id)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 shadow-sm"
                                  >
                                    <Play className="w-4 h-4" />
                                    Start Exam
                                  </button>
                                )}
                                {exam.status === 'in_progress' && (
                                  <button
                                    onClick={() => handleResumeExam(exam.id)}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium flex items-center gap-2 shadow-sm"
                                  >
                                    <Play className="w-4 h-4" />
                                    Resume Exam
                                  </button>
                                )}
                                {exam.status === 'scheduled' && (
                                  <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Starts Soon
                                  </div>
                                )}
                                <button
                                  onClick={() => navigate(`/exams/${exam.id}`)}
                                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:bg-gray-900 transition-colors font-medium flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* History Tab */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {historyExams.length === 0 ? (
                        <div className="text-center py-8">
                          <History className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <h3 className="text-base font-medium text-slate-900 dark:text-gray-100 mb-2">No Exam History</h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">You haven't completed any exams yet.</p>
                        </div>
                      ) : (
                        historyExams.map((exam) => {
                          const isDisqualified = exam.status === 'disqualified';
                          return (
                            <div key={exam.id} className={`rounded-lg border p-4 hover:shadow-md transition-all ${isDisqualified
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-slate-200 dark:border-gray-700'
                              }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">{exam.title}</h3>
                                    {isDisqualified ? (
                                      <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" />
                                          Disqualified
                                        </span>
                                        <div className="relative group">
                                          <Info className="w-4 h-4 text-red-600 cursor-help" />
                                          <div className="absolute left-0 top-6 w-80 bg-red-50 border border-red-300 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                            <div className="flex items-center gap-2 text-sm text-red-800 font-semibold mb-2">
                                              <AlertCircle className="w-4 h-4" />
                                              <span>Disqualification Details</span>
                                            </div>
                                            <div className="space-y-2 text-xs text-red-700">
                                              <p className="font-semibold">
                                                This exam attempt has been disqualified due to exceeding the maximum allowed violations.
                                              </p>
                                              <p>
                                                <strong>Violations:</strong> {exam.violations_count} violations detected
                                              </p>
                                              <p>
                                                <strong>Grading:</strong> Answers have been graded and scored, but this score will NOT count towards your academic performance.
                                              </p>
                                              <p className="text-red-800 font-medium pt-2 border-t border-red-300">
                                                Note: Scores shown are for reference only. This disqualification is final.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Completed
                                      </span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                      <Calendar className="w-4 h-4" />
                                      <span>{exam.submitted_at && formatDate(exam.submitted_at)}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-sm ${isDisqualified ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-gray-400'
                                      }`}>
                                      <Award className="w-4 h-4" />
                                      <span>{exam.score || 0}/{exam.total_marks} marks</span>
                                      {isDisqualified && <span className="text-xs">(Graded)</span>}
                                    </div>
                                    <div className={`flex items-center gap-2 text-sm ${isDisqualified ? 'text-red-600 font-semibold' : 'text-slate-600 dark:text-gray-400'
                                      }`}>
                                      <Percent className="w-4 h-4" />
                                      <span>{exam.percentage || 0}%</span>
                                      {isDisqualified && <span className="text-xs">(Not Counted)</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                      <Timer className="w-4 h-4" />
                                      <span>{exam.time_spent && formatTimeRemaining(exam.time_spent)}</span>
                                    </div>
                                  </div>

                                  {exam.violations_count && exam.violations_count > 0 && !isDisqualified && (
                                    <div className="flex items-center gap-2 text-sm text-orange-600 mb-4">
                                      <AlertCircle className="w-4 h-4" />
                                      <span>{exam.violations_count} violation(s) detected</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 ml-6">
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => handleViewResults(exam.id)}
                                      className={`px-6 py-3 rounded-lg transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl ${isDisqualified
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      {isDisqualified ? 'View Score (Disqualified)' : 'View Results'}
                                    </button>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => navigate(`/exams/${exam.id}`)}
                                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 dark:bg-gray-900 transition-colors font-medium flex items-center gap-2"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Details
                                      </button>
                                      <button
                                        onClick={() => navigate(`/student-analytics/${exam.id}`)}
                                        className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${isDisqualified
                                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                                          : 'bg-purple-600 text-white hover:bg-purple-700'
                                          }`}
                                      >
                                        <BarChart3 className="w-4 h-4" />
                                        Analytics
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Results & Analytics Tab */}
                  {activeTab === 'results' && (
                    <div className="space-y-4">
                      {/* Performance Overview */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100 mb-3">Performance Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.total_exams_attempted}</div>
                            <div className="text-xs text-slate-600 dark:text-gray-400">Exams Attempted</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.average_score.toFixed(1)}%</div>
                            <div className="text-xs text-slate-600 dark:text-gray-400">Average Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">#{stats.current_rank}</div>
                            <div className="text-xs text-slate-600 dark:text-gray-400">Current Rank</div>
                          </div>
                        </div>
                        {disqualifiedExams.length > 0 && (
                          <div className="bg-red-100 border border-red-300 rounded-lg p-2 mt-3">
                            <p className="text-xs text-red-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>
                                <strong>{disqualifiedExams.length}</strong> disqualified exam{disqualifiedExams.length > 1 ? 's' : ''} not included in performance metrics
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Recent Results */}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100 mb-3">Recent Results</h3>
                        {completedExams.length === 0 && disqualifiedExams.length === 0 ? (
                          <div className="text-center py-6">
                            <BarChart3 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600 dark:text-gray-400">No results available yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[...completedExams, ...disqualifiedExams].slice(0, 5).map((exam) => {
                              const isDisqualified = exam.status === 'disqualified';
                              return (
                                <div key={exam.id} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-all ${isDisqualified
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700'
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDisqualified
                                        ? 'bg-red-100'
                                        : 'bg-blue-100'
                                        }`}>
                                      {isDisqualified ? (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                      ) : (
                                        <Award className="w-5 h-5 text-blue-600" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900 dark:text-gray-100 text-sm">{exam.title}</h4>
                                        {isDisqualified && (
                                          <>
                                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold">
                                              DISQUALIFIED
                                            </span>
                                            <div className="relative group">
                                              <Info className="w-3.5 h-3.5 text-red-600 cursor-help" />
                                              <div className="absolute left-0 top-5 w-80 bg-red-50 border border-red-300 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                <div className="flex items-center gap-2 text-sm text-red-800 font-semibold mb-2">
                                                  <AlertCircle className="w-4 h-4" />
                                                  <span>Disqualification Details</span>
                                                </div>
                                                <div className="space-y-2 text-xs text-red-700">
                                                  <p className="font-semibold">
                                                    This exam attempt has been disqualified due to exceeding the maximum allowed violations.
                                                  </p>
                                                  <p>
                                                    <strong>Violations:</strong> {exam.violations_count} violations detected
                                                  </p>
                                                  <p>
                                                    <strong>Grading:</strong> Answers have been graded and scored, but this score will NOT count towards your academic performance.
                                                  </p>
                                                  <p className="text-red-800 font-medium pt-2 border-t border-red-300">
                                                    Note: Scores shown are for reference only. This disqualification is final.
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600 dark:text-gray-400">
                                        {exam.submitted_at && formatDate(exam.submitted_at)} • {exam.score || 0}/{exam.total_marks} marks
                                        {isDisqualified && <span className="text-red-600 font-semibold"> (Not counted)</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className={`text-base font-semibold ${isDisqualified ? 'text-red-600 line-through' : 'text-slate-900 dark:text-gray-100'
                                        }`}>{exam.percentage || 0}%</div>
                                      <div className="text-xs text-slate-600 dark:text-gray-400">Score</div>
                                    </div>
                                    <button
                                      onClick={() => handleViewResults(exam.id)}
                                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                      <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
              <div className="p-5 border-b border-slate-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Quick Actions</h2>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <Link
                    to="/student-dashboard"
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm">My Exams</h3>
                      <p className="text-xs text-slate-600 dark:text-gray-400">Manage your exams</p>
                    </div>
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm">My Profile</h3>
                      <p className="text-xs text-slate-600 dark:text-gray-400">Update your information</p>
                    </div>
                  </Link>

                  <Link
                    to="/results"
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm">My Results</h3>
                      <p className="text-xs text-slate-600 dark:text-gray-400">View exam results</p>
                    </div>
                  </Link>

                  <Link
                    to="/help"
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
                  >
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-gray-100 text-sm">Help & Support</h3>
                      <p className="text-xs text-slate-600 dark:text-gray-400">Get assistance</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}