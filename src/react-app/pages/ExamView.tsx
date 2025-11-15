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
        await fetchSectionStats(response.data.pattern.sections, response.data.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exam details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => navigate('/exams')}
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
                to={`/exams/${exam.id}/results-analytics`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Analytics
              </Link>
              <Link
                to={`/exams/${exam.id}/evaluation`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Evaluation
              </Link>
              <button
                onClick={() => navigate(`/exams/${exam.id}/edit`)}
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

        {/* Main Grid */}
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
              <Link
                to={`/patterns/${exam.pattern.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Pattern
              </Link>
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
                        <Link
                          to={`/pattern/${exam.pattern.id}/question/${slug}/${section.localStart}?examId=${exam.id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                            isComplete ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isComplete ? <Eye className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {isComplete ? 'View' : `Add (${Math.max(stats.remaining, 0)})`}
                        </Link>
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
      </div>
    </div>
  );
}
