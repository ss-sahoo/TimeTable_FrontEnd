import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  Filter,
  Search,
  Calendar,
  User,
  TrendingUp,
  Target,
  FileText,
  X,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import { SkeletonTable, SkeletonStatsCard, SkeletonText } from '../components/SkeletonLoader';

interface Exam {
  id: number;
  title: string;
}

interface ExamAttempt {
  id: number;
  exam: {
    id: number;
    title: string;
    description: string;
    institute_name: string;
    total_questions: number;
    total_marks: number;
    duration_minutes: number;
  };
  exam_title: string;
  student: number;
  student_name: string;
  attempt_number: number;
  status: string;
  started_at: string;
  submitted_at: string | null;
  time_spent: number;
  score: string;
  percentage: string;
  rank: number | null;
  ip_address: string;
  violations_count: number;
  proctoring_enabled: boolean;
  max_violations_allowed: number;
  fullscreen_required: boolean;
  is_completed: boolean;
  time_remaining: number;
  created_at: string;
  updated_at: string;
}

export default function Results() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Filter states
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [studentName, setStudentName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadExams();
    loadResults();
  }, []);

  const loadExams = async () => {
    try {
      const response = await api.get('/exams/exams/');
      const examsData = response.data.results || response.data || [];
      setExams(examsData);
    } catch (error: any) {
      console.error('Error loading exams:', error);
    }
  };

  const buildFilterParams = () => {
    const params: Record<string, string> = {};

    if (selectedExamId) {
      params.exam_id = selectedExamId;
    }

    if (statusFilter) {
      params.status = statusFilter;
    }

    if (studentName.trim()) {
      params.student_name = studentName.trim();
    }

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      if (!Number.isNaN(start.getTime())) {
        params.start_date = start.toISOString();
      }
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59`);
      if (!Number.isNaN(end.getTime())) {
        params.end_date = end.toISOString();
      }
    }

    return params;
  };

  const loadResults = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setApplying(true);
      }
      setLoading(true);
      setError(null);
      setExportError(null);

      const params = buildFilterParams();

      console.log('Fetching results with params:', params);
      const response = await api.get('/exams/attempts/', { params });
      console.log('Results response:', response.data);
      
      // Handle different response structures
      let attemptsData = response.data;
      if (attemptsData && typeof attemptsData === 'object') {
        if (Array.isArray(attemptsData.results)) {
          attemptsData = attemptsData.results;
        } else if (!Array.isArray(attemptsData)) {
          attemptsData = [];
        }
      } else if (!Array.isArray(attemptsData)) {
        attemptsData = [];
      }
      
      setAttempts(attemptsData);
    } catch (error: any) {
      console.error('Error loading results:', error);
      setError(error.message || 'Failed to load results');
    } finally {
      setLoading(false);
      setApplying(false);
    }
  };

  const handleApplyFilters = () => {
    loadResults(true);
  };

  const handleClearFilters = () => {
    setSelectedExamId('');
    setStudentName('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    // Reload with cleared filters
    setTimeout(() => {
      loadResults(true);
    }, 100);
  };

  const handleExport = async () => {
    try {
      setExportError(null);
      setExportMessage(null);
      setExporting(true);

      const params = {
        ...buildFilterParams(),
        format: 'csv'
      };

      const response = await api.get('/exams/attempts/export/', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.setAttribute('download', `exam-results-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportMessage('Results exported as CSV. Check your downloads for the file.');
    } catch (exportErr: any) {
      console.error('Failed to export results:', exportErr);
      setExportError('Failed to export results. Please try again.');
    } finally {
      setExporting(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'auto_submitted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'disqualified':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted').length;
  const disqualifiedAttempts = attempts.filter(a => a.status === 'disqualified').length;
  const inProgressAttempts = attempts.filter(a => a.status === 'in_progress').length;
  
  const averageScore = attempts.length > 0
    ? attempts
        .filter(a => a.percentage && !isNaN(parseFloat(a.percentage)))
        .reduce((sum, a) => sum + parseFloat(a.percentage), 0) / attempts.length
    : 0;

  if (loading && attempts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <SkeletonText lines={1} variant="xl" className="w-1/3 mb-2" />
              <SkeletonText lines={1} variant="md" className="w-1/2" />
            </div>
            
            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonStatsCard key={index} />
              ))}
            </div>
            
            {/* Table Skeleton */}
            <SkeletonTable rows={8} columns={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error && attempts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Results</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = selectedExamId || studentName || statusFilter || startDate || endDate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                Exam Results
              </h1>
              <p className="text-slate-600 mt-2">View and manage all student exam results with advanced filtering</p>
            </div>
            <button
              onClick={loadResults}
              disabled={applying}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${applying ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Results</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{totalAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{completedAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{inProgressAttempts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Average Score</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{averageScore.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
                {hasActiveFilters && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Exam Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Exams</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
              </div>

              {/* Student Name Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Student Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="auto_submitted">Auto Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="disqualified">Disqualified</option>
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleApplyFilters}
                disabled={applying}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 font-medium"
              >
                {applying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Filter className="w-4 h-4" />
                    Apply Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Results ({attempts.length})
              </h3>
              <div className="flex flex-col items-start gap-1 md:items-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-slate-200 disabled:opacity-60"
                  >
                    <Download className={`w-4 h-4 ${exporting ? 'animate-spin' : ''}`} />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
                {exportMessage && (
                  <span className="text-xs text-green-600">{exportMessage}</span>
                )}
                {exportError && (
                  <span className="text-xs text-red-600">{exportError}</span>
                )}
              </div>
            </div>
          </div>

          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Export Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{exportError}</p>
                </div>
              </div>
            </div>
          )}
          {exportMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Export Successful</h3>
                  <p className="text-sm text-green-700 mt-1">{exportMessage}</p>
                </div>
              </div>
            </div>
          )}

          {attempts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Results Found</h3>
              <p className="text-slate-600">
                {hasActiveFilters 
                  ? 'No results match your current filters. Try adjusting your search criteria.' 
                  : 'No students have completed any exams yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Violations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-sm">
                                {attempt.student_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">
                              {attempt.student_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {attempt.student}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {attempt.exam_title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {attempt.exam.total_questions} questions • {attempt.exam.total_marks} marks
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(attempt.status)}`}>
                          {getStatusIcon(attempt.status)}
                          {attempt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">
                          {attempt.percentage ? `${parseFloat(attempt.percentage).toFixed(1)}%` : '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {attempt.score || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatTime(attempt.time_spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatDate(attempt.started_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          attempt.violations_count > 0 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {attempt.violations_count} / {attempt.max_violations_allowed}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/exam-results/${attempt.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Results"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/exam-review/${attempt.id}`)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Review Exam"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/exams/${attempt.exam.id}/analytics`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

