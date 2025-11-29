import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import { ClipboardCheck, CheckCircle, Clock, AlertCircle, Zap, UserCheck, FileCheck } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernCard from '@/react-app/components/analytics/ModernCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import ProgressRing from '@/react-app/components/analytics/ProgressRing';

interface EvaluationData {
  exam: {
    id: number;
    title: string;
    total_questions: number;
  };
  evaluation_statistics: {
    total_questions: number;
    evaluated_questions: number;
    pending_questions: number;
    completion_rate: number;
    auto_evaluated: number;
    manually_evaluated: number;
    pending_evaluation: number;
  };
  question_evaluation_status: Array<{
    question_number: number;
    total_attempts: number;
    evaluated: number;
    pending: number;
    completion_rate: number;
  }>;
  batch_progress: Array<{
    id: number;
    created_at: string;
    total_questions: number;
    evaluated_questions: number;
    status: string;
    progress_percentage: number;
  }>;
  filters_applied: any;
}

export default function EvaluationPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluationData();
  }, [examId, queryParams]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/evaluation/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load evaluation analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const stats = data?.evaluation_statistics;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Evaluation Analytics"
        subtitle="Grading progress and evaluation metrics"
        icon={ClipboardCheck}
        actions={<ModernExportButton onExport={handleExport} />}
      />

      <ModernChartContainer loading={loading} error={error} height="auto" onRetry={loadEvaluationData}>
        {data && (
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ModernCard
                title="Total Questions"
                value={stats?.total_questions || 0}
                icon={FileCheck}
                gradient="blue"
              />
              <ModernCard
                title="Evaluated"
                value={stats?.evaluated_questions || 0}
                icon={CheckCircle}
                subtitle={`${stats?.completion_rate?.toFixed(0) || 0}% complete`}
                gradient="emerald"
              />
              <ModernCard
                title="Pending"
                value={stats?.pending_questions || 0}
                icon={Clock}
                subtitle="Awaiting evaluation"
                gradient="amber"
              />
              <ModernCard
                title="Completion"
                value={`${stats?.completion_rate?.toFixed(0) || 0}%`}
                icon={ClipboardCheck}
                gradient="purple"
              />
            </div>

            {/* Evaluation Breakdown */}
            <GlassCard>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Evaluation Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 p-6"
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-200/30 rounded-full blur-2xl" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Zap className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Auto Evaluated</p>
                      <p className="text-3xl font-bold text-emerald-900">{stats?.auto_evaluated || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-200/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-700">Instant grading</span>
                      <span className="font-semibold text-emerald-800">
                        {stats?.total_questions ? ((stats.auto_evaluated / stats.total_questions) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-6"
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Manually Evaluated</p>
                      <p className="text-3xl font-bold text-blue-900">{stats?.manually_evaluated || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Human reviewed</span>
                      <span className="font-semibold text-blue-800">
                        {stats?.total_questions ? ((stats.manually_evaluated / stats.total_questions) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/50 border border-amber-200/50 p-6"
                >
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl" />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Pending</p>
                      <p className="text-3xl font-bold text-amber-900">{stats?.pending_evaluation || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-200/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-700">Needs attention</span>
                      <span className="font-semibold text-amber-800">
                        {stats?.total_questions ? ((stats.pending_evaluation / stats.total_questions) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </GlassCard>

            {/* Question-wise Evaluation Status */}
            <GlassCard>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-500" />
                Question Evaluation Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.question_evaluation_status.map((qes, index) => (
                  <motion.div
                    key={qes.question_number}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    className="relative bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-lg transition-all"
                  >
                    <div className="absolute top-2 right-2">
                      {qes.completion_rate === 100 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : qes.completion_rate > 0 ? (
                        <Clock className="w-4 h-4 text-amber-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Question</p>
                    <p className="text-xl font-bold text-slate-900 mb-3">{qes.question_number}</p>
                    <ProgressRing
                      value={qes.completion_rate}
                      size={60}
                      strokeWidth={5}
                      color={qes.completion_rate === 100 ? 'emerald' : qes.completion_rate > 50 ? 'blue' : 'amber'}
                    />
                    <div className="mt-3 text-xs text-slate-500">
                      {qes.evaluated}/{qes.total_attempts}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Batch Progress */}
            {data.batch_progress.length > 0 && (
              <GlassCard>
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  Recent Batch Progress
                </h3>
                <div className="space-y-4">
                  {data.batch_progress.map((batch, index) => {
                    const statusColors = {
                      completed: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100' },
                      in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100' },
                      pending: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100' },
                    };
                    const colors = statusColors[batch.status as keyof typeof statusColors] || statusColors.pending;
                    
                    return (
                      <motion.div
                        key={batch.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${colors.badge} flex items-center justify-center`}>
                              <span className={`text-sm font-bold ${colors.text}`}>#{batch.id}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Batch #{batch.id}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(batch.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors.badge} ${colors.text}`}>
                            {batch.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {batch.evaluated_questions} / {batch.total_questions} evaluated
                            </span>
                            <span className="font-semibold text-slate-900">{batch.progress_percentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${batch.progress_percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                              className={`h-full ${colors.bg} rounded-full`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </ModernChartContainer>
    </div>
  );
}
