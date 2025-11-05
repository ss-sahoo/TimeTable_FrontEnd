import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle,
  AlertCircle,
  BookOpen,
  Clock,
  Users,
  Calculator,
  FileText,
  Type,
  Hash,
  Zap,
  Eye
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api, useApi } from '../hooks/useApi';

interface Subject {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface PatternSection {
  id?: number;
  name: string;
  subject: string;
  question_type: 'mcq' | 'numerical' | 'subjective' | 'true_false' | 'fill_blank';
  start_question: number;
  end_question: number;
  marks_per_question: number;
  negative_marking: number;
  min_questions_to_attempt: number;
  is_compulsory: boolean;
  order: number;
}

interface SubjectWithSections {
  name: string;
  sections: PatternSection[];
}

interface ExamPattern {
  id?: number;
  name: string;
  description: string;
  total_questions: number;
  total_marks: number;
  total_duration: number;
  is_active: boolean;
  sections: PatternSection[];
}

export default function PatternCreation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<number, Record<string, string>>>({});
  
  const [pattern, setPattern] = useState<ExamPattern>({
    name: '',
    description: '',
    total_questions: 0,
    total_marks: 0,
    total_duration: 60,
    is_active: true,
    sections: [],
  });

  const [nextSectionOrder, setNextSectionOrder] = useState(1);

  const isEditing = Boolean(id);

  // Fetch subjects
  const { data: subjectsData } = useApi<{results: Subject[]}>('/patterns/subjects/');

  useEffect(() => {
    if (isEditing && id) {
      fetchPattern(id);
    }
  }, [id, isEditing]);

  const fetchPattern = async (patternId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/patterns/patterns/${patternId}/`);
      setPattern(response.data);
      setNextSectionOrder(response.data.sections.length + 1);
    } catch (error) {
      console.error('Failed to fetch pattern:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExamPattern, value: any) => {
    setPattern(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Helper function to group sections by subject
  const getSubjectsWithSections = (): SubjectWithSections[] => {
    const subjectMap = new Map<string, PatternSection[]>();
    
    pattern.sections.forEach(section => {
      if (!subjectMap.has(section.subject)) {
        subjectMap.set(section.subject, []);
      }
      subjectMap.get(section.subject)!.push(section);
    });

    return Array.from(subjectMap.entries()).map(([subjectName, sections]) => ({
      name: subjectName,
      sections: sections.sort((a, b) => a.order - b.order)
    }));
  };

  const addSectionToSubject = (subjectName: string) => {
    const newSection: PatternSection = {
      name: '',
      subject: subjectName,
      question_type: 'mcq',
      start_question: 1,
      end_question: 1,
      marks_per_question: 1,
      negative_marking: 0.25,
      min_questions_to_attempt: 0,
      is_compulsory: true,
      order: nextSectionOrder,
    };

    setPattern(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setNextSectionOrder(prev => prev + 1);
  };

  const addSection = () => {
    // This will be used for the old way - keeping for backward compatibility
    const newSection: PatternSection = {
      name: '',
      subject: '',
      question_type: 'mcq',
      start_question: 1,
      end_question: 1,
      marks_per_question: 1,
      negative_marking: 0.25,
      min_questions_to_attempt: 0,
      is_compulsory: true,
      order: nextSectionOrder,
    };

    setPattern(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setNextSectionOrder(prev => prev + 1);
  };

  const updateSection = (index: number, field: keyof PatternSection, value: any) => {
    setPattern(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      ),
    }));

    // Clear section error
    if (sectionErrors[index]?.[field]) {
      setSectionErrors(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: '' },
      }));
    }
  };

  const removeSection = (index: number) => {
    setPattern(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    const totalQuestions = pattern.sections.reduce((sum, section) => 
      sum + (section.end_question - section.start_question + 1), 0
    );
    const totalMarks = pattern.sections.reduce((sum, section) => 
      sum + ((section.end_question - section.start_question + 1) * section.marks_per_question), 0
    );

    setPattern(prev => ({
      ...prev,
      total_questions: totalQuestions,
      total_marks: totalMarks,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [pattern.sections]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newSectionErrors: Record<number, Record<string, string>> = {};

    if (!pattern.name.trim()) {
      newErrors.name = 'Pattern name is required';
    }

    if (!pattern.description.trim()) {
      newErrors.description = 'Pattern description is required';
    }

    if (pattern.total_duration <= 0) {
      newErrors.total_duration = 'Duration must be greater than 0';
    }

    if (pattern.sections.length === 0) {
      newErrors.sections = 'At least one section is required';
    }

    // Validate sections
    pattern.sections.forEach((section, index) => {
      const sectionError: Record<string, string> = {};

      if (!section.name.trim()) {
        sectionError.name = 'Section name is required';
      }

      if (!section.subject.trim()) {
        sectionError.subject = 'Subject is required';
      }

      if (section.start_question <= 0) {
        sectionError.start_question = 'Start question must be greater than 0';
      }

      if (section.end_question <= 0) {
        sectionError.end_question = 'End question must be greater than 0';
      }

      if (section.end_question < section.start_question) {
        sectionError.end_question = 'End question must be greater than or equal to start question';
      }

      if (section.marks_per_question <= 0) {
        sectionError.marks_per_question = 'Marks per question must be greater than 0';
      }

      if (Object.keys(sectionError).length > 0) {
        newSectionErrors[index] = sectionError;
      }
    });

    setErrors(newErrors);
    setSectionErrors(newSectionErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newSectionErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const patternData = {
        ...pattern,
        institute: user?.institute_id,
      };

      if (isEditing) {
        await api.put(`/patterns/patterns/${id}/`, patternData);
      } else {
        await api.post('/patterns/patterns/', patternData);
      }
      
      navigate('/patterns');
    } catch (error: any) {
      console.error('Failed to save pattern:', error);
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

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'bg-blue-100 text-blue-700';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/patterns')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {isEditing ? 'Edit Pattern' : 'Create New Pattern'}
              </h1>
              <p className="text-slate-600 mt-1">
                {isEditing ? 'Modify the exam pattern structure' : 'Define the structure and sections for your exam pattern'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
                  <p className="text-slate-600">Essential details for your exam pattern</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pattern Name *
                  </label>
                  <input
                    type="text"
                    value={pattern.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Enter pattern name..."
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={pattern.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                      errors.description ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Describe the exam pattern..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={pattern.total_duration}
                    onChange={(e) => handleInputChange('total_duration', parseInt(e.target.value) || 60)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.total_duration ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="1"
                  />
                  {errors.total_duration && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.total_duration}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Active Pattern</h4>
                    <p className="text-sm text-slate-600">Make this pattern available for use</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pattern.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Pattern Sections</h2>
                    <p className="text-slate-600">Define the structure of your exam</p>
                  </div>
                </div>
                <button
                  onClick={addSection}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>

              {errors.sections && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.sections}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {pattern.sections.map((section, index) => (
                  <div key={index} className="p-6 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-medium text-slate-600">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-medium text-slate-900">Section {index + 1}</h3>
                      </div>
                      <button
                        onClick={() => removeSection(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Section Name *
                        </label>
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) => updateSection(index, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            sectionErrors[index]?.name ? 'border-red-300' : 'border-slate-300'
                          }`}
                          placeholder="e.g., Physics, Mathematics"
                        />
                        {sectionErrors[index]?.name && (
                          <p className="text-red-600 text-xs mt-1">{sectionErrors[index].name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Subject *
                        </label>
                        <select
                          value={section.subject}
                          onChange={(e) => updateSection(index, 'subject', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            sectionErrors[index]?.subject ? 'border-red-300' : 'border-slate-300'
                          }`}
                        >
                          <option value="">Select a subject</option>
                          {subjectsData?.results?.map((subject) => (
                            <option key={subject.id} value={subject.name}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        {sectionErrors[index]?.subject && (
                          <p className="text-red-600 text-xs mt-1">{sectionErrors[index].subject}</p>
                        )}
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {/* TODO: Add create subject modal */}}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Create New Subject
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Question Type *
                        </label>
                        <select
                          value={section.question_type}
                          onChange={(e) => updateSection(index, 'question_type', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="mcq">Multiple Choice Questions</option>
                          <option value="numerical">Numerical Questions</option>
                          <option value="subjective">Subjective Questions</option>
                          <option value="true_false">True/False Questions</option>
                          <option value="fill_blank">Fill in the Blanks</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Marks per Question *
                        </label>
                        <input
                          type="number"
                          value={section.marks_per_question}
                          onChange={(e) => updateSection(index, 'marks_per_question', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            sectionErrors[index]?.marks_per_question ? 'border-red-300' : 'border-slate-300'
                          }`}
                          min="1"
                        />
                        {sectionErrors[index]?.marks_per_question && (
                          <p className="text-red-600 text-xs mt-1">{sectionErrors[index].marks_per_question}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Start Question *
                        </label>
                        <input
                          type="number"
                          value={section.start_question}
                          onChange={(e) => updateSection(index, 'start_question', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            sectionErrors[index]?.start_question ? 'border-red-300' : 'border-slate-300'
                          }`}
                          min="1"
                        />
                        {sectionErrors[index]?.start_question && (
                          <p className="text-red-600 text-xs mt-1">{sectionErrors[index].start_question}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          End Question *
                        </label>
                        <input
                          type="number"
                          value={section.end_question}
                          onChange={(e) => updateSection(index, 'end_question', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            sectionErrors[index]?.end_question ? 'border-red-300' : 'border-slate-300'
                          }`}
                          min="1"
                        />
                        {sectionErrors[index]?.end_question && (
                          <p className="text-red-600 text-xs mt-1">{sectionErrors[index].end_question}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Negative Marking
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={section.negative_marking}
                          onChange={(e) => updateSection(index, 'negative_marking', parseFloat(e.target.value) || 0.25)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          min="0"
                          max="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Min Questions to Attempt
                        </label>
                        <input
                          type="number"
                          value={section.min_questions_to_attempt}
                          onChange={(e) => updateSection(index, 'min_questions_to_attempt', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(section.question_type)}`}>
                          {getQuestionTypeIcon(section.question_type)}
                          {section.question_type.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-600">
                          Questions {section.start_question}-{section.end_question}
                        </span>
                        <span className="text-sm text-slate-600">
                          ({section.end_question - section.start_question + 1} questions)
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Total: {(section.end_question - section.start_question + 1) * section.marks_per_question} marks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Structure Preview */}
            {pattern.sections.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Pattern Structure Preview</h2>
                    <p className="text-slate-600">How your pattern will be organized</p>
                  </div>
                </div>

                <div className="space-y-3">
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
                      <div key={subject} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <h5 className="font-semibold text-slate-800">{subject}</h5>
                          <span className="text-sm text-slate-500">
                            (Q{sections[0].start_question}-{sections[sections.length - 1].end_question})
                          </span>
                        </div>
                        <div className="ml-5 space-y-2">
                          {sections.map((section: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-700">{section.name}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(section.question_type)}`}>
                                  {getQuestionTypeIcon(section.question_type)}
                                  {section.question_type.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Q{section.start_question}-{section.end_question}</span>
                                <span>•</span>
                                <span>{section.marks_per_question} marks</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pattern Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Pattern Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Total Questions</span>
                  </div>
                  <span className="font-medium text-slate-900">{pattern.total_questions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Total Marks</span>
                  </div>
                  <span className="font-medium text-slate-900">{pattern.total_marks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Duration</span>
                  </div>
                  <span className="font-medium text-slate-900">{pattern.total_duration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Sections</span>
                  </div>
                  <span className="font-medium text-slate-900">{pattern.sections.length}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : (isEditing ? 'Update Pattern' : 'Create Pattern')}
                </button>

                <button
                  onClick={() => navigate('/patterns')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Pattern Guidelines</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Each section should have unique question ranges</li>
                    <li>• Question numbers should be sequential</li>
                    <li>• Total questions will be calculated automatically</li>
                    <li>• Marks will be calculated based on questions × marks per question</li>
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
