import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Users,
  BarChart3,
  Calendar,
  Clock,
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
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import { getPublicExamLink, normalizeShareUrl } from '../utils/urlUtils';

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
  questions_added: number;
  questions_required: number;
  questions_remaining: number;
  question_completion_percent: number;
  is_question_complete: boolean;
  created_at: string;
  updated_at: string;
  share_url?: string | null;
  public_access_token?: string | null;
  pattern: {
    id: number;
    name: string;
    sections: Array<{
      id: number;
      name: string;
      subject: string;
      question_type: string;
      start_question: number;
      end_question: number;
      marks_per_question: number;
    }>;
  };
}

export default function ExamManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const { user } = useAuthContext();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-select state for bulk delete
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [shareExam, setShareExam] = useState<Exam | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const copyFeedbackTimeout = useRef<number | null>(null);

  // Data for filters
  const [centers, setCenters] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    fetchCenters();
    fetchBatches();
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch exams when filters change
  useEffect(() => {
    fetchExams();
  }, [debouncedSearchTerm, statusFilter, visibilityFilter, selectedCenter, selectedBatch]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideAnyDropdown = Object.values(dropdownRefs.current).some(ref =>
        ref && ref.contains(target)
      );

      if (!isClickInsideAnyDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCenters = async () => {
    try {
      const response = await api.get('/timetable/centers/');
      setCenters(response.data.results || response.data.centers || response.data || []);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/timetable/batches/');
      setBatches(response.data.batches || response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (visibilityFilter !== 'all') {
        params.append('visibility_scope', visibilityFilter);
      }

      if (selectedCenter) {
        params.append('center_id', selectedCenter);
      }

      if (selectedBatch) {
        params.append('batch_id', selectedBatch);
      }

      const response = await api.get(`/exams/exams/?${params.toString()}`);
      setExams(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (examId: number) => {
    setOpenDropdown(openDropdown === examId ? null : examId);
  };

  const handleDeleteExam = async (examId: number) => {
    try {
      setDeleting(examId);
      await api.delete(`/exams/exams/${examId}/`);
      setExams(exams.filter(exam => exam.id !== examId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete exam:', error);
      toast.error('Failed to delete exam. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Multi-select functions for bulk delete
  const toggleExamSelection = (examId: number) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExams.length === exams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(exams.map(exam => exam.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExams.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedExams.length} exam(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setIsBulkDeleting(true);
    try {
      const response = await api.post('/exams/exams/bulk-delete/', {
        exam_ids: selectedExams
      });
      
      if (response.data.success) {
        setExams(exams.filter(exam => !selectedExams.includes(exam.id)));
        setSelectedExams([]);
        setShowSelectionMode(false);
        toast.error(`Successfully deleted ${response.data.deleted_count} exam(s)`);
      } else {
        toast.error('Failed to delete exams: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to bulk delete exams:', error);
      toast.error('Failed to delete exams. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const cancelSelection = () => {
    setSelectedExams([]);
    setShowSelectionMode(false);
  };

  const handlePublishExam = async (examId: number) => {
    try {
      await api.patch(`/exams/exams/${examId}/`, { status: 'published' });
      setExams(exams.map(exam =>
        exam.id === examId ? { ...exam, status: 'published' } : exam
      ));
      setCopyFeedback('Exam published successfully!');
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
      copyFeedbackTimeout.current = window.setTimeout(() => setCopyFeedback(null), 2500);
    } catch (error: any) {
      console.error('Failed to publish exam:', error);
      const errorMessage = error.response?.data?.status?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        'Failed to publish exam. Please ensure all questions are added.';
      toast.error(errorMessage);
    }
  };

  const getExamLink = (exam: Exam) => {
    if (!exam.is_question_complete) {
      return '';
    }
    // Normalize share_url from backend (replace localhost) or generate new link
    const normalizedShareUrl = normalizeShareUrl(exam.share_url);
    return (
      normalizedShareUrl ||
      (exam.public_access_token ? getPublicExamLink(exam.public_access_token) : '')
    );
  };

  const handleCopyExamLink = async (exam: Exam) => {
    if (!exam.is_question_complete) {
      setCopyFeedback('Add all required questions before sharing this exam.');
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
      copyFeedbackTimeout.current = window.setTimeout(() => setCopyFeedback(null), 2500);
      return false;
    }

    const link = getExamLink(exam);

    if (!link) {
      setCopyFeedback('Public link is not available yet for this exam.');
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
      copyFeedbackTimeout.current = window.setTimeout(() => setCopyFeedback(null), 2500);
      return false;
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopyFeedback('Public exam link copied to clipboard.');
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
      copyFeedbackTimeout.current = window.setTimeout(() => setCopyFeedback(null), 2500);
      return true;
    } catch (error) {
      console.error('Failed to copy link:', error);
      setCopyFeedback('Failed to copy link. Please try again.');
      if (copyFeedbackTimeout.current) {
        window.clearTimeout(copyFeedbackTimeout.current);
      }
      copyFeedbackTimeout.current = window.setTimeout(() => setCopyFeedback(null), 2500);
      return false;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'published':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'active':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'archived':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-3.5 h-3.5" />;
      case 'published':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'active':
        return <Play className="w-3.5 h-3.5" />;
      case 'completed':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'archived':
        return <Pause className="w-3.5 h-3.5" />;
      default:
        return <Edit className="w-3.5 h-3.5" />;
    }
  };

  // Exams are now filtered server-side, so we use them directly

  const getExamStats = () => {
    return {
      total: exams.length,
      draft: exams.filter(e => e.status === 'draft').length,
      published: exams.filter(e => e.status === 'published').length,
      active: exams.filter(e => e.status === 'active').length,
      completed: exams.filter(e => e.status === 'completed').length,
    };
  };

  const stats = getExamStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {showSelectionMode ? (
              <h1 className="text-2xl font-bold text-slate-900">Select Exams</h1>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Exam Management</h1>
                <p className="text-xs text-slate-600 mt-1">Manage and organize your exams</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!showSelectionMode ? (
              <button
                onClick={() => setShowSelectionMode(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
              >
                <CheckSquare className="w-4 h-4" />
                Select
              </button>
            ) : (
              <>
                <button
                  onClick={cancelSelection}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                {selectedExams.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isBulkDeleting ? 'Deleting...' : `Delete ${selectedExams.length} Selected`}
                  </button>
                )}
              </>
            )}
            {!showSelectionMode && (
              <Link
                to={`${basePath}/exams/create`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards - Compact Design */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs text-slate-600">Total</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{stats.total}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs text-slate-600">Draft</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{stats.draft}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs text-slate-600">Published</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{stats.published}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-slate-600">Active</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{stats.active}</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs text-slate-600">Completed</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{stats.completed}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters - Improved Design */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search exams by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
              />
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Visibility Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Visibility</label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">All Scopes</option>
                <option value="institute">Institute-Wide</option>
                <option value="centers">Specific Centers</option>
                <option value="batches">Specific Batches</option>
              </select>
            </div>

            {/* Center Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Center</label>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Centers</option>
                {centers.map(center => (
                  <option key={center.id} value={center.id}>{center.name}</option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Batches</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {copyFeedback && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 text-white text-sm px-4 py-2 shadow-lg">
            {copyFeedback}
          </div>
        )}

        {/* Selection Header */}
        {showSelectionMode && exams.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
            >
              {selectedExams.length === exams.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All ({selectedExams.length}/{exams.length})
            </button>
            <span className="text-sm text-blue-600">
              {selectedExams.length} exam{selectedExams.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {exams.map((exam) => {
            const requiredQuestions = exam.questions_required || exam.total_questions || 0;
            const addedQuestions = Math.max(0, exam.questions_added || 0);
            const effectiveAdded = requiredQuestions > 0 ? Math.min(addedQuestions, requiredQuestions) : addedQuestions;
            const percent =
              requiredQuestions > 0
                ? Math.min(
                  100,
                  Math.max(0, Math.round((effectiveAdded / requiredQuestions) * 100)),
                )
                : 0;

            const canShareExam = exam.is_question_complete && !!getExamLink(exam);

            return (
              <div 
                key={exam.id} 
                className={`bg-white rounded-xl border p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200 ${
                  selectedExams.includes(exam.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  {showSelectionMode && (
                    <button
                      onClick={() => toggleExamSelection(exam.id)}
                      className="mr-2 flex-shrink-0"
                    >
                      {selectedExams.includes(exam.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">{exam.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{exam.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(exam.status)}`}>
                    {getStatusIcon(exam.status)}
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                  {!exam.is_question_complete && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      {`${effectiveAdded}/${requiredQuestions} questions`}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>Question completion</span>
                    <span className="font-medium text-slate-900">
                      {percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${exam.is_question_complete ? 'bg-green-500' : 'bg-blue-500'} transition-all`}
                      style={{
                        width: `${percent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Start</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">{new Date(exam.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">Duration</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">{exam.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs">Questions</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">
                      {effectiveAdded}/{requiredQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs">Marks</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">{exam.total_marks}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Link
                    to={`${basePath}/exams/${exam.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <Link
                    to={`${basePath}/exams/${exam.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <div
                    className="relative"
                    ref={(el) => {
                      dropdownRefs.current[exam.id] = el;
                    }}
                  >
                    <button
                      onClick={() => toggleDropdown(exam.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === exam.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                        <div className="py-1">
                          {canShareExam && (
                            <>
                              <button
                                onClick={() => {
                                  setShareExam(exam);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Share2 className="w-4 h-4" />
                                View Public Link
                              </button>
                              <button
                                onClick={async () => {
                                  setOpenDropdown(null);
                                  await handleCopyExamLink(exam);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" />
                                Copy Public Link
                              </button>
                              <div className="border-t border-slate-100 my-1"></div>
                            </>
                          )}
                          {exam.status === 'draft' && (
                            <button
                              onClick={() => {
                                handlePublishExam(exam.id);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Publish Exam
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDeleteConfirm(exam.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Exam
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {exams.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No exams found</h3>
            <p className="text-xs text-slate-600 mb-6 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all' || selectedCenter || selectedBatch
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first exam.'}
            </p>
            {showSelectionMode && (
              <button
                onClick={cancelSelection}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 mb-4"
              >
                <X className="w-4 h-4" />
                Exit Selection Mode
              </button>
            )}
            {!searchTerm && statusFilter === 'all' && visibilityFilter === 'all' && !selectedCenter && !selectedBatch && !showSelectionMode && (
              <Link
                to={`${basePath}/exams/create`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Share Link Modal */}
      {shareExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Share Exam Link</h3>
                <p className="text-sm text-slate-600">Copy and share this link with students.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
              {getExamLink(shareExam) ? (
                <p className="text-xs font-mono text-slate-800 break-all">{getExamLink(shareExam)}</p>
              ) : (
                <p className="text-xs text-slate-600">Public link not available for this exam yet.</p>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShareExam(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await handleCopyExamLink(shareExam);
                }}
                disabled={!getExamLink(shareExam)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Exam</h3>
                <p className="text-sm text-slate-600">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-6">
              Are you sure you want to delete this exam? All associated data including attempts, results, and invitations will be permanently removed.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                disabled={deleting === deleteConfirm}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteExam(deleteConfirm)}
                disabled={deleting === deleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting === deleteConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
