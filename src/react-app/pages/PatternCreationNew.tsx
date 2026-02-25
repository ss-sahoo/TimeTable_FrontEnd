import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
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
  Eye,
  ChevronDown,
  Settings,
  X,
  Layers,
  Split,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import { api, useApi } from '../hooks/useApi';

interface Subject {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface QuestionConfiguration {
  is_nested: boolean;
  nested_type?: 'internal_choice' | 'multipart';
  description?: string;
  options?: Array<{
    label: string;
    description?: string;
    marks?: number;
    parts?: Array<{ label: string; marks: number; description?: string }>;
  }>;
  sub_questions?: Array<{ label: string; marks: number }>;
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
  question_configurations?: Record<string, QuestionConfiguration>;
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
  exam_mode: 'online' | 'offline_omr' | 'offline_subjective';
  omr_config: {
    candidate_fields: Array<{
      name: string;
      type: 'digits' | 'options-only';
      digits?: number;
      options?: any[];
    }>;
  };
}

export default function PatternCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const basePath = isSuperAdminPath ? '/superadmin' : '';
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<number, Record<string, string>>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Configuration Modal State
  const [activeConfig, setActiveConfig] = useState<{
    sectionIndex: number;
    questionNumber: number;
    config: QuestionConfiguration;
  } | null>(null);

  const [pattern, setPattern] = useState<ExamPattern>({
    name: '',
    description: '',
    total_questions: 0,
    total_marks: 0,
    total_duration: 60,
    is_active: true,
    sections: [],
    exam_mode: 'online',
    omr_config: {
      candidate_fields: [
        { name: 'Roll No', type: 'digits', digits: 8 },
        { name: 'Set', type: 'options-only', options: ['A', 'B', 'C', 'D'] }
      ]
    }
  });

  const [nextSectionOrder, setNextSectionOrder] = useState(1);

  const isEditing = Boolean(id);

  // Fetch subjects
  const { data: subjectsData } = useApi<{ results: Subject[] }>('/patterns/subjects/');

  useEffect(() => {
    if (isEditing && id) {
      fetchPattern(id);
    }
  }, [id, isEditing]);

  const normaliseSections = (sections: PatternSection[]): PatternSection[] =>
    sections.map(section => {
      const total = section.end_question - section.start_question + 1;
      return {
        ...section,
        min_questions_to_attempt: Math.max(total, 1),
        question_configurations: section.question_configurations || {},
      };
    });

  const fetchPattern = async (patternId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/patterns/patterns/${patternId}/`);
      setPattern({
        ...response.data,
        sections: normaliseSections(response.data.sections || []),
      });
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
      negative_marking: 1.0,
      min_questions_to_attempt: 1,
      is_compulsory: true,
      order: nextSectionOrder,
      question_configurations: {},
    };

    setPattern(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setNextSectionOrder(prev => prev + 1);
  };

  const updateSection = (index: number, field: keyof PatternSection, value: any) => {
    setPattern(prev => {
      const updatedSections = prev.sections.map((section, i) => {
        if (i !== index) return section;

        let updatedSection: PatternSection = { ...section, [field]: value };

        if (field === 'start_question' || field === 'end_question') {
          const startRaw = field === 'start_question' ? value : updatedSection.start_question;
          const endRaw = field === 'end_question' ? value : updatedSection.end_question;
          const start =
            typeof startRaw === 'number' ? startRaw : parseInt(String(startRaw), 10);
          const end =
            typeof endRaw === 'number' ? endRaw : parseInt(String(endRaw), 10);

          if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
            const total = (end - start) + 1;
            updatedSection = {
              ...updatedSection,
              min_questions_to_attempt: Math.max(total, 1),
            };
          }
        }

        return updatedSection;
      });

      return {
        ...prev,
        sections: updatedSections,
      };
    });

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

    // Clear section errors
    if (sectionErrors[index]) {
      setSectionErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const openConfigurationDrawer = (sectionIndex: number, questionNumber: number) => {
    const section = pattern.sections[sectionIndex];
    const existingConfig = section.question_configurations?.[questionNumber] || {
      is_nested: false,
      nested_type: 'internal_choice',
      options: [
        { label: 'Option A', parts: [{ label: 'a', marks: 1 }] },
        { label: 'Option B', marks: 1 }
      ],
      sub_questions: [{ label: 'i', marks: 1 }]
    };

    setActiveConfig({
      sectionIndex,
      questionNumber,
      config: existingConfig
    });
  };

  const saveConfiguration = () => {
    if (!activeConfig) return;

    setPattern(prev => {
      const updatedSections = [...prev.sections];
      const section = updatedSections[activeConfig.sectionIndex];

      updatedSections[activeConfig.sectionIndex] = {
        ...section,
        question_configurations: {
          ...section.question_configurations,
          [activeConfig.questionNumber]: activeConfig.config
        }
      };

      return { ...prev, sections: updatedSections };
    });

    setActiveConfig(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!pattern.name.trim()) {
      newErrors.name = 'Pattern name is required';
    }

    if (!pattern.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (pattern.total_duration <= 0) {
      newErrors.total_duration = 'Duration must be greater than 0';
    }

    if (pattern.sections.length === 0) {
      newErrors.sections = 'At least one section is required';
    }

    // Validate sections
    const newSectionErrors: Record<number, Record<string, string>> = {};
    pattern.sections.forEach((section, index) => {
      const sectionError: Record<string, string> = {};

      if (!section.name.trim()) {
        sectionError.name = 'Section name is required';
      }

      if (!section.subject.trim()) {
        sectionError.subject = 'Subject is required';
      }

      if (section.start_question >= section.end_question) {
        sectionError.start_question = 'Start question must be less than end question';
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const patternData = {
        ...pattern,
        total_questions: pattern.sections.reduce((sum, section) => sum + (section.end_question - section.start_question + 1), 0),
        total_marks: pattern.sections.reduce((sum, section) => sum + ((section.end_question - section.start_question + 1) * section.marks_per_question), 0),
      };

      if (isEditing) {
        await api.put(`/patterns/patterns/${id}/`, patternData);
        setToastMessage('Pattern Updated Successfully!');
      } else {
        await api.post('/patterns/patterns/', patternData);
        setToastMessage('Pattern Created Successfully!');
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate(`${basePath}/patterns`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to save pattern:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const patternData = {
        ...pattern,
        is_active: true,
        total_questions: pattern.sections.reduce((sum, section) => sum + (section.end_question - section.start_question + 1), 0),
        total_marks: pattern.sections.reduce((sum, section) => sum + ((section.end_question - section.start_question + 1) * section.marks_per_question), 0),
      };

      if (isEditing) {
        await api.put(`/patterns/patterns/${id}/`, patternData);
        setToastMessage('Pattern Updated & Published!');
      } else {
        await api.post('/patterns/patterns/', patternData);
        setToastMessage('Pattern Created & Published!');
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate(`${basePath}/patterns`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to publish pattern:', error);
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
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      case 'numerical':
        return <Calculator className="w-3 h-3 text-green-600" />;
      case 'subjective':
        return <FileText className="w-3 h-3 text-purple-600" />;
      case 'true_false':
        return <Type className="w-3 h-3 text-orange-600" />;
      case 'fill_blank':
        return <Hash className="w-3 h-3 text-red-600" />;
      default:
        return <Type className="w-3 h-3 text-slate-600" />;
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
    <div className="min-h-screen bg-slate-50 relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`${basePath}/patterns`)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Pattern' : 'Create New Pattern'}
            </h1>
            <p className="text-sm text-slate-600">Design your exam pattern structure</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Pattern Information</h2>
                  <p className="text-xs text-slate-600">Basic details for your exam pattern</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pattern Name *
                  </label>
                  <input
                    type="text"
                    value={pattern.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-300' : 'border-slate-300'
                      }`}
                    placeholder="e.g., JEE Main Pattern"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Total Questions *
                  </label>
                  <input
                    type="number"
                    value={pattern.total_questions}
                    onChange={(e) => handleInputChange('total_questions', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.total_questions ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="1"
                    max="500"
                  />
                  {errors.total_questions && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.total_questions}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    value={pattern.total_marks}
                    onChange={(e) => handleInputChange('total_marks', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.total_marks ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="1"
                  />
                  {errors.total_marks && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.total_marks}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    value={pattern.total_duration}
                    onChange={(e) => handleInputChange('total_duration', parseInt(e.target.value) || 60)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.total_duration ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="1"
                  />
                  {errors.total_duration && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.total_duration}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={pattern.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Describe the pattern structure and purpose..."
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">Active Pattern</label>
                  <p className="text-xs text-slate-500">Make this pattern available for use</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pattern.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Exam Mode & OMR Config */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Conduct & Evaluation</h2>
                  <p className="text-xs text-slate-600">Choose how exams using this pattern will be conducted</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Default Exam Mode
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'online', name: 'Online (Computer Based)', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 'offline_omr', name: 'Offline OMR-Based', icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
                      { id: 'offline_subjective', name: 'Offline Subjective', icon: Edit, color: 'text-orange-600', bg: 'bg-orange-50' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleInputChange('exam_mode', mode.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${pattern.exam_mode === mode.id
                          ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode.bg}`}>
                          <mode.icon className={`w-4 h-4 ${mode.color}`} />
                        </div>
                        <span className={`text-sm font-medium ${pattern.exam_mode === mode.id ? 'text-blue-700' : 'text-slate-700'}`}>
                          {mode.name}
                        </span>
                        {pattern.exam_mode === mode.id && (
                          <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {pattern.exam_mode === 'offline_omr' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        OMR Candidate Fields
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newFields = [...pattern.omr_config.candidate_fields, { name: 'New Field', type: 'digits', digits: 5 }];
                          handleInputChange('omr_config', { ...pattern.omr_config, candidate_fields: newFields });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Field
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {pattern.omr_config.candidate_fields.map((field, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => {
                                const newFields = [...pattern.omr_config.candidate_fields];
                                newFields[idx] = { ...field, name: e.target.value };
                                handleInputChange('omr_config', { ...pattern.omr_config, candidate_fields: newFields });
                              }}
                              className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 w-2/3"
                              placeholder="Field Name"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newFields = pattern.omr_config.candidate_fields.filter((_, i) => i !== idx);
                                handleInputChange('omr_config', { ...pattern.omr_config, candidate_fields: newFields });
                              }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={field.type}
                              onChange={(e) => {
                                const newFields = [...pattern.omr_config.candidate_fields];
                                const type = e.target.value as 'digits' | 'options-only';
                                newFields[idx] = {
                                  ...field,
                                  type,
                                  digits: type === 'digits' ? 5 : undefined,
                                  options: type === 'options-only' ? ['A', 'B', 'C', 'D'] : undefined
                                };
                                handleInputChange('omr_config', { ...pattern.omr_config, candidate_fields: newFields });
                              }}
                              className="text-xs border-slate-200 rounded-md py-1"
                            >
                              <option value="digits">Digits (Roll No, etc.)</option>
                              <option value="options-only">Options (Set, Category)</option>
                            </select>
                            {field.type === 'digits' ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 uppercase font-medium">Digits:</span>
                                <input
                                  type="number"
                                  value={field.digits}
                                  onChange={(e) => {
                                    const newFields = [...pattern.omr_config.candidate_fields];
                                    newFields[idx] = { ...field, digits: parseInt(e.target.value) || 1 };
                                    handleInputChange('omr_config', { ...pattern.omr_config, candidate_fields: newFields });
                                  }}
                                  className="w-12 text-xs border-slate-200 rounded-md py-1"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 overflow-hidden">
                                <span className="text-[10px] text-slate-500 uppercase font-medium">Options:</span>
                                <input
                                  type="text"
                                  value={field.options?.join(',')}
                                  onChange={(e) => {
                                    const newFields = [...pattern.omr_config.candidate_fields];
                                    newFields[idx] = { ...field, options: e.target.value.split(',').map(s => s.trim()) };
                                    handleInputChange('omr_config', { ...pattern.omr_config, candidate_fields: newFields });
                                  }}
                                  className="flex-1 min-w-0 text-xs border-slate-200 rounded-md py-1"
                                  placeholder="A,B,C,D"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subject-Based Sections */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Pattern Structure</h2>
                  <p className="text-xs text-slate-600">Organize sections by subject</p>
                </div>
              </div>

              {errors.sections && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.sections}
                  </p>
                </div>
              )}

              {/* Available Subjects */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Available Subjects</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {subjectsData?.results?.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => addSectionToSubject(subject.name)}
                      className="p-2 text-xs border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                    >
                      <div className="font-medium text-slate-700">{subject.name}</div>
                      <div className="text-slate-500">Add Section</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Groups */}
              <div className="space-y-4">
                {getSubjectsWithSections().map((subjectGroup, subjectIndex) => (
                  <div key={subjectIndex} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-slate-800 text-sm">{subjectGroup.name}</h4>
                        <span className="text-xs text-slate-500">
                          ({subjectGroup.sections.length} sections)
                        </span>
                      </div>
                      <button
                        onClick={() => addSectionToSubject(subjectGroup.name)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Section
                      </button>
                    </div>

                    <div className="space-y-2">
                      {subjectGroup.sections.map((section, sectionIndex) => {
                        const globalIndex = pattern.sections.findIndex(s => s === section);
                        return (
                          <div key={globalIndex} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-xs font-medium text-slate-600">
                                  {sectionIndex + 1}
                                </span>
                                <h5 className="text-sm font-medium text-slate-900">{section.name || 'Untitled Section'}</h5>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getQuestionTypeColor(section.question_type)}`}>
                                  {getQuestionTypeIcon(section.question_type)}
                                  {section.question_type.toUpperCase()}
                                </span>
                              </div>
                              <button
                                onClick={() => removeSection(globalIndex)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Section Name</label>
                                <input
                                  type="text"
                                  value={section.name}
                                  onChange={(e) => updateSection(globalIndex, 'name', e.target.value)}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${sectionErrors[globalIndex]?.name ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                  placeholder="Section name"
                                />
                                {sectionErrors[globalIndex]?.name && (
                                  <p className="text-red-600 text-xs mt-1">{sectionErrors[globalIndex].name}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Question Type</label>
                                <select
                                  value={section.question_type}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    updateSection(globalIndex, 'question_type', newType);
                                    // Set negative marking to 0 for subjective questions
                                    if (newType === 'subjective') {
                                      updateSection(globalIndex, 'negative_marking', 0);
                                    } else if (section.negative_marking === 0) {
                                      updateSection(globalIndex, 'negative_marking', 1.0);
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                                >
                                  <option value="mcq">MCQ</option>
                                  <option value="numerical">Numerical</option>
                                  <option value="subjective">Subjective</option>
                                  <option value="true_false">True/False</option>
                                  <option value="fill_blank">Fill Blank</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Start Q</label>
                                <input
                                  type="number"
                                  value={section.start_question}
                                  onChange={(e) => updateSection(globalIndex, 'start_question', parseInt(e.target.value) || 1)}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${sectionErrors[globalIndex]?.start_question ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                  min="1"
                                />
                                {sectionErrors[globalIndex]?.start_question && (
                                  <p className="text-red-600 text-xs mt-1">{sectionErrors[globalIndex].start_question}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">End Q</label>
                                <input
                                  type="number"
                                  value={section.end_question}
                                  onChange={(e) => updateSection(globalIndex, 'end_question', parseInt(e.target.value) || 1)}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${sectionErrors[globalIndex]?.end_question ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                  min="1"
                                />
                                {sectionErrors[globalIndex]?.end_question && (
                                  <p className="text-red-600 text-xs mt-1">{sectionErrors[globalIndex].end_question}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Marks/Q</label>
                                <input
                                  type="number"
                                  value={section.marks_per_question}
                                  onChange={(e) => updateSection(globalIndex, 'marks_per_question', parseInt(e.target.value) || 1)}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${sectionErrors[globalIndex]?.marks_per_question ? 'border-red-300' : 'border-slate-300'
                                    }`}
                                  min="1"
                                />
                                {sectionErrors[globalIndex]?.marks_per_question && (
                                  <p className="text-red-600 text-xs mt-1">{sectionErrors[globalIndex].marks_per_question}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Neg. Mark</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={section.negative_marking}
                                  onChange={(e) => updateSection(globalIndex, 'negative_marking', parseFloat(e.target.value) || 1.0)}
                                  className={`w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${section.question_type === 'subjective' ? 'bg-gray-50' : ''
                                    }`}
                                  min="0"
                                  max="10"
                                  disabled={section.question_type === 'subjective'}
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Min to Attempt</label>
                                <input
                                  type="number"
                                  value={section.min_questions_to_attempt}
                                  onChange={(e) => updateSection(globalIndex, 'min_questions_to_attempt', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                                  min="1"
                                  max={section.end_question - section.start_question + 1}
                                />
                              </div>
                            </div>

                            {/* Question Configuration Tiles for Subjective Questions */}
                            {section.question_type === 'subjective' && (
                              <div className="mt-3 border-t border-slate-200 pt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Settings className="w-3 h-3 text-slate-400" />
                                    <p className="text-xs font-medium text-slate-700">Configure Structure</p>
                                  </div>
                                  <span className="text-[10px] text-slate-400">Click a number to configure</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {Array.from({ length: section.end_question - section.start_question + 1 }, (_, i) => section.start_question + i).map(qNum => {
                                    const hasConfig = section.question_configurations?.[qNum]?.is_nested;
                                    return (
                                      <button
                                        key={qNum}
                                        onClick={() => openConfigurationDrawer(globalIndex, qNum)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors border ${hasConfig
                                          ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200'
                                          }`}
                                        title={hasConfig ? "Question has custom structure" : "Standard subjective question"}
                                      >
                                        {qNum}
                                        {hasConfig && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full border border-white transform translate-x-1/2 -translate-y-1/2"></div>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="mt-2 text-xs text-slate-400 text-right">
                              Total: {(section.end_question - section.start_question + 1) * section.marks_per_question} marks
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-4">
            {/* Pattern Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Pattern Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Total Questions</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.total_questions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Total Marks</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.total_marks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Duration</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.total_duration} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Sections</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.sections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Subjects</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{getSubjectsWithSections().length}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  {saving ? 'Publishing...' : 'Publish Pattern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Drawer/Modal */}
      <AnimatePresence>
        {activeConfig && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setActiveConfig(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Configure Question {activeConfig.questionNumber}</h3>
                  <p className="text-sm text-slate-500">Subjective question structure</p>
                </div>
                <button onClick={() => setActiveConfig(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Structural Toggle */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Nested Structure</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeConfig.config.is_nested}
                        onChange={(e) => setActiveConfig(prev => prev ? {
                          ...prev,
                          config: { ...prev.config, is_nested: e.target.checked }
                        } : null)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {!activeConfig.config.is_nested && (
                    <p className="text-sm text-purple-700">Enable this to add internal choices (OR) or multiple sub-parts (a, b, c).</p>
                  )}
                </div>

                {activeConfig.config.is_nested && (
                  <div className="space-y-6">
                    {/* Structure Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Structure Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveConfig(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, nested_type: 'internal_choice' }
                          } : null)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeConfig.config.nested_type === 'internal_choice'
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          <Split className="w-5 h-5" />
                          <span className="text-sm font-medium">Internal Choice (OR)</span>
                        </button>
                        <button
                          onClick={() => setActiveConfig(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, nested_type: 'multipart' }
                          } : null)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeConfig.config.nested_type === 'multipart'
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          <List className="w-5 h-5" />
                          <span className="text-sm font-medium">Multi-Part (a, b, c)</span>
                        </button>
                      </div>
                    </div>

                    {/* Internal Choice Config */}
                    {activeConfig.config.nested_type === 'internal_choice' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900">Options</h4>
                          <button
                            onClick={() => setActiveConfig(prev => {
                              if (!prev) return null;
                              const currentOptions = prev.config.options || [];
                              return {
                                ...prev,
                                config: {
                                  ...prev.config,
                                  options: [...currentOptions, { label: `Option ${String.fromCharCode(65 + currentOptions.length)}`, marks: 5 }]
                                }
                              };
                            })}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            + Add Option
                          </button>
                        </div>

                        {activeConfig.config.options?.map((option, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-700">{option.label}</span>
                              <input
                                type="number"
                                className="w-16 px-2 py-1 text-xs border rounded"
                                placeholder="Marks"
                                value={option.marks}
                                onChange={(e) => {
                                  const newMarks = parseInt(e.target.value) || 0;
                                  setActiveConfig(prev => {
                                    if (!prev) return null;
                                    const newOptions = [...(prev.config.options || [])];
                                    newOptions[idx] = { ...newOptions[idx], marks: newMarks };
                                    return { ...prev, config: { ...prev.config, options: newOptions } };
                                  });
                                }}
                              />
                            </div>

                            <div className="pl-2 border-l-2 border-slate-300 ml-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-slate-500">Sub-parts?</span>
                                <button
                                  className="text-xs text-blue-600"
                                  onClick={() => {
                                    setActiveConfig(prev => {
                                      if (!prev) return null;
                                      const newOptions = [...(prev.config.options || [])];
                                      const currentParts = newOptions[idx].parts || [];
                                      newOptions[idx] = {
                                        ...newOptions[idx],
                                        parts: [...currentParts, { label: String.fromCharCode(97 + currentParts.length), marks: 1 }]
                                      };
                                      return { ...prev, config: { ...prev.config, options: newOptions } };
                                    });
                                  }}
                                >
                                  + Add Part
                                </button>
                              </div>

                              {option.parts?.map((part, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono w-4">{part.label})</span>
                                  <input
                                    type="text"
                                    className="flex-1 px-2 py-1 text-xs border rounded"
                                    placeholder="Description (optional)"
                                    value={part.description || ''}
                                    onChange={(e) => {
                                      setActiveConfig(prev => {
                                        if (!prev) return null;
                                        const newOptions = [...(prev.config.options || [])];
                                        const newParts = [...(newOptions[idx].parts || [])];
                                        newParts[pIdx] = { ...newParts[pIdx], description: e.target.value };
                                        newOptions[idx] = { ...newOptions[idx], parts: newParts };
                                        return { ...prev, config: { ...prev.config, options: newOptions } };
                                      });
                                    }}
                                  />
                                  <input
                                    type="number"
                                    className="w-12 px-1 py-1 text-xs border rounded"
                                    value={part.marks}
                                    onChange={(e) => {
                                      setActiveConfig(prev => {
                                        if (!prev) return null;
                                        const newOptions = [...(prev.config.options || [])];
                                        const newParts = [...(newOptions[idx].parts || [])];
                                        newParts[pIdx] = { ...newParts[pIdx], marks: parseInt(e.target.value) || 0 };
                                        newOptions[idx] = { ...newOptions[idx], parts: newParts };
                                        return { ...prev, config: { ...prev.config, options: newOptions } };
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Multipart Config */}
                    {activeConfig.config.nested_type === 'multipart' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900">Sub-questions</h4>
                          <button
                            onClick={() => setActiveConfig(prev => {
                              if (!prev) return null;
                              const currentSubs = prev.config.sub_questions || [];
                              // Roman numerals simplistic generator or just a,b,c
                              const labels = ['i', 'ii', 'iii', 'iv', 'v'];
                              return {
                                ...prev,
                                config: {
                                  ...prev.config,
                                  sub_questions: [...currentSubs, { label: labels[currentSubs.length] || '?', marks: 2 }]
                                }
                              };
                            })}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            + Add Sub-question
                          </button>
                        </div>

                        {activeConfig.config.sub_questions?.map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-mono text-sm">
                              {sub.label}
                            </div>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 text-sm border rounded"
                              value={sub.marks}
                              onChange={(e) => {
                                setActiveConfig(prev => {
                                  if (!prev) return null;
                                  const newSubs = [...(prev.config.sub_questions || [])];
                                  newSubs[idx] = { ...newSubs[idx], marks: parseInt(e.target.value) || 0 };
                                  return { ...prev, config: { ...prev.config, sub_questions: newSubs } };
                                });
                              }}
                              placeholder="Marks"
                            />
                            <span className="text-sm text-slate-500">marks</span>
                            <button
                              onClick={() => {
                                setActiveConfig(prev => {
                                  if (!prev) return null;
                                  const newSubs = [...(prev.config.sub_questions || [])].filter((_, i) => i !== idx);
                                  return { ...prev, config: { ...prev.config, sub_questions: newSubs } };
                                });
                              }}
                              className="ml-auto text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={saveConfiguration}
                  className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
