import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import ChartContainer from '@/react-app/components/analytics/ChartContainer';
import ExportButton from '@/react-app/components/analytics/ExportButton';

interface QuestionAnalyticsData {
  exam: {
    id: number;
    title: string;
    total_questions: number;
  };
  question_analytics: Array<{
    question_number: number;
    question_text: string;
    total_attempts: number;
    correct_attempts: number;
    wrong_attempts: number;
    unattempted: number;
    success_rate: number;
    average_score: number;
    max_marks: number;
    average_time_spent: number;
    difficulty_level: string;
  }>;
  filters_applied: any;
}

export default function QuestionsPage() {
  const { examId, queryParams } = useOutletContext<{
    examId: string;
    queryParams: string;
  }>();
  const [data, setData] = useState<QuestionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'question_number' | 'success_rate' | 'average_time_spent'>('question_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadQuestionAnalytics();
  }, [examId, queryParams]);

  const loadQuestionAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/exams/${examId}/analytics/questions/?${queryParams}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load question analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedData = data?.question_analytics ? [...data.question_analytics].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'success_rate':
        aVal = a.success_rate;
        bVal = b.success_rate;
        break;
      case 'average_time_spent':
        aVal = a.average_time_spent;
        bVal = b.average_time_spent;
        break;
      default:
        aVal = a.question_number;
        bVal = b.question_number;
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  }) : [];

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'hard':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Question Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Detailed question-wise performance analysis
          </p>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <ChartContainer loading={loading} error={error} height={600}>
        {data && (
          <div className="space-y-4">
            {data.question_analytics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No question analytics available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                        onClick={() => handleSort('question_number')}
                      >
                        Question
                        {sortBy === 'question_number' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Attempted</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Correct</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Wrong</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Unattempted</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                        onClick={() => handleSort('success_rate')}
                      >
                        Success Rate
                        {sortBy === 'success_rate' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Avg Score</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                        onClick={() => handleSort('average_time_spent')}
                      >
                        Avg Time
                        {sortBy === 'average_time_spent' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedData.map((qa) => (
                      <tr key={qa.question_number} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">Q{qa.question_number}</div>
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                            {qa.question_text}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{qa.total_attempts}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">{qa.correct_attempts}</td>
                        <td className="px-4 py-3 text-rose-600 font-medium">{qa.wrong_attempts}</td>
                        <td className="px-4 py-3 text-slate-500">{qa.unattempted}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{qa.success_rate.toFixed(1)}%</span>
                            <div className="flex-1 w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  qa.success_rate >= 70
                                    ? 'bg-emerald-500'
                                    : qa.success_rate >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${qa.success_rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {qa.average_score.toFixed(2)} / {qa.max_marks}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {Math.floor(qa.average_time_spent / 60)}m {qa.average_time_spent % 60}s
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                              qa.difficulty_level
                            )}`}
                          >
                            {qa.difficulty_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ChartContainer>
    </div>
  );
}

