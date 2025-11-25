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
  Share2
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams/exams/');
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

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-2xl font-bold text-black">Exam Management</h1>
            <p className="text-base" style={{ color: '#6b6b6b' }}>Manage and organize your exams</p>
          </div>
          <Link
            to="/exams/create"
            data-tour-id="cta-create-exam"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#216865' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1a524f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#216865'}
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Link>
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
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:bg-gray-900'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Exams Grid */}
        <div id="exam-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
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
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#2d4bb8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#3f5fd4'}
                >
                  <Eye className="w-3 h-3" />
                  View
                </Link>
                <Link
                  to={`/exams/${exam.id}/analytics`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-white rounded transition-colors"
                  style={{ backgroundColor: '#059669' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
                >
                  <BarChart3 className="w-3 h-3" />
                  Analytics
                </Link>
                <Link
                  to={`/exams/${exam.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs text-white rounded transition-colors"
                  style={{ backgroundColor: '#6b6b6b' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a5a5a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6b6b6b'}
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

        {filteredExams.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#6b6b6b' }} />
            <h3 className="text-lg font-medium text-black mb-2">No exams found</h3>
            <p className="text-sm mb-4" style={{ color: '#6b6b6b' }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first exam.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/exams/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#216865' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1a524f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#216865'}
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
