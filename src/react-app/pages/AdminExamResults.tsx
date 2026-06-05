import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Search,
  Download,
  Eye,
  Users,
  Trophy,
  AlertTriangle,
  BarChart3,
  FileText,
  RefreshCw,
  SortAsc,
  SortDesc,
  CheckCircle,
  Camera,
  Award
} from 'lucide-react';

interface StudentResult {
  s_no: number;
  task_no: number;
  student_id: number;
  student_name: string;
  student_email: string;
  phone: string;
  score: number;
  percentage: number;
  time_spent: number;
  submitted_at: string;
  status: string;
  violations_count: number;
  rank: number;
}

interface ExamInfo {
  id: number;
  title: string;
  total_questions: number;
  total_marks: number;
}

interface SubjectTotal {
  total_marks: number;
  questions: number;
}

interface AdminExamResultsData {
  exam: ExamInfo;
  results: StudentResult[];
  subject_totals: { [key: string]: SubjectTotal };
  total_count: number;
  filters: {
    search: string;
    sort_by: string;
    sort_order: string;
    status: string;
  };
}

const AdminExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  
  // Determine base path based on current route
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const isTeacherPath = location.pathname.startsWith('/teacher');
  const basePath = isSuperAdminPath ? '/superadmin' : 
                   isCenterAdminPath ? '/center-admin' : 
                   isTeacherPath ? '/teacher' : '';

  const [data, setData] = useState<AdminExamResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExamResults();
  }, [examId, searchTerm, sortBy, sortOrder, statusFilter]);

  const loadExamResults = async () => {
    if (!examId) return;
    
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter
      });
      
      const response = await api.get(`/exams/${examId}/results-dashboard/?${params}`);
      setData(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error loading exam results:', error);
      const errorResponse = error?.response;
      if (errorResponse?.status === 404) {
        setError('Exam not found');
      } else if (errorResponse?.status === 403) {
        setError('Access denied - you cannot view these results');
      } else {
        setError('Failed to load exam results');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/exams/${examId}/export/csv/`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam_${examId}_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/exams/${examId}/export/excel/`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam_${examId}_results_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'not_started':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!data?.results) return null;
    
    const results = data.results;
    const totalStudents = results.length;
    const submittedCount = results.filter(r => r.status === 'submitted').length;
    const averageScore = results.length > 0 ? 
      results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0;
    const highestScore = results.length > 0 ? 
      Math.max(...results.map(r => r.percentage)) : 0;
    const violationsCount = results.reduce((sum, r) => sum + r.violations_count, 0);
    
    return {
      totalStudents,
      submittedCount,
      averageScore,
      highestScore,
      violationsCount
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading exam results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Results</h2>
          <p className="text-sm text-slate-600 mb-4">{error || 'Results not available'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Exam Results Dashboard</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-600">{data.exam.title}</p>
                  {user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      <Award className="w-3 h-3" />
                      Super Admin Access
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadExamResults}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Total Students</p>
                  <p className="text-xl font-bold text-slate-900">{statistics.totalStudents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Submitted</p>
                  <p className="text-xl font-bold text-slate-900">{statistics.submittedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Average Score</p>
                  <p className="text-xl font-bold text-slate-900">{statistics.averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Highest Score</p>
                  <p className="text-xl font-bold text-slate-900">{statistics.highestScore.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Total Violations</p>
                  <p className="text-xl font-bold text-slate-900">{statistics.violationsCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('student_name')}
                      className="flex items-center gap-1 hover:text-slate-700"
                    >
                      Student
                      {sortBy === 'student_name' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center gap-1 hover:text-slate-700"
                    >
                      Score
                      {sortBy === 'score' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('percentage')}
                      className="flex items-center gap-1 hover:text-slate-700"
                    >
                      Percentage
                      {sortBy === 'percentage' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('time_spent')}
                      className="flex items-center gap-1 hover:text-slate-700"
                    >
                      Time Spent
                      {sortBy === 'time_spent' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Violations
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('submitted_at')}
                      className="flex items-center gap-1 hover:text-slate-700"
                    >
                      Submitted
                      {sortBy === 'submitted_at' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.results.map((result, index) => (
                  <tr key={result.student_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{result.student_name}</div>
                        <div className="text-xs text-slate-500">{result.student_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {result.score} / {data.exam.total_marks}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {result.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.percentage)}`}>
                        {getGrade(result.percentage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{formatTime(result.time_spent)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {result.violations_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            {result.violations_count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            0
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                        {result.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-500">
                        {new Date(result.submitted_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`${basePath}/exam-results/${result.task_no}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View detailed results"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {result.violations_count > 0 && (
                          <button
                            onClick={() => navigate(`${basePath}/proctoring-snapshots/${result.task_no}`)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="View proctoring snapshots"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {data.results.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Results Found</h3>
              <p className="text-sm text-slate-500">
                {searchTerm ? 'No students match your search criteria.' : 'No students have taken this exam yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Showing {data.results.length} of {data.total_count} results
        </div>
      </div>
    </div>
  );
};

export default AdminExamResults;