import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router';
import {
  ArrowLeft,
  Eye,
  Edit,
  Plus,
  Clock,
  BookOpen,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Calculator,
  FileText,
  Type,
  Hash,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  User,
  Settings,
  Upload
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import QuestionBulkImport from '../components/extraction/QuestionBulkImport';

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  question_type: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
  negative_marking: number;
  min_questions_to_attempt: number;
  is_compulsory: boolean;
  order: number;
}

interface ExamPattern {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  total_marks: number;
  total_duration: number;
  sections: PatternSection[];
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  is_active: boolean;
}

export default function PatternView() {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : isCenterAdminPath ? '/center-admin' : '';
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'questions'>('overview');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { data: pattern, loading, error, refetch } = useApi<ExamPattern>(`/patterns/patterns/${patternId}/`);

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'single_mcq':
      case 'mcq':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'multiple_mcq':
        return <CheckCircle className="w-4 h-4 text-indigo-600" />;
      case 'numerical':
        return <Calculator className="w-4 h-4 text-green-600" />;
      case 'subjective':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'true_false':
        return <Type className="w-4 h-4 text-orange-600" />;
      case 'fill_blank':
        return <Hash className="w-4 h-4 text-red-600" />;
      default:
        return <Type className="w-4 h-4 text-slate-600" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'single_mcq':
      case 'mcq':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'multiple_mcq':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'numerical':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'subjective':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'true_false':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'fill_blank':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single_mcq':
        return 'SINGLE MCQ';
      case 'multiple_mcq':
        return 'MULTIPLE MCQ';
      case 'numerical':
        return 'NUMERICAL';
      case 'subjective':
        return 'SUBJECTIVE';
      case 'true_false':
        return 'TRUE/FALSE';
      case 'fill_blank':
        return 'FILL BLANK';
      default:
        return type.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pattern details...</p>
        </div>
      </div>
    );
  }

  if (error || !pattern) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Pattern Not Found</h2>
          <p className="text-slate-600 mb-4">The pattern you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link
            to={`${basePath}/patterns`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patterns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Modern Header with Gradient */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <Link
                to={`${basePath}/patterns`}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-slate-900">{pattern.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pattern.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-200 text-slate-600'
                    }`}>
                    {pattern.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {pattern.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-slate-600 mt-1 text-xs">{pattern.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`${basePath}/patterns/${pattern.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 lg:px-8 py-6">
        {/* Compact Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Questions</p>
                <p className="text-xl font-bold text-slate-900">{pattern.total_questions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-green-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total Marks</p>
                <p className="text-xl font-bold text-slate-900">{pattern.total_marks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Duration</p>
                <p className="text-xl font-bold text-slate-900">{pattern.total_duration} <span className="text-sm text-slate-600">min</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-orange-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Sections</p>
                <p className="text-xl font-bold text-slate-900">{pattern.sections?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex px-4">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'sections', label: 'Sections', icon: BookOpen },
                { id: 'questions', label: 'Questions', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-5">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Pattern Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Pattern Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Created:</span>
                        <span className="text-sm font-medium text-slate-900">
                          {new Date(pattern.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Created by:</span>
                        <span className="text-sm font-medium text-slate-900">
                          {pattern.created_by.first_name} {pattern.created_by.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${pattern.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {pattern.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {pattern.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900">{pattern.total_questions}</p>
                        <p className="text-xs text-slate-600">Questions</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900">{pattern.total_marks}</p>
                        <p className="text-xs text-slate-600">Total Marks</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900">{pattern.total_duration}</p>
                        <p className="text-xs text-slate-600">Minutes</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-900">{pattern.sections?.length || 0}</p>
                        <p className="text-xs text-slate-600">Sections</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Pattern Sections</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{pattern.sections?.length || 0} sections</p>
                  </div>
                </div>

                {pattern.sections && pattern.sections.length > 0 ? (
                  <div className="space-y-3">
                    {pattern.sections.map((section, index) => (
                      <div key={section.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">{section.name}</h4>
                              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                <BookOpen className="w-3 h-3" />
                                {section.subject}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getQuestionTypeColor(section.question_type)}`}>
                            {getQuestionTypeIcon(section.question_type)}
                            {getQuestionTypeLabel(section.question_type)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-0.5">Questions</p>
                            <p className="text-sm font-bold text-blue-600">Q{section.start_question}-{section.end_question}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{section.end_question - section.start_question + 1} total</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-0.5">Per Question</p>
                            <p className="text-sm font-bold text-green-600">{section.marks_per_question}m</p>
                            <p className="text-xs text-slate-500 mt-0.5">Each</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-0.5">Section Total</p>
                            <p className="text-sm font-bold text-purple-600">{(section.end_question - section.start_question + 1) * section.marks_per_question}m</p>
                            <p className="text-xs text-slate-500 mt-0.5">Max</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-0.5">Min. Attempts</p>
                            <p className="text-sm font-bold text-orange-600">{section.min_questions_to_attempt}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Required</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span>Negative: <span className="font-semibold text-slate-900">{section.negative_marking}</span></span>
                            <span>{section.is_compulsory ? '✓ Compulsory' : '○ Optional'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">No Sections Found</h3>
                    <p className="text-xs text-slate-600 mb-4">Add sections to structure your exam.</p>
                    <Link
                      to={`${basePath}/patterns/${pattern.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Sections
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Questions Overview</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowBulkImport(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Import (AI)
                    </button>
                    <Link
                      to={`${basePath}/patterns/${pattern.id}/questions/create`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Questions
                    </Link>
                  </div>
                </div>

                {pattern.sections && pattern.sections.length > 0 ? (
                  <div className="space-y-6">
                    {pattern.sections.map((section, sectionIndex) => (
                      <div key={section.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">{sectionIndex + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{section.name}</h4>
                            <p className="text-sm text-slate-600">{section.subject}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getQuestionTypeColor(section.question_type)}`}>
                            {getQuestionTypeIcon(section.question_type)}
                            {getQuestionTypeLabel(section.question_type)}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                          {Array.from({ length: section.end_question - section.start_question + 1 }, (_, i) => {
                            const questionNumber = section.start_question + i;
                            return (
                              <Link
                                key={questionNumber}
                                to={`${basePath}/pattern/${pattern.id}/question/${questionNumber}`}
                                className="w-10 h-10 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg flex items-center justify-center text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
                              >
                                {questionNumber}
                              </Link>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              Questions {section.start_question}-{section.end_question} • {section.marks_per_question}m each
                            </span>
                            <Link
                              to={`${basePath}/pattern/${pattern.id}/question/${section.start_question}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Start from Q{section.start_question} →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Questions Available</h3>
                    <p className="text-slate-600 mb-4">This pattern doesn't have any questions yet.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setShowBulkImport(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Bulk Import (AI)
                      </button>
                      <Link
                        to={`${basePath}/patterns/${pattern.id}/questions/create`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Questions
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && pattern && (
        <QuestionBulkImport
          examId={pattern.id}
          patternId={pattern.id}
          onClose={() => setShowBulkImport(false)}
          onImportComplete={() => {
            setShowBulkImport(false);
            refetch(); // Refresh pattern data to show new questions
          }}
        />
      )}
    </div>
  );
}
