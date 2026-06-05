import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';
import { useAuthContext } from '@/react-app/contexts/AuthContext';
import { SkeletonChart, SkeletonCard, SkeletonText, SkeletonStatsCard } from '@/react-app/components/SkeletonLoader';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Zap,
  Trophy,
  Activity,
  RefreshCw,
  LineChart,
  Timer,
  Shield,
  ArrowUp,
} from 'lucide-react';

interface AnalyticsOverview {
  overview: {
    total_exams_attempted: number;
    total_exams_passed: number;
    pass_percentage: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    current_rank: number;
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
    most_efficient_exam: any;
    least_efficient_exam: any;
  };
  violation_stats: {
    total_violations: number;
    exams_with_violations: number;
    average_violations_per_exam: number;
  };
  recent_activity: Array<{
    type: string;
    exam_title: string;
    score: number;
    date: string;
    exam_id: number;
    violations: number;
  }>;
  performance_categories: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
}

interface ExamAnalytics {
  exam_info: {
    exam_title: string;
    exam_id: number;
    attempt_id: number;
    submitted_at: string;
    duration_minutes: number;
    total_marks: number;
    total_questions: number;
  };
  performance_summary: {
    score: number;
    percentage: number;
    correct_answers: number;
    incorrect_answers: number;
    unattempted: number;
    accuracy: number;
  };
  time_analysis: {
    total_time_spent: number;
    average_time_per_question: number;
    time_efficiency: number;
  };
  question_analysis: Array<{
    question_number: number;
    question_text: string;
    question_type: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    marks_obtained: number;
    max_marks: number;
    evaluation_status: string;
    time_spent: number;
  }>;
  difficulty_analysis: {
    easy: number;
    medium: number;
    hard: number;
  };
  type_performance: Record<string, {
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
  }>;
  violations: {
    total_violations: number;
    violation_details: any[];
  };
}

interface WeakArea {
  subject: string;
  accuracy: number;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unattempted: number;
  strength_level: 'strong' | 'moderate' | 'weak';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export default function StudentAnalytics() {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const { examId } = useParams();

  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [, setExamAnalytics] = useState<ExamAnalytics | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('User context:', user);
    console.log('Auth loading:', authLoading);
    
    if (authLoading) {
      return; // Wait for auth to load
    }
    
    if (user && user.role === 'student') {
      loadAnalyticsData();
    } else {
      setError('Access denied. Student access required.');
      setLoading(false);
    }
  }, [activeTab, examId, user, authLoading]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading analytics data for tab:', activeTab);
      console.log('User:', user);
      console.log('Auth loading:', authLoading);

      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      console.log('Access token exists:', !!token);

      if (activeTab === 'overview') {
        console.log('Fetching overview data...');
        const response = await api.get('/exams/student-analytics/overview/');
        console.log('Overview response:', response.data);
        setOverview(response.data);
      } else if (activeTab === 'exam' && examId) {
        console.log('Fetching exam analytics for:', examId);
        const response = await api.get(`/exams/student-analytics/exam/${examId}/`);
        setExamAnalytics(response.data);
      } else if (activeTab === 'weak-areas') {
        console.log('Fetching weak areas data...');
        const response = await api.get('/exams/student-analytics/weak-areas/');
        setWeakAreas(response.data.subject_weak_areas || []);
      } else if (activeTab === 'achievements') {
        console.log('Fetching achievements data...');
        const response = await api.get('/exams/student-analytics/achievements/');
        setAchievements(response.data.achievements || []);
      } else if (activeTab === 'trends') {
        console.log('Fetching trends data...');
        const response = await api.get('/exams/student-analytics/trends/');
        setPerformanceTrends(response.data);
      }
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError(getErrorMessage(err, 'Failed to load analytics data'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <SkeletonText lines={1} variant="xl" className="w-1/3 mb-2" />
            <SkeletonText lines={1} variant="md" className="w-1/2" />
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonStatsCard key={index} />
            ))}
          </div>
          
          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart height="h-80" />
            <SkeletonChart height="h-80" />
          </div>
          
          {/* Performance Table Skeleton */}
          <SkeletonCard>
            <div className="p-6">
              <SkeletonText lines={1} variant="lg" className="w-1/4 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <SkeletonText lines={1} variant="md" className="w-1/3" />
                    <SkeletonText lines={1} variant="sm" className="w-1/4" />
                  </div>
                ))}
              </div>
            </div>
          </SkeletonCard>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Analytics</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="bg-slate-100 p-4 rounded-lg mb-6 text-left text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>User: {user ? `${user.email} (${user.role})` : 'Not logged in'}</p>
            <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
            <p>Token: {localStorage.getItem('access_token') ? 'Present' : 'Missing'}</p>
            <p>Active Tab: {activeTab}</p>
            <p>Exam ID: {examId || 'None'}</p>
          </div>
          <button
            onClick={loadAnalyticsData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Analytics</h1>
              <p className="text-sm text-slate-600 mt-1">Track your performance and improve your skills</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/student-dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ArrowUp className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg border border-slate-200 p-1 mb-6">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'weak-areas', label: 'Weak Areas', icon: Target },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-sm ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && overview && (
            <OverviewTab data={overview} />
          )}

          {activeTab === 'trends' && performanceTrends && (
            <TrendsTab data={performanceTrends} />
          )}

          {activeTab === 'weak-areas' && (
            <WeakAreasTab data={weakAreas} />
          )}

          {activeTab === 'achievements' && (
            <AchievementsTab data={achievements} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }: { data: AnalyticsOverview }) {
  const { overview, performance_trend, subject_performance, time_analysis, violation_stats, performance_categories } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Exams</p>
              <p className="text-2xl font-bold">{overview.total_exams_attempted}</p>
            </div>
            <BookOpen className="w-6 h-6 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Average Score</p>
              <p className="text-2xl font-bold">{overview.average_score}%</p>
            </div>
            <Target className="w-6 h-6 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Pass Rate</p>
              <p className="text-2xl font-bold">{overview.pass_percentage.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-6 h-6 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Best Score</p>
              <p className="text-2xl font-bold">{overview.highest_score}%</p>
            </div>
            <Trophy className="w-6 h-6 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Performance Categories */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Excellent (80%+)', count: performance_categories.excellent, color: 'bg-green-500' },
            { label: 'Good (60-79%)', count: performance_categories.good, color: 'bg-blue-500' },
            { label: 'Average (40-59%)', count: performance_categories.average, color: 'bg-yellow-500' },
            { label: 'Needs Improvement (<40%)', count: performance_categories.needs_improvement, color: 'bg-red-500' },
          ].map((category, index) => (
            <div key={index} className="text-center">
              <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white font-bold text-lg">{category.count}</span>
              </div>
              <p className="text-sm text-slate-600">{category.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Performance Trend */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">Recent Performance</h3>
        <div className="space-y-4">
          {performance_trend.slice(0, 5).map((exam, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{exam.exam_title}</h4>
                  <p className="text-sm text-slate-600">{new Date(exam.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${exam.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {exam.score}%
                </p>
                <p className="text-sm text-slate-600">Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Performance */}
      {Object.keys(subject_performance).length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Subject Performance</h3>
          <div className="space-y-4">
            {Object.entries(subject_performance).map(([subject, data]) => (
              <div key={subject} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900 text-sm">{subject}</h4>
                  <span className="text-lg font-semibold text-slate-900">{data.average_score.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{data.total_exams} exams</span>
                  <span>Best: {data.highest_score.toFixed(1)}%</span>
                  <span>Lowest: {data.lowest_score.toFixed(1)}%</span>
                </div>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.average_score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Analysis */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">Time Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{Math.round(time_analysis.average_time_spent / 60)}m</p>
            <p className="text-sm text-slate-600">Avg Time per Exam</p>
          </div>
          <div className="text-center">
            <Timer className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{Math.round(time_analysis.total_time_spent / 3600)}h</p>
            <p className="text-sm text-slate-600">Total Time Spent</p>
          </div>
          <div className="text-center">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">
              {time_analysis.most_efficient_exam ? time_analysis.most_efficient_exam.exam_title.substring(0, 10) + '...' : 'N/A'}
            </p>
            <p className="text-sm text-slate-600">Most Efficient</p>
          </div>
        </div>
      </div>

      {/* Violation Stats */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">Proctoring Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{violation_stats.total_violations}</p>
            <p className="text-sm text-slate-600">Total Violations</p>
          </div>
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{violation_stats.exams_with_violations}</p>
            <p className="text-sm text-slate-600">Exams with Violations</p>
          </div>
          <div className="text-center">
            <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{violation_stats.average_violations_per_exam.toFixed(1)}</p>
            <p className="text-sm text-slate-600">Avg per Exam</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trends Tab Component
function TrendsTab({}: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Trends</h3>
        <div className="text-center py-8">
          <LineChart className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Performance trends visualization coming soon...</p>
        </div>
      </div>
    </div>
  );
}

// Weak Areas Tab Component
function WeakAreasTab({ data }: { data: WeakArea[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Weak Areas Analysis</h3>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No weak areas identified. Keep up the great work!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((area, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{area.subject}</h4>
                      <p className="text-sm text-slate-600">{area.total_questions} questions attempted</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStrengthColor(area.strength_level)}`}>
                      {area.strength_level.charAt(0).toUpperCase() + area.strength_level.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{area.accuracy.toFixed(1)}%</p>
                    <p className="text-sm text-slate-600">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{area.correct_answers}</p>
                    <p className="text-sm text-slate-600">Correct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{area.incorrect_answers}</p>
                    <p className="text-sm text-slate-600">Incorrect</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{area.unattempted}</p>
                    <p className="text-sm text-slate-600">Unattempted</p>
                  </div>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${area.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Achievements Tab Component
function AchievementsTab({ data }: { data: Achievement[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Achievements</h3>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Complete more exams to unlock achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((achievement, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900">{achievement.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{achievement.description}</p>
                    <p className="text-xs text-slate-500">
                      Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </p>
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

// Helper functions
function getStrengthColor(level: string) {
  switch (level) {
    case 'strong': return 'text-green-600 bg-green-100';
    case 'moderate': return 'text-yellow-600 bg-yellow-100';
    case 'weak': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100';
    case 'uncommon': return 'text-green-600 bg-green-100';
    case 'rare': return 'text-blue-600 bg-blue-100';
    case 'epic': return 'text-purple-600 bg-purple-100';
    case 'legendary': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}
