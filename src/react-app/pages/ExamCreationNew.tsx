import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  Settings,
  Plus,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

interface ExamPattern {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  total_marks: number;
  total_duration: number;
  sections: PatternSection[];
  created_at: string;
}

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
  question_type: 'mcq' | 'numerical' | 'subjective';
}

interface ExamFormData {
  title: string;
  description: string;
  pattern: number | null;
  start_date: string;
  end_date: string;
  duration_minutes: number;
  max_attempts: number;
  passing_marks: number;
  is_published: boolean;
  allow_negative_marking: boolean;
  negative_marking_percentage: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_results_immediately: boolean;
  instructions: string;
  
  // Missing fields from Exam model
  status: string;
  timezone: string;
  grace_period_minutes: number;
  buffer_time_minutes: number;
  auto_start: boolean;
  auto_end: boolean;
  reschedule_allowed: boolean;
  max_reschedules: number;
  reschedule_deadline: string;
  allow_late_submission: boolean;
  late_submission_penalty: number;
  require_fullscreen: boolean;
  disable_copy_paste: boolean;
  disable_right_click: boolean;
  enable_webcam_proctoring: boolean;
  allow_tab_switching: boolean;
  is_public: boolean;
}

export default function ExamCreation() {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditMode = !!examId;

  const [patterns, setPatterns] = useState<ExamPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<ExamPattern | null>(null);
  const [patternOption, setPatternOption] = useState<'use_existing' | 'template' | null>(null);
  const [patternQuestions, setPatternQuestions] = useState<any[]>([]);

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    pattern: null,
    start_date: '',
    end_date: '',
    duration_minutes: 60,
    max_attempts: 1,
    passing_marks: 50,
    is_published: false,
    allow_negative_marking: false,
    negative_marking_percentage: 25,
    shuffle_questions: true,
    shuffle_options: true,
    show_results_immediately: true,
    instructions: '',
    
    // Missing fields with defaults
    status: 'published',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',  // Detect user's timezone
    grace_period_minutes: 0,
    buffer_time_minutes: 15,
    auto_start: true,
    auto_end: true,
    reschedule_allowed: false,
    max_reschedules: 0,
    reschedule_deadline: '',
    allow_late_submission: false,
    late_submission_penalty: 0,
    require_fullscreen: true,
    disable_copy_paste: true,
    disable_right_click: true,
    enable_webcam_proctoring: false,
    allow_tab_switching: false,
    is_public: true,
  });

  useEffect(() => {
    const loadData = async () => {
      const fetchedPatterns = await fetchPatterns();
      if (isEditMode && examId) {
        await fetchExamData(fetchedPatterns);
      }
    };
    loadData();
  }, [examId, isEditMode]);

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patterns/patterns/');
      const fetchedPatterns = response.data.results || response.data;
      setPatterns(fetchedPatterns);
      return fetchedPatterns;
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchExamData = async (fetchedPatterns: ExamPattern[]) => {
    try {
      setLoading(true);
      const response = await api.get(`/exams/exams/${examId}/`);
      const exam = response.data;
      
      // Convert datetime fields to the format expected by datetime-local input
      const formatDateTimeLocal = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        pattern: exam.pattern?.id || null,
        start_date: formatDateTimeLocal(exam.start_date),
        end_date: formatDateTimeLocal(exam.end_date),
        duration_minutes: exam.duration_minutes || 60,
        max_attempts: exam.max_attempts || 1,
        passing_marks: exam.passing_marks || 50,
        is_published: exam.is_published || false,
        allow_negative_marking: exam.allow_negative_marking || false,
        negative_marking_percentage: exam.negative_marking_percentage || 25,
        shuffle_questions: exam.shuffle_questions ?? true,
        shuffle_options: exam.shuffle_options ?? true,
        show_results_immediately: exam.show_results_immediately ?? true,
        instructions: exam.instructions || '',
        status: exam.status || 'published',
        timezone: exam.timezone || 'UTC',
        grace_period_minutes: exam.grace_period_minutes || 0,
        buffer_time_minutes: exam.buffer_time_minutes || 15,
        auto_start: exam.auto_start ?? true,
        auto_end: exam.auto_end ?? true,
        reschedule_allowed: exam.reschedule_allowed || false,
        max_reschedules: exam.max_reschedules || 0,
        reschedule_deadline: exam.reschedule_deadline || '',
        allow_late_submission: exam.allow_late_submission || false,
        late_submission_penalty: exam.late_submission_penalty || 0,
        require_fullscreen: exam.require_fullscreen ?? true,
        disable_copy_paste: exam.disable_copy_paste ?? true,
        disable_right_click: exam.disable_right_click ?? true,
        enable_webcam_proctoring: exam.enable_webcam_proctoring ?? true,
        allow_tab_switching: exam.allow_tab_switching ?? true,
        is_public: exam.is_public || true,
      });

      if (exam.pattern?.id) {
        const pattern = fetchedPatterns.find(p => p.id === exam.pattern.id);
        setSelectedPattern(pattern || null);
      }
    } catch (error) {
      console.error('Failed to fetch exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePatternSelect = (patternId: number) => {
    if (!patternId || isNaN(patternId)) {
      setSelectedPattern(null);
      handleInputChange('pattern', null);
      setPatternOption(null);
      setPatternQuestions([]);
      return;
    }
    
    const pattern = patterns.find(p => p.id === patternId);
    setSelectedPattern(pattern || null);
    handleInputChange('pattern', patternId);
    if (pattern) {
      // Auto-fill duration from pattern
      handleInputChange('duration_minutes', pattern.total_duration);
    }
    // Reset pattern option when changing pattern
    setPatternOption(null);
    setPatternQuestions([]);
  };

  const fetchPatternQuestions = async (patternId: number) => {
    try {
      const response = await api.get(`/patterns/patterns/${patternId}/questions/`);
      setPatternQuestions(response.data.sections_with_questions || []);
    } catch (error) {
      console.error('Failed to fetch pattern questions:', error);
      setPatternQuestions([]);
    }
  };

  const handlePatternOptionChange = (option: 'use_existing' | 'template') => {
    setPatternOption(option);
    if (option === 'use_existing' && selectedPattern) {
      fetchPatternQuestions(selectedPattern.id);
    } else {
      setPatternQuestions([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Exam title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.pattern) {
      newErrors.pattern = 'Please select an exam pattern';
    }

    if (formData.pattern && !patternOption) {
      newErrors.pattern = 'Please select how to use the pattern (questions vs template)';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate >= endDate) {
        newErrors.end_date = 'End date must be after start date';
      }
      
      // Check if exam window is reasonable (at least as long as duration + buffer)
      const examWindowMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      if (examWindowMinutes < formData.duration_minutes) {
        newErrors.end_date = `Exam window (${Math.round(examWindowMinutes)} min) must be at least as long as exam duration (${formData.duration_minutes} min)`;
      }
    }

    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be at least 1 minute';
    }

    // Validate duration matches pattern if pattern is selected
    if (selectedPattern && formData.duration_minutes !== selectedPattern.total_duration) {
      newErrors.duration_minutes = `Duration should match pattern (${selectedPattern.total_duration} min). Update or select different pattern.`;
    }

    if (formData.max_attempts <= 0) {
      newErrors.max_attempts = 'Max attempts must be at least 1';
    }

    if (formData.passing_marks < 0) {
      newErrors.passing_marks = 'Passing marks cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Prepare exam data - rename 'pattern' to 'pattern_id' for backend
      const { pattern, ...rest } = formData;
      
      // Convert datetime-local to ISO format with timezone
      const convertToISO = (dateTimeLocal: string, timezone: string) => {
        if (!dateTimeLocal) return '';
        // datetime-local format: "2025-11-05T18:12"
        // We need to append timezone info
        const date = new Date(dateTimeLocal);
        return date.toISOString();
      };
      
      const examData = {
        ...rest,
        pattern_id: pattern,  // Backend expects pattern_id, not pattern
        start_date: convertToISO(rest.start_date, rest.timezone),
        end_date: convertToISO(rest.end_date, rest.timezone),
        created_by: user?.id,
        institute: user?.institute_id,
      };

      let response;
      if (isEditMode && examId) {
        // Update existing exam
        response = await api.put(`/exams/exams/${examId}/`, examData);
      } else {
        // Create new exam
        response = await api.post('/exams/exams/', examData);
        const newExam = response.data;

        // If user chose to use existing pattern questions, assign them to the exam
        if (patternOption === 'use_existing' && selectedPattern) {
          try {
            await api.post('/patterns/assign-pattern-questions/', {
              exam_id: newExam.id,
              pattern_id: selectedPattern.id,
              use_existing_questions: true
            });
          } catch (assignError) {
            console.error('Failed to assign pattern questions:', assignError);
            // Don't fail the entire exam creation if question assignment fails
          }
        }
      }

      navigate('/exams');
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} exam:`, error);
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
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'subjective':
        return <CheckCircle className="w-3 h-3 text-purple-600" />;
      default:
        return <CheckCircle className="w-3 h-3 text-slate-600" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading patterns...</p>
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
            onClick={() => navigate('/exams')}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Exam' : 'Create New Exam'}</h1>
            <p className="text-sm text-slate-600">Set up a new exam with pattern and settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                  <p className="text-xs text-slate-600">Essential exam details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Exam Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.title ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Enter exam title..."
                  />
                  {errors.title && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.title}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                      errors.description ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Describe the exam..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Date * 
                    <span className="ml-2 text-xs font-normal text-blue-600">
                      ({formData.timezone || 'UTC'})
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.start_date ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {!errors.start_date && formData.start_date && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Exam starts at this exact time in {formData.timezone}
                    </p>
                  )}
                  {errors.start_date && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.start_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    End Date *
                    <span className="ml-2 text-xs font-normal text-blue-600">
                      ({formData.timezone || 'UTC'})
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.end_date ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {!errors.end_date && formData.end_date && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Exam ends at this exact time in {formData.timezone}
                    </p>
                  )}
                  {errors.end_date && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.end_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pattern Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Exam Pattern</h2>
                  <p className="text-xs text-slate-600">Select the pattern for this exam</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-2">Available Patterns *</label>
                <select
                  value={formData.pattern || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handlePatternSelect(value ? parseInt(value) : 0);
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.pattern ? 'border-red-300' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select a pattern...</option>
                  {patterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>
                      {pattern.name} ({pattern.total_questions} Q, {pattern.total_duration} min, {pattern.total_marks} marks)
                    </option>
                  ))}
                </select>
                {errors.pattern && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.pattern}
                  </p>
                )}
                
                {/* Pattern Details Display */}
                {selectedPattern && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">{selectedPattern.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{selectedPattern.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{selectedPattern.total_questions} Questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{selectedPattern.total_duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{selectedPattern.total_marks} marks</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pattern Option Selection */}
              {selectedPattern && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">How do you want to use this pattern?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      patternOption === 'use_existing' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="patternOption"
                        className="mt-1"
                        checked={patternOption === 'use_existing'}
                        onChange={() => handlePatternOptionChange('use_existing')}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Use existing questions</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Copy all questions from this pattern into the exam
                        </div>
                      </div>
                    </label>
                    
                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      patternOption === 'template' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="patternOption"
                        className="mt-1"
                        checked={patternOption === 'template'}
                        onChange={() => handlePatternOptionChange('template')}
                      />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Template only</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Use pattern structure only, add questions later
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {!patternOption && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Please select one option before creating the exam
                    </div>
                  )}
                </div>
              )}

              {/* Pattern Questions Preview */}
              {patternOption === 'use_existing' && patternQuestions.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">
                    Questions that will be copied ({patternQuestions.reduce((total, section) => total + section.questions.length, 0)} total)
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {patternQuestions.map((sectionData, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-slate-700 mb-2">
                          {sectionData.section.name} ({sectionData.questions.length} questions)
                        </div>
                        <div className="space-y-1">
                          {sectionData.questions.slice(0, 3).map((question: any, qIndex: number) => (
                            <div key={qIndex} className="text-xs text-slate-600 flex items-center gap-2">
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="truncate">{question.question_text}</span>
                            </div>
                          ))}
                          {sectionData.questions.length > 3 && (
                            <div className="text-xs text-slate-500">
                              +{sectionData.questions.length - 3} more questions
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern Structure Preview */}
              {selectedPattern && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Pattern Structure</h3>
                  <div className="space-y-2">
                    {(() => {
                      const groupedSections = selectedPattern.sections.reduce((acc: any, section: any) => {
                        if (!acc[section.subject]) {
                          acc[section.subject] = [];
                        }
                        acc[section.subject].push(section);
                        return acc;
                      }, {});

                      return Object.entries(groupedSections).slice(0, 3).map(([subject, sections]: [string, any]) => (
                        <div key={subject} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-slate-600 font-medium">{subject}</span>
                          <span className="text-slate-400">
                            (Q{sections[0].start_question}-{sections[sections.length - 1].end_question})
                          </span>
                        </div>
                      ));
                    })()}
                    {selectedPattern.sections.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{selectedPattern.sections.length - 3} more sections
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Exam Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Exam Settings</h2>
                  <p className="text-xs text-slate-600">Configure exam behavior and rules</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Duration (minutes) *
                    {selectedPattern && (
                      <span className="ml-1 text-xs font-normal text-blue-600">(from pattern)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.duration_minutes ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="1"
                  />
                  {!errors.duration_minutes && selectedPattern && formData.duration_minutes === selectedPattern.total_duration && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Matches pattern duration
                    </p>
                  )}
                  {errors.duration_minutes && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.duration_minutes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Attempts *</label>
                  <input
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => handleInputChange('max_attempts', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.max_attempts ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="1"
                  />
                  {errors.max_attempts && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.max_attempts}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Passing Marks (%) *</label>
                  <input
                    type="number"
                    value={formData.passing_marks}
                    onChange={(e) => handleInputChange('passing_marks', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.passing_marks ? 'border-red-300' : 'border-slate-300'
                    }`}
                    min="0"
                    max="100"
                  />
                  {errors.passing_marks && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.passing_marks}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Shuffle Questions</label>
                    <p className="text-xs text-slate-500">Randomize question order</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_questions}
                      onChange={(e) => handleInputChange('shuffle_questions', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Shuffle Options</label>
                    <p className="text-xs text-slate-500">Randomize answer options</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_options}
                      onChange={(e) => handleInputChange('shuffle_options', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Show Results Immediately</label>
                    <p className="text-xs text-slate-500">Display results after submission</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_results_immediately}
                      onChange={(e) => handleInputChange('show_results_immediately', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Security & Proctoring Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Security & Proctoring</h2>
                  <p className="text-xs text-slate-600">Configure exam security settings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Require Fullscreen</label>
                    <p className="text-xs text-slate-500">Force fullscreen mode during exam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.require_fullscreen}
                      onChange={(e) => handleInputChange('require_fullscreen', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Disable Copy/Paste</label>
                    <p className="text-xs text-slate-500">Prevent copy and paste actions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disable_copy_paste}
                      onChange={(e) => handleInputChange('disable_copy_paste', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Disable Right Click</label>
                    <p className="text-xs text-slate-500">Prevent right-click context menu</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disable_right_click}
                      onChange={(e) => handleInputChange('disable_right_click', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Webcam Proctoring</label>
                    <p className="text-xs text-slate-500">Monitor students via webcam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enable_webcam_proctoring}
                      onChange={(e) => handleInputChange('enable_webcam_proctoring', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Allow Tab Switching</label>
                    <p className="text-xs text-slate-500">Allow switching between browser tabs</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_tab_switching}
                      onChange={(e) => handleInputChange('allow_tab_switching', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Advanced Settings</h2>
                  <p className="text-xs text-slate-600">Configure advanced exam options</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Grace Period (minutes)</label>
                  <input
                    type="number"
                    value={formData.grace_period_minutes}
                    onChange={(e) => handleInputChange('grace_period_minutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    min="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">Extra time after end date</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Buffer Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.buffer_time_minutes}
                    onChange={(e) => handleInputChange('buffer_time_minutes', parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    min="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">Time before exam starts when students can access</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Late Submission Penalty (%)</label>
                  <input
                    type="number"
                    value={formData.late_submission_penalty}
                    onChange={(e) => handleInputChange('late_submission_penalty', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <p className="text-xs text-slate-500 mt-1">Penalty for late submissions</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Auto Start</label>
                    <p className="text-xs text-slate-500">Automatically start exam at start time</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_start}
                      onChange={(e) => handleInputChange('auto_start', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Auto End</label>
                    <p className="text-xs text-slate-500">Automatically end exam at end time</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_end}
                      onChange={(e) => handleInputChange('auto_end', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Allow Late Submission</label>
                    <p className="text-xs text-slate-500">Allow submissions after end time</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_late_submission}
                      onChange={(e) => handleInputChange('allow_late_submission', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Public Exam</label>
                    <p className="text-xs text-slate-500">Allow any student to access</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => handleInputChange('is_public', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Rescheduling Settings - Commented Out */}
            {/* <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Rescheduling Settings</h2>
                  <p className="text-xs text-slate-600">Configure exam rescheduling options</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Allow Rescheduling</label>
                    <p className="text-xs text-slate-500">Allow students to reschedule exam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reschedule_allowed}
                      onChange={(e) => handleInputChange('reschedule_allowed', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Reschedules</label>
                  <input
                    type="number"
                    value={formData.max_reschedules}
                    onChange={(e) => handleInputChange('max_reschedules', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    min="0"
                    disabled={!formData.reschedule_allowed}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reschedule Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.reschedule_deadline}
                    onChange={(e) => handleInputChange('reschedule_deadline', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={!formData.reschedule_allowed}
                  />
                  <p className="text-xs text-slate-500 mt-1">Last date when rescheduling is allowed (leave empty for no deadline)</p>
                </div>
              </div>
            </div> */}

            {/* Instructions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Info className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Exam Instructions</h2>
                  <p className="text-xs text-slate-600">Instructions for students</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Enter exam instructions for students..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-4">
            {/* Exam Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Exam Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Pattern</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">
                    {selectedPattern ? selectedPattern.name : 'Not selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Duration</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{formData.duration_minutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Max Attempts</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{formData.max_attempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">Passing Marks</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{formData.passing_marks}%</span>
                </div>
                {selectedPattern && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600">Total Questions</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900">{selectedPattern.total_questions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600">Total Marks</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900">{selectedPattern.total_marks}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

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
                  {saving ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Exam' : 'Create Exam')}
                </button>

                <button
                  onClick={() => navigate('/exams')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1 text-sm">Exam Guidelines</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Select a pattern to define exam structure</li>
                    <li>• Set appropriate duration and attempts</li>
                    <li>• Configure passing marks and negative marking</li>
                    <li>• Add clear instructions for students</li>
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
