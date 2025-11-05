import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  Eye,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  Mail,
  Share2,
  MoreVertical,
  BarChart3,
  FileText,
  Award,
  Hash,
  Zap,
  Building2,
  Globe,
  UserCheck,
  Shield,
  Info,
  ExternalLink,
  Archive,
  Plus,
  Target,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

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
}

interface Exam {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'active' | 'completed' | 'archived';
  start_date: string;
  end_date: string;
  duration_minutes: number;
  max_attempts: number;
  passing_marks: number;
  total_questions: number;
  total_marks: number;
  created_at: string;
  updated_at: string;
  pattern: {
    id: number;
    name: string;
    description: string;
    total_questions: number;
    total_marks: number;
    sections: PatternSection[];
  };
  is_published: boolean;
  allow_negative_marking: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_results_immediately: boolean;
  instructions: string;
}

interface SectionQuestionStats {
  section_id: number;
  total_needed: number;
  total_added: number;
  remaining: number;
  progress_percentage: number;
}

export default function ExamView() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionQuestionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await api.get<Exam>(`/exams/exams/${examId}/`);
      setExam(response.data);
      
      // Fetch question stats for each section
      if (response.data.pattern?.sections) {
        await fetchSectionStats(response.data.pattern.sections);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exam details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionStats = async (sections: PatternSection[]) => {
    try {
      const stats: SectionQuestionStats[] = [];
      
      for (const section of sections) {
        const totalNeeded = section.end_question - section.start_question + 1;
        
        // Fetch questions for this section
        const response = await api.get(`/questions/questions/?pattern_section=${section.id}`);
        const totalAdded = response.data?.results?.length || response.data?.length || 0;
        
        stats.push({
          section_id: section.id,
          total_needed: totalNeeded,
          total_added: totalAdded,
          remaining: totalNeeded - totalAdded,
          progress_percentage: (totalAdded / totalNeeded) * 100,
        });
      }
      
      setSectionStats(stats);
    } catch (err) {
      console.error('Failed to fetch section stats:', err);
    }
  };

  const getSectionStats = (sectionId: number) => {
    return sectionStats.find(s => s.section_id === sectionId) || {
      section_id: sectionId,
      total_needed: 0,
      total_added: 0,
      remaining: 0,
      progress_percentage: 0,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'published': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <Award className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getQuestionTypeDisplayName = (type: string): string => {
    const typeMapping: Record<string, string> = {
      'single_mcq': 'Single MCQ',
      'multiple_mcq': 'Multiple MCQ',
      'numerical': 'Numerical',
      'subjective': 'Subjective',
      'true_false': 'True/False',
      'fill_blank': 'Fill Blanks',
      'mcq': 'MCQ',
    };
    return typeMapping[type] || type.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Exam Not Found</h3>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'The exam you are looking for does not exist.'}
          </p>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  const overallProgress = sectionStats.length > 0
    ? sectionStats.reduce((acc, stat) => acc + stat.progress_percentage, 0) / sectionStats.length
    : 0;

  const totalQuestionsAdded = sectionStats.reduce((acc, stat) => acc + stat.total_added, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/exams')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors mt-1"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{exam.title}</h1>
                <p className="text-sm text-slate-600">{exam.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(exam.status)}`}>
                {getStatusIcon(exam.status)}
                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
              </span>
              <Link
                to={`/exams/${exam.id}/results-analytics`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
              >
                <FileText className="w-4 h-4" />
                Results and Analytics
              </Link>
              <Link
                to={`/exams/${exam.id}/evaluation`}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="w-4 h-4" />
                Evaluation
              </Link>
              <button
                onClick={() => navigate(`/exams/${exam.id}/edit`)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Edit Exam"
              >
                <Edit className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Start Date</p>
                <p className="text-sm font-semibold text-slate-900">{new Date(exam.start_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Duration</p>
                <p className="text-sm font-semibold text-slate-900">{formatDuration(exam.duration_minutes)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Questions</p>
                <p className="text-sm font-semibold text-slate-900">{exam.total_questions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Total Marks</p>
                <p className="text-sm font-semibold text-slate-900">{exam.total_marks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Overview - Minimalist */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{exam.pattern.name}</h2>
                  <p className="text-xs text-slate-600">{totalQuestionsAdded} of {exam.total_questions} questions added • {overallProgress.toFixed(0)}% complete</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-3">
                  <p className="text-xl font-bold text-blue-600">{overallProgress.toFixed(0)}%</p>
                </div>
                <Link
                  to={`/patterns/${exam.pattern.id}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-xs font-medium"
                >
                  View Pattern
                </Link>
              </div>
            </div>
            <div className="mt-3 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Sections List - Compact */}
          <div className="p-4">
            <div className="space-y-3">
              {exam.pattern.sections.map((section, index) => {
                const stats = getSectionStats(section.id);
                const isComplete = stats.progress_percentage >= 100;
                const totalQuestions = section.end_question - section.start_question + 1;

                return (
                  <div
                    key={section.id}
                    className={`border rounded-lg transition-all ${
                      isComplete
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        {/* Section Info */}
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                            isComplete ? 'bg-green-600' : 'bg-blue-600'
                          }`}>
                            <Layers className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">{section.name}</h3>
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {getQuestionTypeDisplayName(section.question_type)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {section.subject} • Q{section.start_question}-{section.end_question} • +{section.marks_per_question}/-{section.negative_marking} marks
                            </p>
                          </div>
                        </div>

                        {/* Stats & Action */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-base font-bold text-slate-900">{stats.total_added}/{totalQuestions}</p>
                            <p className="text-xs text-slate-600">{stats.progress_percentage.toFixed(0)}%</p>
                          </div>
                          <Link
                            to={`/pattern/${exam.pattern.id}/question/${section.start_question}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                              isComplete
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {isComplete ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Add ({stats.remaining})
                              </>
                            )}
                          </Link>
                        </div>
                      </div>

                      {/* Minimal Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${
                            isComplete
                              ? 'bg-green-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(stats.progress_percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pattern Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Pattern Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Sections</span>
                <span className="text-sm font-bold text-slate-900">{exam.pattern.sections.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Questions</span>
                <span className="text-sm font-bold text-slate-900">{exam.total_questions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Marks</span>
                <span className="text-sm font-bold text-slate-900">{exam.total_marks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Duration</span>
                <span className="text-sm font-bold text-slate-900">{formatDuration(exam.duration_minutes)}</span>
              </div>
            </div>
          </div>

          {/* Question Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Question Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Questions Added</span>
                <span className="text-sm font-bold text-green-600">{totalQuestionsAdded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Questions Needed</span>
                <span className="text-sm font-bold text-slate-900">{exam.total_questions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Remaining</span>
                <span className="text-sm font-bold text-orange-600">{exam.total_questions - totalQuestionsAdded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completion</span>
                <span className="text-sm font-bold text-blue-600">{overallProgress.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Subjects</h3>
            </div>
            <div className="space-y-2">
              {[...new Set(exam.pattern.sections.map(s => s.subject))].map((subject, idx) => {
                const subjectSections = exam.pattern.sections.filter(s => s.subject === subject);
                const totalQs = subjectSections.reduce((acc, s) => acc + (s.end_question - s.start_question + 1), 0);
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-900">{subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">{subjectSections.length} sections</span>
                      <span className="text-xs font-semibold text-blue-600">{totalQs} Qs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
