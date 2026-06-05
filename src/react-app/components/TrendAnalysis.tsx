import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, LineChart,
  Calendar, RefreshCw,
  Target, Users, Clock, Award, AlertTriangle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { getErrorMessage } from '@/react-app/hooks/useApi';

interface TrendData {
  period: string;
  total_exams: number;
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  completion_rate: number;
  average_time_spent: number;
  new_students: number;
  retention_rate: number;
}

interface TrendAnalysisProps {
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ 
  timeRange, 
  onTimeRangeChange 
}) => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'engagement' | 'insights'>('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'score' | 'attempts' | 'pass_rate' | 'time'>('score');

  useEffect(() => {
    loadTrendData();
  }, [timeRange, loadTrendData]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock trend data - in real implementation, this would come from API
      const mockData: TrendData[] = generateMockTrendData(timeRange);
      setTrendData(mockData);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load trend data'));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const generateMockTrendData = (range: string): TrendData[] => {
    const periods = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 12 : 12;
    const data: TrendData[] = [];
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        period: range === 'week' 
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : range === 'month'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : range === 'quarter'
          ? `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`
          : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total_exams: Math.floor(Math.random() * 10) + 5,
        total_attempts: Math.floor(Math.random() * 100) + 50,
        average_score: Math.floor(Math.random() * 30) + 60,
        pass_rate: Math.floor(Math.random() * 20) + 70,
        completion_rate: Math.floor(Math.random() * 15) + 80,
        average_time_spent: Math.floor(Math.random() * 30) + 30,
        new_students: Math.floor(Math.random() * 20) + 10,
        retention_rate: Math.floor(Math.random() * 20) + 75
      });
    }
    
    return data;
  };

  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return ((last - first) / first) * 100;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMetricValue = (data: TrendData[], metric: string) => {
    return data.map(d => d[metric as keyof TrendData] as number);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trend analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadTrendData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const scoreTrend = calculateTrend(getMetricValue(trendData, 'average_score'));
  const attemptsTrend = calculateTrend(getMetricValue(trendData, 'total_attempts'));
  const passRateTrend = calculateTrend(getMetricValue(trendData, 'pass_rate'));
  const timeTrend = calculateTrend(getMetricValue(trendData, 'average_time_spent'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Trend Analysis</h2>
            <p className="text-sm text-gray-600">Performance trends over time</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-sm">{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>
          <button
            onClick={loadTrendData}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Time Range:</span>
        {['week', 'month', 'quarter', 'year'].map((range) => (
          <button
            key={range}
            onClick={() => onTimeRangeChange(range as 'week' | 'month' | 'quarter' | 'year')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Average Score</span>
            </div>
            {getTrendIcon(scoreTrend)}
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {trendData[trendData.length - 1]?.average_score.toFixed(1)}%
          </p>
          <p className={`text-sm ${getTrendColor(scoreTrend)}`}>
            {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(1)}% vs previous period
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Total Attempts</span>
            </div>
            {getTrendIcon(attemptsTrend)}
          </div>
          <p className="text-2xl font-bold text-green-900">
            {trendData[trendData.length - 1]?.total_attempts}
          </p>
          <p className={`text-sm ${getTrendColor(attemptsTrend)}`}>
            {attemptsTrend > 0 ? '+' : ''}{attemptsTrend.toFixed(1)}% vs previous period
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Pass Rate</span>
            </div>
            {getTrendIcon(passRateTrend)}
          </div>
          <p className="text-2xl font-bold text-yellow-900">
            {trendData[trendData.length - 1]?.pass_rate.toFixed(1)}%
          </p>
          <p className={`text-sm ${getTrendColor(passRateTrend)}`}>
            {passRateTrend > 0 ? '+' : ''}{passRateTrend.toFixed(1)}% vs previous period
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Avg Time</span>
            </div>
            {getTrendIcon(timeTrend)}
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {trendData[trendData.length - 1]?.average_time_spent} min
          </p>
          <p className={`text-sm ${getTrendColor(timeTrend)}`}>
            {timeTrend > 0 ? '+' : ''}{timeTrend.toFixed(1)}% vs previous period
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: Target },
          { id: 'engagement', label: 'Engagement', icon: Users },
          { id: 'insights', label: 'Insights', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'performance' | 'engagement' | 'insights')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Trend Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Trend chart would be displayed here</p>
              <div className="mt-4 flex justify-center space-x-2">
                {['score', 'attempts', 'pass_rate', 'time'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric as 'score' | 'attempts' | 'pass_rate' | 'time')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      selectedMetric === metric
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {metric.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Trend Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Positive Trends</h3>
                <ul className="space-y-1 text-sm text-green-800">
                  {scoreTrend > 0 && (
                    <li>• Average scores increased by {scoreTrend.toFixed(1)}%</li>
                  )}
                  {attemptsTrend > 0 && (
                    <li>• Total attempts increased by {attemptsTrend.toFixed(1)}%</li>
                  )}
                  {passRateTrend > 0 && (
                    <li>• Pass rate improved by {passRateTrend.toFixed(1)}%</li>
                  )}
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Areas of Concern</h3>
                <ul className="space-y-1 text-sm text-red-800">
                  {scoreTrend < 0 && (
                    <li>• Average scores decreased by {Math.abs(scoreTrend).toFixed(1)}%</li>
                  )}
                  {attemptsTrend < 0 && (
                    <li>• Total attempts decreased by {Math.abs(attemptsTrend).toFixed(1)}%</li>
                  )}
                  {passRateTrend < 0 && (
                    <li>• Pass rate declined by {Math.abs(passRateTrend).toFixed(1)}%</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            
            {/* Performance Metrics Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pass Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                    {showDetails && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Spent
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trendData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.average_score.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.pass_rate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.total_attempts}
                      </td>
                      {showDetails && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.average_time_spent} min
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Trends</h3>
            
            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">New Students</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {trendData[trendData.length - 1]?.new_students}
                </p>
                <p className="text-sm text-gray-600">This period</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Retention Rate</h4>
                <p className="text-2xl font-bold text-green-600">
                  {trendData[trendData.length - 1]?.retention_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Student retention</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Completion Rate</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {trendData[trendData.length - 1]?.completion_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Exam completion</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Performance Insights</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Best performing period: {trendData.reduce((max, data) => 
                    data.average_score > max.average_score ? data : max
                  ).period}</li>
                  <li>• Most active period: {trendData.reduce((max, data) => 
                    data.total_attempts > max.total_attempts ? data : max
                  ).period}</li>
                  <li>• Average score range: {Math.min(...trendData.map(d => d.average_score)).toFixed(1)}% - {Math.max(...trendData.map(d => d.average_score)).toFixed(1)}%</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  {scoreTrend < 0 && <li>• Review exam difficulty and content quality</li>}
                  {attemptsTrend < 0 && <li>• Increase student engagement and motivation</li>}
                  {passRateTrend < 0 && <li>• Provide additional support and resources</li>}
                  <li>• Monitor trends weekly for early intervention</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendAnalysis;
