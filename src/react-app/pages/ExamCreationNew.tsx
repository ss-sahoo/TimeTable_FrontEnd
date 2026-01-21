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
  Zap,
  ChevronDown
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import { getPublicExamLink, normalizeShareUrl } from '../utils/urlUtils';
import timezones from '@/shared/timezones';

const userDefaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

const buildPartsMap = (parts: Intl.DateTimeFormatPart[]) => {
  const map: Record<string, string> = {};
  parts.forEach(({ type, value }) => {
    if (type !== 'literal') {
      map[type] = value;
    }
  });
  return map;
};

const getTimeZoneOffset = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const map = buildPartsMap(parts);
  const tzTime = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second || '0'),
  );

  return tzTime - date.getTime();
};

const convertToISOStringWithTimezone = (localValue: string, timeZone: string) => {
  if (!localValue) return null;
  const [datePart, timePart] = localValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const baseDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffset(baseDate, timeZone);
  const utcDate = new Date(baseDate.getTime() - offset);
  return utcDate.toISOString();
};

const formatDateTimeLocal = (isoString: string, timeZone: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);

  const map = buildPartsMap(parts);
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
};

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

interface PublicLinkInfo {
  token: string;
  share_url: string;
  expires_at: string | null;
  allowed_ips: string[];
  allow_multiple_devices: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  is_expired: boolean;
  recent_logs: Array<{
    status: string;
    reason: string;
    student_email: string;
    ip_address: string | null;
    accessed_at: string;
  }>;
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
  // Shuffle settings
  shuffle_questions: boolean;
  shuffle_within_sections: boolean;
  shuffle_sections: boolean;
  shuffle_subjects: boolean;
  shuffle_options: boolean;
  shuffle_seed_per_student: boolean;
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
  public_token_expires_at: string;
  public_allowed_ip_ranges_text: string;
  public_allow_multiple_devices: boolean;
  institute?: number | null;
}

const getDefaultFormData = (): ExamFormData => ({
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
  // Shuffle settings
  shuffle_questions: false,
  shuffle_within_sections: true,
  shuffle_sections: false,
  shuffle_subjects: false,
  shuffle_options: false,
  shuffle_seed_per_student: true,
  show_results_immediately: true,
  instructions: '',

  status: 'published',  // Changed default from 'draft' to 'published' so students can see exams immediately
  timezone: userDefaultTimezone,
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
  public_token_expires_at: '',
  public_allowed_ip_ranges_text: '',
  public_allow_multiple_devices: false,
  institute: null,
});

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
  const [patternOption, setPatternOption] = useState<'template' | null>('template');
  const [patternQuestions, setPatternQuestions] = useState<any[]>([]);
  const [publicLinkInfo, setPublicLinkInfo] = useState<PublicLinkInfo | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(false);
  const [publicLinkError, setPublicLinkError] = useState<string | null>(null);
  const [publicLinkCopyMessage, setPublicLinkCopyMessage] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<{
    examId: number;
    shareUrl?: string | null;
    token?: string | null;
  } | null>(null);
  const [creationCopyMessage, setCreationCopyMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExamFormData>(getDefaultFormData());
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPatterns = await fetchPatterns();
      if (isEditMode && examId) {
        await fetchExamData(fetchedPatterns);
      }
    };
    loadData();
  }, [examId, isEditMode]);

  useEffect(() => {
    if (isEditMode && examId && formData.is_public) {
      fetchPublicLinkInfo(examId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.is_public]);

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
      let resolvedTimezone = userDefaultTimezone;
      if (exam.timezone && typeof exam.timezone === 'string') {
        if (exam.timezone === 'UTC' && userDefaultTimezone !== 'UTC') {
          resolvedTimezone = userDefaultTimezone;
        } else if (timezones.includes(exam.timezone)) {
          resolvedTimezone = exam.timezone;
        }
      }

      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        pattern: exam.pattern?.id || null,
        start_date: formatDateTimeLocal(exam.start_date, resolvedTimezone),
        end_date: formatDateTimeLocal(exam.end_date, resolvedTimezone),
        duration_minutes: exam.duration_minutes || 60,
        max_attempts: exam.max_attempts || 1,
        passing_marks: exam.passing_marks || 50,
        is_published: exam.is_published || false,
        allow_negative_marking: exam.allow_negative_marking || false,
        negative_marking_percentage: exam.negative_marking_percentage || 25,
        shuffle_questions: exam.shuffle_questions ?? false,
        shuffle_within_sections: exam.shuffle_within_sections ?? true,
        shuffle_sections: exam.shuffle_sections ?? false,
        shuffle_subjects: exam.shuffle_subjects ?? false,
        shuffle_options: exam.shuffle_options ?? false,
        shuffle_seed_per_student: exam.shuffle_seed_per_student ?? true,
        show_results_immediately: exam.show_results_immediately ?? true,
        instructions: exam.instructions || '',
        status: exam.status || 'draft',
        timezone: resolvedTimezone,
        grace_period_minutes: exam.grace_period_minutes || 0,
        buffer_time_minutes: exam.buffer_time_minutes || 15,
        auto_start: exam.auto_start ?? true,
        auto_end: exam.auto_end ?? true,
        reschedule_allowed: exam.reschedule_allowed || false,
        max_reschedules: exam.max_reschedules || 0,
        reschedule_deadline: exam.reschedule_deadline ? formatDateTimeLocal(exam.reschedule_deadline, resolvedTimezone) : '',
        allow_late_submission: exam.allow_late_submission || false,
        late_submission_penalty: exam.late_submission_penalty || 0,
        require_fullscreen: exam.require_fullscreen ?? true,
        disable_copy_paste: exam.disable_copy_paste ?? true,
        disable_right_click: exam.disable_right_click ?? true,
        enable_webcam_proctoring: exam.enable_webcam_proctoring ?? true,
        allow_tab_switching: exam.allow_tab_switching ?? true,
        is_public: exam.is_public || true,
        public_token_expires_at: exam.public_token_expires_at ? formatDateTimeLocal(exam.public_token_expires_at, resolvedTimezone) : '',
        public_allowed_ip_ranges_text: Array.isArray(exam.public_allowed_ip_ranges) ? exam.public_allowed_ip_ranges.join('\n') : '',
        public_allow_multiple_devices: exam.public_allow_multiple_devices ?? true,
        institute: exam.institute ?? exam.institute_id ?? (user?.institute_id ?? null),
      });
      setAdvancedExpanded(false);

      if (exam.pattern?.id) {
        const pattern = fetchedPatterns.find(p => p.id === exam.pattern.id);
        setSelectedPattern(pattern || null);
      }

      if (examId) {
        fetchPublicLinkInfo(examId);
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

  const parseAllowedIpText = (value: string) => {
    if (!value) return [] as string[];
    return value
      .split(/\r?\n|,/)
      .map(entry => entry.trim())
      .filter(Boolean);
  };

  const formatDateTimeDisplay = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  const fetchPublicLinkInfo = async (currentExamId: string | number) => {
    if (!currentExamId) {
      return;
    }

    try {
      setPublicLinkLoading(true);
      setPublicLinkError(null);
      setPublicLinkCopyMessage(null);
      const response = await api.get(`/exams/exams/${currentExamId}/public-link/`);
      setPublicLinkInfo(response.data);
    } catch (error) {
      console.error('Failed to load public link info:', error);
      setPublicLinkError('Unable to load public link details right now.');
    } finally {
      setPublicLinkLoading(false);
    }
  };

  // Removed: Always using template mode, no need to handle pattern option changes

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

    // Removed validation: Always using template mode by default

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
      setCreationCopyMessage(null);
      // Prepare exam data - rename 'pattern' to 'pattern_id' for backend
      const {
        pattern,
        public_allowed_ip_ranges_text,
        public_token_expires_at,
        reschedule_deadline,
        institute,
        ...rest
      } = formData;

      const allowedIpRanges = parseAllowedIpText(public_allowed_ip_ranges_text);
      const publicExpiryISO = public_token_expires_at
        ? convertToISOStringWithTimezone(public_token_expires_at, rest.timezone)
        : null;
      const rescheduleDeadlineISO = reschedule_deadline
        ? convertToISOStringWithTimezone(reschedule_deadline, rest.timezone)
        : null;

      const examData = {
        ...rest,
        pattern_id: pattern,  // Backend expects pattern_id, not pattern
        start_date: convertToISOStringWithTimezone(rest.start_date, rest.timezone),
        end_date: convertToISOStringWithTimezone(rest.end_date, rest.timezone),
        public_token_expires_at: publicExpiryISO,
        public_allowed_ip_ranges: allowedIpRanges,
        reschedule_deadline: rescheduleDeadlineISO,
        created_by: user?.id,
        institute: institute ?? user?.institute_id ?? user?.institute?.id ?? null,
        timezone: rest.timezone,
        status: rest.status,  // Add status field
        grace_period_minutes: rest.grace_period_minutes,
        buffer_time_minutes: rest.buffer_time_minutes,
        auto_start: rest.auto_start,
        auto_end: rest.auto_end,
        reschedule_allowed: rest.reschedule_allowed,
        max_reschedules: rest.max_reschedules,
        allow_late_submission: rest.allow_late_submission,
        late_submission_penalty: rest.late_submission_penalty,
        require_fullscreen: rest.require_fullscreen,
        disable_copy_paste: rest.disable_copy_paste,
        disable_right_click: rest.disable_right_click,
        enable_webcam_proctoring: rest.enable_webcam_proctoring,
        allow_tab_switching: rest.allow_tab_switching,
        is_public: rest.is_public,
        public_allow_multiple_devices: rest.public_allow_multiple_devices,
      };

      if (isEditMode && examId) {
        await api.put(`/exams/exams/${examId}/`, examData);
        navigate('/exams');
      } else {
        // Create new exam
        const response = await api.post('/exams/exams/', examData);
        const newExam = response.data;

        const shareUrl = normalizeShareUrl(
          newExam?.share_url ||
          (newExam?.public_access_token
            ? getPublicExamLink(newExam.public_access_token)
            : undefined)
        );

        if (newExam?.id) {
          setCreationSuccess({
            examId: newExam.id,
            shareUrl,
            token: newExam?.public_access_token ?? null,
          });
          setFormData(getDefaultFormData());
          setAdvancedExpanded(false);
          setErrors({});
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/exams');
        }
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} exam:`, error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCreatedLink = async () => {
    if (!creationSuccess) return;
    const link = normalizeShareUrl(
      creationSuccess.shareUrl ||
      (creationSuccess.token ? getPublicExamLink(creationSuccess.token) : '')
    );
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCreationCopyMessage('Link copied to clipboard.');
    } catch (err) {
      console.error('Copy failed:', err);
      setCreationCopyMessage('Copy failed. Please copy the link manually.');
    }

    setTimeout(() => setCreationCopyMessage(null), 2000);
  };

  const handleCopyPublicLink = async () => {
    const link = normalizeShareUrl(
      publicLinkInfo?.share_url ||
      (publicLinkInfo?.token ? getPublicExamLink(publicLinkInfo.token) : '')
    );
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setPublicLinkCopyMessage('Link copied to clipboard.');
    } catch (error) {
      console.error('Failed to copy public link:', error);
      setPublicLinkCopyMessage('Copy failed. Please copy manually.');
    }

    setTimeout(() => setPublicLinkCopyMessage(null), 2000);
  };

  const handleRegeneratePublicLink = async () => {
    if (!examId) return;

    try {
      setPublicLinkLoading(true);
      setPublicLinkCopyMessage(null);
      await api.post(`/exams/exams/${examId}/public-link/`, {
        regenerate_token: true,
      });
      await fetchPublicLinkInfo(examId);
      setPublicLinkCopyMessage('New link generated.');
    } catch (error) {
      console.error('Failed to regenerate public link:', error);
      setPublicLinkError('Unable to regenerate link right now.');
    } finally {
      setPublicLinkLoading(false);
    }
  };

  const handleSavePublicLink = async () => {
    if (!examId) return;

    try {
      setPublicLinkLoading(true);
      setPublicLinkCopyMessage(null);
      const expiresAtValue = formData.public_token_expires_at
        ? new Date(formData.public_token_expires_at).toISOString()
        : '';

      await api.post(`/exams/exams/${examId}/public-link/`, {
        expires_at: expiresAtValue,
        allowed_ips: parseAllowedIpText(formData.public_allowed_ip_ranges_text),
        allow_multiple_devices: formData.public_allow_multiple_devices,
      });

      setPublicLinkCopyMessage('Access settings saved.');
      await fetchPublicLinkInfo(examId);
    } catch (error) {
      console.error('Failed to save public link settings:', error);
      setPublicLinkError('Unable to save access settings.');
    } finally {
      setPublicLinkLoading(false);
      setTimeout(() => setPublicLinkCopyMessage(null), 2000);
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

        {creationSuccess && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Exam created successfully.</p>
                <p className="text-xs text-blue-700">
                  Share this link with students to let them access the exam without logging in.
                </p>
                {creationSuccess.shareUrl && (
                  <p className="mt-2 text-xs font-mono text-blue-900 break-all bg-white/60 px-3 py-2 rounded-lg border border-blue-200">
                    {normalizeShareUrl(creationSuccess.shareUrl)}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleCopyCreatedLink}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {creationCopyMessage ? creationCopyMessage : 'Copy Public Link'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/exams/${creationSuccess.examId}/edit`)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configure Exam
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/exams')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Exams
                </button>
              </div>
            </div>
          </div>
        )}

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

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter exam instructions for students..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Date * 
                    <span className="ml-2 text-xs font-normal text-blue-600">
                      ({formData.timezone || userDefaultTimezone})
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
                      ({formData.timezone || userDefaultTimezone})
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

              {/* Removed: Pattern option selection - always using template mode by default */}

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
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-50"
                aria-expanded={advancedExpanded}
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-slate-900">Advanced Settings</span>
                    <span className="block text-xs text-slate-600">Configure advanced exam options</span>
                  </span>
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    advancedExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {advancedExpanded && (
                <div className="px-4 pb-4 pt-3 space-y-4 border-t border-slate-100 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz.replace(/_/g, ' ')}
                          </option>
                        ))}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">Question Shuffling</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-medium text-slate-700">Enable Shuffling</label>
                        <p className="text-xs text-slate-500">Master toggle for question shuffling</p>
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

                    {formData.shuffle_questions && (
                      <div className="ml-4 pl-4 border-l-2 border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-slate-700">Shuffle Within Sections</label>
                            <p className="text-xs text-slate-500">Randomize questions within each section</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.shuffle_within_sections}
                              onChange={(e) => handleInputChange('shuffle_within_sections', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-slate-700">Shuffle Sections</label>
                            <p className="text-xs text-slate-500">Randomize the order of sections</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.shuffle_sections}
                              onChange={(e) => handleInputChange('shuffle_sections', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-slate-700">Shuffle Subjects</label>
                            <p className="text-xs text-slate-500">Randomize the order of subjects</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.shuffle_subjects}
                              onChange={(e) => handleInputChange('shuffle_subjects', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-medium text-slate-700">Shuffle Options</label>
                            <p className="text-xs text-slate-500">Randomize MCQ answer options</p>
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
                            <label className="text-xs font-medium text-slate-700">Unique Order Per Student</label>
                            <p className="text-xs text-slate-500">Each student gets a different shuffle order</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.shuffle_seed_per_student}
                              onChange={(e) => handleInputChange('shuffle_seed_per_student', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    )}

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
              )}
            </div>

            {formData.is_public && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex flex-col gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-blue-900">Public Access Link</h3>
                  <p className="text-xs text-blue-700">Share this link with students who should access the exam without logging in.</p>
                  {publicLinkError && (
                    <span className="text-xs text-red-600">{publicLinkError}</span>
                  )}
                  {publicLinkCopyMessage && (
                    <span className="text-xs text-green-700">{publicLinkCopyMessage}</span>
                  )}
                </div>

                {isEditMode ? (
                  examId ? (
                    <div className="space-y-4">
                      {publicLinkLoading && (
                        <p className="text-xs text-blue-700">Loading public link details...</p>
                      )}

                      {publicLinkInfo && !publicLinkLoading && (
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-600">Shareable URL</p>
                              <p className="text-sm font-semibold text-blue-900 break-all">{normalizeShareUrl(publicLinkInfo.share_url)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleCopyPublicLink}
                                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Copy Link
                              </button>
                              <button
                                type="button"
                                onClick={handleRegeneratePublicLink}
                                disabled={publicLinkLoading}
                                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60"
                              >
                                {publicLinkLoading ? 'Regenerating…' : 'Regenerate'}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Link Expiry</label>
                            <input
                              type="datetime-local"
                              value={formData.public_token_expires_at}
                              onChange={(e) => handleInputChange('public_token_expires_at', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave blank for no expiration.</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              id="public-allow-multiple-devices"
                              type="checkbox"
                              checked={formData.public_allow_multiple_devices}
                              onChange={(e) => handleInputChange('public_allow_multiple_devices', e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-blue-200 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="public-allow-multiple-devices" className="text-xs text-slate-600">
                              Allow access from multiple devices
                            </label>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSavePublicLink}
                              disabled={publicLinkLoading}
                              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                            >
                              {publicLinkLoading ? 'Saving…' : 'Save Access Settings'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-600">
                            <div>
                              <p className="font-medium text-slate-700">Link Created</p>
                              <p>{formatDateTimeDisplay(publicLinkInfo.created_at)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">Last Used</p>
                              <p>{formatDateTimeDisplay(publicLinkInfo.last_used_at)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">Usage Count</p>
                              <p>{publicLinkInfo.usage_count}</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">Status</p>
                              <p className={publicLinkInfo.is_expired ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                {publicLinkInfo.is_expired ? 'Expired' : 'Active'}
                              </p>
                            </div>
                          </div>

                          {publicLinkInfo.recent_logs && publicLinkInfo.recent_logs.length > 0 && (
                            <div className="pt-3 border-t border-blue-200">
                              <p className="text-xs font-semibold text-slate-700 mb-2">Recent Access</p>
                              <div className="space-y-2">
                                {publicLinkInfo.recent_logs.map((log, index) => (
                                  <div key={`${log.accessed_at}-${index}`} className="text-xs text-slate-600 flex flex-wrap gap-2">
                                    <span className="font-medium text-slate-700">{formatDateTimeDisplay(log.accessed_at)}</span>
                                    <span>• {log.status === 'granted' ? 'Granted' : 'Denied'}</span>
                                    {log.student_email && <span>• {log.student_email}</span>}
                                    {log.ip_address && <span>• {log.ip_address}</span>}
                                    {log.reason && <span className="text-slate-500">({log.reason})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!publicLinkInfo && !publicLinkLoading && (
                        <p className="text-xs text-slate-600">Public link details will appear here once generated.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">Save the exam to generate a shareable public link.</p>
                  )
                ) : (
                  <p className="text-xs text-slate-600">
                    Create the exam to generate a shareable public link. After saving you'll be redirected here with the link ready to share.
                  </p>
                )}
              </div>
            )}
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
