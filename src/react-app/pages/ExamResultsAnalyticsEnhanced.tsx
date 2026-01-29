import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Lightbulb,
  Mail,
  Phone,
  PieChart,
  RefreshCw,
  Search,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';

interface StudentResult {
  s_no: number;
  student_id: number;
  student_name: string;
  student_email: string;
  phone: string;
  score: number;
  percentage: number;
  time_spent: number;
  submitted_at: string;
  status: string;
}

interface ExamSummary {
  id: number;
  title: string;
  total_questions: number;
  total_marks: number;
}

interface ResultsResponse {
  exam: ExamSummary;
  results: StudentResult[];
  subject_totals: Record<string, { total_marks: number; questions: number }>;
  total_count: number;
}

interface AnalyticsResponse {
  exam: ExamSummary;
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
  histogram_data: Array<{ range: string; count: number; percentage: number }>;
  question_analytics: Array<{
    question_number: number;
    total_attempts: number;
    correct_attempts: number;
    wrong_attempts: number;
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
    quartiles: {
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
    };
  };
}

type AnalyticsView = 'statistics' | 'heatmap' | 'histogram' | 'boxplot' | 'question_analysis' | 'evaluation';

export default function ExamResultsAnalyticsEnhanced() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');

  const [resultsData, setResultsData] = useState<ResultsResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'submitted_at' | 'score' | 'percentage' | 'time_spent'>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<AnalyticsView>('statistics');

  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    loadResults();
  }, [examId, searchTerm, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    if (!examId) return;
    loadAnalytics();
    loadAiInsights();
  }, [examId]);

  const loadResults = async () => {
    if (!examId) return;
    try {
      setLoadingResults(true);
      setError(null);
      const params = new URLSearchParams({
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter,
      });
      const response = await api.get(`/exams/exams/${examId}/results-dashboard/?${params.toString()}`);
      setResultsData(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load exam results.');
    } finally {
      setLoadingResults(false);
    }
  };

  const loadAnalytics = async () => {
    if (!examId) return;
    try {
      setLoadingAnalytics(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics-dashboard/`);
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load analytics for this exam.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadAiInsights = async () => {
    if (!examId) return;
    try {
      setLoadingInsights(true);
      const response = await api.get(`/exams/exams/${examId}/ai-insights/`);
      setAiInsights(response.data);
    } catch (err) {
      console.debug('AI insights unavailable', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!examId) return;
    try {
      setExporting(true);
      const response = await api.get(`/exams/exams/${examId}/export/?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam_${examId}_results.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      setError('Failed to export exam results.');
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'auto_submitted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'disqualified':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const examTitle = resultsData?.exam.title || analyticsData?.exam.title || 'Exam';
  const totalStudents = resultsData?.total_count ?? 0;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3 rounded-lg border border-red-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
          <AlertCircle className="mx-auto h-6 w-6 text-red-500" />
          <h2 className="text-base font-semibold text-slate-900">We hit a snag</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadResults();
              loadAnalytics();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry loading data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 text-xs text-slate-700 sm:text-sm">
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => navigate(`${basePath}/exams`)}
              className="rounded-md border border-slate-200 p-2 hover:bg-slate-100"
              aria-label="Back to exams"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900">Exam Results &amp; Analytics</h1>
              <p className="truncate text-[11px] text-slate-500">{examTitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => {
                loadResults();
                loadAnalytics();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <div className="flex items-center gap-1.5">
              {(['csv', 'excel', 'pdf'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={exporting}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-3.5 w-3.5" />
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Results</h2>
              <span className="text-[11px] text-slate-500">{totalStudents} students</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name or email"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submitted_at">Sort by date</option>
                <option value="score">Sort by score</option>
                <option value="percentage">Sort by %</option>
                <option value="time_spent">Sort by time</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All status</option>
                <option value="submitted">Submitted</option>
                <option value="auto_submitted">Auto submitted</option>
                <option value="in_progress">In progress</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>
            {resultsData?.subject_totals && Object.keys(resultsData.subject_totals).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(resultsData.subject_totals).map(([subject, summary]) => (
                  <div key={subject} className="min-w-[150px] flex-auto rounded-md border border-slate-200 bg-slate-100 px-3 py-2">
                    <p className="truncate text-xs font-semibold text-slate-800">{subject}</p>
                    <p className="text-[11px] text-slate-500">
                      {summary.total_marks} marks · {summary.questions} Qs
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            {loadingResults ? (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading results…
              </div>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">#</th>
                    <th className="px-3 py-2 text-left font-semibold">Student</th>
                    <th className="px-3 py-2 text-left font-semibold">Score</th>
                    <th className="px-3 py-2 text-left font-semibold">% </th>
                    <th className="px-3 py-2 text-left font-semibold">Time</th>
                    <th className="px-3 py-2 text-left font-semibold">Submitted</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {resultsData?.results?.length ? (
                    resultsData.results.map((result) => (
                      <tr key={result.student_id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{result.s_no}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-900">{result.student_name}</div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="h-3 w-3" />
                            {result.student_email}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="h-3 w-3" />
                            {result.phone}
                          </div>
                        </td>
                        <td className="px-3 py-2">{result.score.toFixed(2)}</td>
                        <td className="px-3 py-2">{result.percentage.toFixed(1)}%</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatTime(result.time_spent)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(result.submitted_at)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${statusBadgeClass(result.status)}`}>
                            {result.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-16 text-center text-xs text-slate-500">
                        No results found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Analytics</h2>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'statistics', label: 'Statistics', icon: BarChart3 },
                { id: 'heatmap', label: 'Heat map', icon: Activity },
                { id: 'histogram', label: 'Histogram', icon: TrendingUp },
                { id: 'boxplot', label: 'Box plot', icon: PieChart },
                { id: 'question_analysis', label: 'Questions', icon: FileText },
                { id: 'evaluation', label: 'Evaluation', icon: CheckCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalyticsView(tab.id as AnalyticsView)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-medium ${activeAnalyticsView === tab.id
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading analytics…
              </div>
            ) : !analyticsData ? (
              <div className="py-12 text-center text-xs text-slate-500">Analytics data is not available yet.</div>
            ) : (
              <>
                {activeAnalyticsView === 'statistics' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ['Average score', analyticsData.statistics.average_score.toFixed(2)],
                      ['Median score', analyticsData.statistics.median_score.toFixed(2)],
                      ['Highest score', analyticsData.statistics.highest_score.toFixed(2)],
                      ['Lowest score', analyticsData.statistics.lowest_score.toFixed(2)],
                      ['Completion rate', `${analyticsData.statistics.completion_rate.toFixed(1)}%`],
                      ['Attempts', analyticsData.statistics.total_attempts],
                      ['Invited', analyticsData.statistics.total_invited],
                      ['Avg time (min)', (analyticsData.statistics.average_time_spent / 60).toFixed(1)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[11px] text-slate-500">{label}</p>
                        <p className="text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeAnalyticsView === 'histogram' && (
                  <div className="space-y-2">
                    {analyticsData.histogram_data.map((bucket, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-16 text-[11px] text-slate-500">{bucket.range}</span>
                        <div className="h-2 flex-1 rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${bucket.percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-[11px] text-slate-500">{bucket.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeAnalyticsView === 'heatmap' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {analyticsData.heatmap_data.map((item, idx) => (
                      <div key={idx} className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-900">{item.subject}</p>
                        <p className="text-[11px] text-slate-500">{item.section_name}</p>
                        <p className="text-[11px] text-slate-600">
                          Average {item.average_score.toFixed(2)} / {item.max_marks}
                        </p>
                        <p className="text-[11px] text-slate-500">Questions: {item.total_questions}</p>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${(item.average_score / item.max_marks) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeAnalyticsView === 'boxplot' && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {[
                      ['Min', analyticsData.box_plot_data.quartiles.min],
                      ['Q1', analyticsData.box_plot_data.quartiles.q1],
                      ['Median', analyticsData.box_plot_data.quartiles.median],
                      ['Q3', analyticsData.box_plot_data.quartiles.q3],
                      ['Max', analyticsData.box_plot_data.quartiles.max],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                        <p className="text-[11px] text-slate-500">{label}</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeAnalyticsView === 'question_analysis' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-100 uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Question</th>
                          <th className="px-3 py-2 text-left font-semibold">Attempted</th>
                          <th className="px-3 py-2 text-left font-semibold">Correct</th>
                          <th className="px-3 py-2 text-left font-semibold">Wrong</th>
                          <th className="px-3 py-2 text-left font-semibold">Success %</th>
                          <th className="px-3 py-2 text-left font-semibold">Avg score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {analyticsData.question_analytics.map((qa) => (
                          <tr key={qa.question_number} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-semibold text-slate-900">Q{qa.question_number}</td>
                            <td className="px-3 py-2">{qa.total_attempts}</td>
                            <td className="px-3 py-2 text-emerald-600">{qa.correct_attempts}</td>
                            <td className="px-3 py-2 text-red-600">{qa.wrong_attempts}</td>
                            <td className="px-3 py-2">{qa.success_rate.toFixed(1)}%</td>
                            <td className="px-3 py-2">
                              {qa.average_score.toFixed(2)}/{qa.max_marks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeAnalyticsView === 'evaluation' && (
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-700">
                    <p>Manage grading and qualitative feedback in the evaluation workspace.</p>
                    <Link
                      to={`${basePath}/exams/${examId}/evaluation`}
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Open evaluation dashboard
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {aiInsights && (
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <h2 className="text-sm font-semibold text-slate-900">AI insights</h2>
            </div>
            {loadingInsights ? (
              <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analysing performance…
              </div>
            ) : (
              <>
                {aiInsights.insights?.length ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {aiInsights.insights.map((insight: any, idx: number) => (
                      <div key={idx} className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-900">{insight.title}</p>
                        <p className="text-[11px] text-slate-600">{insight.description}</p>
                        <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {insight.severity?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {aiInsights.recommendations?.length ? (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recommendations</h3>
                    {aiInsights.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-slate-900">{rec.title}</p>
                        <p className="text-[11px] text-slate-600">{rec.description}</p>
                        <div className="mt-1 text-[10px] font-medium text-blue-600">{rec.category}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

