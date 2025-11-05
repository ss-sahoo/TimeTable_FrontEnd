import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { 
  Search, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Award,
  Filter,
  ArrowUpDown,
  Eye,
  FileText,
  Target,
  BookOpen,
  Calculator,
  Activity,
  PieChart,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Star,
  Zap,
  Brain,
  Lightbulb,
  Trophy,
  Medal,
  Crown,
  Flame,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useApi, api } from '@/react-app/hooks/useApi';

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

interface ExamData {
  id: number;
  title: string;
  total_questions: number;
  total_marks: number;
}

interface ResultsData {
  exam: ExamData;
  results: StudentResult[];
  subject_totals: Record<string, { total_marks: number; questions: number }>;
  total_count: number;
  filters: {
    search: string;
    sort_by: string;
    sort_order: string;
    status: string;
  };
}

interface AnalyticsData {
  exam: ExamData;
  statistics: {
    total_attempts: number;
    total_invited: number;
    completion_rate: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    median_score: number;
    mode_score: number;
    range_score: number;
    std_deviation: number;
    variance: number;
    average_time_spent: number;
  };
  histogram_data: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  question_analytics: Array<{
    question_number: number;
    total_attempts: number;
    correct_attempts: number;
    wrong_attempts: number;
    unattempted: number;
    success_rate: number;
    average_score: number;
    max_marks: number;
  }>;
  heatmap_data: Array<{
    section_name: string;
    subject: string;
    average_score: number;
    max_marks: number;
    total_questions: number;
  }>;
  box_plot_data: {
    scores: number[];
    quartiles: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
  };
}

export default function ExamResultsAnalyticsEnhanced() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  // State for Results section
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State for Analytics section
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<'statistics' | 'heatmap' | 'histogram' | 'boxplot' | 'question_analysis'>('statistics');
  
  // Loading states
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load results data
  useEffect(() => {
    if (examId) {
      loadResultsData();
    }
  }, [examId, searchTerm, sortBy, sortOrder, statusFilter]);

  // Load analytics data
  useEffect(() => {
    if (examId) {
      loadAnalyticsData();
      loadAIInsights();
    }
  }, [examId]);

  const loadResultsData = async () => {
    try {
      setLoadingResults(true);
      setError(null);
      const params = new URLSearchParams({
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter
      });
      
      const response = await api.get(`/exams/exams/${examId}/results-dashboard/?${params}`);
      setResultsData(response.data);
    } catch (error: any) {
      console.error('Error loading results:', error);
      setError(error.response?.data?.error || 'Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics-dashboard/`);
      setAnalyticsData(response.data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Load AI Insights
  const loadAIInsights = async () => {
    try {
      setLoadingInsights(true);
      const response = await api.get(`/exams/exams/${examId}/ai-insights/`);
      setAiInsights(response.data);
    } catch (error: any) {
      console.error('Error loading AI insights:', error);
      // Don't set error state for AI insights as it's optional
    } finally {
      setLoadingInsights(false);
    }
  };

  // Export data function
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setExporting(true);
      const response = await api.get(`/exams/exams/${examId}/export/?format=${format}`, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam_${examId}_results_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    } finally {
      setExporting(false);
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
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


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'auto_submitted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
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
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGradeIcon = (percentage: number) => {
    if (percentage >= 90) return <Crown className="w-5 h-5" />;
    if (percentage >= 80) return <Trophy className="w-5 h-5" />;
    if (percentage >= 70) return <Medal className="w-5 h-5" />;
    if (percentage >= 60) return <Award className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadResultsData();
                loadAnalyticsData();
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full px-2 sm:px-4 lg:px-6 py-6">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm mb-6">
          <div className="w-full px-2 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/exams')}
                  className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Exam Results & Analytics</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        {resultsData?.exam.title || analyticsData?.exam.title || 'Loading...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    loadResultsData();
                    loadAnalyticsData();
                  }}
                  className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </button>
                <div className="relative group">
                  <button
                    disabled={exporting}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {exporting ? 'Exporting...' : 'Export Data'}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={() => handleExport('csv')}
                        disabled={exporting}
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-green-600" />
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        disabled={exporting}
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Export as Excel
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        disabled={exporting}
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        Export as PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Results Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Student Results</h2>
                  <p className="text-blue-100 text-sm">Comprehensive performance overview</p>
                </div>
              </div>
              {resultsData && (
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-white">{resultsData.total_count}</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Total Students</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {/* Modern Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm mb-6">
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
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  >
                    <option value="submitted_at">Sort by Date</option>
                    <option value="score">Sort by Score</option>
                    <option value="percentage">Sort by Percentage</option>
                    <option value="time_spent">Sort by Time</option>
                  </select>
                  
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="auto_submitted">Auto Submitted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subject Totals Cards */}
            {resultsData?.subject_totals && Object.keys(resultsData.subject_totals).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(resultsData.subject_totals).map(([subject, data], index) => (
                  <div key={subject} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject}</h3>
                        <p className="text-sm text-gray-600">{data.total_marks} marks • {data.questions} questions</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modern Results Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              {loadingResults ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading results...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          S.No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Task No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort('score')}
                        >
                          <div className="flex items-center gap-1">
                            Score
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort('percentage')}
                        >
                          <div className="flex items-center gap-1">
                            Grade
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort('time_spent')}
                        >
                          <div className="flex items-center gap-1">
                            Time
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                          onClick={() => handleSort('submitted_at')}
                        >
                          <div className="flex items-center gap-1">
                            Submitted
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-slate-200/60">
                      {resultsData?.results && resultsData.results.length > 0 ? (
                        resultsData.results.map((result) => (
                          <tr key={result.student_id} className="group hover:bg-slate-50/80 transition-all duration-200">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {result.s_no}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                              {result.task_no}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-200">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                    {result.student_name}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {result.student_email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              {result.phone}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                              {result.score.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getGradeColor(result.percentage)}`}>
                                {getGradeIcon(result.percentage)}
                                {result.percentage.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-slate-400" />
                              {formatTime(result.time_spent)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                              {formatDate(result.submitted_at)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(result.status)}`}>
                                {getStatusIcon(result.status)}
                                {result.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center">
                              <Users className="w-16 h-16 text-gray-400 mb-4" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Student Results Found</h3>
                              <p className="text-gray-600 mb-6 max-w-md">
                                {resultsData?.total_count === 0 
                                  ? "No students have attempted this exam yet. Results will appear here once students complete the exam." 
                                  : "No results match your current search criteria. Try adjusting your search or filters."}
                              </p>
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => setSearchTerm('')}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  Clear Search
                                </button>
                                <button
                                  onClick={() => setStatusFilter('all')}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                >
                                  Clear Filters
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Analytics Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Performance Analytics</h2>
                  <p className="text-purple-100 text-sm">Deep insights and statistical analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-300" />
                <span className="text-white text-xs sm:text-sm">AI-Powered Insights</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Modern Analytics View Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'statistics', name: 'Statistics', icon: BarChart3, color: 'blue' },
                { id: 'heatmap', name: 'Heat Map', icon: Activity, color: 'red' },
                { id: 'histogram', name: 'Histogram', icon: TrendingUp, color: 'green' },
                { id: 'boxplot', name: 'Box Plot', icon: PieChart, color: 'purple' },
                { id: 'question_analysis', name: 'Question Analysis', icon: FileText, color: 'orange' },
                { id: 'evaluation', name: 'Evaluation', icon: CheckCircle, color: 'emerald' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalyticsView(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeAnalyticsView === tab.id
                      ? `bg-${tab.color}-100 text-${tab.color}-700 border-2 border-${tab.color}-200 shadow-sm`
                      : 'text-slate-600 hover:bg-slate-100 border-2 border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {loadingAnalytics ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Enhanced Statistics View */}
                  {activeAnalyticsView === 'statistics' && analyticsData && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600">Mean Score</p>
                              <p className="text-3xl font-bold text-blue-900">
                                {analyticsData.statistics.average_score.toFixed(2)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                              <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-emerald-600">Median Score</p>
                              <p className="text-3xl font-bold text-emerald-900">
                                {analyticsData.statistics.median_score.toFixed(2)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-200 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-600">Mode Score</p>
                              <p className="text-3xl font-bold text-purple-900">
                                {analyticsData.statistics.mode_score.toFixed(2)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                              <Target className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-600">Range</p>
                              <p className="text-3xl font-bold text-orange-900">
                                {analyticsData.statistics.range_score.toFixed(2)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                              <TrendingDown className="w-6 h-6 text-orange-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Standard Deviation</h3>
                            <Calculator className="w-6 h-6 text-gray-600" />
                          </div>
                          <p className="text-4xl font-bold text-gray-900">
                            {analyticsData.statistics.std_deviation.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Variance</h3>
                            <Zap className="w-6 h-6 text-gray-600" />
                          </div>
                          <p className="text-4xl font-bold text-gray-900">
                            {analyticsData.statistics.variance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Histogram View */}
                  {activeAnalyticsView === 'histogram' && analyticsData && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                          Score Distribution
                        </h3>
                        <div className="space-y-4">
                          {analyticsData.histogram_data.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="w-20 text-sm font-medium text-gray-700">{item.range}</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                                  style={{ width: `${item.percentage}%` }}
                                >
                                  <span className="text-xs text-white font-medium">
                                    {item.count > 0 ? item.count : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="w-16 text-sm font-medium text-gray-700 text-right">
                                {item.percentage.toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Question Analysis View */}
                  {activeAnalyticsView === 'question_analysis' && analyticsData && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                          <FileText className="w-6 h-6 mr-2 text-green-600" />
                          Question-wise Analysis
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Question
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Attempted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Correct
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Wrong
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Success Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Avg Score
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {analyticsData.question_analytics.map((qa) => (
                                <tr key={qa.question_number} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-sm font-bold text-blue-600">Q{qa.question_number}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {qa.total_attempts}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                                    {qa.correct_attempts}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                    {qa.wrong_attempts}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                        <div 
                                          className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                                          style={{ width: `${qa.success_rate}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">
                                        {qa.success_rate.toFixed(1)}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {qa.average_score.toFixed(2)}/{qa.max_marks}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Heat Map View */}
                  {activeAnalyticsView === 'heatmap' && analyticsData && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                          <Activity className="w-6 h-6 mr-2 text-red-600" />
                          Subject-wise Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {analyticsData.heatmap_data.map((subject, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                                  <p className="text-sm text-gray-600">{subject.section_name}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-red-600" />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Average Score:</span>
                                  <span className="font-medium">{subject.average_score.toFixed(2)}/{subject.max_marks}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Questions:</span>
                                  <span className="font-medium">{subject.total_questions}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(subject.average_score / subject.max_marks) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Box Plot View */}
                  {activeAnalyticsView === 'boxplot' && analyticsData && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                          <PieChart className="w-6 h-6 mr-2 text-purple-600" />
                          Score Distribution (Box Plot)
                        </h3>
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                          {analyticsData.box_plot_data && analyticsData.box_plot_data.quartiles && Object.keys(analyticsData.box_plot_data.quartiles).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900">
                                  {analyticsData.box_plot_data.quartiles.min?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-sm text-gray-600">Minimum</div>
                              </div>
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-900">
                                  {analyticsData.box_plot_data.quartiles.q1?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-sm text-blue-600">Q1 (25th percentile)</div>
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-900">
                                  {analyticsData.box_plot_data.quartiles.median?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-sm text-green-600">Median (50th percentile)</div>
                              </div>
                              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-900">
                                  {analyticsData.box_plot_data.quartiles.q3?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-sm text-yellow-600">Q3 (75th percentile)</div>
                              </div>
                              <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-900">
                                  {analyticsData.box_plot_data.quartiles.max?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-sm text-red-600">Maximum</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Score Data Available</h4>
                              <p className="text-gray-600">Complete exam attempts to see score distribution analysis.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluation View */}
                  {activeAnalyticsView === 'evaluation' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                          <CheckCircle className="w-6 h-6 mr-2 text-emerald-600" />
                          Question Evaluation Dashboard
                        </h3>
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Evaluation Management</h4>
                            <p className="text-gray-600 mb-6">Access the comprehensive evaluation dashboard to manage question grading and feedback.</p>
                            <Link
                              to={`/exams/${examId}/evaluation`}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Open Evaluation Dashboard
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI-Powered Insights Section */}
                  {aiInsights && (
                    <div className="mt-8 space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                              <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h3>
                              <p className="text-purple-600 text-sm">Intelligent analysis and recommendations</p>
                            </div>
                          </div>
                          {loadingInsights && (
                            <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                          )}
                        </div>

                        {/* Insights Grid */}
                        {aiInsights.insights && aiInsights.insights.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {aiInsights.insights.map((insight: any, index: number) => (
                              <div key={index} className={`p-4 rounded-xl border ${
                                insight.severity === 'high' ? 'bg-red-50 border-red-200' :
                                insight.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-green-50 border-green-200'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    insight.severity === 'high' ? 'bg-red-100' :
                                    insight.severity === 'medium' ? 'bg-yellow-100' :
                                    'bg-green-100'
                                  }`}>
                                    {insight.severity === 'high' ? (
                                      <AlertCircle className="w-4 h-4 text-red-600" />
                                    ) : insight.severity === 'medium' ? (
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        insight.severity === 'high' ? 'bg-red-100 text-red-700' :
                                        insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {insight.severity.toUpperCase()}
                                      </span>
                                      {insight.value !== undefined && (
                                        <span className="text-xs text-gray-500">
                                          Value: {insight.value}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recommendations */}
                        {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 text-yellow-500" />
                              Recommendations
                            </h4>
                            <div className="space-y-3">
                              {aiInsights.recommendations.map((rec: any, index: number) => (
                                <div key={index} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Target className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-green-100 text-green-700'
                                        }`}>
                                          {rec.priority.toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600">{rec.description}</p>
                                      <span className="text-xs text-blue-600 font-medium">{rec.category}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Anomalies */}
                        {aiInsights.anomalies && aiInsights.anomalies.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-orange-500" />
                              Anomalies Detected
                            </h4>
                            <div className="space-y-3">
                              {aiInsights.anomalies.map((anomaly: any, index: number) => (
                                <div key={index} className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                      <AlertCircle className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 mb-1">{anomaly.student_name}</h5>
                                      <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Score: {anomaly.score}</span>
                                        <span>Z-Score: {anomaly.z_score.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Data Message */}
                        {(!aiInsights.insights || aiInsights.insights.length === 0) && 
                         (!aiInsights.recommendations || aiInsights.recommendations.length === 0) && 
                         (!aiInsights.anomalies || aiInsights.anomalies.length === 0) && (
                          <div className="text-center py-8">
                            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No AI insights available yet. Complete more exam attempts to generate insights.</p>
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
      </div>
    </div>
  );
}
