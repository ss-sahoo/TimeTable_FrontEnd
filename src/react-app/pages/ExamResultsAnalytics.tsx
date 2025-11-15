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

  const examTitle = resultsData?.exam.title || analyticsData?.exam.title || 'Exam';

  return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="w-full space-y-4 text-slate-700 text-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 leading-tight truncate">
              Exam Results & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{examTitle}</p>
          </div>
          <button
            onClick={exportResults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </header>

        <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Results</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
              <div className="relative col-span-2 md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="submitted_at">Sort by Date</option>
                <option value="score">Sort by Score</option>
                <option value="percentage">Sort by %</option>
                <option value="time_spent">Sort by Time</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">High → Low</option>
                <option value="asc">Low → High</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="auto_submitted">Auto Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            {resultsData?.subject_totals && Object.keys(resultsData.subject_totals).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(resultsData.subject_totals).map(([subject, data]) => (
                  <div key={subject} className="flex-auto min-w-[160px] bg-slate-100 border border-slate-200 rounded-md px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{subject}</p>
                    <p className="text-[11px] text-slate-500">{data.total_marks} marks · {data.questions} Qs</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {loadingResults ? (
              <div className="flex items-center justify-center h-48 text-xs text-slate-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  Loading results...
                </div>
              </div>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-500 uppercase tracking-wide">
                  <tr>
                    {['S.No', 'Task', 'Student', 'Phone', 'Score', '%', 'Time', 'Submitted', 'Status'].map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {resultsData?.results.map((result) => (
                    <tr key={result.student_id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{result.s_no}</td>
                      <td className="px-3 py-2">{result.task_no}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{result.student_name}</div>
                        <div className="text-[11px] text-slate-500">{result.student_email}</div>
                      </td>
                      <td className="px-3 py-2">{result.phone}</td>
                      <td className="px-3 py-2">{result.score.toFixed(2)}</td>
                      <td className="px-3 py-2">{result.percentage.toFixed(1)}%</td>
                      <td className="px-3 py-2">{formatTime(result.time_spent)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(result.submitted_at)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(result.status)}`}>
                          {result.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Analytics</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'statistics', name: 'Statistics', icon: BarChart3 },
                  { id: 'heatmap', name: 'Heat Map', icon: Activity },
                  { id: 'histogram', name: 'Histogram', icon: TrendingUp },
                  { id: 'boxplot', name: 'Box Plot', icon: PieChart },
                  { id: 'question_analysis', name: 'Questions', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAnalyticsView(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      activeAnalyticsView === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center h-48 text-xs text-slate-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  Loading analytics...
                </div>
              </div>
            ) : (
              <>
                {activeAnalyticsView === 'statistics' && analyticsData && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                        <p className="text-[11px] font-semibold text-blue-700">Mean Score</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-blue-900">{analyticsData.statistics.average_score.toFixed(2)}</span>
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                        <p className="text-[11px] font-semibold text-emerald-700">Median Score</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-emerald-900">{analyticsData.statistics.median_score.toFixed(2)}</span>
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 rounded-md px-3 py-2">
                        <p className="text-[11px] font-semibold text-purple-700">Mode Score</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-purple-900">{analyticsData.statistics.mode_score.toFixed(2)}</span>
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-md px-3 py-2">
                        <p className="text-[11px] font-semibold text-orange-700">Range</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-lg font-bold text-orange-900">{analyticsData.statistics.range_score.toFixed(2)}</span>
                          <TrendingDown className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-2">
                        <p className="text-[11px] font-semibold text-slate-600">Std deviation</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">{analyticsData.statistics.std_deviation.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-2">
                        <p className="text-[11px] font-semibold text-slate-600">Variance</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">{analyticsData.statistics.variance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeAnalyticsView === 'histogram' && analyticsData && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Score Distribution</h3>
                    <div className="space-y-1.5">
                      {analyticsData.histogram_data.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-16 text-[11px] text-slate-500">{item.range}</span>
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-3 bg-blue-500 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-right text-[11px] text-slate-500">{item.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeAnalyticsView === 'question_analysis' && analyticsData && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Question-wise Analysis</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-100 text-slate-500 uppercase tracking-wide">
                          <tr>
                            {['Question', 'Attempted', 'Correct', 'Wrong', 'Success %', 'Avg Score'].map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-semibold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {analyticsData.question_analytics.map((qa) => (
                            <tr key={qa.question_number} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-semibold text-slate-800">Q{qa.question_number}</td>
                              <td className="px-3 py-2">{qa.total_attempts}</td>
                              <td className="px-3 py-2 text-emerald-600">{qa.correct_attempts}</td>
                              <td className="px-3 py-2 text-rose-600">{qa.wrong_attempts}</td>
                              <td className="px-3 py-2">{qa.success_rate.toFixed(1)}%</td>
                              <td className="px-3 py-2">{qa.average_score.toFixed(2)}/{qa.max_marks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeAnalyticsView === 'heatmap' && analyticsData && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Subject performance</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                      {analyticsData.heatmap_data.map((subject, index) => (
                        <div key={index} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-xs">{subject.subject}</span>
                            <span className="text-[11px] text-slate-500">{subject.section_name}</span>
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                            <span>Average</span>
                            <span className="font-semibold text-slate-800">
                              {subject.average_score.toFixed(2)}/{subject.max_marks}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                            <span>Questions</span>
                            <span className="font-semibold text-slate-800">{subject.total_questions}</span>
                          </div>
                          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${(subject.average_score / subject.max_marks) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeAnalyticsView === 'boxplot' && analyticsData && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">Score distribution (quartiles)</h3>
                    <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-600 space-y-1.5">
                      {([
                        ['Minimum', analyticsData.box_plot_data.quartiles.min],
                        ['Q1 (25%)', analyticsData.box_plot_data.quartiles.q1],
                        ['Median', analyticsData.box_plot_data.quartiles.median],
                        ['Q3 (75%)', analyticsData.box_plot_data.quartiles.q3],
                        ['Maximum', analyticsData.box_plot_data.quartiles.max],
                      ] as const).map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span>{label}</span>
                          <span className="font-semibold text-slate-800">{value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        examId={parseInt(examId || '0')}
        examTitle={examTitle}
      />
    </div>
  );
}
