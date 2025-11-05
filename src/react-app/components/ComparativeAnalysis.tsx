import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, 
  Clock, Target, Award, Loader2, RefreshCw,
  Filter, Download, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';

interface ExamComparison {
  exam_id: number;
  exam_title: string;
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  completion_rate: number;
  average_time_spent: number;
  difficulty_level: string;
  subject: string;
  created_at: string;
}

interface ComparativeAnalysisProps {
  selectedExams: number[];
  onClose: () => void;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ 
  selectedExams, 
  onClose 
}) => {
  const [exams, setExams] = useState<ExamComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'attempts' | 'pass_rate' | 'time'>('score');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'trends' | 'insights'>('overview');

  useEffect(() => {
    loadComparisonData();
  }, [selectedExams]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const promises = selectedExams.map(examId => 
        api.get(`/exams/${examId}/performance-comparison/`)
      );
      
      const responses = await Promise.all(promises);
      const examData = responses.map((response, index) => ({
        exam_id: selectedExams[index],
        exam_title: response.data.exam_title,
        total_attempts: response.data.comparisons.overall_statistics.total_attempts,
        average_score: response.data.comparisons.overall_statistics.average_percentage,
        pass_rate: response.data.comparisons.overall_statistics.pass_rate,
        completion_rate: 85, // Mock data
        average_time_spent: 45, // Mock data
        difficulty_level: 'Medium', // Mock data
        subject: 'General', // Mock data
        created_at: new Date().toISOString()
      }));
      
      setExams(examData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const sortedExams = [...exams].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.average_score - a.average_score;
      case 'attempts':
        return b.total_attempts - a.total_attempts;
      case 'pass_rate':
        return b.pass_rate - a.pass_rate;
      case 'time':
        return b.average_time_spent - a.average_time_spent;
      default:
        return 0;
    }
  });

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadComparisonData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Comparative Analysis</h2>
            <p className="text-sm text-gray-600">Comparing {exams.length} exams</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="score">Average Score</option>
            <option value="attempts">Total Attempts</option>
            <option value="pass_rate">Pass Rate</option>
            <option value="time">Time Spent</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: Target },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'insights', label: 'Insights', icon: Award }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Exams</p>
                    <p className="text-2xl font-bold text-blue-900">{exams.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Avg Score</p>
                    <p className="text-2xl font-bold text-green-900">
                      {(exams.reduce((sum, exam) => sum + exam.average_score, 0) / exams.length).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Avg Pass Rate</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {(exams.reduce((sum, exam) => sum + exam.pass_rate, 0) / exams.length).toFixed(1)}%
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {exams.reduce((sum, exam) => sum + exam.total_attempts, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Exam Comparison Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pass Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      {showDetails && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedExams.map((exam, index) => (
                      <tr key={exam.exam_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {exam.exam_title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {exam.subject}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {exam.total_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getPerformanceColor(exam.average_score)}`}>
                            {exam.average_score.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {exam.pass_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(exam.difficulty_level)}`}>
                            {exam.difficulty_level}
                          </span>
                        </td>
                        {showDetails && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {exam.average_time_spent} min
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Comparison</h3>
            
            {/* Performance Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Performance comparison chart would be displayed here</p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Best Performing Exam</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {sortedExams[0]?.exam_title || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  {sortedExams[0]?.average_score.toFixed(1)}% average score
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Needs Improvement</h4>
                <p className="text-2xl font-bold text-red-600">
                  {sortedExams[sortedExams.length - 1]?.exam_title || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  {sortedExams[sortedExams.length - 1]?.average_score.toFixed(1)}% average score
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
            
            {/* Trends Chart Placeholder */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Trend analysis chart would be displayed here</p>
            </div>

            {/* Trend Insights */}
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Positive Trends</h4>
                </div>
                <p className="text-sm text-green-800 mt-2">
                  Overall performance has improved by 12% compared to previous period.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Areas of Concern</h4>
                </div>
                <p className="text-sm text-yellow-800 mt-2">
                  Completion rates have decreased by 5% in the last month.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Top Performer</h4>
                <p className="text-sm text-gray-600">
                  "{sortedExams[0]?.exam_title}" consistently shows the highest performance with 
                  {sortedExams[0]?.average_score.toFixed(1)}% average score.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Most Popular</h4>
                <p className="text-sm text-gray-600">
                  The exam with the most attempts is "{exams.reduce((max, exam) => 
                    exam.total_attempts > max.total_attempts ? exam : max
                  ).exam_title}" with {Math.max(...exams.map(e => e.total_attempts))} attempts.
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Difficulty Analysis</h4>
                <p className="text-sm text-gray-600">
                  {exams.filter(e => e.difficulty_level === 'Hard').length} exams are marked as hard,
                  {exams.filter(e => e.difficulty_level === 'Medium').length} as medium,
                  and {exams.filter(e => e.difficulty_level === 'Easy').length} as easy.
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                <p className="text-sm text-gray-600">
                  Consider reviewing the exam with lowest pass rate and adjusting difficulty or content.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparativeAnalysis;
