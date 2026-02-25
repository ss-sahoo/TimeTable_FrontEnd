import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router';
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
  Layers,
  Brain,
  RefreshCw
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import QuestionBulkImport from '../components/extraction/QuestionBulkImport';
import OMRManagement from '../components/OMRManagement';
import AnswerSheetUpload from '../components/AnswerSheetUpload';

const slugifySubject = (subject: string) =>
  subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
  timezone?: string;
  // Exam mode fields
  exam_mode?: 'online' | 'offline_omr' | 'offline_subjective';
  ai_evaluation_enabled?: boolean;
  marking_strictness?: 'lenient' | 'moderate' | 'strict';
  omr_sheet_generated?: boolean;
  omr_sheet_file?: string;
  omr_metadata?: any;
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
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const { user } = useAuthContext();
  const [exam, setExam] = useState<Exam | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionQuestionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'audience' | 'evaluation'>('details');
  const [audienceData, setAudienceData] = useState<any>(null);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState('');
  const [generatingOMR, setGeneratingOMR] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<PatternSection | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

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
        await fetchSectionStats(response.data.pattern.sections, response.data.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exam details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const effectiveExamMode = exam?.exam_mode && exam.exam_mode !== 'online'
    ? exam.exam_mode
    : (exam?.pattern as any)?.exam_mode || 'online';
  const isOfflineMode = effectiveExamMode === 'offline_omr' || effectiveExamMode === 'offline_subjective';

  const handleDownloadQuestionPaper = async () => {
    if (!exam) return;
    try {
      const response = await api.get(`/exams/exams/${exam.id}/question-paper/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Question_Paper_${exam.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download question paper:', err);
      alert('Failed to download question paper. Please try again.');
    }
  };

  const handlePublishExam = async () => {
    if (!exam) return;

    // 1. Validate Exam Questions (Check for missing answers)
    try {
      setLoading(true);
      const validationRes = await api.get(`/questions/exam-validate/${exam.id}/`);
      const { valid, missing_answers } = validationRes.data;

      if (!valid && missing_answers.length > 0) {
        const missingList = missing_answers.map((q: any) => `Q${q.question_number}`).join(', ');
        alert(`Cannot Publish Exam:\n\nThe following questions are missing answers or solutions:\n${missingList}\n\nPlease add answers to these questions before publishing to ensure accurate evaluation.`);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Validation failed:', err);
      // We might want to allow publishing if validation check itself fails (network error), 
      // or block it. For now, let's warn but allow proceeding if user confirms.
      if (!confirm('Validation check failed. Do you want to proceed with publishing anyway?')) {
        setLoading(false);
        return;
      }
    }

    if (!confirm('Are you sure you want to publish this exam? This will make it visible to eligible students.')) {
      setLoading(false);
      return;
    }

    try {
      await api.patch(`/exams/exams/${exam.id}/`, { status: 'published' });

      // Update local state immediately to hide the button
      setExam(prev => prev ? { ...prev, status: 'published', is_published: true } : null);

      await fetchExam(); // Refresh data to show published status and generated OMR

      if (effectiveExamMode === 'offline_omr') {
        alert('Exam published successfully! OMR sheet is being generated.');
      } else {
        alert('Exam published successfully!');
      }
    } catch (err: any) {
      console.error('Failed to publish exam:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to publish exam.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOMR = async () => {
    if (!exam) return;
    try {
      setGeneratingOMR(true);
      await api.post(`/omr/sheets/generate/${exam.id}/`);
      alert('OMR sheet generation started!');
      await fetchExam(); // Refresh to get the file link
    } catch (err: any) {
      console.error('Failed to generate OMR:', err);
      const msg = err.response?.data?.error || 'Failed to generate OMR sheet.';
      alert(msg);
    } finally {
      setGeneratingOMR(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!exam || !sectionToDelete) return;

    try {
      setDeletingSection(true);
      // Delete the section via API
      await api.delete(`/patterns/patterns/${exam.pattern.id}/sections/${sectionToDelete.id}/`);

      // Refresh exam data to get updated pattern
      await fetchExam();

      // Close modal
      setSectionToDelete(null);
      alert(`Section "${sectionToDelete.name}" deleted successfully!`);
    } catch (err: any) {
      console.error('Failed to delete section:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to delete section.';
      alert(msg);
    } finally {
      setDeletingSection(false);
    }
  };

  const fetchAudience = async () => {
    try {
      setLoadingAudience(true);
      const response = await api.get(`/exams/exams/${examId}/eligible-students/`);
      setAudienceData(response.data);
    } catch (err) {
      console.error('Failed to fetch audience:', err);
    } finally {
      setLoadingAudience(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audience') {
      fetchAudience();
    }
  }, [activeTab, examId]);

  const fetchSectionStats = async (sections: PatternSection[], examId?: number) => {
    try {
      const stats: SectionQuestionStats[] = [];

      for (const section of sections) {
        const totalNeeded = section.end_question - section.start_question + 1;

        // Fetch questions for this section
        const queryParams = new URLSearchParams({
          pattern_section: String(section.id),
        });
        if (examId) {
          queryParams.set('exam', String(examId));
        }
        const response = await api.get(`/questions/questions/?${queryParams.toString()}`);
        // Use 'count' from paginated response for total, not results.length which is just the first page
        const totalAdded = response.data?.count ?? response.data?.results?.length ?? response.data?.length ?? 0;

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
            to={`${basePath}/exams`}
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
  const sortedSections = [...(exam.pattern.sections || [])].sort((a, b) => {
    if (a.subject === b.subject) {
      return a.start_question - b.start_question || a.id - b.id;
    }
    return a.start_question - b.start_question || a.id - b.id;
  });
  const orderedSubjects = [...new Set(sortedSections.map((s) => s.subject))];
  const subjectGroups = orderedSubjects.map((subject) => {
    let offset = 0;
    const sections = sortedSections
      .filter((section) => section.subject === subject)
      .map((section) => {
        const questionCount = section.end_question - section.start_question + 1;
        const localStart = offset + 1;
        const localEnd = localStart + questionCount - 1;
        offset += questionCount;
        return {
          ...section,
          questionCount,
          localStart,
          localEnd,
        };
      });

    return {
      subject,
      slug: slugifySubject(subject),
      sections,
      totalQuestions: offset,
    };
  });

  const sectionRows = subjectGroups.flatMap(({ subject, slug, sections }) =>
    sections.map((section) => {
      const stats = getSectionStats(section.id);
      return {
        subject,
        slug,
        section,
        stats,
        isComplete: stats.progress_percentage >= 100,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="w-full space-y-5 text-slate-700 text-base">
        {/* Header */}
        <header className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={() => navigate(`${basePath}/exams`)}
                className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Back to exams"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-900 leading-tight truncate">{exam.title}</h1>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description || 'No description provided.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusColor(exam.status)}`}>
                {getStatusIcon(exam.status)}
                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
              </span>
              <Link
                to={`${basePath}/exams/${exam.id}/results-analytics`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Analytics
              </Link>
              <button
                onClick={() => isOfflineMode ? setActiveTab('evaluation') : navigate(`${basePath}/exams/${exam.id}/evaluation`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                title="Go to Evaluation"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Evaluation
              </button>
              <button
                onClick={handleDownloadQuestionPaper}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                title="Download Question Paper"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              {exam && (
                <button
                  onClick={() => navigate(`/exams/${exam.id}/extraction-v3`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                  title="AI Bulk Import Questions"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Bulk Import
                </button>
              )}
              {exam.status === 'draft' && !exam.is_published && (
                <button
                  onClick={handlePublishExam}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm animate-pulse"
                  title="Publish Exam"
                >
                  <CheckCircle className="w-4 h-4" />
                  Publish Exam
                </button>
              )}
              {effectiveExamMode === 'offline_omr' && (
                exam.omr_sheet_file ? (
                  <a
                    href={exam.omr_sheet_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                    title="Download OMR Sheet"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download OMR
                  </a>
                ) : (
                  <button
                    onClick={handleGenerateOMR}
                    disabled={generatingOMR}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                    title="Generate OMR Sheet"
                  >
                    {generatingOMR ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Generate OMR
                  </button>
                )
              )}
              <button
                onClick={() => navigate(`${basePath}/exams/${exam.id}/edit`)}
                className="p-2 rounded-md hover:bg-slate-100 transition-colors"
                title="Edit Exam"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Start</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(exam.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Duration</p>
                <p className="text-sm font-semibold text-slate-800">{formatDuration(exam.duration_minutes)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Questions</p>
                <p className="text-sm font-semibold text-slate-800">{exam.total_questions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-orange-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Marks</p>
                <p className="text-sm font-semibold text-slate-800">{exam.total_marks}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Attempts</p>
                <p className="text-sm font-semibold text-slate-800">{exam.max_attempts}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Timezone</p>
                <p className="text-sm font-semibold text-slate-800">{exam.timezone || 'Default'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'details' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Exam Details
            {activeTab === 'details' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('audience')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'audience' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Target Audience
            {activeTab === 'audience' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          {/* Show Evaluation tab for offline exam modes */}
          {isOfflineMode && (
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === 'evaluation'
                ? effectiveExamMode === 'offline_omr' ? 'text-green-600' : 'text-purple-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Brain className="w-3.5 h-3.5" />
              {effectiveExamMode === 'offline_omr' ? 'OMR Evaluation' : 'AI Evaluation'}
              {activeTab === 'evaluation' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${effectiveExamMode === 'offline_omr' ? 'bg-green-600' : 'bg-purple-600'
                  }`} />
              )}
            </button>
          )}
        </div>

        {/* Main Content Area */}
        {activeTab === 'details' ? (
          <div className="grid grid-cols-12 gap-4">
            {/* Sections Table */}
            <section className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{exam.pattern.name}</h2>
                  <p className="text-xs text-slate-500">
                    {totalQuestionsAdded} of {exam.total_questions} questions added · {overallProgress.toFixed(0)}% complete
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`${basePath}/exam/${exam.id}/pattern/${exam.pattern.id}/bulk-import`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    AI Bulk Import
                  </button>
                  <button
                    onClick={() => navigate(`/exams/${exam.id}/extraction-v3`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                    title="Use modern AI pipeline to extract questions"
                  >
                    <Zap className="w-3 h-3" />
                    Smart Extract V3
                  </button>
                  <Link
                    to={`${basePath}/patterns/${exam.pattern.id}/view`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Pattern
                  </Link>
                </div>
              </div>
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead className="bg-slate-100 text-slate-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Subject</th>
                      <th className="px-3 py-2 text-left font-semibold">Section</th>
                      <th className="px-3 py-2 text-left font-semibold">Range</th>
                      <th className="px-3 py-2 text-left font-semibold">Type</th>
                      <th className="px-3 py-2 text-center font-semibold">Marks</th>
                      <th className="px-3 py-2 text-center font-semibold">Added</th>
                      <th className="px-3 py-2 text-center font-semibold">Progress</th>
                      <th className="px-3 py-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sectionRows.map(({ subject, slug, section, stats, isComplete }) => (
                      <tr key={section.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-800">{subject}</td>
                        <td className="px-3 py-2 text-slate-700">
                          <span className="block text-slate-800 font-semibold">{section.name}</span>
                          <span className="text-[11px] text-slate-500">#{section.id}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          Q{section.start_question}-{section.end_question}
                          <span className="block text-[11px] text-slate-400">
                            Subject Q{section.localStart}-{section.localEnd}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{getQuestionTypeDisplayName(section.question_type)}</td>
                        <td className="px-3 py-2 text-center text-slate-700">
                          +{section.marks_per_question}/-{section.negative_marking}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">
                          {stats.total_added}/{section.questionCount}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[12px] text-slate-600 font-medium">{stats.progress_percentage.toFixed(0)}%</span>
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(stats.progress_percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`${basePath}/pattern/${exam.pattern.id}/question/${slug}/${section.localStart}?examId=${exam.id}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${isComplete ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                              {isComplete ? <Eye className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {isComplete ? 'View' : `Add (${Math.max(stats.remaining, 0)})`}
                            </Link>
                            <button
                              onClick={() => setSectionToDelete(section)}
                              className="inline-flex items-center justify-center p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title={`Delete section "${section.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sectionRows.length === 0 && (
                  <div className="flex items-center justify-center py-10 text-xs text-slate-500">
                    No sections configured for this pattern.
                  </div>
                )}
              </div>
            </section>

            {/* Side Column */}
            <aside className="col-span-12 lg:col-span-4 space-y-3">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Pattern Snapshot</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Sections</span>
                    <span className="font-semibold text-slate-800">{exam.pattern.sections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Questions</span>
                    <span className="font-semibold text-slate-800">{exam.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Marks</span>
                    <span className="font-semibold text-slate-800">{exam.total_marks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completion</span>
                    <span className="font-semibold text-blue-600">{overallProgress.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Question Tracker</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Questions Added</span>
                    <span className="font-semibold text-green-600">{totalQuestionsAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Needed</span>
                    <span className="font-semibold text-slate-800">{exam.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining</span>
                    <span className="font-semibold text-orange-500">
                      {Math.max(exam.total_questions - totalQuestionsAdded, 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Subjects</h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[...new Set(exam.pattern.sections.map((s) => s.subject))].map((subject) => {
                    const subjectSections = exam.pattern.sections.filter((s) => s.subject === subject);
                    const totalQs = subjectSections.reduce(
                      (acc, s) => acc + (s.end_question - s.start_question + 1),
                      0
                    );
                    return (
                      <div key={subject} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-50">
                        <span className="font-medium text-slate-800">{subject}</span>
                        <span className="text-[11px] text-slate-500">
                          {subjectSections.length} sections · {totalQs} Qs
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {exam.instructions && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-900">Instructions</h3>
                  </div>
                  <div className="text-xs text-slate-600 max-h-32 overflow-auto whitespace-pre-wrap">
                    {exam.instructions}
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : activeTab === 'audience' ? (
          /* Audience Tab Content */
          <div className="space-y-4">
            {/* Audience Header & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Student Participation</h2>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Total Eligible: <span className="text-blue-600">{audienceData?.total_eligible || 0}</span>
                  </div>
                </div>

                {/* Scope Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="px-3 py-1.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600 border border-slate-200">
                    Scope: <span className="text-slate-900 capitalize">{audienceData?.visibility_display || exam.status}</span>
                  </div>
                  {audienceData?.allowed_centers?.map((c: any) => (
                    <div key={c.id} className="px-3 py-1.5 bg-blue-50 rounded-md text-xs font-medium text-blue-600 border border-blue-100">
                      Center: {c.name}
                    </div>
                  ))}
                  {audienceData?.allowed_batches?.map((b: any) => (
                    <div key={b.id} className="px-3 py-1.5 bg-indigo-50 rounded-md text-xs font-medium text-indigo-600 border border-indigo-100">
                      Batch: {b.name} ({b.code})
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={audienceSearch}
                    onChange={(e) => setAudienceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <div className="absolute left-3 top-2.5">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold">Student</th>
                        <th className="px-3 py-3 text-left font-semibold">Center</th>
                        <th className="px-3 py-3 text-center font-semibold">Status</th>
                        <th className="px-3 py-3 text-center font-semibold">Result</th>
                        <th className="px-3 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingAudience ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                              <span className="text-slate-500">Loading students...</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        audienceData?.students
                          ?.filter((s: any) =>
                            s.full_name.toLowerCase().includes(audienceSearch.toLowerCase()) ||
                            s.email.toLowerCase().includes(audienceSearch.toLowerCase())
                          )
                          .map((student: any) => (
                            <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-3">
                                <div className="font-semibold text-slate-900">{student.full_name}</div>
                                <div className="text-[11px] text-slate-500">{student.email}</div>
                              </td>
                              <td className="px-3 py-3 text-slate-600">{student.center_name}</td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${student.status === 'not_started' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                  student.status === 'in_progress' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                                    'bg-green-100 text-green-700 border border-green-200'
                                  }`}>
                                  {student.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {student.score !== null ? (
                                  <div>
                                    <div className="font-bold text-slate-900">{student.score}/{exam.total_marks}</div>
                                    <div className="text-[10px] text-slate-500">{student.percentage?.toFixed(1)}%</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">--</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">
                                {student.attempt_id && (
                                  <Link
                                    to={`${basePath}/exams/attempts/${student.attempt_id}`}
                                    className="p-1.5 inline-flex bg-slate-100 text-slate-600 rounded hover:bg-blue-600 hover:text-white transition-all"
                                    title="View Attempt"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                <button className="p-1.5 ml-1 inline-flex bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-all">
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                      {!loadingAudience && audienceData?.students?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                            No eligible students found for the current configuration.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audience Stats Sidebar */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Participation Rate</h3>
                  <div className="text-3xl font-black text-blue-600 mb-1">
                    {audienceData ? Math.round((audienceData.students.filter((s: any) => s.status !== 'not_started').length / Math.max(audienceData.total_eligible, 1)) * 100) : 0}%
                  </div>
                  <p className="text-xs text-slate-500">
                    {audienceData?.students.filter((s: any) => s.status !== 'not_started').length} out of {audienceData?.total_eligible} students have started.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Status Distribution
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Completed', color: 'bg-green-500', count: audienceData?.students.filter((s: any) => ['submitted', 'auto_submitted'].includes(s.status)).length || 0 },
                      { label: 'In Progress', color: 'bg-amber-500', count: audienceData?.students.filter((s: any) => s.status === 'in_progress').length || 0 },
                      { label: 'Not Started', color: 'bg-slate-300', count: audienceData?.students.filter((s: any) => s.status === 'not_started').length || 0 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-[11px] font-medium mb-1">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="text-slate-900">{item.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${audienceData ? (item.count / Math.max(audienceData.total_eligible, 1)) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-md p-4 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5" />
                    <h3 className="text-sm font-bold">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="flex items-center gap-2 w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      Remind Pending Students
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Export Audience List
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      Add Individual Student
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'evaluation' ? (
          /* Evaluation Tab Content - OMR/AI Evaluation */
          <div className="space-y-4">
            {effectiveExamMode === 'offline_omr' && (
              <OMRManagement examId={exam.id} examTitle={exam.title} patternId={exam.pattern.id} />
            )}

            {effectiveExamMode === 'offline_subjective' && (
              <AnswerSheetUpload examId={exam.id} examTitle={exam.title} />
            )}
          </div>
        ) : null
        }
      </div >

      {/* Bulk Import Modal */}
      {
        showBulkImport && exam && (
          <QuestionBulkImport
            examId={exam.id}
            patternId={exam.pattern.id}
            onClose={() => setShowBulkImport(false)}
            onImportComplete={() => {
              setShowBulkImport(false);
              fetchExam(); // Refresh exam data to show new questions
            }}
          />
        )
      }

      {/* Delete Section Confirmation Modal */}
      {
        sectionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">Delete Section</h3>
                    <p className="text-sm text-red-600">This action cannot be undone</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-slate-700 mb-4">
                  Are you sure you want to delete the section <span className="font-bold text-slate-900">"{sectionToDelete.name}"</span>?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-amber-800">
                      <p className="font-medium mb-1">Warning:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>This will remove the section from the pattern</li>
                        <li>Questions linked to this section may become orphaned</li>
                        <li>Section: {sectionToDelete.subject} - Q{sectionToDelete.start_question} to Q{sectionToDelete.end_question}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSectionToDelete(null)}
                  disabled={deletingSection}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSection}
                  disabled={deletingSection}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deletingSection ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Section
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
