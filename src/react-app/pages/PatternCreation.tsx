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
  Eye,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api, useApi } from '../hooks/useApi';
import { MarkingScheme } from '../../shared/types';
import MarkingSchemeConfig from '../components/MarkingSchemeConfig';

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
  question_type: 'Single Correct MCQ' | 'Multiple Correct MCQ' | 'Numerical' | 'Subjective' | 'True/False' | 'Fill in the Blanks';
  start_question: number | string;
  end_question: number | string;
  min_questions_to_attempt: number | string;
  is_compulsory: boolean;
  order: number;
  marking_scheme: MarkingScheme;
}

interface SubjectWithSections {
  name: string;
  sections: PatternSection[];
}

interface ExamPattern {
  id?: number;
  name: string;
  description: string;
  total_questions: number | string;
  total_marks: number | string;
  total_duration: number | string;
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
  const [marksValidationError, setMarksValidationError] = useState('');
  
  const [pattern, setPattern] = useState<ExamPattern>({
    name: '',
    description: '',
    total_questions: '',
    total_marks: '',
    total_duration: '',
    is_active: true,
    sections: [],
  });

  const [nextSectionOrder, setNextSectionOrder] = useState(1);
  
  // Subject management state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState('');
  const [showAvailableSubjects, setShowAvailableSubjects] = useState(false);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  const isEditing = Boolean(id);

  // Fetch subjects
  const { data: subjectsData, refetch: refetchSubjects } = useApi<{results: Subject[]}>('/patterns/subjects/');

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
    
    // Clear marks validation error when total marks change
    if (field === 'total_marks' && marksValidationError) {
      setMarksValidationError('');
    }
  };

  // Handle subject input change with autocomplete
  const handleSubjectInputChange = (value: string) => {
    setNewSubjectName(value);
    
    if (value.trim().length > 0 && subjectsData?.results) {
      const filtered = subjectsData.results.filter(subject =>
        subject.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSubjects(filtered);
      setShowSubjectSuggestions(filtered.length > 0);
    } else {
      setFilteredSubjects([]);
      setShowSubjectSuggestions(false);
    }
  };

  // Handle subject selection from suggestions - directly add section
  const handleSubjectSelect = (subjectName: string) => {
    // Clear the input and suggestions
    setNewSubjectName('');
    setShowSubjectSuggestions(false);
    setFilteredSubjects([]);
    setSubjectError('');
    
    // Directly add a section with this subject (don't create new subject)
    addSectionToSubject(subjectName);
  };

  // Calculate total marks from all sections
  const calculateTotalSectionMarks = () => {
    return pattern.sections.reduce((total, section) => {
      const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
      const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
      const questionsInSection = endQ - startQ + 1;
      const sectionMarks = questionsInSection * section.marking_scheme.max_marks;
      return total + sectionMarks;
    }, 0);
  };

  // Validate marks consistency
  const validateMarks = () => {
    const calculatedMarks = calculateTotalSectionMarks();
    const totalMarks = typeof pattern.total_marks === 'string' ? parseInt(pattern.total_marks) || 0 : pattern.total_marks;
    
    // Only validate if total_marks is not empty
    if (pattern.total_marks && pattern.total_marks !== '' && calculatedMarks !== totalMarks) {
      setMarksValidationError(
        `Marks mismatch! Total marks: ${totalMarks}, Calculated from sections: ${calculatedMarks}`
      );
      return false;
    } else {
      setMarksValidationError('');
      return true;
    }
  };

  // Calculate next available question number
  const getNextQuestionNumber = () => {
    if (pattern.sections.length === 0) {
      return 1; // First section starts from question 1
    }
    
    // Find the highest end_question number
    const maxEndQuestion = Math.max(...pattern.sections.map(section => 
      typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question
    ));
    return maxEndQuestion + 1;
  };

  // Calculate suggested end question for a given start question and questions count
  const getSuggestedEndQuestion = (startQuestion: number, questionsCount: number = 5) => {
    return startQuestion + questionsCount - 1;
  };

  // Handle removing a subject
  const handleRemoveSubject = async (subjectId: number, subjectName: string) => {
    if (!confirm(`Are you sure you want to remove "${subjectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/patterns/subjects/${subjectId}/`);
      
      // Refresh subjects data
      await refetchSubjects();
      
      // Remove any sections that belong to this subject
      setPattern(prev => ({
        ...prev,
        sections: prev.sections.filter(section => section.subject !== subjectName)
      }));
      
      console.log('Subject removed successfully');
    } catch (error: any) {
      console.error('Failed to remove subject:', error);
      alert(error.response?.data?.error || 'Failed to remove subject. Please try again.');
    }
  };

  // Handle adding a new subject
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      setSubjectError('Subject name is required');
      return;
    }

    // Check if subject already exists
    const existingSubject = subjectsData?.results?.find(
      subject => subject.name.toLowerCase() === newSubjectName.trim().toLowerCase()
    );
    
    if (existingSubject) {
      setSubjectError('Subject already exists');
      return;
    }

    try {
      setAddingSubject(true);
      setSubjectError('');
      
      const response = await api.post('/patterns/subjects/', {
        name: newSubjectName.trim(),
        description: `Subject for ${newSubjectName.trim()}`,
        is_active: true
      });

      // Clear the input
      setNewSubjectName('');
      
      // Refresh subjects data by refetching
      refetchSubjects();
      
      // Automatically add a section for the new subject
      setTimeout(() => {
        addSectionToSubject(newSubjectName.trim());
      }, 200);
      
    } catch (error: any) {
      console.error('Failed to add subject:', error);
      setSubjectError(error.response?.data?.name?.[0] || 'Failed to add subject. Please try again.');
    } finally {
      setAddingSubject(false);
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
    const nextStartQuestion = getNextQuestionNumber();
    const suggestedEndQuestion = getSuggestedEndQuestion(nextStartQuestion, 5);
    
    const defaultMarkingScheme: MarkingScheme = {
      max_marks: 1,
      negative_marks: 0,
      partial_marking: false,
      marks_per_correct_option: 0,
      tolerance_range: 0,
      decimal_precision: 2,
      manual_grading: false,
    };

    const newSection: PatternSection = {
      name: '',
      subject: subjectName,
      question_type: 'Single Correct MCQ',
      start_question: nextStartQuestion,
      end_question: suggestedEndQuestion,
      min_questions_to_attempt: 5,
      is_compulsory: true,
      order: nextSectionOrder,
      marking_scheme: defaultMarkingScheme,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Add unique ID
    };

    setPattern(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setNextSectionOrder(prev => prev + 1);

    // Scroll to the newly created section after a short delay
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section-id="${newSection.id}"]`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a subtle highlight effect
        sectionElement.classList.add('ring-2', 'ring-blue-300', 'ring-opacity-50');
        setTimeout(() => {
          sectionElement.classList.remove('ring-2', 'ring-blue-300', 'ring-opacity-50');
        }, 2000);
      }
    }, 200);
  };

  // Real-time validation for individual section fields
  const validateSectionField = (index: number, field: keyof PatternSection, value: any, updatedSection?: PatternSection) => {
    // Use updated section if provided, otherwise fall back to current pattern state
    const section = updatedSection || pattern.sections[index];
    if (!section) return;

    let errorMessage = '';

    if (field === 'start_question' || field === 'end_question') {
      const startQ = field === 'start_question' ? 
        (typeof value === 'string' ? parseInt(value) || 0 : value) :
        (typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question);
      
      const endQ = field === 'end_question' ? 
        (typeof value === 'string' ? parseInt(value) || 0 : value) :
        (typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question);

      if (startQ >= endQ) {
        errorMessage = 'Start question must be less than end question';
      }
    }

    if (field === 'min_questions_to_attempt') {
      const minQuestions = typeof value === 'string' ? parseInt(value) || 0 : value;
      const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
      const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
      const totalQuestions = endQ - startQ + 1;

      if (minQuestions > totalQuestions) {
        errorMessage = `Minimum questions (${minQuestions}) cannot be greater than total questions (${totalQuestions})`;
      } else if (minQuestions < 0) {
        errorMessage = 'Minimum questions cannot be negative';
      }
    }

    // Update section errors
    setSectionErrors(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: errorMessage
      }
    }));
  };

  const updateSection = (index: number, field: keyof PatternSection, value: any) => {
    setPattern(prev => {
      const updatedSections = [...prev.sections];
      updatedSections[index] = { ...updatedSections[index], [field]: value };
      
      // Auto-update subsequent sections' start_question when end_question changes
      if (field === 'end_question') {
        let currentEndQuestion = typeof value === 'string' ? parseInt(value) || 0 : value;
        for (let i = index + 1; i < updatedSections.length; i++) {
          const nextStartQuestion = currentEndQuestion + 1;
          updatedSections[i] = { 
            ...updatedSections[i], 
            start_question: nextStartQuestion 
          };
          // Update end_question to maintain the same number of questions
          const currentStartQ = typeof updatedSections[i].start_question === 'string' ? parseInt(updatedSections[i].start_question) || 0 : updatedSections[i].start_question;
          const currentEndQ = typeof updatedSections[i].end_question === 'string' ? parseInt(updatedSections[i].end_question) || 0 : updatedSections[i].end_question;
          const questionsInSection = currentEndQ - currentStartQ + 1;
          updatedSections[i] = { 
            ...updatedSections[i], 
            end_question: nextStartQuestion + questionsInSection - 1 
          };
          currentEndQuestion = nextStartQuestion + questionsInSection - 1;
        }
      }
      
      return {
        ...prev,
        sections: updatedSections
      };
    });

    // Clear section error
    if (sectionErrors[index]?.[field]) {
      setSectionErrors(prev => ({
        ...prev,
        [index]: { ...prev[index], [field]: '' },
      }));
    }

    // Trigger real-time validation for section fields
    if (field === 'start_question' || field === 'end_question' || field === 'min_questions_to_attempt') {
      // Use a longer timeout to ensure state is updated
      setTimeout(() => {
        validateSectionField(index, field, value);
      }, 200);
    }

    // Trigger marks validation when relevant fields change
    if (field === 'start_question' || field === 'end_question' || field === 'marking_scheme') {
      setTimeout(() => {
        validateMarks();
      }, 100);
    }
  };

  const removeSection = (index: number) => {
    setPattern(prev => {
      const updatedSections = prev.sections.filter((_, i) => i !== index);
      
      // Recalculate question numbers for remaining sections
      let currentQuestion = 1;
      const recalculatedSections = updatedSections.map(section => {
        const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
        const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
        const questionsInSection = endQ - startQ + 1;
        const newSection = {
          ...section,
          start_question: currentQuestion,
          end_question: currentQuestion + questionsInSection - 1
        };
        currentQuestion += questionsInSection;
        return newSection;
      });
      
      return {
        ...prev,
        sections: recalculatedSections
      };
    });

    // Clear section errors
    if (sectionErrors[index]) {
      setSectionErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!pattern.name.trim()) {
      newErrors.name = 'Pattern name is required';
    }

    if (!pattern.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const totalQuestionsNum = typeof pattern.total_questions === 'string' ? parseInt(pattern.total_questions) : pattern.total_questions;
    if (!pattern.total_questions || pattern.total_questions === '' || totalQuestionsNum <= 0) {
      newErrors.total_questions = 'Total questions must be greater than 0';
    }

    const totalMarksNum = typeof pattern.total_marks === 'string' ? parseInt(pattern.total_marks) : pattern.total_marks;
    if (!pattern.total_marks || pattern.total_marks === '' || totalMarksNum <= 0) {
      newErrors.total_marks = 'Total marks must be greater than 0';
    }

    const totalDurationNum = typeof pattern.total_duration === 'string' ? parseInt(pattern.total_duration) : pattern.total_duration;
    if (!pattern.total_duration || pattern.total_duration === '' || totalDurationNum <= 0) {
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

      const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
      const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
      
      if (startQ >= endQ) {
        sectionError.start_question = 'Start question must be less than end question';
      }

      // Validate min_questions_to_attempt
      const minQuestions = typeof section.min_questions_to_attempt === 'string' ? parseInt(section.min_questions_to_attempt) || 0 : section.min_questions_to_attempt;
      const totalQuestions = endQ - startQ + 1;
      if (minQuestions > totalQuestions) {
        sectionError.min_questions_to_attempt = `Minimum questions (${minQuestions}) cannot be greater than total questions (${totalQuestions})`;
      }
      if (minQuestions < 0) {
        sectionError.min_questions_to_attempt = 'Minimum questions cannot be negative';
      }

      // Check marking_scheme.max_marks instead of marks_per_question
      if (!section.marking_scheme || section.marking_scheme.max_marks <= 0) {
        sectionError.marking_scheme = 'Marks per question must be greater than 0';
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
    console.log('🔍 Starting validation...');
    const isValid = validateForm();
    const marksValid = validateMarks();
    console.log('✅ Validation result:', isValid);
    console.log('✅ Marks validation result:', marksValid);
    console.log('📋 Current errors:', errors);
    console.log('📋 Section errors:', sectionErrors);
    
    if (!isValid) {
      alert('Please fix all validation errors before saving.');
      return;
    }

    if (!marksValid) {
      alert('Please fix the marks mismatch before saving.');
      return;
    }

    setSaving(true);
    try {
      const patternData = {
        ...pattern,
        total_questions: typeof pattern.total_questions === 'string' ? parseInt(pattern.total_questions) || 0 : pattern.total_questions,
        total_marks: typeof pattern.total_marks === 'string' ? parseInt(pattern.total_marks) || 0 : pattern.total_marks,
        total_duration: typeof pattern.total_duration === 'string' ? parseInt(pattern.total_duration) || 0 : pattern.total_duration,
      };

      console.log('📤 Sending pattern data:', patternData);

      if (isEditing) {
        const response = await api.put(`/patterns/patterns/${id}/`, patternData);
        console.log('✅ Update response:', response.data);
      } else {
        const response = await api.post('/patterns/patterns/', patternData);
        console.log('✅ Create response:', response.data);
      }

      alert('Pattern saved successfully!');
      navigate('/patterns');
    } catch (error: any) {
      console.error('❌ Failed to save pattern:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save pattern. ';
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage += error.response.data.detail || error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage += error.response.data.detail;
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }
        setErrors(error.response.data);
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    console.log('🔍 Starting validation for publish...');
    const isValid = validateForm();
    
    if (!isValid) {
      alert('Please fix all validation errors before publishing.');
      return;
    }

    setSaving(true);
    try {
      const patternData = {
        ...pattern,
        is_active: true,
        total_questions: typeof pattern.total_questions === 'string' ? parseInt(pattern.total_questions) || 0 : pattern.total_questions,
        total_marks: typeof pattern.total_marks === 'string' ? parseInt(pattern.total_marks) || 0 : pattern.total_marks,
        total_duration: typeof pattern.total_duration === 'string' ? parseInt(pattern.total_duration) || 0 : pattern.total_duration,
      };

      console.log('📤 Publishing pattern data:', patternData);

      if (isEditing) {
        const response = await api.put(`/patterns/patterns/${id}/`, patternData);
        console.log('✅ Update response:', response.data);
      } else {
        const response = await api.post('/patterns/patterns/', patternData);
        console.log('✅ Create response:', response.data);
      }

      alert('Pattern published successfully!');
      navigate('/patterns');
    } catch (error: any) {
      console.error('❌ Failed to publish pattern:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Failed to publish pattern. ';
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage += error.response.data.detail || error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage += error.response.data.detail;
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }
        setErrors(error.response.data);
      } else {
        errorMessage += error.message || 'Unknown error';
      }
      
      alert(errorMessage);
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
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/patterns')}
            className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Pattern' : 'Create New Pattern'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">Design your exam pattern structure</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Form - Takes 3 columns */}
          <div className="xl:col-span-3 space-y-3 sm:space-y-4">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Pattern Information</h2>
                  <p className="text-xs text-slate-600">Basic details for your exam pattern</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pattern Name *
                  </label>
                  <input
                    type="text"
                    value={pattern.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300' : 'border-slate-300'
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
                    onChange={(e) => handleInputChange('total_questions', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      errors.total_questions ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="1"
                    max="500"
                    placeholder="Enter total questions"
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
                    onChange={(e) => handleInputChange('total_marks', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      errors.total_marks ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="1"
                    placeholder="Enter total marks"
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
                    onChange={(e) => handleInputChange('total_duration', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      errors.total_duration ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="1"
                    placeholder="Enter duration in minutes"
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
                  Description *
                </label>
                <textarea
                  value={pattern.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Describe the pattern structure and purpose..."
                  required
                />
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Add Subject Section */}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Add Subject</h3>
                      <p className="text-xs text-slate-500">Search existing or create new</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAvailableSubjects(!showAvailableSubjects)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    {showAvailableSubjects ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Hide Available Subjects
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show Available Subjects
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 relative">
                    <input
                      type="text"
                      value={newSubjectName}
                      onChange={(e) => handleSubjectInputChange(e.target.value)}
                      onFocus={() => {
                        if (newSubjectName.trim() && filteredSubjects.length > 0) {
                          setShowSubjectSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowSubjectSuggestions(false), 200);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Search existing (PHY, MAT) or type new subject name"
                    />
                    
                    {/* Autocomplete Suggestions Dropdown */}
                    {showSubjectSuggestions && filteredSubjects.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                          <p className="text-xs text-blue-700 font-medium">
                            Click to add section with this subject
                          </p>
                        </div>
                        {filteredSubjects.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => handleSubjectSelect(subject.name)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-green-50 hover:border-l-4 hover:border-l-green-500 transition-all flex items-center gap-2 border-b border-slate-100 last:border-b-0"
                          >
                            <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">{subject.name}</div>
                              {subject.description && (
                                <div className="text-xs text-slate-500 truncate">{subject.description}</div>
                              )}
                            </div>
                            <Plus className="w-4 h-4 text-green-600 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddSubject}
                    disabled={!newSubjectName.trim() || addingSubject}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    title="Create a new subject (or click suggestion above to use existing)"
                  >
                    {addingSubject ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create New
                      </>
                    )}
                  </button>
                </div>
                {subjectError && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {subjectError}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
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

            {/* Subject-Based Sections */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Pattern Structure</h2>
                  <p className="text-xs text-slate-600">Organize sections by subject • Questions auto-numbered sequentially</p>
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

              {/* Available Subjects - Collapsible */}
              {showAvailableSubjects && (
                <div className="mb-6" id="available-subjects-section">
                  <div className="transition-all duration-200 ease-in-out">
                    {subjectsData?.results && subjectsData.results.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {subjectsData.results.map((subject) => (
                          <div key={subject.id} className="relative group">
                            <button
                              onClick={() => addSectionToSubject(subject.name)}
                              className="w-full p-2 text-xs border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                            >
                              <div className="font-medium text-slate-700">{subject.name}</div>
                              <div className="text-slate-500">Add Section</div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSubject(subject.id, subject.name);
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="Remove subject"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <BookOpen className="w-4 h-4 text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-600 mb-1">No subjects available</p>
                        <p className="text-xs text-slate-500">Add subjects above to create pattern sections</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subject Groups */}
              <div className="space-y-4">
                {getSubjectsWithSections().map((subjectGroup, subjectIndex) => (
                  <div key={subjectIndex} data-subject-group className="border border-slate-200 rounded-lg p-4">
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
                          <div key={globalIndex} data-section-id={section.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Section Name</label>
                                <input
                                  type="text"
                                  value={section.name}
                                  onChange={(e) => updateSection(globalIndex, 'name', e.target.value)}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    sectionErrors[globalIndex]?.name ? 'border-red-300' : 'border-slate-300'
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
                                    const newType = e.target.value as PatternSection['question_type'];
                                    updateSection(globalIndex, 'question_type', newType);
                                    
                                    // Update marking scheme based on question type
                                    const updatedScheme = { ...section.marking_scheme };
                                    if (newType === 'Subjective') {
                                      updatedScheme.manual_grading = true;
                                      updatedScheme.negative_marks = 0;
                                    } else if (newType === 'Multiple Correct MCQ') {
                                      updatedScheme.partial_marking = true;
                                      updatedScheme.marks_per_correct_option = updatedScheme.max_marks / 2; // Default assumption
                                    } else if (newType === 'Numerical') {
                                      updatedScheme.tolerance_range = 0.1;
                                      updatedScheme.decimal_precision = 2;
                                    }
                                    updateSection(globalIndex, 'marking_scheme', updatedScheme);
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                                >
                                  <option value="Single Correct MCQ">Single Correct MCQ</option>
                                  <option value="Multiple Correct MCQ">Multiple Correct MCQ</option>
                                  <option value="Numerical">Numerical</option>
                                  <option value="Subjective">Subjective</option>
                                  <option value="True/False">True/False</option>
                                  <option value="Fill in the Blanks">Fill in the Blanks</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Start Q</label>
                                <input
                                  type="number"
                                  value={section.start_question}
                                  onChange={(e) => updateSection(globalIndex, 'start_question', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    sectionErrors[globalIndex]?.start_question ? 'border-red-300' : 'border-slate-300'
                                  }`}
                                  min="1"
                                />
                                {sectionErrors[globalIndex]?.start_question && (
                                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {sectionErrors[globalIndex].start_question}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">End Q</label>
                                <input
                                  type="number"
                                  value={section.end_question}
                                  onChange={(e) => updateSection(globalIndex, 'end_question', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    sectionErrors[globalIndex]?.end_question ? 'border-red-300' : 'border-slate-300'
                                  }`}
                                  min="1"
                                />
                                {sectionErrors[globalIndex]?.end_question && (
                                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {sectionErrors[globalIndex].end_question}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Min to Attempt</label>
                                <input
                                  type="number"
                                  value={section.min_questions_to_attempt}
                                  onChange={(e) => updateSection(globalIndex, 'min_questions_to_attempt', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                                  className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    sectionErrors[globalIndex]?.min_questions_to_attempt ? 'border-red-300' : 'border-slate-300'
                                  }`}
                                  min="0"
                                />
                                {sectionErrors[globalIndex]?.min_questions_to_attempt && (
                                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {sectionErrors[globalIndex].min_questions_to_attempt}
                                  </p>
                                )}
                              </div>

                            </div>

                            {/* Marking Scheme Configuration */}
                            <div className="mt-4">
                              <MarkingSchemeConfig
                                questionType={section.question_type}
                                markingScheme={section.marking_scheme}
                                onChange={(scheme) => updateSection(globalIndex, 'marking_scheme', scheme)}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  Questions {section.start_question}-{section.end_question}
                                </span>
                                <span>•</span>
                                <span>{(() => {
                                  const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
                                  const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
                                  return endQ - startQ + 1;
                                })()} questions</span>
                                {globalIndex === 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    <Zap className="w-3 h-3" />
                                    Auto-numbered
                                  </span>
                                )}
                              </div>
                              <div className="font-medium">
                                Total: {(() => {
                                  const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
                                  const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
                                  return (endQ - startQ + 1) * section.marking_scheme.max_marks;
                                })()} marks
                              </div>
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
          <div className="space-y-3 sm:space-y-4">
            {/* Pattern Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Pattern Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Total Questions</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.total_questions || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Total Marks</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.total_marks || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Duration</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{pattern.total_duration ? `${pattern.total_duration} min` : 'Not set'}</span>
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

            {/* Marks Summary */}
            {pattern.sections.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Marks Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Total:</span>
                    <span className="text-xs font-medium text-slate-900">{pattern.total_marks || 'Not set'} marks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Calculated:</span>
                    <span className="text-xs font-medium text-slate-900">{calculateTotalSectionMarks()} marks</span>
                  </div>
                  {marksValidationError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-600 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {marksValidationError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Actions - Fixed at bottom right */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg min-w-[140px] sm:min-w-[160px]"
          >
            <Save className="w-4 h-4" />
            <span className="whitespace-nowrap">{saving ? 'Saving...' : 'Save Pattern'}</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg min-w-[140px] sm:min-w-[180px]"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="whitespace-nowrap">{saving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
