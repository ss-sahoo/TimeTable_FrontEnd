import { useState, useEffect, useRef } from 'react';
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
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchExams();
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
      alert('Failed to delete exam. Please try again.');
    } finally {
      setDeleting(null);
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
            <h1 className="text-2xl font-bold text-slate-900">Exam Management</h1>
            <p className="text-xs text-slate-600 mt-1">Manage and organize your exams</p>
          </div>
          <Link
            to="/exams/create"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Link>
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
        <div className="flex items-center gap-3 mb-6">
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

          {/* Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300 min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
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
                  <span className="text-xs font-medium text-slate-900">{exam.total_questions}</span>
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
                  to={`/exams/${exam.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Link>
                <Link
                  to={`/exams/${exam.id}/edit`}
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
          ))}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No exams found</h3>
            <p className="text-xs text-slate-600 mb-6 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first exam.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/exams/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create Exam
              </Link>
            )}
          </div>
        )}
      </div>

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
