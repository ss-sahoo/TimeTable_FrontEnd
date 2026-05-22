import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { FileQuestion, Clock, CheckCircle, XCircle, MinusCircle, Search, Filter } from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import ProgressRing from '@/react-app/components/analytics/ProgressRing';

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

const difficultyConfig = {
  easy: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600' },
  hard: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', gradient: 'from-rose-500 to-rose-600' },
};

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

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

  const filteredAndSortedData = data?.question_analytics
    ? [...data.question_analytics]
        .filter(q => {
          const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `Q${q.question_number}`.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesDifficulty = difficultyFilter === 'all' || q.difficulty_level === difficultyFilter;
          return matchesSearch && matchesDifficulty;
        })
        .sort((a, b) => {
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
        })
    : [];

  const getDifficultyConfig = (level: string) => {
    return difficultyConfig[level as keyof typeof difficultyConfig] || difficultyConfig.medium;
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 70) return 'emerald';
    if (rate >= 40) return 'amber';
    return 'rose';
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Question Analytics"
        subtitle="Detailed question-wise performance analysis"
        icon={FileQuestion}
        actions={<ModernExportButton onExport={handleExport} />}
      />

      {/* Filters & Controls */}
      <GlassCard padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="question_number-asc">Q# (Ascending)</option>
            <option value="question_number-desc">Q# (Descending)</option>
            <option value="success_rate-desc">Success Rate (High to Low)</option>
            <option value="success_rate-asc">Success Rate (Low to High)</option>
            <option value="average_time_spent-desc">Time (High to Low)</option>
            <option value="average_time_spent-asc">Time (Low to High)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </GlassCard>

      <ModernChartContainer loading={loading} error={error} height="auto" onRetry={loadQuestionAnalytics}>
        {data && (
          <AnimatePresence mode="wait">
            {filteredAndSortedData.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No questions match your filters</p>
              </motion.div>
            ) : viewMode === 'cards' ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredAndSortedData.map((qa, index) => {
                  const config = getDifficultyConfig(qa.difficulty_level);
                  const successColor = getSuccessColor(qa.success_rate);
                  return (
                    <motion.div
                      key={qa.question_number}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                            {qa.question_number}
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                              {qa.difficulty_level}
                            </span>
                          </div>
                        </div>
                        <ProgressRing
                          value={qa.success_rate}
                          size={56}
                          strokeWidth={5}
                          color={successColor as any}
                        />
                      </div>

                      <p className="text-sm text-slate-700 line-clamp-2 mb-4 min-h-[40px]">
                        {qa.question_text}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Correct</p>
                          <p className="text-sm font-bold text-emerald-600">{qa.correct_attempts}</p>
                        </div>
                        <div className="text-center p-2 bg-rose-50 rounded-lg">
                          <XCircle className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Wrong</p>
                          <p className="text-sm font-bold text-rose-600">{qa.wrong_attempts}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <MinusCircle className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Skipped</p>
                          <p className="text-sm font-bold text-slate-600">{qa.unattempted}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(qa.average_time_spent / 60)}m {qa.average_time_spent % 60}s avg
                        </span>
                        <span>
                          {qa.average_score.toFixed(1)} / {qa.max_marks} marks
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto"
              >
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Question</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Attempted</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Correct</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Wrong</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Success Rate</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Score</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Time</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedData.map((qa, index) => {
                      const config = getDifficultyConfig(qa.difficulty_level);
                      return (
                        <motion.tr
                          key={qa.question_number}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold text-xs`}>
                                {qa.question_number}
                              </span>
                              <span className="text-sm text-slate-700 line-clamp-1 max-w-xs">{qa.question_text}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">{qa.total_attempts}</td>
                          <td className="px-4 py-4 text-center text-sm font-medium text-emerald-600">{qa.correct_attempts}</td>
                          <td className="px-4 py-4 text-center text-sm font-medium text-rose-600">{qa.wrong_attempts}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    qa.success_rate >= 70 ? 'bg-emerald-500' :
                                    qa.success_rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${qa.success_rate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{qa.success_rate.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">
                            {qa.average_score.toFixed(1)}/{qa.max_marks}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">
                            {Math.floor(qa.average_time_spent / 60)}m {qa.average_time_spent % 60}s
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                              {qa.difficulty_level}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </ModernChartContainer>
    </div>
  );
}
