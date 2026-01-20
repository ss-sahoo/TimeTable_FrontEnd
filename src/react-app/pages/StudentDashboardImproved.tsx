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
  MapPin,
  Building2,
  GraduationCap,
  Target,
  TrendingDown,
  Users
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

interface StudentInfo {
  name: string;
  email: string;
  institute: string | null;
  center: string | null;
  center_location: string | null;
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
  student_info: StudentInfo;
  available_exams: StudentExam[];
  scheduled_exams: StudentExam[];
  ongoing_exams: StudentExam[];
  completed_exams: StudentExam[];
  disqualified_exams: StudentExam[];
}

export default function StudentDashboardImproved() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'results'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch student dashboard data from API
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useApi<StudentDashboardData>('/exams/student-dashboard/');

  const stats = dashboardData?.stats || {
    total_exams_attempted: 0,
    average_score: 0,
    total_violations: 0,
    current_rank: 1,
  };

  const studentInfo = dashboardData?.student_info || {
    name: '',
    email: '',
    institute: null,
    center: null,
    center_location: null,
  };

  const availableExams = dashboardData?.available_exams || [];
  const scheduledExams = dashboardData?.scheduled_exams || [];
  const ongoingExams = dashboardData?.ongoing_exams || [];
  const completedExams = dashboardData?.completed_exams || [];
  const disqualified_exams = dashboardData?.disqualified_exams || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
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
    navigate(`/secure-exam/${examId}`);
  };

  const handleViewResults = (examId: number) => {
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

  const getFilteredExams = (exams: StudentExam[]) => {
    return exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exam.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const currentExams = getFilteredExams([...availableExams, ...scheduledExams, ...ongoingExams]);
  const historyExams = getFilteredExams([...completedExams, ...disqualified_exams]);

  if (dashboardLoading) {
    return <SkeletonStudentDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Enhanced Header with Student Info */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                      Welcome back, {user?.first_name}!
                    </h1>
                    <p className="text-blue-100 text-sm">
                      {studentInfo.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="p-3 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all disabled:opacity-50 border border-white/30"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {/* Institute & Center Info */}
              <div className="mt-6 flex flex-wrap gap-4">
                {studentInfo.institute && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <Building2 className="w-4 h-4 text-white" />
                    <span className="text-white font-medium text-sm">{studentInfo.institute}</span>
                  </div>
                )}
                {studentInfo.center && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <MapPin className="w-4 h-4 text-white" />
                    <span className="text-white font-medium text-sm">
                      {studentInfo.center}
                      {studentInfo.center_location && ` - ${studentInfo.center_location}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900 dark:text-gray-100">{stats.total_exams_attempted}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Exams Attempted</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <TrendingUp className="w-3 h-3" />
              <span>All time</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900 dark:text-gray-100">{stats.average_score.toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Average Score</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>Performance</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900 dark:text-gray-100">#{stats.current_rank}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Current Rank</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
              <Users className="w-3 h-3" />
              <span>In your center</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                stats.total_violations > 0 
                  ? 'bg-gradient-to-br from-red-500 to-orange-600' 
                  : 'bg-gradient-to-br from-slate-400 to-slate-500'
              }`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${
                  stats.total_violations > 0 ? 'text-red-600' : 'text-slate-900 dark:text-gray-100'
                }`}>{stats.total_violations}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Violations</p>
            <div className={`mt-2 flex items-center gap-1 text-xs ${
              stats.total_violations > 0 ? 'text-red-600' : 'text-slate-500'
            }`}>
              <AlertCircle className="w-3 h-3" />
              <span>{stats.total_violations > 0 ? 'Needs attention' : 'Clean record'}</span>
            </div>
          </div>
        </div>


        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Exams */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
              {/* Tabs */}
              <div className="p-6 border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">My Exams</h2>
                  <Link
                    to="/student-analytics"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium flex items-center gap-2 text-sm shadow-md"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </Link>
                </div>

                <div className="flex space-x-2">
                  {[
                    { id: 'current', name: 'Current', count: currentExams.length, icon: Play },
                    { id: 'history', name: 'History', count: historyExams.length, icon: History },
                    { id: 'results', name: 'Results', count: completedExams.length, icon: BarChart3 }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'current' | 'history' | 'results')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.name}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search exams..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {dashboardError ? (
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
                          <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No Current Exams</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400">
                              You don't have any available or ongoing exams at the moment.
                            </p>
                          </div>
                        ) : (
                          currentExams.map((exam) => (
                            <div key={exam.id} className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-slate-200 dark:border-gray-600 p-5 hover:shadow-lg transition-all">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100">{exam.title}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                      (exam.status === 'available' || exam.can_start) ? 'bg-green-100 text-green-700' :
                                      exam.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                      exam.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {(exam.status === 'available' || exam.can_start) ? <><Play className="w-3 h-3" /> Available</> :
                                       exam.status === 'in_progress' ? <><Activity className="w-3 h-3" /> In Progress</> :
                                       exam.status === 'scheduled' ? <><Clock className="w-3 h-3" /> Scheduled</> :
                                       'Unknown'}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                      <Calendar className="w-4 h-4 text-blue-500" />
                                      <span>{formatDate(exam.start_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                      <FileText className="w-4 h-4 text-purple-500" />
                                      <span>{exam.total_questions} questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                      <Award className="w-4 h-4 text-yellow-500" />
                                      <span>{exam.total_marks} marks</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                      <Timer className="w-4 h-4 text-red-500" />
                                      <span>{exam.duration_minutes} min</span>
                                    </div>
                                  </div>

                                  {exam.description && (
                                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">{exam.description}</p>
                                  )}

                                  {/* Security Features */}
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 rounded-md text-xs text-green-700 dark:text-green-400">
                                      <Shield className="w-3.5 h-3.5" />
                                      <span>AI Proctoring</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs text-blue-700 dark:text-blue-400">
                                      <Camera className="w-3.5 h-3.5" />
                                      <span>Camera</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md text-xs text-purple-700 dark:text-purple-400">
                                      <Monitor className="w-3.5 h-3.5" />
                                      <span>Secure</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-6">
                                  {(exam.status === 'available' || exam.can_start) && (
                                    <button
                                      onClick={() => handleStartExam(exam.id)}
                                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap"
                                    >
                                      <Play className="w-4 h-4" />
                                      Start Exam
                                    </button>
                                  )}
                                  {exam.status === 'in_progress' && (
                                    <button
                                      onClick={() => handleResumeExam(exam.id)}
                                      className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap"
                                    >
                                      <Play className="w-4 h-4" />
                                      Resume
                                    </button>
                                  )}
                                  {exam.status === 'scheduled' && (
                                    <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-700 font-semibold flex items-center gap-2 whitespace-nowrap">
                                      <Clock className="w-4 h-4" />
                                      Starts Soon
                                    </div>
                                  )}
                                  <button
                                    onClick={() => navigate(`/exams/${exam.id}`)}
                                    className="px-6 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Details
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
                          <div className="text-center py-12">
                            <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No Exam History</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400">
                              You haven't completed any exams yet.
                            </p>
                          </div>
                        ) : (
                          historyExams.map((exam) => {
                            const isDisqualified = exam.status === 'disqualified';
                            return (
                              <div key={exam.id} className={`rounded-xl border p-5 hover:shadow-lg transition-all ${
                                isDisqualified 
                                  ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800' 
                                  : 'bg-gradient-to-r from-white to-purple-50 dark:from-gray-700 dark:to-purple-900/20 border-slate-200 dark:border-gray-600'
                              }`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100">{exam.title}</h3>
                                      {isDisqualified ? (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" />
                                          DISQUALIFIED
                                        </span>
                                      ) : (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          Completed
                                        </span>
                                      )}
                                    </div>
                                  
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>{exam.submitted_at && formatDate(exam.submitted_at)}</span>
                                      </div>
                                      <div className={`flex items-center gap-2 text-sm font-semibold ${
                                        isDisqualified ? 'text-red-600' : 'text-slate-900 dark:text-gray-100'
                                      }`}>
                                        <Award className="w-4 h-4" />
                                        <span>{exam.score || 0}/{exam.total_marks} marks</span>
                                      </div>
                                      <div className={`flex items-center gap-2 text-sm font-semibold ${
                                        isDisqualified ? 'text-red-600 line-through' : 'text-slate-900 dark:text-gray-100'
                                      }`}>
                                        <Percent className="w-4 h-4" />
                                        <span>{exam.percentage || 0}%</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                                        <Timer className="w-4 h-4" />
                                        <span>{exam.time_spent && formatTimeRemaining(exam.time_spent)}</span>
                                      </div>
                                    </div>

                                    {exam.violations_count && exam.violations_count > 0 && (
                                      <div className={`flex items-center gap-2 text-sm font-medium ${
                                        isDisqualified ? 'text-red-700' : 'text-orange-600'
                                      }`}>
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{exam.violations_count} violation(s) detected</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2 ml-6">
                                    <button
                                      onClick={() => handleViewResults(exam.id)}
                                      className={`px-6 py-3 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap ${
                                        isDisqualified
                                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                      }`}
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      View Results
                                    </button>
                                    <button
                                      onClick={() => navigate(`/exams/${exam.id}`)}
                                      className="px-6 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Results Tab */}
                    {activeTab === 'results' && (
                      <div className="space-y-6">
                        {/* Performance Overview */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-4">Performance Overview</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                              <div className="text-3xl font-bold text-blue-600">{stats.total_exams_attempted}</div>
                              <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Exams Attempted</div>
                            </div>
                            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                              <div className="text-3xl font-bold text-green-600">{stats.average_score.toFixed(1)}%</div>
                              <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Average Score</div>
                            </div>
                            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                              <div className="text-3xl font-bold text-purple-600">#{stats.current_rank}</div>
                              <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Current Rank</div>
                            </div>
                          </div>
                        </div>

                        {/* Recent Results */}
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-4">Recent Results</h3>
                          {completedExams.length === 0 && disqualified_exams.length === 0 ? (
                            <div className="text-center py-8">
                              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                              <p className="text-sm text-slate-600 dark:text-gray-400">No results available yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {[...completedExams, ...disqualified_exams].slice(0, 5).map((exam) => {
                                const isDisqualified = exam.status === 'disqualified';
                                return (
                                  <div key={exam.id} className={`flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all ${
                                    isDisqualified 
                                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        isDisqualified
                                          ? 'bg-gradient-to-br from-red-500 to-orange-500'
                                          : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                      }`}>
                                        {isDisqualified ? (
                                          <AlertCircle className="w-6 h-6 text-white" />
                                        ) : (
                                          <Award className="w-6 h-6 text-white" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-slate-900 dark:text-gray-100">{exam.title}</h4>
                                          {isDisqualified && (
                                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold">
                                              DISQUALIFIED
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-gray-400">
                                          {exam.submitted_at && formatDate(exam.submitted_at)} • {exam.score || 0}/{exam.total_marks} marks
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <div className={`text-xl font-bold ${
                                          isDisqualified ? 'text-red-600 line-through' : 'text-slate-900 dark:text-gray-100'
                                        }`}>{exam.percentage || 0}%</div>
                                        <div className="text-xs text-slate-600 dark:text-gray-400">Score</div>
                                      </div>
                                      <button
                                        onClick={() => handleViewResults(exam.id)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
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

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
              <div className="p-5 border-b border-slate-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100">Quick Actions</h2>
              </div>
              <div className="p-5 space-y-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg hover:shadow-md transition-all border border-green-200 dark:border-green-800"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-gray-100 text-sm">My Profile</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Update information</p>
                  </div>
                </Link>

                <Link
                  to="/student-analytics"
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg hover:shadow-md transition-all border border-purple-200 dark:border-purple-800"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-gray-100 text-sm">Analytics</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">View performance</p>
                  </div>
                </Link>

                <Link
                  to="/help"
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg hover:shadow-md transition-all border border-orange-200 dark:border-orange-800"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-gray-100 text-sm">Help & Support</h3>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Get assistance</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Upcoming Exams */}
            {scheduledExams.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                <div className="p-5 border-b border-slate-200 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100">Upcoming Exams</h2>
                </div>
                <div className="p-5 space-y-3">
                  {scheduledExams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-slate-900 dark:text-gray-100 text-sm mb-1">{exam.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(exam.start_date)}</span>
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
}
