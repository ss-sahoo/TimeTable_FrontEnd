import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Target,
  Download,
} from 'lucide-react';

interface AnalyticsData {
  exams: {
    total: number;
    active: number;
    completed: number;
    draft: number;
  };
  users: {
    total: number;
    active: number;
    new_this_month: number;
  };
  patterns: {
    total: number;
    active: number;
  };
  questions: {
    total: number;
    by_type: {
      mcq: number;
      numerical: number;
      subjective: number;
      true_false: number;
      fill_blank: number;
    };
  };
  performance: {
    avg_score: number;
    completion_rate: number;
    total_attempts: number;
  };
  recent_activity: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: AnalyticsData = {
        exams: {
          total: 24,
          active: 8,
          completed: 12,
          draft: 4
        },
        users: {
          total: 156,
          active: 142,
          new_this_month: 23
        },
        patterns: {
          total: 8,
          active: 6
        },
        questions: {
          total: 1247,
          by_type: {
            mcq: 856,
            numerical: 234,
            subjective: 98,
            true_false: 45,
            fill_blank: 14
          }
        },
        performance: {
          avg_score: 78.5,
          completion_rate: 92.3,
          total_attempts: 1847
        },
        recent_activity: [
          {
            id: 1,
            type: 'exam_completed',
            description: 'Physics Midterm completed',
            timestamp: '2025-10-05T10:30:00Z',
            user: 'John Doe'
          },
          {
            id: 2,
            type: 'pattern_created',
            description: 'JEE Advanced Pattern created',
            timestamp: '2025-10-05T09:15:00Z',
            user: 'Dr. Smith'
          },
          {
            id: 3,
            type: 'user_registered',
            description: 'New student registered',
            timestamp: '2025-10-05T08:45:00Z',
            user: 'Alice Johnson'
          }
        ]
      };
      setAnalytics(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#216865' }}></div>
          <p className="text-sm" style={{ color: '#6b6b6b' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Analytics Dashboard</h1>
            <p className="text-base" style={{ color: '#6b6b6b' }}>Insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg focus:ring-2 transition-colors"
              style={{ borderColor: '#e5e7eb', color: '#000000' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#216865';
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button 
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#216865' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a524f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#216865'}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: '#216865' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Total Exams</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{analytics.exams.total}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-3 h-3" />
              +12%
            </div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Active Users</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{analytics.users.active}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-3 h-3" />
              +8%
            </div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#a855f7' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Completed</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{analytics.exams.completed}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-3 h-3" />
              +15%
            </div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: '#f97316' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Avg Score</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{analytics.performance.avg_score}%</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-3 h-3" />
              +2.3%
            </div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Completion</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{analytics.performance.completion_rate}%</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-3 h-3" />
              +5.1%
            </div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#6366f1' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Attempts</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{analytics.performance.total_attempts}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-3 h-3" />
              +23%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Status Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Exam Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Active</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.exams.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Completed</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.exams.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                  <span className="text-xs text-slate-600">Draft</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.exams.draft}</span>
              </div>
            </div>
          </div>

          {/* Question Types Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-900">Question Types</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">MCQ</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.questions.by_type.mcq}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Numerical</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.questions.by_type.numerical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Subjective</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.questions.by_type.subjective}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">True/False</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.questions.by_type.true_false}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-slate-600">Fill Blank</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{analytics.questions.by_type.fill_blank}</span>
              </div>
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-900">User Growth</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Users</span>
                <span className="text-sm font-medium text-slate-900">{analytics.users.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Active Users</span>
                <span className="text-sm font-medium text-slate-900">{analytics.users.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">New This Month</span>
                <span className="text-sm font-medium text-slate-900">{analytics.users.new_this_month}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Active Rate</span>
                <span className="text-sm font-medium text-slate-900">
                  {Math.round((analytics.users.active / analytics.users.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {analytics.recent_activity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm text-slate-900">{activity.description}</div>
                  <div className="text-xs text-slate-500">by {activity.user}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-600" />
              <h3 className="text-sm font-semibold text-slate-900">Performance</h3>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{analytics.performance.avg_score}%</div>
            <div className="text-xs text-slate-600">Average Score</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <TrendingUp className="w-3 h-3" />
              +2.3% from last month
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-900">Completion Rate</h3>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{analytics.performance.completion_rate}%</div>
            <div className="text-xs text-slate-600">Exams Completed</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <TrendingUp className="w-3 h-3" />
              +5.1% from last month
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Total Attempts</h3>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{analytics.performance.total_attempts}</div>
            <div className="text-xs text-slate-600">All Time</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <TrendingUp className="w-3 h-3" />
              +23% from last month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
