import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { ClipboardCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';
import AnalyticsCard from '@/react-app/components/analytics/AnalyticsCard';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Evaluation Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Grading progress and evaluation metrics
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <ChartContainer loading={loading} error={error} height={600}>
        {data && (
          <div className="space-y-6">
            {/* Evaluation Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsCard
                title="Total Questions"
                value={data.evaluation_statistics.total_questions}
                icon={ClipboardCheck}
              />
              <AnalyticsCard
                title="Evaluated"
                value={data.evaluation_statistics.evaluated_questions}
                icon={CheckCircle}
                subtitle={`${data.evaluation_statistics.completion_rate.toFixed(1)}% complete`}
              />
              <AnalyticsCard
                title="Pending"
                value={data.evaluation_statistics.pending_questions}
                icon={Clock}
                subtitle="Awaiting evaluation"
              />
              <AnalyticsCard
                title="Completion Rate"
                value={`${data.evaluation_statistics.completion_rate.toFixed(1)}%`}
                icon={ClipboardCheck}
              />
            </div>

            {/* Evaluation Breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Evaluation Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-900">Auto Evaluated</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {data.evaluation_statistics.auto_evaluated}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Manually Evaluated</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {data.evaluation_statistics.manually_evaluated}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">Pending</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {data.evaluation_statistics.pending_evaluation}
                  </p>
                </div>
              </div>
            </div>

            {/* Question-wise Evaluation Status */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Question Evaluation Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Question</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Total Attempts</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Evaluated</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Pending</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.question_evaluation_status.map((qes) => (
                      <tr key={qes.question_number} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">Q{qes.question_number}</td>
                        <td className="px-4 py-3 text-slate-700">{qes.total_attempts}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">{qes.evaluated}</td>
                        <td className="px-4 py-3 text-amber-600 font-medium">{qes.pending}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{qes.completion_rate.toFixed(1)}%</span>
                            <div className="flex-1 w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: `${qes.completion_rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Batch Progress */}
            {data.batch_progress.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Batch Progress</h3>
                <div className="space-y-3">
                  {data.batch_progress.map((batch) => (
                    <div key={batch.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Batch #{batch.id}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(batch.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            batch.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : batch.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>
                            {batch.evaluated_questions} / {batch.total_questions} evaluated
                          </span>
                          <span>{batch.progress_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${batch.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

