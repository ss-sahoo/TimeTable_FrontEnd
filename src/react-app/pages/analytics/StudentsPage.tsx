import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mail, Clock, Award, AlertTriangle, ChevronRight,
  User, TrendingUp, Users, Filter, SortAsc
} from 'lucide-react';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';
import GlassCard from '@/react-app/components/analytics/GlassCard';
import ModernCard from '@/react-app/components/analytics/ModernCard';
import ModernChartContainer from '@/react-app/components/analytics/ModernChartContainer';
import PageHeader from '@/react-app/components/analytics/PageHeader';
import ModernExportButton from '@/react-app/components/analytics/ModernExportButton';
import ProgressRing from '@/react-app/components/analytics/ProgressRing';

interface StudentResult {
  s_no: number;
  task_no: number;
  student_id: number;
  student_name: string;
  student_email: string;
  phone: string;
  score: number;
  percentage: number;
  time_spent: number;
  submitted_at: string;
  status: string;
  violations_count: number;
  rank: number;
}

interface ResultsData {
  exam: {
    id: number;
    title: string;
    total_questions: number;
    total_marks: number;
  };
  results: StudentResult[];
  subject_totals: Record<string, { total_marks: number; questions: number }>;
  total_count: number;
}

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  submitted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  auto_submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  disqualified: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function StudentsPage() {
  const { examId, examData } = useOutletContext<{
    examId: string;
    queryParams: string;
    examData: any;
  }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'submitted_at' | 'score' | 'percentage' | 'time_spent'>('score');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    loadStudentResults();
  }, [examId, searchTerm, sortBy, sortOrder, statusFilter]);

  const loadStudentResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter,
      });
      const response = await api.get(`/exams/exams/${examId}/results-dashboard/?${params.toString()}`);
      setData(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load student results'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'image') => {
    console.log('Export as', format);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getPerformanceColor = (percentage: number): 'emerald' | 'blue' | 'amber' | 'rose' => {
    if (percentage >= 80) return 'emerald';
    if (percentage >= 60) return 'blue';
    if (percentage >= 40) return 'amber';
    return 'rose';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', text: '🥇' };
    if (rank === 2) return { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: '🥈' };
    if (rank === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-amber-700', text: '🥉' };
    return { bg: 'bg-slate-100', text: rank.toString() };
  };

  const viewStudentDetails = (studentId: number) => {
    navigate(`/exams/${examId}/results-analytics/student/${studentId}`);
  };

  const totalMarks = data?.exam?.total_marks || examData?.total_marks || 100;
  const avgScore = data?.results?.length 
    ? data.results.reduce((sum, r) => sum + r.score, 0) / data.results.length 
    : 0;
  const avgPercentage = data?.results?.length 
    ? data.results.reduce((sum, r) => sum + r.percentage, 0) / data.results.length 
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Student Results"
        subtitle="View and analyze individual student performance"
        icon={Users}
        actions={<ModernExportButton onExport={handleExport} />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernCard
          title="Total Students"
          value={data?.total_count || 0}
          icon={Users}
          gradient="blue"
        />
        <ModernCard
          title="Average Score"
          value={`${avgScore.toFixed(1)}/${totalMarks}`}
          icon={Award}
          gradient="emerald"
        />
        <ModernCard
          title="Average %"
          value={`${avgPercentage.toFixed(1)}%`}
          icon={TrendingUp}
          gradient="purple"
        />
        <ModernCard
          title="With Violations"
          value={data?.results?.filter(r => r.violations_count > 0).length || 0}
          icon={AlertTriangle}
          gradient="amber"
        />
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Score</option>
                <option value="percentage">Percentage</option>
                <option value="time_spent">Time</option>
                <option value="submitted_at">Date</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="auto_submitted">Auto Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

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
        </div>
      </GlassCard>

      {/* Results */}
      <ModernChartContainer loading={loading} error={error} height="auto" onRetry={loadStudentResults}>
        {data && (
          <AnimatePresence mode="wait">
            {data.results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No student results found</p>
              </motion.div>
            ) : viewMode === 'cards' ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {data.results.map((result, index) => {
                  const perfColor = getPerformanceColor(result.percentage);
                  const rankBadge = getRankBadge(result.rank);
                  const statusStyle = statusConfig[result.status] || statusConfig.submitted;
                  
                  return (
                    <motion.div
                      key={result.student_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      onClick={() => viewStudentDetails(result.student_id)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${rankBadge.bg} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                            {result.rank <= 3 ? rankBadge.text : result.rank}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{result.student_name || 'Unknown'}</h3>
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {result.student_email}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <ProgressRing
                          value={result.percentage}
                          size={70}
                          strokeWidth={6}
                          color={perfColor}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Score</span>
                            <span className="text-sm font-bold text-slate-900">{result.score.toFixed(1)}/{totalMarks}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Time</span>
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(result.time_spent)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                            {result.status.replace('_', ' ')}
                          </span>
                          {result.violations_count > 0 && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {result.violations_count} ⚠️
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {result.submitted_at ? formatDate(result.submitted_at) : '-'}
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
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rank</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Percentage</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.results.map((result, index) => {
                      const rankBadge = getRankBadge(result.rank);
                      const statusStyle = statusConfig[result.status] || statusConfig.submitted;
                      
                      return (
                        <motion.tr
                          key={result.student_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className={`w-8 h-8 rounded-lg ${rankBadge.bg} flex items-center justify-center text-white font-bold text-xs`}>
                              {result.rank <= 3 ? rankBadge.text : result.rank}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{result.student_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{result.student_email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-bold text-slate-900">{result.score.toFixed(1)}</span>
                            <span className="text-slate-400">/{totalMarks}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    result.percentage >= 80 ? 'bg-emerald-500' :
                                    result.percentage >= 60 ? 'bg-blue-500' :
                                    result.percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${result.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{result.percentage.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-slate-600">
                            {formatTime(result.time_spent)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                              {result.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => viewStudentDetails(result.student_id)}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              View Details
                            </motion.button>
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
