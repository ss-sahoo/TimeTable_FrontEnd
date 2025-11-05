import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Zap,
  Star,
  Trophy,
  Brain,
  PieChart,
  Activity,
  ChevronRight,
  RefreshCw,
  Download,
  Eye,
  Timer,
  Shield,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
  Users,
  BarChart,
  LineChart
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_exams_attempted: number;
    total_exams_passed: number;
    pass_percentage: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    current_rank: number;
    total_violations: number;
  };
  performance_trend: Array<{
    exam_title: string;
    score: number;
    date: string;
    exam_id: number;
  }>;
  subject_performance: Record<string, {
    total_exams: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
  }>;
  time_analysis: {
    average_time_spent: number;
    total_time_spent: number;
  };
  performance_categories: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
  recent_activity: Array<{
    type: string;
    exam_title: string;
    score: number;
    date: string;
    exam_id: number;
    violations: number;
  }>;
}

export default function StudentAnalyticsOverview() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === 'student') {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/exams/student-analytics/overview/');
      setData(response.data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Analytics</h2>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, performance_trend, subject_performance, time_analysis, performance_categories, recent_activity } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="w-full px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
              <p className="text-blue-100">Comprehensive overview of your academic performance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Exams Attempted</p>
                  <p className="text-3xl font-bold mt-1">{overview.total_exams_attempted}</p>
                  <p className="text-blue-200 text-xs mt-1">{overview.total_exams_passed} passed</p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-200" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Average Score</p>
                  <p className="text-3xl font-bold mt-1">{overview.average_score.toFixed(1)}%</p>
                  <p className="text-blue-200 text-xs mt-1">Across all exams</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-200" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Pass Rate</p>
                  <p className="text-3xl font-bold mt-1">{overview.pass_percentage.toFixed(0)}%</p>
                  <p className="text-blue-200 text-xs mt-1">Success rate</p>
                </div>
                <Trophy className="w-10 h-10 text-blue-200" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Current Rank</p>
                  <p className="text-3xl font-bold mt-1">#{overview.current_rank}</p>
                  <p className="text-blue-200 text-xs mt-1">In your institute</p>
                </div>
                <Star className="w-10 h-10 text-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Performance Distribution - Pie Chart Representation */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Performance Distribution</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Excellent (80%+)</span>
                  <span className="text-sm font-semibold text-green-600">{performance_categories.excellent}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(performance_categories.excellent / overview.total_exams_attempted) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Good (60-79%)</span>
                  <span className="text-sm font-semibold text-blue-600">{performance_categories.good}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(performance_categories.good / overview.total_exams_attempted) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Average (40-59%)</span>
                  <span className="text-sm font-semibold text-orange-600">{performance_categories.average}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${(performance_categories.average / overview.total_exams_attempted) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Needs Improvement (&lt;40%)</span>
                  <span className="text-sm font-semibold text-red-600">{performance_categories.needs_improvement}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${(performance_categories.needs_improvement / overview.total_exams_attempted) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Score Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">Highest Score</p>
                  <p className="text-2xl font-bold text-green-600">{overview.highest_score.toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">Lowest Score</p>
                  <p className="text-2xl font-bold text-red-600">{overview.lowest_score.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Performance Trend */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <LineChart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Performance Trend</h2>
            </div>
            {performance_trend.length > 0 ? (
              <div className="space-y-3">
                {performance_trend.map((item, index) => {
                  const previousScore = index < performance_trend.length - 1 ? performance_trend[index + 1].score : item.score;
                  return (
                    <div
                      key={item.exam_id}
                      className={`border rounded-lg p-4 ${getPerformanceBg(item.score)} hover:shadow-md transition-all cursor-pointer`}
                      onClick={() => navigate(`/student-analytics/${item.exam_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{item.exam_title}</h3>
                            {getTrendIcon(item.score, previousScore)}
                          </div>
                          <p className="text-xs text-slate-600">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getPerformanceColor(item.score)}`}>
                            {item.score.toFixed(0)}%
                          </p>
                          <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No exam attempts yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Subject-wise Performance</h2>
            </div>
            {Object.keys(subject_performance).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(subject_performance).map(([subject, stats]) => (
                  <div key={subject} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{subject}</h3>
                      <span className="text-sm text-slate-600">{stats.total_exams} exams</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Average</p>
                        <p className={`text-lg font-bold ${getPerformanceColor(stats.average_score)}`}>
                          {stats.average_score.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Highest</p>
                        <p className="text-lg font-bold text-green-600">{stats.highest_score.toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Lowest</p>
                        <p className="text-lg font-bold text-red-600">{stats.lowest_score.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stats.average_score >= 80 ? 'bg-green-600' :
                            stats.average_score >= 60 ? 'bg-blue-600' :
                            stats.average_score >= 40 ? 'bg-orange-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${stats.average_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No subject data available</p>
              </div>
            )}
          </div>

          {/* Time & Discipline Stats */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Time & Discipline</h2>
            </div>
            <div className="space-y-6">
              {/* Time Stats */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Time Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Timer className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 mb-1">Total Time</p>
                    <p className="text-xl font-bold text-slate-900">{formatTime(time_analysis.total_time_spent)}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 mb-1">Avg/Exam</p>
                    <p className="text-xl font-bold text-slate-900">{formatTime(time_analysis.average_time_spent)}</p>
                  </div>
                </div>
              </div>

              {/* Discipline Stats */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Exam Discipline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-slate-700">Total Violations</span>
                    </div>
                    <span className={`text-lg font-bold ${overview.total_violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {overview.total_violations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-slate-700">Clean Exams</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {overview.total_exams_attempted - (overview.total_violations > 0 ? 1 : 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Badge */}
              <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Performance Level</p>
                    <p className="text-lg font-bold text-slate-900">
                      {overview.average_score >= 80 ? 'Excellent' :
                       overview.average_score >= 60 ? 'Good' :
                       overview.average_score >= 40 ? 'Average' : 'Needs Focus'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          {recent_activity.length > 0 ? (
            <div className="space-y-3">
              {recent_activity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/student-analytics/${activity.exam_id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${getPerformanceBg(activity.score)}`}>
                      {activity.score >= 60 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{activity.exam_title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                        {activity.violations > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            {activity.violations} violations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getPerformanceColor(activity.score)}`}>
                      {activity.score.toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-600 mt-1">View Details →</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No recent activity</p>
            </div>
          )}
        </div>

        {/* Insights & Recommendations */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Personalized Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <Brain className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Study Smart</h3>
              <p className="text-sm text-slate-600">
                Focus on subjects with lower averages to improve overall performance.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <Target className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Set Goals</h3>
              <p className="text-sm text-slate-600">
                Aim for consistent scores above 80% to achieve excellence level.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <Shield className="w-6 h-6 text-orange-600 mb-2" />
              <h3 className="font-semibold text-slate-900 mb-1">Stay Disciplined</h3>
              <p className="text-sm text-slate-600">
                Maintain zero violations to build a strong academic reputation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

