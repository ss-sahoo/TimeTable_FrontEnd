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
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Layout,
  Settings,
  Split,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, useApi } from '../hooks/useApi';
import { MarkingScheme } from '../../shared/types';
import MarkingSchemeConfig from '../components/MarkingSchemeConfig';
import { toast } from "react-toastify";


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
  question_configurations?: Record<string, QuestionConfiguration>;
}

interface QuestionConfiguration {
  is_nested: boolean;
  nested_type?: 'internal_choice' | 'multipart' | 'mixed';
  description?: string;
  options?: Array<{
    label: string;
    description?: string;
    marks?: number;
    type?: 'compulsory' | 'choice_group';
    options?: Array<{
      label: string;
      marks: number;
      description?: string;
      sub_parts?: Array<{ label: string; marks: number; description?: string }>;
    }>;
    sub_parts?: Array<{ label: string; marks: number; description?: string }>;
  }>;
  sub_questions?: Array<{ label: string; marks: number; description?: string }>;
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

const SUBJECT_COLORS = [
  { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-800', accent: 'bg-blue-600', dot: 'bg-blue-500', shadow: 'shadow-blue-500/10' },
  { bg: 'bg-indigo-50/50', border: 'border-indigo-200', text: 'text-indigo-800', accent: 'bg-indigo-600', dot: 'bg-indigo-500', shadow: 'shadow-indigo-500/10' },
  { bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-800', accent: 'bg-purple-600', dot: 'bg-purple-500', shadow: 'shadow-purple-500/10' },
  { bg: 'bg-rose-50/50', border: 'border-rose-200', text: 'text-rose-800', accent: 'bg-rose-600', dot: 'bg-rose-500', shadow: 'shadow-rose-500/10' },
  { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-800', accent: 'bg-amber-600', dot: 'bg-amber-500', shadow: 'shadow-amber-500/10' },
  { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'bg-emerald-600', dot: 'bg-emerald-500', shadow: 'shadow-emerald-500/10' },
  { bg: 'bg-cyan-50/50', border: 'border-cyan-200', text: 'text-cyan-800', accent: 'bg-cyan-600', dot: 'bg-cyan-500', shadow: 'shadow-cyan-500/10' },
];

export default function PatternCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<number, Record<string, string>>>({});
  const [marksValidationError, setMarksValidationError] = useState('');

  // Configuration Modal State
  const [activeConfig, setActiveConfig] = useState<{
    sectionIndex: number;
    questionNumber: number;
    config: QuestionConfiguration;
  } | null>(null);

  const [pattern, setPattern] = useState<ExamPattern>({
    name: '',
    description: '',
    total_questions: '',
    total_marks: '',
    total_duration: '',
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

  // Subject management state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState('');
  const [showAvailableSubjects, setShowAvailableSubjects] = useState(false);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [recentlyAddedSubjects, setRecentlyAddedSubjects] = useState<Set<string>>(new Set());

  const isEditing = Boolean(id);

  // Fetch subjects
  const { data: subjectsData, refetch: refetchSubjects } = useApi<{ results: Subject[] }>('/patterns/subjects/');

  useEffect(() => {
    if (isEditing && id) {
      fetchPattern(id);
    }
  }, [id, isEditing]);

  const normaliseSections = (sections: PatternSection[]): PatternSection[] =>
    sections.map(section => {
      const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
      const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
      const total = endQ - startQ + 1;

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

    // Clear marks validation error when total marks change
    if (field === 'total_marks' && marksValidationError) {
      setMarksValidationError('');
    }
  };

  // Auto-calculate totals from sections
  useEffect(() => {
    const totalQs = pattern.sections.reduce((total, section) => {
      const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
      const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
      return total + Math.max(0, endQ - startQ + 1);
    }, 0);

    const calculatedMarks = pattern.sections.reduce((total, section) => {
      const startQ = typeof section.start_question === 'string' ? parseInt(section.start_question) || 0 : section.start_question;
      const endQ = typeof section.end_question === 'string' ? parseInt(section.end_question) || 0 : section.end_question;
      const questionsInSection = Math.max(0, endQ - startQ + 1);
      return total + (questionsInSection * (section.marking_scheme?.max_marks || 0));
    }, 0);

    // Only update if values actually changed to avoid unnecessary re-renders
    if (Number(pattern.total_questions) !== totalQs || Number(pattern.total_marks) !== calculatedMarks) {
      setPattern(prev => ({
        ...prev,
        total_questions: totalQs,
        total_marks: calculatedMarks
      }));
    }
  }, [pattern.sections]);

  // Handle subject input change with autocomplete
  const handleSubjectInputChange = (value: string) => {
    setNewSubjectName(value);

    if (value.trim().length > 0) {
      const results = subjectsData?.results || [];
      const filtered = results.filter(subject =>
        subject.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSubjects(filtered);
      setShowSubjectSuggestions(filtered.length > 0 || results.length === 0);
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


  // Calculate next available question number WITHIN A SPECIFIC SUBJECT
  const getNextQuestionNumberForSubject = (subjectName: string) => {
    // Filter sections for this specific subject
    const subjectSections = pattern.sections.filter(s => s.subject === subjectName);

    if (subjectSections.length === 0) {
      return 1; // First section of this subject starts from question 1
    }

    // Find the highest end_question number within THIS SUBJECT only
    const maxEndQuestion = Math.max(...subjectSections.map(section =>
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
      toast.error(error.response?.data?.error || 'Failed to remove subject. Please try again.');
    }
  };

  const openConfigurationDrawer = (sectionIndex: number, questionNumber: number) => {
    const section = pattern.sections[sectionIndex];
    const existingConfig = section.question_configurations?.[questionNumber] || {
      is_nested: false,
      nested_type: 'multipart',
      options: [
        { label: 'a', marks: 2, parts: [{ label: 'i', marks: 1 }] },
        { label: 'b', marks: 2 }
      ],
      sub_questions: []
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
      handleSubjectSelect(existingSubject.name);
      return;
    }

    try {
      setAddingSubject(true);
      setSubjectError('');

      await api.post('/patterns/subjects/', {
        name: newSubjectName.trim(),
        description: `Subject for ${newSubjectName.trim()}`,
        is_active: true
      });

      // Mark this subject as recently added (for visual highlighting)
      const subjectName = newSubjectName.trim();
      setRecentlyAddedSubjects(prev => new Set(prev).add(subjectName));

      // Clear the input
      setNewSubjectName('');

      // Refresh subjects data by refetching
      await refetchSubjects();

      // Automatically add a section for the new subject
      setTimeout(() => {
        addSectionToSubject(subjectName);
      }, 300);

    } catch (error: any) {
      console.error('Failed to add subject:', error);

      // Handle the case where the subject already exists on the server but wasn't in our local list
      if (error.response?.status === 400 &&
        (error.response.data?.name?.[0]?.toLowerCase().includes('already exists') ||
          error.response.data?.non_field_errors?.[0]?.toLowerCase().includes('already exists'))) {

        const subjectName = newSubjectName.trim();
        await refetchSubjects();
        handleSubjectSelect(subjectName);
      } else {
        setSubjectError(error.response?.data?.name?.[0] || error.response?.data?.error || 'Failed to add subject. Please try again.');
      }
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
    // Use SUBJECT-SPECIFIC question numbering (each subject starts from 1)
    const nextStartQuestion = getNextQuestionNumberForSubject(subjectName);
    const suggestedEndQuestion = getSuggestedEndQuestion(nextStartQuestion, 5);
    const totalQuestions = suggestedEndQuestion - nextStartQuestion + 1;

    const defaultMarkingScheme: MarkingScheme = {
      max_marks: 4,  // Default to 4 marks per question
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
      min_questions_to_attempt: Math.max(totalQuestions, 1),
      is_compulsory: true,
      order: nextSectionOrder,
      marking_scheme: defaultMarkingScheme,
    };

    setPattern(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setNextSectionOrder(prev => prev + 1);

    // Scroll to the subject group and highlight it
    setTimeout(() => {
      const subjectGroupElement = document.querySelector(`[data-subject-name="${subjectName}"]`);
      if (subjectGroupElement) {
        subjectGroupElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Add a subtle highlight effect to the whole subject group
        subjectGroupElement.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'transition-all', 'duration-500');
        setTimeout(() => {
          subjectGroupElement.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
        }, 3000);
      }
    }, 400); // Slightly longer delay to allow DOM to update with the new section
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
      let currentSection = { ...updatedSections[index], [field]: value };

      if (field === 'start_question' || field === 'end_question') {
        const startRaw = currentSection.start_question;
        const endRaw = currentSection.end_question;
        const startQ = typeof startRaw === 'number' ? startRaw : parseInt(String(startRaw), 10);
        const endQ = typeof endRaw === 'number' ? endRaw : parseInt(String(endRaw), 10);

        if (Number.isFinite(startQ) && Number.isFinite(endQ) && endQ >= startQ) {
          currentSection = {
            ...currentSection,
            min_questions_to_attempt: Math.max(endQ - startQ + 1, 1),
          };
        }
      }

      updatedSections[index] = currentSection;

      // REMOVED: Auto-update subsequent sections' start_question when end_question changes
      // This was causing automatic calculation - users should manually set end_question values

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
      // Logic for auto-calc is now handled via useEffect
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

      // Check for overlapping question ranges WITHIN THE SAME SUBJECT only
      pattern.sections.forEach((otherSection, otherIndex) => {
        if (otherIndex === index) return; // Skip self
        if (otherSection.subject !== section.subject) return; // Skip different subjects

        const otherStartQ = typeof otherSection.start_question === 'string' ? parseInt(otherSection.start_question) || 0 : otherSection.start_question;
        const otherEndQ = typeof otherSection.end_question === 'string' ? parseInt(otherSection.end_question) || 0 : otherSection.end_question;

        // Check for overlap within the same subject
        if ((startQ >= otherStartQ && startQ <= otherEndQ) || (endQ >= otherStartQ && endQ <= otherEndQ)) {
          sectionError.start_question = `Questions ${startQ}-${endQ} overlap with another section in ${section.subject}`;
        }
      });

      // Validate SUBJECT-WISE sequential numbering
      // Find previous section in the same subject
      const subjectSections = pattern.sections.filter(s => s.subject === section.subject);
      const indexInSubject = subjectSections.findIndex(s => s === section);

      if (indexInSubject > 0) {
        // Not the first section in this subject - should continue from previous section
        const prevSectionInSubject = subjectSections[indexInSubject - 1];
        const prevEndQ = typeof prevSectionInSubject.end_question === 'string' ? parseInt(prevSectionInSubject.end_question) || 0 : prevSectionInSubject.end_question;

        if (startQ !== prevEndQ + 1) {
          sectionError.start_question = `Should start from ${prevEndQ + 1} (previous ${section.subject} section ended at ${prevEndQ})`;
        }
      } else {
        // First section in this subject - should start from 1
        if (startQ !== 1) {
          sectionError.start_question = `First section of ${section.subject} should start from question 1`;
        }
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
    console.log('✅ Validation result:', isValid);
    console.log('📋 Current errors:', errors);
    console.log('📋 Section errors:', sectionErrors);

    if (!isValid) {
      toast.error("Please fix all validation errors before saving.");
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

      toast.success('Pattern saved successfully!');
      navigate(`${basePath}/patterns`);
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

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    console.log('🔍 Starting validation for publish...');
    const isValid = validateForm();

    if (!isValid) {
      toast.error('Please fix all validation errors before publishing.');
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

      toast.success('Pattern published successfully!');
      navigate(`${basePath}/patterns`);
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

      toast.error(errorMessage);
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => navigate(`${basePath}/patterns`)}
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
                    Total Questions
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={pattern.total_questions}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-bold cursor-not-allowed transition-all"
                      placeholder="Calculated from sections"
                    />
                    <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-10">
                      <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        Auto-calculated from sections below
                      </div>
                    </div>
                  </div>
                  {errors.total_questions && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.total_questions}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={pattern.total_marks}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-bold cursor-not-allowed transition-all"
                      placeholder="Calculated from sections"
                    />
                    <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-10">
                      <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        Auto-calculated from sections below
                      </div>
                    </div>
                  </div>
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
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.total_duration ? 'border-red-300' : 'border-slate-300'
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
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${errors.description ? 'border-red-300' : 'border-slate-300'
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

              {/* Conduct & Evaluation Section */}
              <div className="mt-6 border-t border-slate-100 pt-6">
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
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative group">
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
                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
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
                  <p className="text-xs text-slate-600">Organize sections by subject • Each subject starts from Question 1</p>
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
                {getSubjectsWithSections().map((subjectGroup, subjectIndex) => {
                  const isNewlyAdded = recentlyAddedSubjects.has(subjectGroup.name);
                  const colorScheme = SUBJECT_COLORS[subjectIndex % SUBJECT_COLORS.length];

                  return (
                    <div
                      key={subjectIndex}
                      data-subject-group
                      data-subject-name={subjectGroup.name}
                      className={`border rounded-2xl p-6 transition-all duration-500 relative overflow-hidden ${colorScheme.bg} ${colorScheme.border} ${colorScheme.shadow} ${isNewlyAdded ? 'ring-2 ring-green-400 ring-offset-2 scale-[1.01]' : 'shadow-lg'
                        }`}
                    >
                      {/* Decorative Background Element */}
                      <div className={`absolute top-0 right-0 w-32 h-32 ${colorScheme.accent} opacity-[0.03] rounded-bl-full -mr-8 -mt-8`}></div>

                      <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colorScheme.dot} animate-pulse`}></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold text-lg uppercase tracking-tight ${colorScheme.text}`}>
                                {subjectGroup.name}
                              </h4>
                              {isNewlyAdded && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce">
                                  <Zap className="w-2 h-2" />
                                  New
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {subjectGroup.sections.length} Sections
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Total Qs: {subjectGroup.sections.reduce((t, s) => {
                                  const startQ = typeof s.start_question === 'string' ? parseInt(s.start_question) || 0 : s.start_question;
                                  const endQ = typeof s.end_question === 'string' ? parseInt(s.end_question) || 0 : s.end_question;
                                  return t + (endQ - startQ + 1);
                                }, 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addSectionToSubject(subjectGroup.name)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-white rounded-md transition-colors ${isNewlyAdded
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
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
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Question</label>
                                  <input
                                    type="number"
                                    value={section.start_question}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      if (inputValue === '') {
                                        updateSection(globalIndex, 'start_question', '');
                                      } else {
                                        const numValue = parseInt(inputValue, 10);
                                        if (!isNaN(numValue) && numValue > 0) {
                                          updateSection(globalIndex, 'start_question', numValue);
                                        }
                                      }
                                    }}
                                    className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${sectionErrors[globalIndex]?.start_question ? 'border-red-300' : 'border-slate-300'
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
                                  <label className="block text-xs font-medium text-slate-600 mb-1">End Question</label>
                                  <input
                                    type="number"
                                    value={section.end_question}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      if (inputValue === '') {
                                        updateSection(globalIndex, 'end_question', '');
                                      } else {
                                        const numValue = parseInt(inputValue, 10);
                                        if (!isNaN(numValue) && numValue > 0) {
                                          updateSection(globalIndex, 'end_question', numValue);
                                        }
                                      }
                                    }}
                                    className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${sectionErrors[globalIndex]?.end_question ? 'border-red-300' : 'border-slate-300'
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
                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-slate-50 text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    readOnly
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

                              {/* Question Configuration Tiles for Subjective Questions */}
                              {section.question_type === 'Subjective' && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Settings className="w-3 h-3 text-slate-400" />
                                      <p className="text-xs font-medium text-slate-700">Configure Structure</p>
                                    </div>
                                    <span className="text-[10px] text-slate-400">Click a number to configure</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: (typeof section.end_question === 'string' ? parseInt(section.end_question) : section.end_question) - (typeof section.start_question === 'string' ? parseInt(section.start_question) : section.start_question) + 1 }, (_, i) => (typeof section.start_question === 'string' ? parseInt(section.start_question) : section.start_question) + i).map(qNum => {
                                      const hasConfig = section.question_configurations?.[qNum]?.is_nested;
                                      return (
                                        <button
                                          key={qNum}
                                          onClick={() => openConfigurationDrawer(globalIndex, qNum)}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors border relative ${hasConfig
                                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200'
                                            }`}
                                          title={hasConfig ? "Question has custom structure" : "Standard subjective question"}
                                        >
                                          {qNum}
                                          {hasConfig && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-white"></div>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

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
                                  {sectionIndex === 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs" title="Each subject starts from question 1">
                                      <Zap className="w-3 h-3" />
                                      Subject Q1
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
                  );
                })}
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

            {/* Live Skeleton Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[14px] text-blue-600" />
                  Live Skeleton
                </h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[12px] font-bold rounded-full uppercase tracking-tighter">
                  Real-time
                </span>
              </div>

              {pattern.sections.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-12 h-12 border-2 border-dashed border-slate-300 rounded-xl mb-2 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No sections yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {getSubjectsWithSections().map((subject, sIdx) => {
                    const colorScheme = SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length];
                    const totalQs = subject.sections.reduce((t, s) => {
                      const startQ = typeof s.start_question === 'string' ? parseInt(s.start_question) || 0 : s.start_question;
                      const endQ = typeof s.end_question === 'string' ? parseInt(s.end_question) || 0 : s.end_question;
                      return t + (endQ - startQ + 1);
                    }, 0);

                    return (
                      <div key={sIdx} className="relative pl-4">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100"></div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${colorScheme.dot}`}></div>
                          <span className="text-[12px] font-black uppercase text-slate-800 tracking-tight truncate max-w-[120px]">
                            {subject.name}
                          </span>
                          <span className="ml-auto text-[12px] font-bold text-slate-400">
                            {totalQs} Questions
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 ml-1">
                          {subject.sections.map((section, secIdx) => (
                            <div
                              key={secIdx}
                              onClick={() => {
                                const el = document.querySelector(`[data-section-id="${section.id}"]`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className="group cursor-pointer flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-300 hover:bg-white transition-all duration-300"
                            >
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-slate-700 truncate max-w-[100px]">
                                  {section.name || `Section ${secIdx + 1}`}
                                </span>
                                <span className="text-[12px] text-slate-400 font-medium">
                                  {section.question_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[12px] font-black text-slate-500 tracking-tighter">
                                  Question : {section.start_question}-{section.end_question}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Questions Distribution</span>
                  <span className="text-slate-800">{pattern.total_questions || 0} Total</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {getSubjectsWithSections().map((subject, sIdx) => {
                    const colorScheme = SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length];
                    const totalQs = subject.sections.reduce((t, s) => {
                      const startQ = typeof s.start_question === 'string' ? parseInt(s.start_question) || 0 : s.start_question;
                      const endQ = typeof s.end_question === 'string' ? parseInt(s.end_question) || 0 : s.end_question;
                      return t + (endQ - startQ + 1);
                    }, 0);
                    const totalPatternQs = typeof pattern.total_questions === 'string' ? parseInt(pattern.total_questions) || 0 : pattern.total_questions;
                    const width = (totalQs / (totalPatternQs || 1)) * 100;
                    if (width === 0) return null;
                    return (
                      <div
                        key={sIdx}
                        className={`${colorScheme.accent} h-full transition-all duration-500`}
                        style={{ width: `${width}%` }}
                        title={`${subject.name}: ${totalQs} Questions`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1.5">Pattern Summary</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-blue-500" />
                  <span className="text-sm font-bold text-slate-800">{pattern.total_questions || 0} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-purple-500" />
                  <span className="text-sm font-bold text-slate-800">{pattern.sections.length} Sections</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate(`${basePath}/patterns`)}
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <div className="flex-grow md:flex-grow-0 flex items-center gap-3">
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
      </div>

      {/* Configuration Drawer/Modal */}
      <AnimatePresence>
        {activeConfig && (
          <div className="fixed inset-0 z-[60] flex justify-end">
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
                          onClick={() => setActiveConfig(prev => {
                            if (!prev) return null;
                            const newConfig = { ...prev.config, nested_type: 'internal_choice' as const };
                            const subLabels = ['i', 'ii', 'iii', 'iv', 'v'];
                            // Relabel options to Option A, B... if they are currently a, b...
                            if (newConfig.options?.every(o => o.label.length === 1)) {
                              newConfig.options = newConfig.options.map((o, i) => {
                                const relabeledParts = (o.sub_parts || []).map((p, pi) => ({
                                  ...p,
                                  label: subLabels[pi] || '?'
                                }));
                                return {
                                  ...o,
                                  label: `Option ${String.fromCharCode(65 + i)}`,
                                  sub_parts: relabeledParts
                                };
                              });
                            }
                            return { ...prev, config: newConfig };
                          })}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeConfig.config.nested_type === 'internal_choice'
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          <Split className="w-5 h-5" />
                          <span className="text-sm font-medium">Internal Choice (OR)</span>
                        </button>
                        <button
                          onClick={() => setActiveConfig(prev => {
                            if (!prev) return null;
                            const newConfig = { ...prev.config, nested_type: 'multipart' as const };
                            const subLabels = ['i', 'ii', 'iii', 'iv', 'v'];
                            // Relabel options to a, b, c... if they are currently Option A, B...
                            if (newConfig.options?.every(o => o.label.startsWith('Option'))) {
                              newConfig.options = newConfig.options.map((o, i) => {
                                const relabeledParts = (o.sub_parts || []).map((p, pi) => ({
                                  ...p,
                                  label: subLabels[pi] || '?'
                                }));
                                return {
                                  ...o,
                                  label: String.fromCharCode(97 + i),
                                  sub_parts: relabeledParts
                                };
                              });
                            } else {
                              // If already in multipart or similar but subparts are wrong
                              newConfig.options = (newConfig.options || []).map((o) => ({
                                ...o,
                                sub_parts: (o.sub_parts || []).map((p, pi) => ({
                                  ...p,
                                  label: subLabels[pi] || '?'
                                }))
                              }));
                            }
                            return { ...prev, config: newConfig };
                          })}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeConfig.config.nested_type === 'multipart'
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          <List className="w-5 h-5" />
                          <span className="text-sm font-medium">Multi-Part (a, b, c)</span>
                        </button>

                        <button
                          onClick={() => setActiveConfig(prev => prev ? {
                            ...prev,
                            config: { ...prev.config, nested_type: 'mixed' }
                          } : null)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeConfig.config.nested_type === 'mixed'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          <Layers className="w-5 h-5" />
                          <span className="text-sm font-medium">Mixed Mode</span>
                        </button>
                      </div>
                    </div>

                    {/* Mixed / Complex Structure Editor */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Question parts</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveConfig(prev => {
                              if (!prev) return null;
                              const currentOptions = prev.config.options || [];
                              const labels = ['a', 'b', 'c', 'd', 'e'];
                              return {
                                ...prev,
                                config: {
                                  ...prev.config,
                                  nested_type: (prev.config.nested_type === 'mixed' ? 'mixed' : (prev.config.nested_type || 'multipart')),
                                  options: [...currentOptions, { type: 'compulsory', label: labels[currentOptions.length] || '?', marks: 2 }]
                                }
                              };
                            })}
                            className="text-[10px] font-bold text-blue-600 px-2 py-1 bg-blue-50 rounded border border-blue-100"
                          >
                            + Add Compulsory Part
                          </button>
                          <button
                            onClick={() => setActiveConfig(prev => {
                              if (!prev) return null;
                              const currentOptions = prev.config.options || [];
                              return {
                                ...prev,
                                config: {
                                  ...prev.config,
                                  nested_type: (prev.config.nested_type === 'mixed' ? 'mixed' : (prev.config.nested_type || 'internal_choice')),
                                  options: [...currentOptions, { type: 'choice_group', label: 'OR Group', options: [{ label: '', marks: 5 }, { label: '', marks: 5 }] }]
                                }
                              };
                            })}
                            className="text-[10px] font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded border border-indigo-100"
                          >
                            + Add OR Group
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(activeConfig.config.options || []).map((part, idx) => (
                          <div key={idx} className={`p-4 border rounded-xl relative group ${part.type === 'choice_group' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  className="w-12 px-1 py-0.5 text-sm font-bold border rounded bg-white text-center"
                                  value={part.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setActiveConfig(prev => {
                                      if (!prev) return null;
                                      const newOptions = [...(prev.config.options || [])];
                                      newOptions[idx] = { ...newOptions[idx], label: val };
                                      return { ...prev, config: { ...prev.config, options: newOptions } };
                                    });
                                  }}
                                />
                              </div>

                              <div className="flex-1">
                                {part.type === 'choice_group' ? (
                                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Internal Choice Group (Either-Or)</span>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Part Note (e.g. 'State the law')"
                                    className="w-full px-2 py-1 text-xs border rounded bg-transparent border-dashed border-slate-300 outline-none"
                                    value={part.description || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setActiveConfig(prev => {
                                        if (!prev) return null;
                                        const newOptions = [...(prev.config.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], description: val };
                                        return { ...prev, config: { ...prev.config, options: newOptions } };
                                      });
                                    }}
                                  />
                                )}
                              </div>

                              {part.type !== 'choice_group' && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    className="w-16 px-2 py-1 text-sm font-bold border rounded bg-white text-center"
                                    value={part.marks || 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setActiveConfig(prev => {
                                        if (!prev) return null;
                                        const newOptions = [...(prev.config.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], marks: val };
                                        return { ...prev, config: { ...prev.config, options: newOptions } };
                                      });
                                    }}
                                  />
                                  <span className="text-xs text-slate-400">m</span>
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  setActiveConfig(prev => {
                                    if (!prev) return null;
                                    const newOptions = [...(prev.config.options || [])].filter((_, i) => i !== idx);
                                    return { ...prev, config: { ...prev.config, options: newOptions } };
                                  });
                                }}
                                className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Sub-parts for Compulsory parts */}
                            {part.type !== 'choice_group' && (
                              <div className="pl-6 border-l-2 border-slate-200 ml-2 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400">SUB-PARTS</span>
                                  <button
                                    className="text-[10px] text-blue-600 font-bold hover:underline"
                                    onClick={() => {
                                      setActiveConfig(prev => {
                                        if (!prev) return null;
                                        const newOptions = [...(prev.config.options || [])];
                                        const currentParts = newOptions[idx].sub_parts || [];
                                        newOptions[idx] = {
                                          ...newOptions[idx],
                                          sub_parts: [...currentParts, { label: (currentParts.length + 1).toString(), marks: 1 }]
                                        };
                                        return { ...prev, config: { ...prev.config, options: newOptions } };
                                      });
                                    }}
                                  >
                                    + Add Sub-part
                                  </button>
                                </div>
                                {(part.sub_parts || []).map((sp, spIdx) => (
                                  <div key={spIdx} className="flex gap-2 items-center">
                                    <input
                                      className="w-8 border-b text-[11px] text-center bg-transparent"
                                      value={sp.label}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setActiveConfig(prev => {
                                          if (!prev) return null;
                                          const newOptions = [...(prev.config.options || [])];
                                          newOptions[idx].sub_parts![spIdx].label = val;
                                          return { ...prev, config: { ...prev.config, options: newOptions } };
                                        });
                                      }}
                                    />
                                    <input
                                      className="flex-1 border-b text-[11px] bg-transparent"
                                      value={sp.description || ''}
                                      placeholder="Sub-part description"
                                      onChange={e => {
                                        const val = e.target.value;
                                        setActiveConfig(prev => {
                                          if (!prev) return null;
                                          const newOptions = [...(prev.config.options || [])];
                                          newOptions[idx].sub_parts![spIdx].description = val;
                                          return { ...prev, config: { ...prev.config, options: newOptions } };
                                        });
                                      }}
                                    />
                                    <input
                                      type="number"
                                      className="w-10 border-b text-[11px] text-center bg-transparent"
                                      value={sp.marks}
                                      onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setActiveConfig(prev => {
                                          if (!prev) return null;
                                          const newOptions = [...(prev.config.options || [])];
                                          newOptions[idx].sub_parts![spIdx].marks = val;
                                          return { ...prev, config: { ...prev.config, options: newOptions } };
                                        });
                                      }}
                                    />
                                    <button
                                      onClick={() => {
                                        setActiveConfig(prev => {
                                          if (!prev) return null;
                                          const newOptions = [...(prev.config.options || [])];
                                          newOptions[idx].sub_parts = newOptions[idx].sub_parts!.filter((_, i) => i !== spIdx);
                                          return { ...prev, config: { ...prev.config, options: newOptions } };
                                        });
                                      }}
                                      className="text-slate-300 hover:text-red-400"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Choice Options for Choice Groups */}
                            {part.type === 'choice_group' && (
                              <div className="pl-6 border-l-2 border-indigo-200 ml-2 space-y-3">
                                {(part.options || []).map((opt, oIdx) => (
                                  <div key={oIdx}>
                                    <div className="bg-white p-2 rounded shadow-sm border border-indigo-50">
                                      <div className="flex gap-2 items-center mb-2">
                                        <input
                                          className="w-10 text-xs font-bold text-center border-b"
                                          value={opt.label}
                                          placeholder="label"
                                          onChange={e => {
                                            const val = e.target.value;
                                            setActiveConfig(prev => {
                                              if (!prev) return null;
                                              const newOptions = [...(prev.config.options || [])];
                                              newOptions[idx].options![oIdx].label = val;
                                              return { ...prev, config: { ...prev.config, options: newOptions } };
                                            });
                                          }}
                                        />
                                        <input
                                          className="flex-1 text-xs border-b"
                                          placeholder="Choice description"
                                          value={opt.description || ''}
                                          onChange={e => {
                                            const val = e.target.value;
                                            setActiveConfig(prev => {
                                              if (!prev) return null;
                                              const newOptions = [...(prev.config.options || [])];
                                              newOptions[idx].options![oIdx].description = val;
                                              return { ...prev, config: { ...prev.config, options: newOptions } };
                                            });
                                          }}
                                        />
                                        <input
                                          type="number"
                                          className="w-12 text-xs text-center border-b"
                                          value={opt.marks}
                                          onChange={e => {
                                            const val = parseInt(e.target.value) || 0;
                                            setActiveConfig(prev => {
                                              if (!prev) return null;
                                              const newOptions = [...(prev.config.options || [])];
                                              newOptions[idx].options![oIdx].marks = val;
                                              return { ...prev, config: { ...prev.config, options: newOptions } };
                                            });
                                          }}
                                        />
                                        <button
                                          onClick={() => {
                                            setActiveConfig(prev => {
                                              if (!prev) return null;
                                              const newOptions = [...(prev.config.options || [])];
                                              newOptions[idx].options = newOptions[idx].options!.filter((_, i) => i !== oIdx);
                                              return { ...prev, config: { ...prev.config, options: newOptions } };
                                            });
                                          }}
                                          className="text-slate-300 hover:text-red-400"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>

                                      {/* Sub-parts for this Choice */}
                                      <div className="pl-4 border-l border-slate-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] font-bold text-slate-400">Choice Sub-parts</span>
                                          <button
                                            className="text-[9px] text-indigo-500 font-bold hover:underline"
                                            onClick={() => {
                                              setActiveConfig(prev => {
                                                if (!prev) return null;
                                                const newOptions = [...(prev.config.options || [])];
                                                const currentSubParts = newOptions[idx].options![oIdx].sub_parts || [];
                                                newOptions[idx].options![oIdx].sub_parts = [...currentSubParts, { label: (currentSubParts.length + 1).toString(), marks: 1 }];
                                                return { ...prev, config: { ...prev.config, options: newOptions } };
                                              });
                                            }}
                                          >
                                            + Add Sub-part
                                          </button>
                                        </div>
                                        {(opt.sub_parts || []).map((sop, sopIdx) => (
                                          <div key={sopIdx} className="flex gap-2 items-center">
                                            <input
                                              className="w-6 text-[10px] text-center border-b bg-transparent"
                                              value={sop.label}
                                              onChange={e => {
                                                const val = e.target.value;
                                                setActiveConfig(prev => {
                                                  if (!prev) return null;
                                                  const newOptions = [...(prev.config.options || [])];
                                                  newOptions[idx].options![oIdx].sub_parts![sopIdx].label = val;
                                                  return { ...prev, config: { ...prev.config, options: newOptions } };
                                                });
                                              }}
                                            />
                                            <input
                                              className="flex-1 text-[10px] border-b bg-transparent"
                                              value={sop.description || ''}
                                              placeholder="part text"
                                              onChange={e => {
                                                const val = e.target.value;
                                                setActiveConfig(prev => {
                                                  if (!prev) return null;
                                                  const newOptions = [...(prev.config.options || [])];
                                                  newOptions[idx].options![oIdx].sub_parts![sopIdx].description = val;
                                                  return { ...prev, config: { ...prev.config, options: newOptions } };
                                                });
                                              }}
                                            />
                                            <input
                                              type="number"
                                              className="w-8 text-[10px] text-center border-b bg-transparent"
                                              value={sop.marks}
                                              onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setActiveConfig(prev => {
                                                  if (!prev) return null;
                                                  const newOptions = [...(prev.config.options || [])];
                                                  newOptions[idx].options![oIdx].sub_parts![sopIdx].marks = val;
                                                  return { ...prev, config: { ...prev.config, options: newOptions } };
                                                });
                                              }}
                                            />
                                            <button
                                              onClick={() => {
                                                setActiveConfig(prev => {
                                                  if (!prev) return null;
                                                  const newOptions = [...(prev.config.options || [])];
                                                  newOptions[idx].options![oIdx].sub_parts = newOptions[idx].options![oIdx].sub_parts!.filter((_, i) => i !== sopIdx);
                                                  return { ...prev, config: { ...prev.config, options: newOptions } };
                                                });
                                              }}
                                              className="text-slate-300 hover:text-red-400"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {oIdx < (part.options || []).length - 1 && (
                                      <div className="text-[9px] font-black text-indigo-300 text-center py-1 tracking-tighter">— OR —</div>
                                    )}
                                  </div>
                                ))}
                                <button
                                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                                  onClick={() => {
                                    setActiveConfig(prev => {
                                      if (!prev) return null;
                                      const newOptions = [...(prev.config.options || [])];
                                      if (!newOptions[idx].options) newOptions[idx].options = [];
                                      newOptions[idx].options!.push({ label: '', marks: 5 });
                                      return { ...prev, config: { ...prev.config, options: newOptions } };
                                    });
                                  }}
                                >
                                  + Add Choice
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
    </div>
  );
}
