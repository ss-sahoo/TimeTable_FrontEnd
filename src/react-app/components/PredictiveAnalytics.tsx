import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, 
  Target, BarChart3, Users, Clock, CheckCircle, 
  XCircle, Loader2, RefreshCw, Eye, EyeOff 
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';

interface PredictiveAnalyticsProps {
  examId: number;
  examTitle: string;
}

interface PerformancePrediction {
  predicted_percentage: number;
  predicted_score: number;
  predicted_grade: string;
  confidence_interval: {
    lower_bound: number;
    upper_bound: number;
  };
  probability_of_passing: number;
  expected_rank: number;
}

interface StudentPrediction {
  student_id: number;
  student_name: string;
  student_email: string;
  risk_level: 'high' | 'medium' | 'low';
  risk_factors: string[];
  recommendations: string[];
  predicted_score: number;
}

interface PerformanceInsights {
  difficulty_analysis: {
    easy_questions: number;
    medium_questions: number;
    hard_questions: number;
    average_difficulty_score: number;
    difficulty_distribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  performance_distribution: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
    poor: number;
  };
  expected_statistics: {
    expected_average: number;
    expected_median: number;
    expected_standard_deviation: number;
    expected_pass_rate: number;
    expected_fail_rate: number;
  };
  at_risk_students: StudentPrediction[];
  historical_statistics: {
    total_attempts: number;
    average_score: number;
    average_percentage: number;
    highest_score: number;
    lowest_score: number;
    pass_rate: number;
  };
  recommendations: {
    exam_recommendations: string[];
    intervention_recommendations: string[];
  };
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ examId, examTitle }) => {
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'at-risk' | 'difficulty' | 'recommendations'>('overview');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [examId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/exams/${examId}/performance-insights/`);
      setInsights(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load predictive analytics');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading predictive analytics...</p>
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
          onClick={loadInsights}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No predictive analytics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI-Powered Analytics</h2>
            <p className="text-sm text-gray-600">{examTitle}</p>
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
            onClick={loadInsights}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'at-risk', label: 'At-Risk Students', icon: AlertTriangle },
          { id: 'difficulty', label: 'Difficulty Analysis', icon: Target },
          { id: 'recommendations', label: 'Recommendations', icon: CheckCircle }
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

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Expected Average</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {insights.expected_statistics.expected_average.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Expected Pass Rate</p>
                    <p className="text-2xl font-bold text-green-900">
                      {insights.expected_statistics.expected_pass_rate.toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">At-Risk Students</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {insights.at_risk_students.length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Performance Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expected Performance Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Excellent (90%+)', value: insights.performance_distribution.excellent, color: 'bg-green-500' },
                  { label: 'Good (80-89%)', value: insights.performance_distribution.good, color: 'bg-blue-500' },
                  { label: 'Average (60-79%)', value: insights.performance_distribution.average, color: 'bg-yellow-500' },
                  { label: 'Below Average (40-59%)', value: insights.performance_distribution.below_average, color: 'bg-orange-500' },
                  { label: 'Poor (<40%)', value: insights.performance_distribution.poor, color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-3">
                    <div className="w-24 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-900">{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical vs Expected */}
            {insights.historical_statistics.total_attempts > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical vs Expected Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Historical Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Score:</span>
                        <span className="font-medium">{insights.historical_statistics.average_percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pass Rate:</span>
                        <span className="font-medium">{insights.historical_statistics.pass_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Attempts:</span>
                        <span className="font-medium">{insights.historical_statistics.total_attempts}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Expected Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Average:</span>
                        <span className="font-medium">{insights.expected_statistics.expected_average.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Pass Rate:</span>
                        <span className="font-medium">{insights.expected_statistics.expected_pass_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Standard Deviation:</span>
                        <span className="font-medium">{insights.expected_statistics.expected_standard_deviation.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'at-risk' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">At-Risk Students</h3>
              <span className="text-sm text-gray-600">
                {insights.at_risk_students.length} students identified
              </span>
            </div>

            {insights.at_risk_students.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No at-risk students identified</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.at_risk_students.map((student) => (
                  <div key={student.student_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{student.student_name}</h4>
                        <p className="text-sm text-gray-600">{student.student_email}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(student.risk_level)}`}>
                        {student.risk_level.toUpperCase()} RISK
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Factors</h5>
                        <ul className="space-y-1">
                          {student.risk_factors.map((factor, index) => (
                            <li key={index} className="text-sm text-red-600 flex items-center space-x-2">
                              <XCircle className="w-3 h-3" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h5>
                        <ul className="space-y-1">
                          {student.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-blue-600 flex items-center space-x-2">
                              <CheckCircle className="w-3 h-3" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Predicted Score:</span>
                        <span className="font-medium text-gray-900">{student.predicted_score.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'difficulty' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Difficulty Analysis</h3>

            {/* Difficulty Distribution */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Question Difficulty Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Easy Questions</p>
                      <p className="text-2xl font-bold text-green-900">
                        {insights.difficulty_analysis.easy_questions}
                      </p>
                    </div>
                    <div className="text-sm text-green-600">
                      {insights.difficulty_analysis.difficulty_distribution.easy.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Medium Questions</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {insights.difficulty_analysis.medium_questions}
                      </p>
                    </div>
                    <div className="text-sm text-yellow-600">
                      {insights.difficulty_analysis.difficulty_distribution.medium.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Hard Questions</p>
                      <p className="text-2xl font-bold text-red-900">
                        {insights.difficulty_analysis.hard_questions}
                      </p>
                    </div>
                    <div className="text-sm text-red-600">
                      {insights.difficulty_analysis.difficulty_distribution.hard.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Overall Difficulty Score</h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${(insights.difficulty_analysis.average_difficulty_score / 3) * 100}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {insights.difficulty_analysis.average_difficulty_score.toFixed(2)}/3.0
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {insights.difficulty_analysis.average_difficulty_score < 1.5 ? 'Easy' :
                 insights.difficulty_analysis.average_difficulty_score < 2.5 ? 'Medium' : 'Hard'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>

            {/* Exam Recommendations */}
            {insights.recommendations.exam_recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Exam-Level Recommendations</h4>
                <div className="space-y-2">
                  {insights.recommendations.exam_recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intervention Recommendations */}
            {insights.recommendations.intervention_recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Intervention Recommendations</h4>
                <div className="space-y-2">
                  {insights.recommendations.intervention_recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.recommendations.exam_recommendations.length === 0 && 
             insights.recommendations.intervention_recommendations.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No specific recommendations at this time</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
