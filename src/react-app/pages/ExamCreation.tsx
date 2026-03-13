import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ArrowLeft,
  Save,
  Clock,
  Users,
  BookOpen,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Building2,
  Layers,
  Globe,
  Target
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
  negative_marking?: number;
}

interface PatternQuestion {
  id: number;
  question_number_in_pattern: number | null;
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
  instructions: string;
  status: string;
  duration_minutes: number;
  passing_marks: number;
  allow_negative_marking: boolean;
  negative_marking_percentage: number;
  shuffle_questions: boolean;
  late_submission_penalty: number;
  // Visibility scope fields
  visibility_scope: 'institute' | 'centers' | 'batches';
  center_ids: string[];
  batch_ids: string[];
  show_result_after_exam_end: boolean;
}

export default function ExamCreation() {
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
  const [patternOption, setPatternOption] = useState<'use_existing' | 'template' | null>(null);

  // Centers and batches for visibility scope
  const [centers, setCenters] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);


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
    instructions: '',
    status: 'published',
    duration_minutes: 60,
    passing_marks: 33,
    allow_negative_marking: false,
    negative_marking_percentage: 25,
    shuffle_questions: false,
    late_submission_penalty: 0,
    // Visibility scope defaults
    visibility_scope: 'institute',
    center_ids: [],
    batch_ids: [],
    show_result_after_exam_end: true,
  });


  useEffect(() => {
    fetchPatterns();
    fetchCenters();
    fetchBatches();
    if (isEditing && examId) {
      fetchExam();
    }
  }, [isEditing, examId]);

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

  const fetchCenters = async () => {
    try {
      const response = await api.get('/timetable/centers/');
      const centersData = response.data.results || response.data.centers || response.data || [];
      const allCenters = Array.isArray(centersData) ? centersData : [];

      // Get institute ID from either top-level or nested institute object
      const userInstituteId = user?.institute_id || user?.institute?.id;

      if (userInstituteId) {
        const targetId = String(userInstituteId);
        const filtered = allCenters.filter((c: any) => {
          const centerInstituteId = c.institute_id || c.institute?.id || c.institute;
          return String(centerInstituteId) === targetId;
        });
        setCenters(filtered);
      } else {
        setCenters(allCenters);
      }
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get('/timetable/batches/');
      const batchesData = response.data.batches || response.data.results || response.data || [];
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };


  const fetchExam = async () => {
    if (!examId) return;

    try {
      setLoading(true);
      console.log('Fetching exam for editing with ID:', examId);
      const response = await api.get(`/exams/exams/${examId}/`);
      const exam = response.data;
      console.log('Exam data for editing:', exam);

      // Populate form with existing exam data
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        pattern: exam.pattern?.id || null,
        start_date: formatDateTimeForInput(exam.start_date) || getDefaultDateTime(),
        end_date: formatDateTimeForInput(exam.end_date) || getDefaultEndDateTime(),
        max_attempts: exam.max_attempts || 1,
        is_public: exam.is_public || false,
        allow_late_submission: exam.allow_late_submission || false,
        late_submission_penalty: exam.late_submission_penalty || 0,
        require_fullscreen: exam.require_fullscreen !== undefined ? exam.require_fullscreen : true,
        disable_copy_paste: exam.disable_copy_paste !== undefined ? exam.disable_copy_paste : true,
        disable_right_click: exam.disable_right_click !== undefined ? exam.disable_right_click : true,
        enable_webcam_proctoring: exam.enable_webcam_proctoring || false,
        allow_tab_switching: exam.allow_tab_switching || false,
        instructions: exam.instructions || '',
        status: exam.status || 'published',
        duration_minutes: exam.duration_minutes || 60,
        passing_marks: exam.passing_marks || 33,
        allow_negative_marking: exam.allow_negative_marking || false,
        negative_marking_percentage: exam.negative_marking_percentage || 25,
        shuffle_questions: exam.shuffle_questions || false,
        // Visibility scope fields
        visibility_scope: exam.visibility_scope || 'institute',
        center_ids: exam.center_ids || [],
        batch_ids: exam.batch_ids || [],
        show_result_after_exam_end: exam.show_result_after_exam_end ?? true,
      });


      // Set selected pattern
      if (exam.pattern) {
        setSelectedPattern(exam.pattern);
      }
    } catch (error) {
      console.error('Failed to fetch exam:', error);
      setErrors({ general: 'Failed to load exam data' });
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
    const pattern = patterns.find(p => p.id === patternId);
    setSelectedPattern(pattern || null);
    handleInputChange('pattern', patternId);
    if (pattern) {
      handleInputChange('duration_minutes', pattern.duration_minutes);
    }
    // reset option on change
    setPatternOption(null);
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

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be at least 1 minute';
    }

    if (formData.max_attempts <= 0) {
      newErrors.max_attempts = 'Max attempts must be at least 1';
    }

    if (formData.passing_marks < 0) {
      newErrors.passing_marks = 'Passing marks cannot be negative';
    }

    // Visibility scope validation
    if (formData.visibility_scope === 'centers' && formData.center_ids.length === 0) {
      newErrors.visibility_scope = 'Please select at least one center';
    }

    if (formData.visibility_scope === 'batches' && formData.batch_ids.length === 0) {
      newErrors.visibility_scope = 'Please select at least one batch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (selectedPattern && !patternOption) {
      setErrors(prev => ({ ...prev, pattern: 'Select how to use the pattern (questions vs template).' }));
      return;
    }

    setSaving(true);
    try {
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
        start_date: formatDateTimeForBackend(formData.start_date),
        end_date: formatDateTimeForBackend(formData.end_date),
        created_by: user?.id,
        institute: user?.institute_id || user?.institute?.id,
        // Include visibility scope data
        visibility_scope: formData.visibility_scope,
        center_ids: formData.visibility_scope === 'centers' ? formData.center_ids : [],
        batch_ids: formData.visibility_scope === 'batches' ? formData.batch_ids : [],
      };


      if (isEditing && examId) {
        // Update existing exam
        await api.put(`/exams/exams/${examId}/`, examData);
      } else {
        // Create new exam
        const createRes = await api.post('/exams/exams/', examData);
        const newExam = createRes.data;

        // If user chose to use existing pattern questions, map them into ExamQuestion
        if (patternOption === 'use_existing' && selectedPattern) {
          try {
            // Ensure we have latest sections
            const patternDetail = await api.get(`/patterns/patterns/${selectedPattern.id}/`);
            const sections: PatternSection[] = patternDetail.data.sections || selectedPattern.sections || [];

            for (const section of sections) {
              const qRes = await api.get(`/questions/questions/?pattern_section=${section.id}`);
              const questions: PatternQuestion[] = (qRes.data.results || qRes.data) as PatternQuestion[];
              const sorted = questions
                .filter(q => q.question_number_in_pattern != null)
                .sort((a, b) => (a.question_number_in_pattern! - b.question_number_in_pattern!));

              for (const q of sorted) {
                await api.post(`/questions/exams/${newExam.id}/questions/`, {
                  question_id: q.id,
                  question_number: q.question_number_in_pattern || 1,
                  section_name: section.name,
                  marks: section.marks_per_question,
                  negative_marks: section.negative_marking ?? 0.25,
                  order: q.question_number_in_pattern || 1,
                });
              }
            }
          } catch (assignErr) {
            console.error('Failed to assign pattern questions to exam:', assignErr);
          }
        }
      }

      navigate(`${basePath}/exams`);
    } catch (error: any) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} exam:`, error);
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#216865' }}></div>
          <p className="text-sm" style={{ color: '#6b6b6b' }}>
            {isEditing ? 'Loading exam data...' : 'Loading patterns...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full px-2 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate(`${basePath}/exams`)}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            style={{ color: '#6b6b6b' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-black">
              {isEditing ? 'Edit Exam' : 'Create New Exam'}
            </h1>
            <p className="text-xs" style={{ color: '#6b6b6b' }}>
              {isEditing ? 'Update exam details and settings' : 'Set up a new exam with pattern and settings'}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-red-600" />
              <p className="text-xs text-red-600">{errors.general}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          {/* Main Form - Takes 4 columns */}
          <div className="xl:col-span-4 space-y-2">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#216865' }}>
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-black">Basic Information</h2>
                  <p className="text-xs" style={{ color: '#6b6b6b' }}>Essential exam details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>Exam Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.title ? 'border-red-300' : ''
                      }`}
                    style={{
                      borderColor: errors.title ? '#ef4444' : '#e5e7eb',
                      color: '#000000'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3f5fd4';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.title ? '#ef4444' : '#e5e7eb';
                    }}
                    placeholder="Enter exam title"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.title}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.status ? 'border-red-300' : ''}`}
                    style={{ borderColor: errors.status ? '#ef4444' : '#e5e7eb', color: '#000000' }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {errors.status && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.status}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={2}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors resize-none ${errors.description ? 'border-red-300' : ''
                      }`}
                    style={{
                      borderColor: errors.description ? '#ef4444' : '#e5e7eb',
                      color: '#000000'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3f5fd4';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.description ? '#ef4444' : '#e5e7eb';
                    }}
                    placeholder="Describe the exam..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.description}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.start_date ? 'border-red-300' : ''
                      }`}
                    style={{
                      borderColor: errors.start_date ? '#ef4444' : '#e5e7eb',
                      color: '#000000'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3f5fd4';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.start_date ? '#ef4444' : '#e5e7eb';
                    }}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                  {errors.start_date && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.start_date}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.end_date ? 'border-red-300' : ''
                      }`}
                    style={{
                      borderColor: errors.end_date ? '#ef4444' : '#e5e7eb',
                      color: '#000000'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3f5fd4';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.end_date ? '#ef4444' : '#e5e7eb';
                    }}
                    min={formData.start_date || new Date().toISOString().slice(0, 16)}
                    required
                  />
                  {errors.end_date && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.end_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Exam Visibility Scope */}
            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7c3aed' }}>
                  <Target className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-black">Exam Visibility</h2>
                  <p className="text-xs" style={{ color: '#6b6b6b' }}>Choose who can take this exam</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Institute-wide option */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.visibility_scope === 'institute'
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                  <input
                    type="radio"
                    name="visibility_scope"
                    value="institute"
                    checked={formData.visibility_scope === 'institute'}
                    onChange={() => handleInputChange('visibility_scope', 'institute')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-semibold text-slate-900">Institute-Wide</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      All students in your institute ({user?.institute?.name || 'Current Institute'}) can access this exam
                    </p>
                  </div>
                </label>

                {/* Specific Centers option */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.visibility_scope === 'centers'
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                  <input
                    type="radio"
                    name="visibility_scope"
                    value="centers"
                    checked={formData.visibility_scope === 'centers'}
                    onChange={() => handleInputChange('visibility_scope', 'centers')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-semibold text-slate-900">Specific Centers</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Only students enrolled in selected centers can access this exam
                    </p>
                  </div>
                </label>

                {/* Center selection (shown when centers scope is selected) */}
                {formData.visibility_scope === 'centers' && (
                  <div className="ml-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-700 mb-2">Select Centers:</p>
                    {centers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No centers available</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {centers.map((center) => (
                          <label key={center.id} className="flex items-center gap-2 p-2 rounded border border-slate-100 bg-white hover:bg-violet-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.center_ids.includes(String(center.id))}
                              onChange={(e) => {
                                const centerId = String(center.id);
                                if (e.target.checked) {
                                  handleInputChange('center_ids', [...formData.center_ids, centerId]);
                                } else {
                                  handleInputChange('center_ids', formData.center_ids.filter((id: string) => id !== centerId));
                                }
                              }}
                              className="rounded text-violet-600"
                            />
                            <div>
                              <span className="text-xs font-medium text-slate-700">{center.name}</span>
                              {center.city && <span className="text-xs text-slate-400 ml-1">- {center.city}</span>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {formData.visibility_scope === 'centers' && formData.center_ids.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Select at least one center
                      </p>
                    )}
                  </div>
                )}

                {/* Specific Batches option */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.visibility_scope === 'batches'
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                  <input
                    type="radio"
                    name="visibility_scope"
                    value="batches"
                    checked={formData.visibility_scope === 'batches'}
                    onChange={() => handleInputChange('visibility_scope', 'batches')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-violet-600" />
                      <span className="text-xs font-semibold text-slate-900">Specific Batches</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Only students enrolled in selected batches can access this exam
                    </p>
                  </div>
                </label>

                {/* Batch selection (shown when batches scope is selected) */}
                {formData.visibility_scope === 'batches' && (
                  <div className="ml-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-700 mb-2">Select Batches:</p>
                    {batches.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No batches available</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {batches.map((batch) => (
                          <label key={batch.id} className="flex items-center gap-2 p-2 rounded border border-slate-100 bg-white hover:bg-violet-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.batch_ids.includes(String(batch.id))}
                              onChange={(e) => {
                                const batchId = String(batch.id);
                                if (e.target.checked) {
                                  handleInputChange('batch_ids', [...formData.batch_ids, batchId]);
                                } else {
                                  handleInputChange('batch_ids', formData.batch_ids.filter((id: string) => id !== batchId));
                                }
                              }}
                              className="rounded text-violet-600"
                            />
                            <div>
                              <span className="text-xs font-medium text-slate-700">{batch.name}</span>
                              <span className="text-xs text-slate-400 ml-1">({batch.code})</span>
                              {batch.program && <span className="text-xs text-slate-400 block">{batch.program}</span>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {formData.visibility_scope === 'batches' && formData.batch_ids.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Select at least one batch
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pattern Selection */}

            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#723e11' }}>
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-black">Exam Pattern</h2>
                  <p className="text-xs" style={{ color: '#6b6b6b' }}>Select the pattern for this exam</p>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-2">Available Patterns *</label>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  {patterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => handlePatternSelect(pattern.id)}
                      className={`p-2 text-left border rounded transition-colors ${formData.pattern === pattern.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-medium text-slate-900">{pattern.name}</h3>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                          <span className="text-xs text-slate-500">{pattern.total_questions}Q</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-1 line-clamp-2">{pattern.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{pattern.duration_minutes}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>{pattern.total_marks}m</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.pattern && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.pattern}
                  </p>
                )}
              </div>

              {/* Pattern Structure Preview */}
              {selectedPattern && (
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Pattern Structure</h3>
                  {/* Option 2: Choose how to use this pattern */}
                  <div className="mb-3 p-3 rounded border bg-slate-50" style={{ borderColor: '#e5e7eb' }}>
                    <p className="text-xs font-medium text-slate-800 mb-2">How do you want to use this pattern?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${patternOption === 'use_existing' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-white'}`}>
                        <input
                          type="radio"
                          name="patternOption"
                          className="mt-1"
                          checked={patternOption === 'use_existing'}
                          onChange={() => setPatternOption('use_existing')}
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900">Use previous questions</div>
                          <div className="text-xs text-slate-600">Copy existing questions from this pattern into the exam</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${patternOption === 'template' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-white'}`}>
                        <input
                          type="radio"
                          name="patternOption"
                          className="mt-1"
                          checked={patternOption === 'template'}
                          onChange={() => setPatternOption('template')}
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900">Template only (no questions)</div>
                          <div className="text-xs text-slate-600">Use the pattern structure; you’ll add/select questions later</div>
                        </div>
                      </label>
                    </div>
                    {!patternOption && (
                      <div className="mt-2 text-[11px] text-slate-500">Please select one option before creating the exam.</div>
                    )}
                  </div>

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
            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-900">Exam Settings</h2>
                  <p className="text-xs text-slate-600">Configure exam behavior and rules</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Duration (min) *</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.duration_minutes ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="1"
                  />
                  {errors.duration_minutes && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.duration_minutes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Attempt *</label>
                  <input
                    type="number"
                    value={formData.max_attempts}
                    onChange={(e) => handleInputChange('max_attempts', parseInt(e.target.value) || 1)}
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.max_attempts ? 'border-red-300' : 'border-slate-300'
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
                    className={`w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:outline-none transition-colors ${errors.passing_marks ? 'border-red-300' : 'border-slate-300'
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

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Negative Marking (%)</label>
                  <input
                    type="number"
                    value={formData.negative_marking_percentage}
                    onChange={(e) => handleInputChange('negative_marking_percentage', parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:outline-none transition-colors"
                    min="0"
                    max="100"
                    disabled={!formData.allow_negative_marking}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Negative Marking</label>
                    <p className="text-xs text-slate-500">Deduct marks for wrong answers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_negative_marking}
                      onChange={(e) => handleInputChange('allow_negative_marking', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

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
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
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
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Late Submission</label>
                    <p className="text-xs text-slate-500">Allow after end time</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_late_submission}
                      onChange={(e) => handleInputChange('allow_late_submission', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Require Fullscreen</label>
                    <p className="text-xs text-slate-500">Force fullscreen mode</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.require_fullscreen}
                      onChange={(e) => handleInputChange('require_fullscreen', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Disable Copy/Paste</label>
                    <p className="text-xs text-slate-500">Prevent copy/paste</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disable_copy_paste}
                      onChange={(e) => handleInputChange('disable_copy_paste', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Disable Right Click</label>
                    <p className="text-xs text-slate-500">Prevent right-click menu</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.disable_right_click}
                      onChange={(e) => handleInputChange('disable_right_click', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Delay Results Display</label>
                    <p className="text-xs text-slate-500">Show results only after exam ends</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.show_result_after_exam_end}
                      onChange={(e) => handleInputChange('show_result_after_exam_end', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Webcam Proctoring</label>
                    <p className="text-xs text-slate-500">Monitor via webcam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enable_webcam_proctoring}
                      onChange={(e) => handleInputChange('enable_webcam_proctoring', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Info className="w-3 h-3 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-900">Exam Instructions</h2>
                  <p className="text-xs text-slate-600">Instructions for students</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:outline-none transition-colors resize-none"
                  placeholder="Enter exam instructions for students"
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-2">
            {/* Exam Summary */}
            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-xs font-semibold text-slate-900 mb-2">Exam Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Pattern</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">
                    {selectedPattern ? selectedPattern.name : 'Not selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Duration</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{formData.duration_minutes}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Max Attempts</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{formData.max_attempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Passing Marks</span>
                  </div>
                  <span className="text-xs font-medium text-slate-900">{formData.passing_marks}%</span>
                </div>
                {selectedPattern && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-xs text-slate-600">Total Questions</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900">{selectedPattern.total_questions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-xs text-slate-600">Total Marks</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900">{selectedPattern.total_marks}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border p-3" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-xs font-semibold text-slate-900 mb-2">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-3 h-3" />
                  {saving ? 'Creating...' : 'Create Exam'}
                </button>

                <button
                  onClick={() => navigate(`${basePath}/exams`)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1 text-xs">Exam Guidelines</h4>
                  <ul className="text-xs text-blue-700 space-y-0.5">
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
