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
  BookOpen, 
  CheckCircle,
  AlertCircle,
  Calculator,
  FileText,
  Type,
  Hash,
  Upload,
  Download,
  Star,
  Clock,
  User,
  Tag,
  Image,
  Code,
  Brain
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

interface Question {
  id: number;
  title: string;
  content: string;
  question_type: 'mcq' | 'numerical' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  subject: string;
  topic: string;
  options?: Array<{
    id: number;
    text: string;
    is_correct: boolean;
  }>;
  correct_answer?: string;
  explanation?: string;
  images?: Array<{
    id: number;
    image_url: string;
    caption?: string;
  }>;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  question_bank: {
    id: number;
    name: string;
  };
}

interface QuestionBank {
  id: number;
  name: string;
  description: string;
  subject: string;
  total_questions: number;
  created_at: string;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function QuestionBank() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchQuestionBanks();
    fetchQuestions();
  }, [selectedBank, typeFilter, difficultyFilter, sortBy, sortOrder]);

  const fetchQuestionBanks = async () => {
    try {
      const response = await api.get('/questions/question-banks/');
      setQuestionBanks(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch question banks:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBank !== 'all') params.append('question_bank', selectedBank);
      if (typeFilter !== 'all') params.append('question_type', typeFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      params.append('ordering', sortOrder === 'desc' ? `-${sortBy}` : sortBy);
      
      const response = await api.get(`/questions/questions/?${params.toString()}`);
      setQuestions(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'numerical':
        return <Calculator className="w-4 h-4 text-green-600" />;
      case 'subjective':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Type className="w-4 h-4 text-slate-600" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'bg-blue-100 text-blue-700';
      case 'numerical':
        return 'bg-green-100 text-green-700';
      case 'subjective':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/questions/questions/${questionId}/`);
      setQuestions(questions.filter(question => question.id !== questionId));
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleDuplicateQuestion = async (question: Question) => {
    try {
      const duplicateData = {
        ...question,
        title: `${question.title} (Copy)`,
      };
      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;
      delete duplicateData.created_by;

      const response = await api.post('/questions/questions/', duplicateData);
      navigate(`/questions/${response.data.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate question:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Question Bank</h1>
              <p className="text-slate-600 mt-1">Create, manage, and organize your question library</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/questions/import"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </Link>
              <Link
                to="/questions/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Question
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Banks</option>
                {questionBanks.map((bank) => (
                  <option key={bank.id} value={bank.id.toString()}>
                    {bank.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="mcq">MCQ</option>
                <option value="numerical">Numerical</option>
                <option value="subjective">Subjective</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="difficulty-asc">Difficulty</option>
                <option value="marks-desc">Highest Marks</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Questions</p>
                <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">MCQ Questions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {questions.filter(q => q.question_type === 'mcq').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Numerical Questions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {questions.filter(q => q.question_type === 'numerical').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Verified Questions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {questions.filter(q => q.is_verified).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-2xl border border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No questions found</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first question.'}
              </p>
              <Link
                to="/questions/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Question
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{question.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.question_type)}`}>
                          {getQuestionTypeIcon(question.question_type)}
                          {question.question_type.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          <Star className="w-3 h-3" />
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                        {question.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="text-slate-600 mb-4 line-clamp-2">
                        {question.content.length > 200 
                          ? `${question.content.substring(0, 200)}...` 
                          : question.content
                        }
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{question.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{question.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{question.marks} marks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-600">{question.created_by.first_name}</span>
                        </div>
                      </div>

                      {question.options && question.options.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-slate-900 mb-2">Options</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {question.options.map((option) => (
                              <div key={option.id} className={`p-2 rounded-lg text-sm ${
                                option.is_correct ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'
                              }`}>
                                {option.text}
                                {option.is_correct && (
                                  <CheckCircle className="w-3 h-3 inline ml-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-slate-500">
                        Created {formatDate(question.created_at)} • Bank: {question.question_bank.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        to={`/questions/${question.id}`}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      <Link
                        to={`/questions/${question.id}/edit`}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Edit Question"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      <div className="relative group">
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleDuplicateQuestion(question)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Duplicate
                            </button>
                            <Link
                              to={`/questions/${question.id}/verify`}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Verify
                            </Link>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
