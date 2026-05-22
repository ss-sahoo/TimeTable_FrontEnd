import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Target, TrendingDown, Clock, Users, AlertTriangle,
  Activity, Percent, Timer, UserCheck
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import ModernCard from '@/react-app/components/analytics/ModernCard';
import StatCard from '@/react-app/components/analytics/StatCard';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import ProgressRing from '@/react-app/components/analytics/ProgressRing';

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
  const { examId, queryParams } = useOutletContext<{
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
    console.log('Export as', format);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Statistics"
          subtitle="Comprehensive performance metrics"
          icon={BarChart3}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Statistics"
          subtitle="Comprehensive performance metrics"
          icon={BarChart3}
        />
        <ModernChartContainer loading={false} error={error} height={200} onRetry={loadStatistics} />
      </div>
    );
  }

  const stats = data?.statistics;
  const totalMarks = data?.exam?.total_marks ?? 100;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Statistics"
        subtitle="Comprehensive performance metrics and analysis"
        icon={BarChart3}
        actions={<ModernExportButton onExport={handleExport} />}
      />

      {/* Hero Stats - Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernCard
          title="Mean Score"
          value={stats?.average_score?.toFixed(1) ?? '0'}
          icon={BarChart3}
          subtitle={`Out of ${totalMarks} marks`}
          gradient="blue"
        />
        <ModernCard
          title="Median Score"
          value={stats?.median_score?.toFixed(1) ?? '0'}
          icon={TrendingUp}
          subtitle="50th percentile"
          gradient="emerald"
        />
        <ModernCard
          title="Completion Rate"
          value={`${stats?.completion_rate?.toFixed(0) ?? 0}%`}
          icon={UserCheck}
          subtitle={`${stats?.total_attempts ?? 0} of ${stats?.total_invited ?? 0}`}
          gradient="purple"
        />
        <ModernCard
          title="Average Time"
          value={`${Math.floor((stats?.average_time_spent ?? 0) / 60)}m`}
          icon={Timer}
          subtitle="Time spent on exam"
          gradient="cyan"
        />
      </div>

      {/* Score Distribution Stats */}
      <GlassCard delay={0.1}>
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Score Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            title="Highest"
            value={stats?.highest_score?.toFixed(1) ?? '0'}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Lowest"
            value={stats?.lowest_score?.toFixed(1) ?? '0'}
            icon={TrendingDown}
            variant="danger"
          />
          <StatCard
            title="Mode"
            value={stats?.mode_score?.toFixed(1) ?? '0'}
            icon={Target}
            variant="info"
          />
          <StatCard
            title="Range"
            value={stats?.range_score?.toFixed(1) ?? '0'}
            variant="warning"
          />
          <StatCard
            title="Std Dev"
            value={stats?.std_deviation?.toFixed(2) ?? '0'}
            subtitle="Variability"
          />
          <StatCard
            title="Variance"
            value={stats?.variance?.toFixed(2) ?? '0'}
            subtitle="Statistical"
          />
        </div>
      </GlassCard>

      {/* Percentile Distribution */}
      <GlassCard delay={0.2}>
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Percent className="w-5 h-5 text-purple-500" />
          Percentile Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: '25th', value: stats?.percentiles?.p25, color: 'amber' as const },
            { label: '50th', value: stats?.percentiles?.p50, color: 'blue' as const },
            { label: '75th', value: stats?.percentiles?.p75, color: 'emerald' as const },
            { label: '90th', value: stats?.percentiles?.p90, color: 'purple' as const },
            { label: '95th', value: stats?.percentiles?.p95, color: 'rose' as const },
          ].map((p, index) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex flex-col items-center"
            >
              <ProgressRing
                value={p.value ?? 0}
                max={totalMarks}
                size={100}
                strokeWidth={8}
                color={p.color}
                showValue={false}
              />
              <div className="text-center mt-3">
                <p className="text-2xl font-bold text-slate-900">{p.value?.toFixed(1) ?? '0'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.label} Percentile</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Violation Statistics */}
      {stats?.violation_stats && (
        <GlassCard delay={0.3}>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Violation Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-5"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Violations</span>
                </div>
                <p className="text-3xl font-bold text-amber-900">{stats.violation_stats.total_violations}</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/50 p-5"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/30 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-rose-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Affected Attempts</span>
                </div>
                <p className="text-3xl font-bold text-rose-900">{stats.violation_stats.attempts_with_violations}</p>
                <p className="text-xs text-rose-600 mt-1">
                  {((stats.violation_stats.attempts_with_violations / (stats.total_attempts || 1)) * 100).toFixed(1)}% of total
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 p-5"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-200/30 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Avg per Attempt</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.violation_stats.average_violations.toFixed(2)}</p>
              </div>
            </motion.div>
          </div>
        </GlassCard>
      )}

      {/* Time Distribution */}
      {stats?.time_distribution?.submissions_by_hour && Object.keys(stats.time_distribution.submissions_by_hour).length > 0 && (
        <GlassCard delay={0.4}>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            Submission Time Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.time_distribution.submissions_by_hour)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([hour, count], index) => {
                const maxCount = Math.max(...Object.values(stats.time_distribution.submissions_by_hour));
                const percentage = (Number(count) / maxCount) * 100;
                return (
                  <motion.div
                    key={hour}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <span className="w-14 text-sm font-medium text-slate-600">{hour}:00</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + index * 0.05 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-end pr-3"
                      >
                        {percentage > 20 && (
                          <span className="text-xs font-semibold text-white">{count}</span>
                        )}
                      </motion.div>
                    </div>
                    {percentage <= 20 && (
                      <span className="text-xs font-medium text-slate-500 w-8">{count}</span>
                    )}
                  </motion.div>
                );
              })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
