import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../hooks/useApi';
import { 
  CheckCircle, 
  Clock, 
  Award, 
  BarChart3, 
  Eye,
  AlertTriangle,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  User,
  BookOpen,
  ArrowLeft,
  Star,
  Percent,
  Timer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Share2,
  Zap
} from 'lucide-react';
import LaTeXRenderer from '../components/LaTeXRenderer';

interface ExamResult {
  attempt: {
    id: number;
    exam_title: string;
    student_name: string;
    status: string;
    score: number;
    percentage: number;
    time_spent: number;
    submitted_at: string;
    violations_count: number;
  };
  overall_score: number;
  total_questions: number;
  percentage: number;
  section_results: {
    [key: string]: {
      section_name: string;
      question_type: string;
      score: number | null;
      max_marks: number;
      status: 'available' | 'pending_review';
      feedback: string;
    };
  };
  detailed_answers: {
    [key: string]: {
      question_text: string;
      question_type: string;
      user_answer: string;
      correct_answer: string;
      is_correct: boolean;
      marks_obtained: number;
      max_marks: number;
      explanation: string;
    };
  };
  submitted_at: string;
  time_spent: number;
}

const ExamResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'sections'>('overview');

  useEffect(() => {
    // Load exam result for the attempt ID
    loadExamResult();
  }, [attemptId, navigate]);

  const loadExamResult = async () => {
    try {
      console.log('Loading exam results for attempt:', attemptId);
      const response = await api.get(`/exams/attempts/${attemptId}/results/`);
      const data = response.data;
      console.log('Exam results data:', data);
      setResult(data);
    } catch (error: any) {
      console.error('Error loading exam results:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.status === 404) {
        setError('Exam results not found');
      } else if (error.response?.status === 403) {
        setError('Access denied - you cannot view these results');
      } else {
        setError('Failed to load exam results');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 60) return { level: 'Satisfactory', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">Loading exam results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Error Loading Results</h2>
          <p className="text-sm text-slate-600 mb-4">{error || 'Results not available'}</p>
          <button 
            onClick={() => navigate('/student-dashboard')} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { attempt, section_results, detailed_answers } = result;
  const availableSections = Object.values(section_results).filter(section => section.status === 'available');
  const pendingSections = Object.values(section_results).filter(section => section.status === 'pending_review');
  const performance = getPerformanceLevel(attempt.percentage);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Exam Results</h1>
                <p className="text-sm text-slate-600">{attempt.exam_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Download Results">
                <Download className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Share Results">
                <Share2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Score Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
          <div className="p-4">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 ${getGradeColor(attempt.percentage)} mb-4`}>
                <Trophy className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{getGrade(attempt.percentage)}</h2>
              <p className={`text-sm font-medium ${performance.color}`}>{performance.level}</p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{attempt.score || 0}</div>
                <div className="text-xs text-slate-600">Score</div>
                <div className="text-xs text-slate-500">out of {result.total_questions || 0}</div>
              </div>
              
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{attempt.percentage || 0}%</div>
                <div className="text-xs text-slate-600">Percentage</div>
                <div className="text-xs text-slate-500">Overall</div>
              </div>
              
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{formatTime(attempt.time_spent)}</div>
                <div className="text-xs text-slate-600">Time Spent</div>
                <div className="text-xs text-slate-500">Duration</div>
              </div>
              
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{attempt.violations_count}</div>
                <div className="text-xs text-slate-600">Violations</div>
                <div className="text-xs text-slate-500">Detected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
          <div className="border-b border-slate-200">
            <div className="flex space-x-1 p-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'sections', label: 'Sections', icon: BookOpen },
                { id: 'detailed', label: 'Detailed', icon: Eye }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Exam Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Exam Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Student:</span>
                        <span className="font-medium">{attempt.student_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Submitted:</span>
                        <span className="font-medium">{new Date(attempt.submitted_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className={`font-medium ${
                          attempt.status === 'submitted' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {attempt.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-600" />
                      Performance Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Questions:</span>
                        <span className="font-medium">{result.total_questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Correct Answers:</span>
                        <span className="font-medium">{result.overall_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sections Graded:</span>
                        <span className="font-medium">{availableSections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Under Review:</span>
                        <span className="font-medium">{pendingSections.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Results Summary */}
                {availableSections.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Graded Sections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableSections.map((section, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm">{section.section_name}</h4>
                              <p className="text-xs text-slate-600">{section.question_type.toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-semibold text-green-600">
                                {section.score || 0}/{section.max_marks}
                              </p>
                              <p className="text-xs text-slate-500">{section.feedback}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Results */}
                {pendingSections.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      Under Review
                    </h3>
                    <div className="space-y-2">
                      {pendingSections.map((section, index) => (
                        <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900 text-sm">{section.section_name}</h4>
                              <p className="text-xs text-slate-600">{section.question_type.toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-semibold text-orange-600">Pending</p>
                              <p className="text-xs text-slate-500">{section.feedback}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{availableSections.length}</div>
                    <div className="text-sm text-slate-600">Sections Graded</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{pendingSections.length}</div>
                    <div className="text-sm text-slate-600">Under Review</div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Answers Tab */}
            {activeTab === 'detailed' && (
              <div className="space-y-4">
                {Object.keys(detailed_answers).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(detailed_answers).map(([questionId, answer]) => (
                      <div key={questionId} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-slate-900 text-sm">Question {questionId}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              answer.is_correct 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {answer.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                            <span className="text-xs text-slate-500">{answer.marks_obtained}/{answer.max_marks} marks</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1">Question:</p>
                            <div className="text-sm text-slate-900">
                              <LaTeXRenderer content={answer.question_text} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-slate-700 mb-1">Your Answer:</p>
                              <p className="text-sm text-slate-900 bg-slate-50 p-2 rounded">{answer.user_answer}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-700 mb-1">Correct Answer:</p>
                              <p className="text-sm text-slate-900 bg-slate-50 p-2 rounded">{answer.correct_answer}</p>
                            </div>
                          </div>
                          {answer.explanation && (
                            <div>
                              <p className="text-xs font-medium text-slate-700 mb-1">Explanation:</p>
                              <div className="text-sm text-slate-900 bg-blue-50 p-2 rounded">
                                <LaTeXRenderer content={answer.explanation} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">No detailed answers available yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Answers will be available after grading is complete.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/student-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/student-analytics')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;