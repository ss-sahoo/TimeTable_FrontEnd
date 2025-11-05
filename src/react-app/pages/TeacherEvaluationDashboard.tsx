import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Brain,
  User,
  FileText,
  BarChart3,
  Settings,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Edit,
  Save,
  X,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  Zap,
  Users,
  Calendar,
  Timer,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Download,
  Upload,
  MoreVertical
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface QuestionEvaluation {
  id: number;
  attempt: number;
  question: {
    id: number;
    question_text: string;
    question_type: string;
    marks: number;
    difficulty: string;
  };
  question_number: number;
  student_answer: string;
  is_answered: boolean;
  evaluation_type: 'auto' | 'manual' | 'ai' | 'mixed';
  evaluation_status: 'pending' | 'auto_evaluated' | 'manually_evaluated' | 'ai_evaluated' | 'reviewed';
  marks_obtained: number;
  max_marks: number;
  is_correct: boolean;
  evaluated_by_name?: string;
  evaluated_at?: string;
  evaluation_notes: string;
  ai_confidence_score?: number;
  ai_feedback: string;
  manual_feedback: string;
  requires_review: boolean;
}

interface PendingEvaluationsResponse {
  pending_count: number;
  evaluations: QuestionEvaluation[];
}

interface EvaluationProgress {
  total_questions: number;
  auto_evaluated: number;
  manually_evaluated: number;
  ai_evaluated: number;
  pending_evaluation: number;
  completion_percentage: number;
  is_fully_evaluated: boolean;
}

interface EvaluationSettings {
  enable_auto_evaluation: boolean;
  enable_manual_evaluation: boolean;
  enable_ai_evaluation: boolean;
  ai_model_preference: string;
  ai_confidence_threshold: number;
  ai_fallback_to_manual: boolean;
  notify_evaluators: boolean;
  notify_students_on_completion: boolean;
}

export default function TeacherEvaluationDashboard() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'completed' | 'settings'>('overview');
  const [selectedEvaluation, setSelectedEvaluation] = useState<QuestionEvaluation | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    marks_obtained: 0,
    is_correct: false,
    feedback: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API calls
  const { data: progress, loading: progressLoading, refetch: refetchProgress } = useApi<EvaluationProgress>(
    `/evaluation/exams/${examId}/progress/`
  );

  const { data: pendingEvaluations, loading: pendingLoading, refetch: refetchPending } = useApi<PendingEvaluationsResponse>(
    `/evaluation/exams/${examId}/pending/`
  );

  const { data: settings, loading: settingsLoading, refetch: refetchSettings } = useApi<EvaluationSettings>(
    `/evaluation/exams/${examId}/settings/`
  );

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProgress(),
        refetchPending(),
        refetchSettings()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProgress, refetchPending, refetchSettings]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleManualEvaluation = async (evaluation: QuestionEvaluation) => {
    setSelectedEvaluation(evaluation);
    setEvaluationForm({
      marks_obtained: evaluation.marks_obtained,
      is_correct: evaluation.is_correct,
      feedback: evaluation.manual_feedback
    });
    setShowEvaluationModal(true);
  };

  const handleAIEvaluation = async (evaluation: QuestionEvaluation) => {
    try {
      const response = await fetch(`/api/evaluation/questions/${evaluation.id}/ai/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        await refreshData();
      }
    } catch (error) {
      console.error('AI evaluation failed:', error);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedEvaluation) return;

    try {
      const response = await fetch(`/api/evaluation/questions/${selectedEvaluation.id}/manual/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(evaluationForm)
      });

      if (response.ok) {
        setShowEvaluationModal(false);
        setSelectedEvaluation(null);
        await refreshData();
      }
    } catch (error) {
      console.error('Evaluation save failed:', error);
    }
  };

  const handleBatchAIEvaluation = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/evaluation/exams/${examId}/batch-ai/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        await refreshData();
      }
    } catch (error) {
      console.error('Batch AI evaluation failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'auto_evaluated': return 'bg-green-100 text-green-800';
      case 'manually_evaluated': return 'bg-blue-100 text-blue-800';
      case 'ai_evaluated': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'mixed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvaluations = (pendingEvaluations?.evaluations || []).filter(evaluation => {
    const matchesSearch = evaluation.question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.student_answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evaluation.evaluation_status === statusFilter;
    const matchesType = typeFilter === 'all' || evaluation.evaluation_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (progressLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading evaluation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Evaluation Dashboard</h1>
                <p className="text-sm text-slate-600">Manage exam evaluations and grading</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'pending', label: 'Pending', icon: Clock, count: progress?.pending_evaluation },
              { id: 'completed', label: 'Completed', icon: CheckCircle },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count !== undefined && (
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-2 sm:px-4 lg:px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Auto Evaluated</p>
                    <p className="text-2xl font-bold text-slate-900">{progress?.auto_evaluated || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Manually Evaluated</p>
                    <p className="text-2xl font-bold text-slate-900">{progress?.manually_evaluated || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">AI Evaluated</p>
                    <p className="text-2xl font-bold text-slate-900">{progress?.ai_evaluated || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-slate-900">{progress?.pending_evaluation || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Evaluation Progress</h3>
                <span className="text-2xl font-bold text-blue-600">
                  {progress?.completion_percentage?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress?.completion_percentage || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-600 mt-2">
                <span>0</span>
                <span>{progress?.total_questions || 0} questions</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleBatchAIEvaluation}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  Batch AI Evaluation
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Review Pending
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Evaluation Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search questions or answers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="auto_evaluated">Auto Evaluated</option>
                  <option value="manually_evaluated">Manually Evaluated</option>
                  <option value="ai_evaluated">AI Evaluated</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="auto">Auto</option>
                  <option value="manual">Manual</option>
                  <option value="ai">AI</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            {/* Evaluations List */}
            <div className="space-y-4">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-slate-900">
                          Q{evaluation.question_number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.evaluation_status)}`}>
                          {evaluation.evaluation_status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(evaluation.evaluation_type)}`}>
                          {evaluation.evaluation_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {evaluation.question.question_type} • {evaluation.question.difficulty} • {evaluation.max_marks} marks
                      </p>
                      <p className="text-slate-900 mb-3">{evaluation.question.question_text}</p>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-slate-700 mb-1">Student Answer:</p>
                        <p className="text-slate-900">{evaluation.student_answer || 'No answer provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-lg font-bold text-slate-900">
                        {evaluation.marks_obtained}/{evaluation.max_marks}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {evaluation.evaluation_type === 'manual' && (
                        <button
                          onClick={() => handleManualEvaluation(evaluation)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Evaluate
                        </button>
                      )}
                      {evaluation.evaluation_type === 'ai' && (
                        <button
                          onClick={() => handleAIEvaluation(evaluation)}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Brain className="w-4 h-4" />
                          AI Evaluate
                        </button>
                      )}
                      <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                    {evaluation.ai_confidence_score && (
                      <div className="text-sm text-slate-600">
                        AI Confidence: {(evaluation.ai_confidence_score * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredEvaluations.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Evaluations</h3>
                  <p className="text-slate-600">All questions have been evaluated!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Evaluation Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Auto Evaluation</p>
                    <p className="text-sm text-slate-600">Enable automatic evaluation for objective questions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.enable_auto_evaluation || false}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Manual Evaluation</p>
                    <p className="text-sm text-slate-600">Enable manual evaluation for subjective questions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.enable_manual_evaluation || false}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">AI Evaluation</p>
                    <p className="text-sm text-slate-600">Enable AI-powered evaluation for subjective questions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.enable_ai_evaluation || false}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings?.enable_ai_evaluation && (
                  <div className="ml-6 space-y-4 border-l-2 border-slate-200 pl-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">AI Model</label>
                      <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude-3">Claude 3</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confidence Threshold: {settings?.ai_confidence_threshold || 0.7}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings?.ai_confidence_threshold || 0.7}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedEvaluation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Manual Evaluation</h3>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Question {selectedEvaluation.question_number}</h4>
                <p className="text-slate-700 mb-4">{selectedEvaluation.question.question_text}</p>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-700 mb-1">Student Answer:</p>
                  <p className="text-slate-900">{selectedEvaluation.student_answer}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marks Obtained</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedEvaluation.max_marks}
                    step="0.5"
                    value={evaluationForm.marks_obtained}
                    onChange={(e) => setEvaluationForm(prev => ({
                      ...prev,
                      marks_obtained: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Max: {selectedEvaluation.max_marks}</p>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={evaluationForm.is_correct}
                      onChange={(e) => setEvaluationForm(prev => ({
                        ...prev,
                        is_correct: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Mark as Correct</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Feedback</label>
                <textarea
                  value={evaluationForm.feedback}
                  onChange={(e) => setEvaluationForm(prev => ({
                    ...prev,
                    feedback: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide feedback to the student..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvaluation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
