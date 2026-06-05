import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  BookOpen,
  Calculator,
  FileText,
  Type,
  Hash,
  Image,
  Upload,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import RichTextEditor from '../components/RichTextEditor';

interface QuestionOption {
  id?: number;
  text: string;
  is_correct: boolean;
  order: number;
}

interface Question {
  id?: number;
  question_text: string;
  question_type: 'mcq' | 'numerical' | 'subjective' | 'true_false' | 'fill_blank';
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  explanation: string;
  options: QuestionOption[];
  correct_answer: string;
  image_url?: string;
  pattern_section_id?: number;
  created_by?: number;
  institute?: number;
}

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  question_type: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
}

interface ExamPattern {
  id: number;
  name: string;
  sections: PatternSection[];
}

export default function QuestionCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const { patternId, sectionId } = useParams();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [optionErrors, setOptionErrors] = useState<Record<number, string>>({});

  const [pattern, setPattern] = useState<ExamPattern | null>(null);
  const [selectedSection, setSelectedSection] = useState<PatternSection | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [question, setQuestion] = useState<Question>({
    question_text: '',
    question_type: 'mcq',
    subject: '',
    difficulty: 'medium',
    marks: 1,
    negative_marks: 0.25,
    explanation: '',
    options: [
      { text: '', is_correct: false, order: 1 },
      { text: '', is_correct: false, order: 2 },
      { text: '', is_correct: false, order: 3 },
      { text: '', is_correct: false, order: 4 }
    ],
    correct_answer: '',
    pattern_section_id: sectionId ? parseInt(sectionId) : undefined,
  });

  useEffect(() => {
    if (patternId) {
      fetchPattern();
    }
    fetchSubjects();
  }, [patternId]);

  useEffect(() => {
    if (pattern && sectionId) {
      const section = pattern.sections.find(s => s.id === parseInt(sectionId));
      if (section) {
        setSelectedSection(section);
        setQuestion(prev => ({
          ...prev,
          question_type: section.question_type as any,
          subject: section.subject,
          marks: section.marks_per_question,
          pattern_section_id: section.id,
        }));
      }
    }
  }, [pattern, sectionId]);

  const fetchPattern = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patterns/patterns/${patternId}/`);
      setPattern(response.data);
    } catch (error) {
      console.error('Failed to fetch pattern:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/patterns/subjects/');
      setSubjects(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleInputChange = (field: keyof Question, value: any) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: any) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    }));
    if (optionErrors[index]) {
      setOptionErrors(prev => ({ ...prev, [index]: '' }));
    }
  };

  const addOption = () => {
    setQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', is_correct: false, order: prev.options.length + 1 }]
    }));
  };

  const removeOption = (index: number) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
    setOptionErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const setCorrectOption = (index: number) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        is_correct: i === index
      }))
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newOptionErrors: Record<number, string> = {};

    if (!question.question_text.trim()) {
      newErrors.question_text = 'Question text is required';
    }

    if (!question.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (question.marks <= 0) {
      newErrors.marks = 'Marks must be greater than 0';
    }

    if (question.negative_marks < 0) {
      newErrors.negative_marks = 'Negative marks cannot be negative';
    }

    // Validate options for MCQ and True/False
    if (question.question_type === 'mcq' || question.question_type === 'true_false') {
      const validOptions = question.options.filter(opt => opt.text.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }

      const correctOptions = question.options.filter(opt => opt.is_correct);
      if (correctOptions.length === 0) {
        newErrors.options = 'At least one correct option is required';
      }

      question.options.forEach((option, index) => {
        if (!option.text.trim()) {
          newOptionErrors[index] = 'Option text is required';
        }
      });
    }

    // Validate correct answer for numerical and fill_blank
    if ((question.question_type === 'numerical' || question.question_type === 'fill_blank') && !question.correct_answer.trim()) {
      newErrors.correct_answer = 'Correct answer is required';
    }

    setErrors(newErrors);
    setOptionErrors(newOptionErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newOptionErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const questionData = {
        ...question,
        created_by: user?.id,
        institute: user?.institute_id,
      };

      await api.post('/questions/questions/', questionData);
      navigate(`${basePath}/patterns/${patternId}`);
    } catch (error: any) {
      console.error('Failed to create question:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pattern...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`${basePath}/patterns/${patternId}`)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Question</h1>
            <p className="text-sm text-slate-600">
              {pattern && selectedSection
                ? `Add question to ${selectedSection.name} in ${pattern.name}`
                : 'Create a new question for your pattern'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Question Type & Basic Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Question Details</h2>
                  <p className="text-xs text-slate-600">Basic information and type</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Question Type</label>
                  <select
                    value={question.question_type}
                    onChange={(e) => handleInputChange('question_type', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={!!selectedSection}
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="numerical">Numerical</option>
                    <option value="subjective">Subjective</option>
                    <option value="true_false">True/False</option>
                    <option value="fill_blank">Fill in the Blanks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={question.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.subject ? 'border-red-300' : 'border-slate-300'
                      }`}
                    disabled={!!selectedSection}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={question.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Marks *</label>
                  <input
                    type="number"
                    value={question.marks}
                    onChange={(e) => handleInputChange('marks', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.marks ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="1"
                  />
                  {errors.marks && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.marks}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.01"
                    value={question.negative_marks}
                    onChange={(e) => handleInputChange('negative_marks', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.negative_marks ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="0"
                  />
                  {errors.negative_marks && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.negative_marks}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Question Text</h2>
                  <p className="text-xs text-slate-600">Enter your question content</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Question *</label>
                <RichTextEditor
                  value={question.question_text}
                  onChange={(value) => handleInputChange('question_text', value)}
                  placeholder="Enter your question here... You can use LaTeX for mathematical expressions: $x^2 + y^2 = z^2$"
                  className={errors.question_text ? 'border-red-300' : ''}
                />
                {errors.question_text && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.question_text}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">Question Image (Optional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                  <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-2">Click to upload or drag and drop</p>
                  <button className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors">
                    <Upload className="w-3 h-3" />
                    Choose File
                  </button>
                </div>
              </div>
            </div>

            {/* Options for MCQ and True/False */}
            {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Answer Options</h2>
                      <p className="text-xs text-slate-600">Add options and mark the correct one</p>
                    </div>
                  </div>
                  <button
                    onClick={addOption}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Option
                  </button>
                </div>

                {errors.options && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.options}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                      <button
                        onClick={() => setCorrectOption(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${option.is_correct
                          ? 'border-green-500 bg-green-500'
                          : 'border-slate-300 hover:border-slate-400'
                          }`}
                      >
                        {option.is_correct && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <RichTextEditor
                          value={option.text}
                          onChange={(value) => handleOptionChange(index, 'text', value)}
                          placeholder={`Option ${index + 1} - Use LaTeX for equations: $x^2$`}
                          className={optionErrors[index] ? 'border-red-300' : ''}
                        />
                      </div>
                      {question.options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correct Answer for Numerical and Fill Blank */}
            {(question.question_type === 'numerical' || question.question_type === 'fill_blank') && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Correct Answer</h2>
                    <p className="text-xs text-slate-600">Enter the correct answer</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Answer *</label>
                  <RichTextEditor
                    value={question.correct_answer}
                    onChange={(value) => handleInputChange('correct_answer', value)}
                    placeholder={question.question_type === 'numerical' ? 'Enter numerical value with LaTeX: $3.2 \\times 10^{-17}$ J' : 'Enter the correct text with LaTeX support'}
                    className={errors.correct_answer ? 'border-red-300' : ''}
                  />
                  {errors.correct_answer && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.correct_answer}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Info className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Explanation</h2>
                  <p className="text-xs text-slate-600">Provide explanation for the answer</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Explanation</label>
                <RichTextEditor
                  value={question.explanation}
                  onChange={(value) => handleInputChange('explanation', value)}
                  placeholder="Explain why this is the correct answer... Use LaTeX for mathematical expressions: $K.E = eV = 1.6 \\times 10^{-19} \\times 200 = 3.2 \\times 10^{-17}$ J"
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-4">
            {/* Question Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Question Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getQuestionTypeIcon(question.question_type)}
                    <span className="text-xs text-slate-600">Type</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900 capitalize">
                    {question.question_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Subject</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{question.subject || 'Not selected'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Marks</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{question.marks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Difficulty</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900 capitalize">{question.difficulty}</span>
                </div>
                {question.question_type === 'mcq' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">Options</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">{question.options.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pattern Info */}
            {pattern && selectedSection && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Pattern Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">Pattern</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">{pattern.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">Section</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">{selectedSection.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-600">Range</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900">
                      Q{selectedSection.start_question}-{selectedSection.end_question}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-3 h-3" />
                  {saving ? 'Creating...' : 'Create Question'}
                </button>

                <button
                  onClick={() => navigate(`${basePath}/patterns/${patternId}`)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">Question Guidelines</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Use clear and concise language</li>
                    <li>• Mark the correct option for MCQ</li>
                    <li>• Provide detailed explanations</li>
                    <li>• Use LaTeX for math expressions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
