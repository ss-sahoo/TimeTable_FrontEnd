import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  BookOpen,
  Clock,
  Users,
  Settings,
  CheckCircle,
  CheckSquare,
  AlertCircle,
  Zap,
  Calculator,
  FileText,
  Hash,
  Type,
  Monitor
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
  question_type: 'mcq' | 'numerical' | 'subjective' | 'true_false' | 'fill_blank';
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
  exam_mode: 'online' | 'offline_omr' | 'offline_subjective';
}

export default function PatternManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : isCenterAdminPath ? '/center-admin' : '';
  const { user } = useAuthContext();
  const [patterns, setPatterns] = useState<ExamPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchPatterns();
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

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patterns/patterns/');
      setPatterns(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (patternId: number) => {
    setOpenDropdown(openDropdown === patternId ? null : patternId);
  };

  const handleDeletePattern = async (patternId: number) => {
    try {
      setDeleting(patternId);
      await api.delete(`/patterns/patterns/${patternId}/`);
      setPatterns(patterns.filter(pattern => pattern.id !== patternId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete pattern:', error);
      alert('Failed to delete pattern. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'single_mcq':
      case 'mcq':
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      case 'multiple_mcq':
        return <CheckSquare className="w-3 h-3 text-indigo-600" />;
      case 'numerical':
        return <Calculator className="w-3 h-3 text-green-600" />;
      case 'subjective':
        return <FileText className="w-3 h-3 text-purple-600" />;
      case 'true_false':
        return <Type className="w-3 h-3 text-orange-600" />;
      case 'fill_blank':
        return <Hash className="w-3 h-3 text-red-600" />;
      default:
        return <Type className="w-3 h-3 text-slate-600 dark:text-gray-400" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'single_mcq':
      case 'mcq':
        return 'bg-blue-100 text-blue-700';
      case 'multiple_mcq':
        return 'bg-indigo-100 text-indigo-700';
      case 'numerical':
        return 'bg-green-100 text-green-700';
      case 'subjective':
        return 'bg-purple-100 text-purple-700';
      case 'true_false':
        return 'bg-orange-100 text-orange-700';
      case 'fill_blank':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredPatterns = patterns.filter(pattern => {
    const matchesSearch = pattern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && pattern.is_active) ||
      (statusFilter === 'inactive' && !pattern.is_active);
    return matchesSearch && matchesStatus;
  });

  const getPatternStats = () => {
    return {
      total: patterns.length,
      active: patterns.filter(p => p.is_active).length,
      inactive: patterns.filter(p => !p.is_active).length,
      totalQuestions: patterns.reduce((sum, p) => sum + p.total_questions, 0),
      totalMarks: patterns.reduce((sum, p) => sum + p.total_marks, 0),
    };
  };

  const stats = getPatternStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Pattern Management</h1>
            <p className="text-base" style={{ color: '#6b6b6b' }}>Manage and organize your exam patterns</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-slate-300 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-xs ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-gray-900'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-xs border-l border-slate-300 ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-gray-900'}`}
              >
                Grid
              </button>
            </div>
            <Link
              to={`${basePath}/patterns/create`}
              data-tour-id="cta-create-pattern"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Pattern
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6" data-tour-id="pattern-stats">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Total</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Active</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.active}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Inactive</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.inactive}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Questions</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.totalQuestions}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Total Marks</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-gray-100 mt-1">{stats.totalMarks}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search patterns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-gray-900'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 dark:text-gray-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Patterns List/Grid */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}`}>
          {filteredPatterns.map((pattern) => (
            <div key={pattern.id} className={`bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow ${viewMode === 'list' ? 'w-full' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100 truncate">{pattern.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">{pattern.description}</p>
                </div>
                <div
                  className="relative ml-2"
                  ref={(el) => {
                    dropdownRefs.current[pattern.id] = el;
                  }}
                >
                  <button
                    onClick={() => toggleDropdown(pattern.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:text-gray-400 rounded"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === pattern.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setDeleteConfirm(pattern.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Pattern
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${pattern.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                  {pattern.is_active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {pattern.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${pattern.exam_mode === 'online' ? 'bg-blue-100 text-blue-700' :
                  pattern.exam_mode === 'offline_omr' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  <Monitor className="w-3 h-3" />
                  {pattern.exam_mode === 'online' ? 'Online' : pattern.exam_mode === 'offline_omr' ? 'Offline OMR' : 'Offline Subjective'}
                </span>
              </div>

              <div className={`mb-4 ${viewMode === 'list' ? 'grid grid-cols-2 md:grid-cols-4 gap-2' : 'space-y-2'}`}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Questions</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{pattern.total_questions}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Marks</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{pattern.total_marks}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Duration</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{pattern.total_duration} min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600 dark:text-gray-400">Sections</span>
                  </div>
                  <span className="text-slate-900 dark:text-gray-100">{pattern.sections.length}</span>
                </div>
              </div>

              {/* Sections Preview - Horizontal Layout */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-slate-900 dark:text-gray-100 mb-2">Pattern Structure</h4>
                {pattern.sections && pattern.sections.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      // Group sections by subject
                      const groupedSections = pattern.sections.reduce((acc: any, section: any) => {
                        if (!acc[section.subject]) {
                          acc[section.subject] = [];
                        }
                        acc[section.subject].push(section);
                        return acc;
                      }, {});

                      return Object.entries(groupedSections).map(([subject, sections]: [string, any]) => (
                        <div key={subject} className="border border-slate-200 dark:border-gray-700 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h5 className="font-medium text-slate-800 text-xs">{subject}</h5>
                            <span className="text-xs text-slate-500">
                              (Q{sections[0].start_question}-{sections[sections.length - 1].end_question})
                            </span>
                          </div>
                          {/* Horizontal sections layout */}
                          <div className="flex flex-wrap gap-1">
                            {sections.map((section: any) => (
                              <div
                                key={section.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-md text-xs"
                              >
                                <span className="text-slate-700 font-medium">{section.name}</span>
                                <span className={`inline-flex items-center gap-1 px-1 py-0.5 rounded-full text-xs font-medium ${getQuestionTypeColor(section.question_type)}`}>
                                  {getQuestionTypeIcon(section.question_type)}
                                  {section.question_type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-slate-500">
                                  Q{section.start_question}-{section.end_question}
                                </span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-500">{section.marks_per_question}m</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No sections defined</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`${basePath}/patterns/${pattern.id}/view`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Link>
                <Link
                  to={`${basePath}/patterns/${pattern.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-xs bg-slate-50 dark:bg-gray-900 text-slate-700 rounded hover:bg-slate-100 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredPatterns.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No patterns found</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first exam pattern.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to={`${basePath}/patterns/create`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Pattern
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Delete Pattern</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-6">
              Are you sure you want to delete this pattern? All associated sections, questions, and exam data will be permanently removed.
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
                onClick={() => handleDeletePattern(deleteConfirm)}
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
                    Delete Pattern
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
