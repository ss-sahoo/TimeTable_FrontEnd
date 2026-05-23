import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';
import {
  BookOpen,
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Play,
  Eye,
  Award,
  Timer,
  Users,
  Lock,
  Unlock,
  Camera,
  Monitor,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Upload,
  FileText,
  BarChart3,
  Shield,
  X
} from 'lucide-react';

interface Exam {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  max_attempts: number;
  used_attempts?: number;
  is_public: boolean;
  is_flexible?: boolean;
  allow_late_submission: boolean;
  require_fullscreen: boolean;
  enable_webcam_proctoring: boolean;
  exam_mode?: 'online' | 'offline_omr' | 'offline_subjective';
  status: string;
  can_start?: boolean;
  time_remaining?: number;
  attempt_id?: number;
  latest_score?: number;
  latest_percentage?: number;
  submitted_at?: string;
  violations_count?: number;
  results_hidden?: boolean;
  results_available_at?: string;
}

type ExamStatus = 'all' | 'available' | 'scheduled' | 'ongoing' | 'completed';

export default function StudentExamList() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExamStatus>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'marks'>('date');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'student') {
      loadExams();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [exams, searchTerm, statusFilter, sortBy]);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/exams/student-dashboard/');

      // Combine all exams from different categories
      const allExams = [
        ...(response.data.available_exams || []).map((e: any) => ({ ...e, status: 'available' })),
        ...(response.data.scheduled_exams || []).map((e: any) => ({ ...e, status: 'scheduled' })),
        ...(response.data.ongoing_exams || []).map((e: any) => ({ ...e, status: 'ongoing' })),
        ...(response.data.completed_exams || []).map((e: any) => ({
          ...e,
          status: 'completed',
          latest_score: e.score,
          latest_percentage: e.percentage
        })),
        ...(response.data.disqualified_exams || []).map((e: any) => ({
          ...e,
          status: 'disqualified',
          latest_score: e.score,
          latest_percentage: e.percentage
        }))
      ];

      setExams(allExams);
    } catch (err: any) {
      console.error('Error loading exams:', err);
      setError(err.response?.data?.error || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exams];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exam => exam.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'marks':
          return (b.total_marks || 0) - (a.total_marks || 0);
        case 'date':
        default:
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });

    setFilteredExams(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExams();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, '0');

    return `${month} ${day}, ${year}, ${hour12}:${minuteStr} ${period}`;
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-700 border-green-200', icon: Unlock, text: 'Available' },
      scheduled: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar, text: 'Scheduled' },
      ongoing: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Play, text: 'Ongoing' },
      completed: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle, text: 'Completed' },
      disqualified: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, text: 'Disqualified' }
    };

    const badge = badges[status as keyof typeof badges] || badges.available;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getActionButton = (exam: Exam) => {
    // Handle Offline Subjective Exams
    if (exam.exam_mode === 'offline_subjective') {
      const isCompleted = exam.status === 'completed';
      return (
        <button
          onClick={() => navigate(`/exam-access/${exam.id}`)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all ${isCompleted ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isCompleted ? <Eye className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {isCompleted ? 'View Results & Uploads' : 'Upload Answer Sheet'}
        </button>
      );
    }

    switch (exam.status) {
      case 'available':
        return (
          <button
            onClick={() => navigate(`/exam-access/${exam.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 shadow-sm"
          >
            <Play className="w-4 h-4" />
            Start Exam
          </button>
        );
      case 'scheduled':
        return (
          <button
            disabled
            className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Not Yet Available
          </button>
        );
      case 'ongoing':
        return (
          <button
            onClick={() => navigate(`/secure-exam/${exam.attempt_id}`)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium flex items-center gap-2 shadow-sm"
          >
            <Play className="w-4 h-4" />
            Resume Exam
          </button>
        );
      case 'completed':
        return (
          <button
            onClick={() => navigate(`/exam-results/exam/${exam.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2 shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View Results
          </button>
        );
      case 'disqualified':
        return (
          <button
            onClick={() => navigate(`/exam-results/exam/${exam.id}`)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center gap-2 shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View Score
          </button>
        );
      default:
        return null;
    }
  };

  if (loading && exams.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Exams...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: exams.length,
    available: exams.filter(e => e.status === 'available').length,
    scheduled: exams.filter(e => e.status === 'scheduled').length,
    ongoing: exams.filter(e => e.status === 'ongoing').length,
    completed: exams.filter(e => e.status === 'completed').length
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Filters Bar */}
      <div className="w-full px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {showFilters && <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ExamStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Exams</option>
                  <option value="available">Available</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'marks')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="marks">Total Marks (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('date');
                }}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600">Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Exam List */}
      <div className="w-full px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {filteredExams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Exams Found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No exams available at the moment'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{exam.title}</h3>
                      {exam.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{exam.description}</p>
                      )}
                      {exam.is_flexible && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                            <Clock className="w-2.5 h-2.5" />
                            Flexible Window
                          </span>
                        </div>
                      )}
                    </div>
                    {getStatusBadge(exam.status)}
                  </div>

                  {/* Exam Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>{exam.total_questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Award className="w-4 h-4 text-green-600" />
                      <span>{exam.total_marks} Marks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Timer className="w-4 h-4 text-orange-600" />
                      <span>{exam.duration_minutes} Minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>{exam.max_attempts} Attempt{exam.max_attempts > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 bg-slate-50">
                  {/* Date Range */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Start:</span>
                      <span>{formatDate(exam.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">End:</span>
                      <span>{formatDate(exam.end_date)}</span>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {exam.is_public ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                    {exam.require_fullscreen && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        Fullscreen
                      </span>
                    )}
                    {exam.enable_webcam_proctoring && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        Proctored
                      </span>
                    )}
                    {exam.allow_late_submission && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Late OK
                      </span>
                    )}
                  </div>

                  {/* Score Display for Completed (Visible) */}
                  {exam.status === 'completed' && !exam.results_hidden && exam.latest_percentage !== undefined && exam.latest_percentage !== null && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Your Score:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-600">
                            {exam.latest_score}/{exam.total_marks}
                          </span>
                          <span className="text-sm text-slate-600">({exam.latest_percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      {exam.submitted_at && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-blue-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Submitted: {formatDate(exam.submitted_at)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Results Message for Completed */}
                  {exam.status === 'completed' && exam.results_hidden && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Results Pending</span>
                      </div>
                      <p className="text-xs text-amber-600 mb-2">
                        Results will be available after the exam period ends.
                      </p>
                      {exam.results_available_at && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-amber-200 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>Release: {formatDate(exam.results_available_at)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Score Display for Disqualified (Visible) */}
                  {exam.status === 'disqualified' && !exam.results_hidden && exam.latest_percentage !== undefined && exam.latest_percentage !== null && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Disqualified</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-600">Score (not counted):</span>
                        <span className="text-base font-bold text-red-600 line-through">
                          {exam.latest_percentage.toFixed(0)}%
                        </span>
                      </div>
                      {exam.submitted_at && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-red-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>Submitted: {formatDate(exam.submitted_at)}</span>
                        </div>
                      )}
                      {exam.violations_count !== undefined && (
                        <div className="flex items-center gap-2 text-xs text-red-600 pt-1">
                          <Shield className="w-3 h-3" />
                          <span>{exam.violations_count} violation{exam.violations_count !== 1 ? 's' : ''} detected</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Results Message for Disqualified */}
                  {exam.status === 'disqualified' && exam.results_hidden && (
                    <div className="mb-4 p-3 bg-red-50/50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Attempt Terminated</span>
                      </div>
                      <p className="text-xs text-red-600 mb-1 font-medium italic">
                        Evaluation restricted until after exam end.
                      </p>
                    </div>
                  )}

                  {/* Time Remaining for Scheduled */}
                  {exam.status === 'scheduled' && exam.time_remaining !== undefined && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">Starts in:</span>
                        <span className="text-base font-bold text-blue-600">
                          {formatTimeRemaining(exam.time_remaining)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex gap-2">
                    {getActionButton(exam)}
                    <button
                      onClick={() => navigate(`/student-analytics/${exam.id}`)}
                      className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

