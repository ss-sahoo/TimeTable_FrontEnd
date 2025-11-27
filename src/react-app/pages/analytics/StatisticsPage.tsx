import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { BarChart3, TrendingUp, Target, TrendingDown, Clock, Users, Award, AlertTriangle } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import AnalyticsCard from '@/react-app/components/analytics/AnalyticsCard';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';

interface StatisticsData {
  exam: {
    id: number;
    title: string;
    total_questions: number;
    total_marks: number;
  };
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
    min_time_spent: number;
    max_time_spent: number;
    average_percentage: number;
    percentiles: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
    };
    violation_stats: {
      total_violations: number;
      attempts_with_violations: number;
      average_violations: number;
    };
    time_distribution: {
      submissions_by_hour: Record<number, number>;
    };
  };
  filters_applied: any;
}

export default function StatisticsPage() {
  const { examId, filters, queryParams, examData } = useOutletContext<{
    examId: string;
    filters: any;
    queryParams: string;
    examData: any;
  }>();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [examId, queryParams]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/statistics/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    // TODO: Implement export functionality
    console.log('Export as', format);
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Statistics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Statistics</h2>
        </div>
        <ChartContainer loading={false} error={error} height={200} />
      </div>
    );
  }

  const stats = data?.statistics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Statistics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive performance metrics and analysis
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      {/* Basic Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Mean Score"
          value={stats?.average_score?.toFixed(2) ?? '0.00'}
          icon={BarChart3}
          subtitle={`Out of ${data?.exam?.total_marks ?? 0} marks`}
        />
        <AnalyticsCard
          title="Median Score"
          value={stats?.median_score?.toFixed(2) ?? '0.00'}
          icon={TrendingUp}
          subtitle="50th percentile"
        />
        <AnalyticsCard
          title="Mode Score"
          value={stats?.mode_score?.toFixed(2) ?? '0.00'}
          icon={Target}
          subtitle="Most frequent score"
        />
        <AnalyticsCard
          title="Range"
          value={stats?.range_score?.toFixed(2) ?? '0.00'}
          icon={TrendingDown}
          subtitle={`${stats?.lowest_score?.toFixed(2) ?? 0} - ${stats?.highest_score?.toFixed(2) ?? 0}`}
        />
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Std Deviation"
          value={stats?.std_deviation?.toFixed(2) ?? '0.00'}
          subtitle="Score variability"
        />
        <AnalyticsCard
          title="Variance"
          value={stats?.variance?.toFixed(2) ?? '0.00'}
          subtitle="Statistical variance"
        />
        <AnalyticsCard
          title="Average Time"
          value={`${Math.floor((stats?.average_time_spent ?? 0) / 60)}m ${(stats?.average_time_spent ?? 0) % 60}s`}
          icon={Clock}
          subtitle="Time spent on exam"
        />
        <AnalyticsCard
          title="Completion Rate"
          value={`${stats?.completion_rate?.toFixed(1) ?? 0}%`}
          icon={Users}
          subtitle={`${stats?.total_attempts ?? 0} of ${stats?.total_invited ?? 0} invited`}
        />
      </div>

      {/* Percentiles */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Percentile Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">25th Percentile</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.percentiles?.p25?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">50th Percentile (Median)</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.percentiles?.p50?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">75th Percentile</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.percentiles?.p75?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">90th Percentile</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.percentiles?.p90?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">95th Percentile</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.percentiles?.p95?.toFixed(2) ?? '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Violation Statistics */}
      {stats?.violation_stats && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Violation Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnalyticsCard
              title="Total Violations"
              value={stats.violation_stats.total_violations}
              icon={AlertTriangle}
            />
            <AnalyticsCard
              title="Attempts with Violations"
              value={stats.violation_stats.attempts_with_violations}
              subtitle={`${((stats.violation_stats.attempts_with_violations / stats.total_attempts) * 100).toFixed(1)}% of attempts`}
            />
            <AnalyticsCard
              title="Average Violations"
              value={stats.violation_stats.average_violations.toFixed(2)}
              subtitle="Per attempt"
            />
          </div>
        </div>
      )}

      {/* Time Distribution */}
      {stats?.time_distribution?.submissions_by_hour && Object.keys(stats.time_distribution.submissions_by_hour).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Submission Time Distribution</h3>
          <div className="space-y-2">
            {Object.entries(stats.time_distribution.submissions_by_hour)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([hour, count]) => (
                <div key={hour} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-slate-600">{hour}:00</span>
                  <div className="flex-1 h-6 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-6 bg-blue-500 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${(Number(count) / Math.max(...Object.values(stats.time_distribution.submissions_by_hour))) * 100}%`,
                      }}
                    >
                      <span className="text-[10px] text-white font-medium">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

