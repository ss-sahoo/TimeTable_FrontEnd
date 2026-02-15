import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
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
  const { user } = useAuthContext();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Multi-select state for bulk delete
  const [selectedExams, setSelectedExams] = useState<number[]>([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 dark:text-gray-300';
      case 'published':
        return 'bg-blue-100 text-blue-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-slate-100 text-slate-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-3 h-3" />;
      case 'published':
        return <CheckCircle className="w-3 h-3" />;
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'archived':
        return <Pause className="w-3 h-3" />;
      default:
        return <Edit className="w-3 h-3" />;
    }
  };

  // Stats are now calculated on the frontend based on the fetched (filtered) exams
  // Or we might want to fetch stats separately if we want global stats.
  // For now, let's keep it based on current view for simplicity, or just calculate from 'exams'
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

  const scrollToExamGrid = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const gridElement = document.getElementById('exam-grid');
    gridElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteExam = async (examId: number) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        await api.delete(`/exams/exams/${examId}/`);
        setExams(exams.filter(exam => exam.id !== examId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert('Failed to delete exam: ' + errorMessage);
      }
    }
  };

  // Multi-select functions
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

    setIsDeleting(true);
    try {
      const response = await api.post('/exams/exams/bulk-delete/', {
        exam_ids: selectedExams
      });
      
      if (response.data.success) {
        // Remove deleted exams from the list
        setExams(exams.filter(exam => !selectedExams.includes(exam.id)));
        setSelectedExams([]);
        setShowSelectionMode(false);
        alert(`Successfully deleted ${response.data.deleted_count} exam(s)`);
      } else {
        alert('Failed to delete exams: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to delete exams: ' + errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelSelection = () => {
    setSelectedExams([]);
    setShowSelectionMode(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#216865' }}></div>
          <p className="text-sm" style={{ color: '#6b6b6b' }}>Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {showSelectionMode ? (
              <h1 className="text-2xl font-bold text-black">Select Exams</h1>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-black">Exam Management</h1>
                <p className="text-base" style={{ color: '#6b6b6b' }}>Manage and organize your exams</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!showSelectionMode ? (
              <button
                onClick={() => setShowSelectionMode(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg transition-colors hover:bg-slate-50"
              >
                <CheckSquare className="w-4 h-4" />
                Select
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelSelection}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg transition-colors hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                {selectedExams.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#dc2626' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : `Delete ${selectedExams.length} Selected`}
                  </button>
                )}
              </div>
            )}
            <Link
              to="/exams/create"
              data-tour-id="cta-create-exam"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#216865' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a524f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#216865'}
            >
              <Plus className="w-4 h-4" />
              Create Exam
            </Link>
          </div>
        </div>

        <div
          data-tour-id="panel-scheduling"
          className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 px-5 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="space-y-3">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-[0.2em]">
              Scheduling & Invites
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Orchestrate exam windows with timezone-smart reminders
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                Open the scheduling drawer inside any exam card to configure slots, buffers, and branded email journeys
                before sending invitations.
              </p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Auto-send invites, reminders, and fallback SMS notes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Enforce buffers, grace periods, and rescheduling limits
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Preview the candidate experience before publishing
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={scrollToExamGrid}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Jump to my exams
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: '#216865' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Total</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4" style={{ color: '#6b6b6b' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Draft</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.draft}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#216865' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Published</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.published}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" style={{ color: '#3f5fd4' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Active</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#723e11' }} />
              <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>Completed</span>
            </div>
            <div className="text-lg font-semibold text-black mt-1">{stats.completed}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-900'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Visibility</span>
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Scopes</option>
                  <option value="institute">Institute-Wide</option>
                  <option value="centers">Specific Centers</option>
                  <option value="batches">Specific Batches</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Center</span>
                <select
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={visibilityFilter === 'batches'} // Optional logic: centers not relevant if filtering by batch? Actually centers IS relevant for batch too usually, but let's keep it simple.
                >
                  <option value="">All Centers</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>{center.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Batch</span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Selection Header */}
        {showSelectionMode && exams.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            </div>
            <span className="text-sm text-blue-600">
              {selectedExams.length} exam{selectedExams.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}

        {/* Exams Grid */}
        <div id="exam-grid" data-tour-id="exam-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exams.map((exam) => (
            <div 
              key={exam.id} 
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                selectedExams.includes(exam.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
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
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">{exam.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">{exam.description}</p>
                </div>
                <div className="relative ml-2">
                  <button className="p-1 text-slate-400 hover:text-slate-600 dark:text-gray-400 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                  {getStatusIcon(exam.status)}
                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Start</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{new Date(exam.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Duration</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{exam.duration_minutes} min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Questions</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{exam.total_questions}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Marks</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{exam.total_marks}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/exams/${exam.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-white rounded transition-colors"
                  style={{ backgroundColor: '#3f5fd4' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d4bb8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3f5fd4'}
                >
                  <Eye className="w-3 h-3" />
                  View
                </Link>
                <Link
                  to={`/exams/${exam.id}/analytics`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-white rounded transition-colors"
                  style={{ backgroundColor: '#059669' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                >
                  <BarChart3 className="w-3 h-3" />
                  Analytics
                </Link>
                <Link
                  to={`/exams/${exam.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-white rounded transition-colors"
                  style={{ backgroundColor: '#6b6b6b' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a5a5a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b6b6b'}
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Link>
                <button
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  style={{ color: '#6b6b6b' }}
                  onClick={() => handleDeleteExam(exam.id)}
                  title="Delete Exam"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#6b6b6b' }} />
            <h3 className="text-lg font-medium text-black mb-2">No exams found</h3>
            <p className="text-sm mb-4" style={{ color: '#6b6b6b' }}>
              {searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all' || selectedCenter || selectedBatch
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first exam.'}
            </p>
            {showSelectionMode && (
              <button
                onClick={cancelSelection}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg transition-colors hover:bg-slate-50 mb-4"
              >
                <X className="w-4 h-4" />
                Exit Selection Mode
              </button>
            )}
            {!searchTerm && statusFilter === 'all' && visibilityFilter === 'all' && !selectedCenter && !selectedBatch && !showSelectionMode && (
              <Link
                to="/exams/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#216865' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a524f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#216865'}
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
