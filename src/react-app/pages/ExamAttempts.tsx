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
  FileText
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import { SkeletonTable, SkeletonStatsCard, SkeletonText } from '../components/SkeletonLoader';

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

export default function ExamAttempts() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [examFilter, setExamFilter] = useState<string>('all');

  useEffect(() => {
    loadAllAttempts();
  }, []);

  const loadAllAttempts = async () => {
    try {
      setLoading(true);
      
      // Get all attempts across all exams
      const response = await api.get('/exams/attempts/');
      console.log('All attempts response:', response.data);
      
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
      console.error('Error loading attempts:', error);
      setError(error.message || 'Failed to load exam attempts');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter attempts based on search and filters
  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = 
      attempt.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.exam_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || attempt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get unique exams for filter dropdown
  const uniqueExams = Array.from(new Set(attempts.map(attempt => attempt.exam_title)));

  // Calculate statistics
  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted').length;
  const disqualifiedAttempts = attempts.filter(a => a.status === 'disqualified').length;
  const inProgressAttempts = attempts.filter(a => a.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
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

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border rounded-lg p-4 sm:p-6" style={{ borderColor: '#ef4444' }}>
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3" style={{ color: '#dc2626' }} />
              <div>
                <h3 className="text-base sm:text-lg font-medium" style={{ color: '#991b1b' }}>Error Loading Attempts</h3>
                <p className="text-sm sm:text-base mt-1" style={{ color: '#dc2626' }}>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Exam Attempts</h1>
            <p className="text-base" style={{ color: '#6b6b6b' }}>View and manage all exam attempts</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#216865' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Total</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{totalAttempts}</div>
          </div>

          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Completed</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{completedAttempts}</div>
          </div>

          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>In Progress</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{inProgressAttempts}</div>
          </div>

          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Disqualified</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{disqualifiedAttempts}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by student or exam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="auto_submitted">Auto Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Exam</label>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Exams</option>
                {uniqueExams.map(exam => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-gray-100">
              Exam Attempts ({filteredAttempts.length})
            </h3>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-slate-400 dark:text-gray-500" />
              <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No Attempts Found</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No attempts match your current filters.' 
                  : 'No students have attempted any exams yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
                <thead className="bg-slate-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Time Spent
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Violations
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-200 dark:divide-gray-700">
                  {filteredAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">
                              {attempt.student_name}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                              ID: {attempt.student}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-gray-100">
                            {attempt.exam_title}
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                            {attempt.exam.total_questions} questions • {attempt.exam.total_marks} marks
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                          {getStatusIcon(attempt.status)}
                          <span className="ml-1 hidden sm:inline">{attempt.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-gray-100">
                        {attempt.percentage ? `${parseFloat(attempt.percentage).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-gray-100">
                        {formatTime(attempt.time_spent)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-gray-100">
                        <span className="hidden sm:inline">{formatDate(attempt.started_at)}</span>
                        <span className="sm:hidden">{new Date(attempt.started_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 dark:text-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.violations_count > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {attempt.violations_count} / {attempt.max_violations_allowed}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/exam-results/${attempt.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Results"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/exam-review/${attempt.id}`)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Review Exam"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/exams/${attempt.exam.id}/analytics`)}
                            className="text-green-600 hover:text-green-900"
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
