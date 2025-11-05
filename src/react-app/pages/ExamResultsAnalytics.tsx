import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
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
  TrendingDown
} from 'lucide-react';
import { useApi, api } from '@/react-app/hooks/useApi';
import ExportModal from '../components/ExportModal';

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

export default function ExamResultsAnalytics() {
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
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);

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
    }
  }, [examId]);

  const loadResultsData = async () => {
    try {
      setLoadingResults(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter
      });
      
      const response = await api.get(`/exams/${examId}/results-dashboard/?${params}`);
      setResultsData(response.data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoadingResults(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await api.get(`/exams/${examId}/analytics-dashboard/`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
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

  const exportResults = () => {
    setShowExportModal(true);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Results & Analytics</h1>
              <p className="text-gray-600 mt-1">
                {resultsData?.exam.title || analyticsData?.exam.title || 'Loading...'}
              </p>
            </div>
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
            
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="submitted_at">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="percentage">Sort by Percentage</option>
                <option value="time_spent">Sort by Time</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="auto_submitted">Auto Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            {/* Subject Totals */}
            {resultsData?.subject_totals && Object.keys(resultsData.subject_totals).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(resultsData.subject_totals).map(([subject, data]) => (
                  <div key={subject} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">{subject}</h3>
                    <p className="text-sm text-gray-600">{data.total_marks} marks • {data.questions} questions</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            {loadingResults ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading results...</p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center gap-1">
                        Score
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('percentage')}
                    >
                      <div className="flex items-center gap-1">
                        Percentage
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('time_spent')}
                    >
                      <div className="flex items-center gap-1">
                        Time Spent
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('submitted_at')}
                    >
                      <div className="flex items-center gap-1">
                        Submitted At
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultsData?.results.map((result) => (
                    <tr key={result.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.s_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.task_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.student_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.score.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(result.time_spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(result.submitted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
            
            {/* Analytics View Tabs */}
            <div className="flex space-x-1 mb-6">
              {[
                { id: 'statistics', name: 'Statistics', icon: BarChart3 },
                { id: 'heatmap', name: 'Heat Map', icon: Activity },
                { id: 'histogram', name: 'Histogram', icon: TrendingUp },
                { id: 'boxplot', name: 'Box Plot', icon: PieChart },
                { id: 'question_analysis', name: 'Question Analysis', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalyticsView(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeAnalyticsView === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Statistics View */}
                {activeAnalyticsView === 'statistics' && analyticsData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Mean Score</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {analyticsData.statistics.average_score.toFixed(2)}
                            </p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">Median Score</p>
                            <p className="text-2xl font-bold text-green-900">
                              {analyticsData.statistics.median_score.toFixed(2)}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">Mode Score</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {analyticsData.statistics.mode_score.toFixed(2)}
                            </p>
                          </div>
                          <Target className="w-8 h-8 text-purple-600" />
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">Range</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {analyticsData.statistics.range_score.toFixed(2)}
                            </p>
                          </div>
                          <TrendingDown className="w-8 h-8 text-orange-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Deviation</h3>
                        <p className="text-3xl font-bold text-gray-900">
                          {analyticsData.statistics.std_deviation.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance</h3>
                        <p className="text-3xl font-bold text-gray-900">
                          {analyticsData.statistics.variance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Histogram View */}
                {activeAnalyticsView === 'histogram' && analyticsData && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Score Distribution</h3>
                    <div className="space-y-4">
                      {analyticsData.histogram_data.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-gray-600">{item.range}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div 
                              className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${item.percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {item.count > 0 ? item.count : ''}
                              </span>
                            </div>
                          </div>
                          <div className="w-16 text-sm text-gray-600 text-right">
                            {item.percentage.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Analysis View */}
                {activeAnalyticsView === 'question_analysis' && analyticsData && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Question-wise Analysis</h3>
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
                            <tr key={qa.question_number} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Q{qa.question_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {qa.total_attempts}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {qa.correct_attempts}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {qa.wrong_attempts}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {qa.success_rate.toFixed(1)}%
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
                )}

                {/* Heat Map View */}
                {activeAnalyticsView === 'heatmap' && analyticsData && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {analyticsData.heatmap_data.map((subject, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">{subject.subject}</h4>
                          <p className="text-sm text-gray-600 mb-4">{subject.section_name}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Average Score:</span>
                              <span className="font-medium">{subject.average_score.toFixed(2)}/{subject.max_marks}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Questions:</span>
                              <span className="font-medium">{subject.total_questions}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(subject.average_score / subject.max_marks) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Box Plot View */}
                {activeAnalyticsView === 'boxplot' && analyticsData && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Score Distribution (Box Plot)</h3>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Minimum:</span>
                          <span className="font-medium">{analyticsData.box_plot_data.quartiles.min.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Q1 (25th percentile):</span>
                          <span className="font-medium">{analyticsData.box_plot_data.quartiles.q1.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Median (50th percentile):</span>
                          <span className="font-medium">{analyticsData.box_plot_data.quartiles.median.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Q3 (75th percentile):</span>
                          <span className="font-medium">{analyticsData.box_plot_data.quartiles.q3.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Maximum:</span>
                          <span className="font-medium">{analyticsData.box_plot_data.quartiles.max.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        examId={parseInt(examId || '0')}
        examTitle={resultsData?.exam.title || analyticsData?.exam.title || 'Exam'}
      />
    </div>
  );
}
