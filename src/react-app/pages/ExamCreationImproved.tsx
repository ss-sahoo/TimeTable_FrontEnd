import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  BookOpen,
  Settings,
  AlertCircle,
  Zap,
  Monitor,
  FileSpreadsheet,
  UserCheck,
  CheckCircle,
  Plus,
  Trash2,
  Edit,
  FileText
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

interface ExamPattern {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  sections: PatternSection[];
  exam_mode?: 'online' | 'offline_omr' | 'offline_subjective';
  omr_config?: any;
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
  max_attempts: number;
  is_public: boolean;
  allow_late_submission: boolean;
  require_fullscreen: boolean;
  disable_copy_paste: boolean;
  disable_right_click: boolean;
  enable_webcam_proctoring: boolean;
  allow_tab_switching: boolean;
  exam_mode: 'online' | 'offline_omr' | 'offline_subjective';
  omr_config: any;
  program_id: number | string | null;
  center_id: number | string | null;
  show_result_after_exam_end: boolean;
}

export default function ExamCreationImproved() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const basePath = isSuperAdminPath ? '/superadmin' : '';
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!examId;

  const [patterns, setPatterns] = useState<ExamPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<ExamPattern | null>(null);

  // Helper function to format datetime for input
  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  // Helper function to get default datetime (1 hour from now)
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  // Helper function to get default end datetime (2 hours from now)
  const getDefaultEndDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    pattern: null,
    start_date: getDefaultDateTime(),
    end_date: getDefaultEndDateTime(),
    max_attempts: 1,
    is_public: false,
    allow_late_submission: false,
    require_fullscreen: true,
    disable_copy_paste: true,
    disable_right_click: true,
    enable_webcam_proctoring: false,
    allow_tab_switching: false,
    exam_mode: 'online',
    omr_config: {},
    program_id: null,
    center_id: null,
    show_result_after_exam_end: true,
  });

  const [centers, setCenters] = useState<any[]>([]);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);

  useEffect(() => {
    fetchPatterns();
    fetchCenters();
    fetchPrograms();
    if (isEditing && examId) {
      fetchExam();
    }
  }, [isEditing, examId]);

  useEffect(() => {
    if (formData.center_id) {
      const filtered = allPrograms.filter(p => String(p.center_id) === String(formData.center_id));
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms(allPrograms);
    }
  }, [formData.center_id, allPrograms]);

  const fetchCenters = async () => {
    try {
      const response = await api.get('/timetable/centers/');
      setCenters(response.data.centers || response.data);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/timetable/programs/');
      setAllPrograms(response.data.programs || response.data);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

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

  const fetchExam = async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const response = await api.get(`/exams/exams/${examId}/`);
      const exam = response.data;

      setFormData({
        title: exam.title,
        description: exam.description,
        pattern: exam.pattern?.id || exam.pattern, // Use pattern ID if it's an object, otherwise use the value directly
        start_date: formatDateTimeForInput(exam.start_date) || getDefaultDateTime(),
        end_date: formatDateTimeForInput(exam.end_date) || getDefaultEndDateTime(),
        max_attempts: exam.max_attempts,
        is_public: exam.is_public,
        allow_late_submission: exam.allow_late_submission,
        require_fullscreen: exam.require_fullscreen,
        disable_copy_paste: exam.disable_copy_paste,
        disable_right_click: exam.disable_right_click,
        enable_webcam_proctoring: exam.enable_webcam_proctoring,
        allow_tab_switching: exam.allow_tab_switching,
        exam_mode: exam.exam_mode || 'online',
        omr_config: exam.omr_config || {},
        program_id: exam.program?.id || exam.program || null,
        center_id: exam.center?.id || exam.center || null,
        show_result_after_exam_end: exam.show_result_after_exam_end ?? true,
      });

      // Find and set the selected pattern
      const patternId = exam.pattern?.id || exam.pattern;
      const pattern = patterns.find(p => p.id === patternId);
      if (pattern) {
        setSelectedPattern(pattern);
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePatternChange = (patternId: number) => {
    const pattern = patterns.find(p => p.id === patternId);
    setSelectedPattern(pattern || null);
    handleInputChange('pattern', patternId);
    if (pattern) {
      handleInputChange('exam_mode', pattern.exam_mode || 'online');
      handleInputChange('omr_config', pattern.omr_config || {});
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.pattern) {
      newErrors.pattern = 'Please select a pattern';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.max_attempts < 1) {
      newErrors.max_attempts = 'Max attempts must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Format datetime properly for backend - convert local time to ISO string
      const formatDateTimeForBackend = (datetimeString: string) => {
        if (!datetimeString) return '';
        // Create a Date object from the local datetime string
        // datetime-local input gives us local time in format YYYY-MM-DDTHH:MM
        const date = new Date(datetimeString);
        // Convert to ISO string which includes the proper timezone
        return date.toISOString();
      };

      const examData = {
        ...formData,
        pattern_id: formData.pattern, // Convert pattern to pattern_id for backend
        start_date: formatDateTimeForBackend(formData.start_date),
        end_date: formatDateTimeForBackend(formData.end_date),
        institute: user?.institute_id,
        created_by: user?.id,
        duration_minutes: selectedPattern?.duration_minutes || 60, // Get duration from selected pattern
        exam_mode: formData.exam_mode,
        omr_config: formData.omr_config,
      };

      // Remove the pattern field since we're using pattern_id
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pattern, ...examDataWithoutPattern } = examData;

      if (isEditing && examId) {
        await api.put(`/exams/exams/${examId}/`, examDataWithoutPattern);
      } else {
        await api.post('/exams/exams/', examDataWithoutPattern);
      }

      navigate(`${basePath}/exams`);
    } catch (error: any) {
      console.error('Failed to save exam:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
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
            onClick={() => navigate(`${basePath}/exams`)}
            className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Exam' : 'Create New Exam'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isEditing ? 'Update exam settings and configuration' : 'Set up a new exam with pattern-based structure'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Form - Takes 3 columns */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            <form id="exam-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                    <p className="text-sm text-slate-600">Provide exam title, description, and select a pattern</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Exam Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.title ? 'border-red-300' : 'border-slate-300'
                        }`}
                      placeholder="Enter exam title"
                    />
                    {errors.title && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter exam description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Pattern *</label>
                    <select
                      value={formData.pattern || ''}
                      onChange={(e) => handlePatternChange(parseInt(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.pattern ? 'border-red-300' : 'border-slate-300'
                        }`}
                    >
                      <option value="">Choose a pattern...</option>
                      {patterns.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name} ({pattern.total_questions} questions, {pattern.total_marks} marks, {pattern.duration_minutes} min)
                        </option>
                      ))}
                    </select>
                    {errors.pattern && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.pattern}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Center (Optional)</label>
                      <select
                        value={formData.center_id || ''}
                        onChange={(e) => handleInputChange('center_id', e.target.value || null)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="">All Centers</option>
                        {centers.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Program (Optional)</label>
                      <select
                        value={formData.program_id || ''}
                        onChange={(e) => handleInputChange('program_id', e.target.value || null)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="">All Programs</option>
                        {filteredPrograms.map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conduct & Evaluation Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Conduct & Evaluation</h2>
                    <p className="text-sm text-slate-600">Choose how this exam will be conducted and evaluated</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mode Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Exam Mode</label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'online', name: 'Online (Computer Based)', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { id: 'offline_omr', name: 'Offline OMR-Based', icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
                        { id: 'offline_subjective', name: 'Offline Subjective', icon: Edit, color: 'text-orange-600', bg: 'bg-orange-50' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => handleInputChange('exam_mode', mode.id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${formData.exam_mode === mode.id
                            ? 'border-indigo-500 bg-indigo-50/30'
                            : 'border-slate-100 hover:border-slate-200'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode.bg}`}>
                            <mode.icon className={`w-5 h-5 ${mode.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${formData.exam_mode === mode.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {mode.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {mode.id === 'online' ? 'Standard in-app testing' : mode.id === 'offline_omr' ? 'Auto-grade scanned sheets' : 'Handwritten with AI assist'}
                            </p>
                          </div>
                          {formData.exam_mode === mode.id && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* OMR Configuration (Conditional) */}
                  {formData.exam_mode === 'offline_omr' && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          OMR Candidate Fields
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            const currentFields = formData.omr_config?.candidate_fields || [];
                            handleInputChange('omr_config', {
                              ...formData.omr_config,
                              candidate_fields: [...currentFields, { name: 'New Field', type: 'digits', digits: 5 }]
                            });
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200"
                        >
                          + Add Field
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(formData.omr_config?.candidate_fields || []).map((field: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 group relative">
                            <button
                              type="button"
                              onClick={() => {
                                const newFields = [...formData.omr_config.candidate_fields];
                                newFields.splice(idx, 1);
                                handleInputChange('omr_config', { ...formData.omr_config, candidate_fields: newFields });
                              }}
                              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Field Name</label>
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => {
                                    const newFields = [...formData.omr_config.candidate_fields];
                                    newFields[idx] = { ...field, name: e.target.value };
                                    handleInputChange('omr_config', { ...formData.omr_config, candidate_fields: newFields });
                                  }}
                                  className="w-full text-xs font-medium border-0 border-b border-transparent focus:border-indigo-500 p-0 focus:ring-0"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Type</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => {
                                    const newFields = [...formData.omr_config.candidate_fields];
                                    newFields[idx] = { ...field, type: e.target.value };
                                    handleInputChange('omr_config', { ...formData.omr_config, candidate_fields: newFields });
                                  }}
                                  className="w-full text-xs border-0 border-b border-transparent focus:border-indigo-500 p-0 focus:ring-0 bg-transparent"
                                >
                                  <option value="digits">Digits (Numbers)</option>
                                  <option value="options-only">Set Selection</option>
                                </select>
                              </div>
                            </div>
                            {field.type === 'digits' && (
                              <div className="mt-2 pt-2 border-t border-slate-50">
                                <label className="text-[10px] font-bold text-slate-400 mr-2">Number of Digits:</label>
                                <input
                                  type="number"
                                  value={field.digits}
                                  onChange={(e) => {
                                    const newFields = [...formData.omr_config.candidate_fields];
                                    newFields[idx] = { ...field, digits: parseInt(e.target.value) || 1 };
                                    handleInputChange('omr_config', { ...formData.omr_config, candidate_fields: newFields });
                                  }}
                                  className="w-12 text-xs border-0 border-b border-indigo-200 p-0 focus:ring-0 text-indigo-600 font-bold"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Information Display */}
              {selectedPattern && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Selected Pattern: {selectedPattern.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Duration</p>
                      <p className="text-lg font-bold text-blue-700">{selectedPattern.duration_minutes} min</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Questions</p>
                      <p className="text-lg font-bold text-blue-700">{selectedPattern.total_questions}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Total Marks</p>
                      <p className="text-lg font-bold text-blue-700">{selectedPattern.total_marks}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Settings className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">Sections</p>
                      <p className="text-lg font-bold text-blue-700">{selectedPattern.sections?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule & Access */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Schedule & Access</h2>
                    <p className="text-sm text-slate-600">Set exam timing and access permissions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      📅 Start Date & Time *
                      <span className="block text-xs font-normal text-gray-500 mt-1">
                        Select both date and time when the exam will begin
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className={`w-full px-3 py-3 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.start_date ? 'border-red-300' : 'border-blue-300'
                        }`}
                      style={{
                        borderColor: errors.start_date ? '#ef4444' : '#93c5fd',
                        color: '#000000',
                        backgroundColor: '#f8fafc'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3f5fd4';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.start_date ? '#ef4444' : '#93c5fd';
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Click to select both date and time
                    </p>
                    {errors.start_date && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.start_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                      🕒 End Date & Time *
                      <span className="block text-xs font-normal text-gray-500 mt-1">
                        Select both date and time when the exam will end
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className={`w-full px-3 py-3 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.end_date ? 'border-red-300' : 'border-blue-300'
                        }`}
                      style={{
                        borderColor: errors.end_date ? '#ef4444' : '#93c5fd',
                        color: '#000000',
                        backgroundColor: '#f8fafc'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3f5fd4';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.end_date ? '#ef4444' : '#93c5fd';
                      }}
                      min={formData.start_date || new Date().toISOString().slice(0, 16)}
                      required
                    />
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Click to select both date and time
                    </p>
                    {errors.end_date && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.end_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Attempts *</label>
                    <input
                      type="number"
                      value={formData.max_attempts}
                      onChange={(e) => handleInputChange('max_attempts', parseInt(e.target.value) || 1)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.max_attempts ? 'border-red-300' : 'border-slate-300'
                        }`}
                      min="1"
                    />
                    {errors.max_attempts && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.max_attempts}
                      </p>
                    )}
                  </div>

                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Public Exam</label>
                      <p className="text-xs text-slate-500">Allow any student to access this exam</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => handleInputChange('is_public', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Allow Late Submission</label>
                      <p className="text-xs text-slate-500">Allow submissions after the end time</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allow_late_submission}
                        onChange={(e) => handleInputChange('allow_late_submission', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Require Fullscreen</label>
                        <p className="text-xs text-slate-500">Force fullscreen mode during exam</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_fullscreen}
                        onChange={(e) => handleInputChange('require_fullscreen', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Disable Copy/Paste</label>
                        <p className="text-xs text-slate-500">Prevent copying and pasting during exam</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.disable_copy_paste}
                        onChange={(e) => handleInputChange('disable_copy_paste', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Disable Right Click</label>
                        <p className="text-xs text-slate-500">Prevent right-click context menu</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.disable_right_click}
                        onChange={(e) => handleInputChange('disable_right_click', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Enable Webcam Proctoring</label>
                        <p className="text-xs text-slate-500">Monitor students via webcam</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enable_webcam_proctoring}
                        onChange={(e) => handleInputChange('enable_webcam_proctoring', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 text-blue-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Delay Results Display</label>
                        <p className="text-xs text-slate-500">Show results ONLY after exam end time (Recommended for formal exams)</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.show_result_after_exam_end}
                        onChange={(e) => handleInputChange('show_result_after_exam_end', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-3 sm:space-y-4">
            {/* Exam Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Exam Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Pattern</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedPattern ? selectedPattern.name : 'Not selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Duration</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{selectedPattern?.duration_minutes || 0} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Max Attempts</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{formData.max_attempts}</span>
                </div>
                {selectedPattern && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Total Questions</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{selectedPattern.total_questions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">Total Marks</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{selectedPattern.total_marks}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
              <div className="space-y-3">
                <button
                  type="submit"
                  form="exam-form"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Exam' : 'Create Exam')}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/exams`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}
