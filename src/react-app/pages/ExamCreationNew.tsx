import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
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
import { motion, AnimatePresence } from 'framer-motion';
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
  exam_mode?: 'online' | 'offline_omr' | 'offline_subjective';
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
  is_flexible: boolean;
  // Exam mode settings
  exam_mode: 'online' | 'offline_omr' | 'offline_subjective' | 'hybrid';
  ai_evaluation_enabled: boolean;
  marking_strictness: 'lenient' | 'moderate' | 'strict';
  // Shuffle settings
  shuffle_questions: boolean;
  shuffle_within_sections: boolean;
  shuffle_sections: boolean;
  shuffle_subjects: boolean;
  shuffle_options: boolean;
  shuffle_seed_per_student: boolean;
  show_result_after_exam_end: boolean;
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
  // Visibility scope fields
  visibility_scope: 'institute' | 'centers' | 'batches' | 'program';
  center_ids: string[];
  batch_ids: string[];
  program_id: string | number | null;
  copy_from_exam_id: number | null;
}

const getDefaultFormData = (): ExamFormData => ({
  title: '',
  description: '',
  pattern: null,
  start_date: '',
  end_date: '',
  duration_minutes: 60,
  max_attempts: 2,
  passing_marks: 50,
  is_published: false,
  allow_negative_marking: false,
  negative_marking_percentage: 25,
  is_flexible: false,
  // Shuffle settings
  shuffle_questions: false,
  shuffle_within_sections: true,
  shuffle_sections: false,
  shuffle_subjects: false,
  shuffle_options: false,
  shuffle_seed_per_student: true,
  show_result_after_exam_end: true,
  instructions: '',

  // Exam mode defaults
  exam_mode: 'online',
  ai_evaluation_enabled: false,
  marking_strictness: 'moderate',

  status: 'draft',  // Default to draft so admins can review before publishing
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
  // Visibility scope defaults
  visibility_scope: 'institute',
  center_ids: [],
  batch_ids: [],
  program_id: null,
  copy_from_exam_id: null,
});

export default function ExamCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isCenterAdminPath = location.pathname.startsWith('/center-admin');
  const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');
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

  // Centers and batches for visibility scope
  const [centers, setCenters] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  const [creationSuccess, setCreationSuccess] = useState<{
    examId: number;
    shareUrl?: string | null;
    token?: string | null;
  } | null>(null);
  const [creationCopyMessage, setCreationCopyMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState<ExamFormData>(getDefaultFormData());
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPatterns = await fetchPatterns();
      fetchExamsForCopy();
      fetchCenters();
      fetchBatches();
      fetchPrograms();
      if (isEditMode && examId) {
        await fetchExamData(fetchedPatterns);
      }
    };
    loadData();
  }, [examId, isEditMode]);

  const [existingExams, setExistingExams] = useState<any[]>([]);

  const fetchExamsForCopy = async () => {
    try {
      const response = await api.get('/exams/exams/?page_size=1000');
      setExistingExams(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch exams for copy:', error);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await api.get('/timetable/centers/');
      const centersData = response.data.results || response.data.centers || response.data || [];
      const allCenters = Array.isArray(centersData) ? centersData : [];

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

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/timetable/programs/');
      const programsData = response.data.programs || response.data.results || response.data || [];
      setPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };


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
        max_attempts: exam.max_attempts || 2,
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
        show_result_after_exam_end: exam.show_result_after_exam_end ?? true,
        instructions: exam.instructions || '',
        // Exam mode settings
        exam_mode: exam.exam_mode || 'online',
        ai_evaluation_enabled: exam.ai_evaluation_enabled ?? false,
        marking_strictness: exam.marking_strictness || 'moderate',
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
        // Visibility scope fields
        visibility_scope: exam.visibility_scope || 'institute',
        center_ids: exam.allowed_centers_data ? exam.allowed_centers_data.map((c: any) => String(c.id)) : [],
        batch_ids: exam.allowed_batches_data ? exam.allowed_batches_data.map((b: any) => String(b.id)) : [],
        program_id: exam.program?.id || exam.program || null,
        copy_from_exam_id: null,
        is_flexible: exam.is_flexible || false,
      });


      setAdvancedExpanded(false);

      if (exam.pattern?.id) {
        const pattern = fetchedPatterns.find(p => p.id === exam.pattern.id);
        setSelectedPattern(pattern || null);
      }

      if (examId) {
        fetchPublicLinkInfo(examId);
      }

      // If end date is significantly different from start + duration, enable flexible window if not already set
      if (!exam.is_flexible && exam.start_date && exam.end_date && exam.duration_minutes) {
        const start = new Date(exam.start_date);
        const end = new Date(exam.end_date);
        const diff = (end.getTime() - start.getTime()) / 60000;
        if (Math.abs(diff - exam.duration_minutes) > 1) {
          setFormData(prev => ({ ...prev, is_flexible: true }));
        }
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
      // Auto-fill duration and exam mode from pattern
      const newDuration = pattern.total_duration;
      const newMode = pattern.exam_mode || 'online';

      setFormData(prev => {
        const newData = {
          ...prev,
          pattern: patternId,
          duration_minutes: newDuration,
          exam_mode: newMode
        };
        if (!prev.is_flexible && prev.start_date) {
          const startDate = new Date(prev.start_date);
          const endDate = new Date(startDate.getTime() + newDuration * 60000);
          newData.end_date = formatDateTimeLocal(endDate.toISOString(), prev.timezone);
        }
        return newData;
      });
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

    // Visibility scope validation
    if (formData.visibility_scope === 'centers' && formData.center_ids.length === 0) {
      newErrors.visibility_scope = 'Please select at least one center';
    }

    if (formData.visibility_scope === 'batches' && formData.batch_ids.length === 0) {
      newErrors.visibility_scope = 'Please select at least one batch';
    }

    if (formData.visibility_scope === 'program' && !formData.program_id) {
      newErrors.visibility_scope = 'Please select a program';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
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
        copy_from_exam_id: formData.copy_from_exam_id,
        start_date: convertToISOStringWithTimezone(rest.start_date, rest.timezone),
        end_date: convertToISOStringWithTimezone(rest.end_date, rest.timezone),
        public_token_expires_at: publicExpiryISO,
        public_allowed_ip_ranges: allowedIpRanges,
        reschedule_deadline: rescheduleDeadlineISO,
        created_by: user?.id,
        institute: institute ?? user?.institute_id ?? user?.institute?.id ?? null,
        timezone: rest.timezone,
        status: saveAsDraft ? 'draft' : 'published',  // Set status based on button clicked
        is_published: !saveAsDraft,  // Set is_published based on status
        // Visibility scope data
        visibility_scope: formData.visibility_scope,
        center_ids: formData.visibility_scope === 'centers' ? formData.center_ids : [],
        batch_ids: formData.visibility_scope === 'batches' ? formData.batch_ids : [],
        program_id: formData.visibility_scope === 'program' ? formData.program_id : null,
      };


      if (isEditMode && examId) {
        await api.put(`/exams/exams/${examId}/`, examData);
        setToastMessage('Exam Updated Successfully!');
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          navigate(`${basePath}/exams`);
        }, 1500);
      } else {
        // Create new exam
        const response = await api.post('/exams/exams/', examData);
        const newExam = response.data;

        if (newExam?.id) {
          setToastMessage(saveAsDraft ? 'Exam Saved as Draft!' : 'Exam Published Successfully!');
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            navigate(`${basePath}/exams`);
          }, 1500);
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-28">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`${basePath}/exams`)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isEditMode ? 'Edit Exam' : 'Create New Exam'}</h1>
            <p className="text-sm text-slate-600">Set up a new exam with pattern and settings</p>
          </div>
        </div>

        {/* Removed creationSuccess block as requested to show toast instead */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
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
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.title ? 'border-red-300' : 'border-slate-300'
                      }`}
                    placeholder="Enter exam title"
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
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${errors.description ? 'border-red-300' : 'border-slate-300'
                      }`}
                    placeholder="Describe the exam"
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
                    placeholder="Enter exam instructions for students"
                  />
                </div>

                {/* Exam Mode Selection - Removed as per user request, now auto-selected from Pattern */}
                {/* 
                <div className="col-span-2 mt-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Exam Mode</h2>
                      <p className="text-xs text-slate-600">Choose how students will take this exam</p>
                    </div>
                  </div>

                 <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Current Mode:</strong> {formData.exam_mode === 'online' ? 'Online' : (formData.exam_mode === 'offline_omr' ? 'Offline OMR' : 'Offline Subjective')}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      (Determined by the selected pattern)
                    </p>
                 </div>
                </div>
                */}

                {/* Exam Pattern & Content - Moved Up & Redesigned */}
                <div className="col-span-2 mt-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Exam Pattern & Content</h2>
                      <p className="text-xs text-slate-600">Select how to populate questions for this exam</p>
                    </div>
                  </div>

                  {!isEditMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <button
                        type="button"
                        onClick={() => handleInputChange('copy_from_exam_id', null)}
                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${!formData.copy_from_exam_id
                          ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!formData.copy_from_exam_id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200 group-hover:bg-slate-50'}`}>
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${!formData.copy_from_exam_id ? 'text-blue-900' : 'text-slate-900'}`}>Use Pattern Template</p>
                          <p className="text-xs text-slate-500">Pick a structure and add questions manually</p>
                        </div>
                        {!formData.copy_from_exam_id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 absolute top-4 right-4" />
                        )}
                      </button>

                      {/* Copy from Existing - Commented out */}
                      {/* 
                      <button
                        type="button"
                        onClick={() => {
                          if (existingExams.length > 0 && !formData.copy_from_exam_id) {
                            const sourceExam = existingExams[0];
                            handleInputChange('copy_from_exam_id', sourceExam.id);
                            if (!formData.title.trim()) {
                              handleInputChange('title', `${sourceExam.title} (Copy)`);
                            }
                            if (sourceExam.pattern) {
                              handlePatternSelect(sourceExam.pattern.id);
                            }
                          }
                        }}
                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${formData.copy_from_exam_id
                          ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.copy_from_exam_id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200 group-hover:bg-slate-50'}`}>
                          <Copy className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${formData.copy_from_exam_id ? 'text-blue-900' : 'text-slate-900'}`}>Copy from Existing</p>
                          <p className="text-xs text-slate-500">Duplicate questions from a past exam</p>
                        </div>
                        {formData.copy_from_exam_id && (
                          <CheckCircle className="w-5 h-5 text-blue-600 absolute top-4 right-4" />
                        )}
                      </button>
                      */}
                    </div>
                  )}

                  {formData.copy_from_exam_id && !isEditMode && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Select Source Exam</label>
                      <select
                        value={formData.copy_from_exam_id || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          handleInputChange('copy_from_exam_id', val);
                          const sourceExam = existingExams.find(ex => ex.id === val);
                          if (sourceExam) {
                            if (!formData.title.trim() || formData.title.includes('(Copy)')) {
                              handleInputChange('title', `${sourceExam.title} (Copy)`);
                            }
                            if (sourceExam.pattern) {
                              handlePatternSelect(sourceExam.pattern.id);
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 text-sm border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm transition-all"
                      >
                        <option value="">Select an exam...</option>
                        {existingExams.map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.title} ({ex.pattern?.name || 'No Pattern'})</option>
                        ))}
                      </select>

                      <div className="mt-4 flex flex-wrap gap-4">
                        {formData.copy_from_exam_id && (() => {
                          const ex = existingExams.find(e => e.id === formData.copy_from_exam_id);
                          if (!ex) return null;
                          return (
                            <>
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[11px] font-medium text-slate-600">Q: <span className="font-bold text-slate-900">{ex.questions_added || 0}</span></span>
                              </div>
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-[11px] font-medium text-slate-600">Marks: <span className="font-bold text-slate-900">{ex.total_marks || 0}</span></span>
                              </div>
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-[11px] font-medium text-slate-600 font-bold text-slate-900">{ex.duration_minutes || 0}m</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 mb-2">Available Patterns *</label>
                    <div className="relative">
                      <select
                        value={formData.pattern || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handlePatternSelect(value ? parseInt(value) : 0);
                        }}
                        disabled={!!formData.copy_from_exam_id}
                        className={`w-full px-4 py-2.5 text-sm border-2 rounded-xl appearance-none bg-white focus:ring-4 transition-all ${errors.pattern ? 'border-red-300 focus:ring-red-50' : 'border-slate-200 focus:ring-blue-50 focus:border-blue-500'}`}
                      >
                        <option value="">Select a pattern structure</option>
                        {patterns.map((pattern) => (
                          <option key={pattern.id} value={pattern.id}>
                            {pattern.name} ({pattern.total_questions} Q, {pattern.total_duration}m)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    {errors.pattern && (
                      <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.pattern}
                      </p>
                    )}

                    {selectedPattern && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200/60">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{selectedPattern.name}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">{selectedPattern.description}</p>
                          </div>
                          <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-blue-600 shadow-sm">Pattern Loaded</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Questions</span>
                            <span className="text-sm font-bold text-slate-900">{selectedPattern.total_questions}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Duration</span>
                            <span className="text-sm font-bold text-slate-900">{selectedPattern.total_duration}m</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Marks</span>
                            <span className="text-sm font-bold text-slate-900">{selectedPattern.total_marks}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setFormData(prev => {
                        const newData = { ...prev, start_date: newStartDate };
                        if (!prev.is_flexible && newStartDate && prev.duration_minutes) {
                          const startDate = new Date(newStartDate);
                          const endDate = new Date(startDate.getTime() + prev.duration_minutes * 60000);
                          newData.end_date = formatDateTimeLocal(endDate.toISOString(), prev.timezone);
                        }
                        return newData;
                      });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.start_date ? 'border-red-300' : 'border-slate-300'
                      }`}
                  />
                  {errors.start_date && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.start_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => {
                      const newDuration = parseInt(e.target.value) || 0;
                      setFormData(prev => {
                        const newData = { ...prev, duration_minutes: newDuration };
                        if (!prev.is_flexible && prev.start_date && newDuration) {
                          const startDate = new Date(prev.start_date);
                          const endDate = new Date(startDate.getTime() + newDuration * 60000);
                          newData.end_date = formatDateTimeLocal(endDate.toISOString(), prev.timezone);
                        }
                        return newData;
                      });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.duration_minutes ? 'border-red-300' : 'border-slate-300'
                      }`}
                    min="1"
                  />
                  {errors.duration_minutes && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.duration_minutes}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_flexible}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          handleInputChange('is_flexible', checked);
                          if (!checked && formData.start_date && formData.duration_minutes) {
                            const startDate = new Date(formData.start_date);
                            const endDate = new Date(startDate.getTime() + formData.duration_minutes * 60000);
                            handleInputChange('end_date', formatDateTimeLocal(endDate.toISOString(), formData.timezone));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Flexible Exam Window</span>
                    </label>
                    <p className="text-xs text-slate-500">
                      {formData.is_flexible
                        ? "Set a custom end date for a wider availability window."
                        : "Exam ends automatically after the duration."}
                    </p>
                  </div>

                  {formData.is_flexible ? (
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
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.end_date ? 'border-red-300' : 'border-slate-300'
                          }`}
                      />
                      {errors.end_date && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.end_date}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-1">Calculated End Date</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formData.start_date && formData.duration_minutes
                            ? new Date(new Date(formData.start_date).getTime() + formData.duration_minutes * 60000).toLocaleString('en-US', {
                              timeZone: formData.timezone,
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            }) + ` (${formData.timezone})`
                            : "Select start date and duration"}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Visibility Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Exam Visibility</h2>
                    <p className="text-xs text-slate-600">Control which students can see and take this exam</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Visibility Scope Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${formData.visibility_scope === 'institute' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900">Institute-Wide</span>
                        <input
                          type="radio"
                          name="visibility_scope"
                          checked={formData.visibility_scope === 'institute'}
                          onChange={() => handleInputChange('visibility_scope', 'institute')}
                          className="w-4 h-4 text-indigo-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">All students in your institute can take this exam.</p>
                    </label>

                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${formData.visibility_scope === 'centers' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900">Specific Centers</span>
                        <input
                          type="radio"
                          name="visibility_scope"
                          checked={formData.visibility_scope === 'centers'}
                          onChange={() => handleInputChange('visibility_scope', 'centers')}
                          className="w-4 h-4 text-indigo-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">Only students in selected centers can take this exam.</p>
                    </label>

                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${formData.visibility_scope === 'batches' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900">Specific Batches</span>
                        <input
                          type="radio"
                          name="visibility_scope"
                          checked={formData.visibility_scope === 'batches'}
                          onChange={() => handleInputChange('visibility_scope', 'batches')}
                          className="w-4 h-4 text-indigo-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">Only students in selected batches can take this exam.</p>
                    </label>

                    <label className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${formData.visibility_scope === 'program' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900">Specific Program</span>
                        <input
                          type="radio"
                          name="visibility_scope"
                          checked={formData.visibility_scope === 'program'}
                          onChange={() => handleInputChange('visibility_scope', 'program')}
                          className="w-4 h-4 text-indigo-600"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">Only students in the selected program can take this exam.</p>
                    </label>
                  </div>

                  {/* Center Selection (shown when centers scope is selected) */}
                  {formData.visibility_scope === 'centers' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">Select Centers:</p>
                      {centers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No centers available</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {centers.map((center) => (
                            <label key={center.id} className="flex items-center gap-2 p-2 rounded border border-slate-100 bg-white hover:bg-indigo-50 cursor-pointer transition-colors">
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
                                className="rounded text-indigo-600"
                              />
                              <span className="text-xs font-medium text-slate-700">{center.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.visibility_scope && formData.visibility_scope === 'centers' && (
                        <p className="text-red-600 text-[10px] mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.visibility_scope}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Batch Selection (shown when batches scope is selected) */}
                  {formData.visibility_scope === 'batches' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">Select Batches:</p>
                      {batches.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No batches available</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {batches.map((batch) => (
                            <label key={batch.id} className="flex items-center gap-2 p-2 rounded border border-slate-100 bg-white hover:bg-indigo-50 cursor-pointer transition-colors">
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
                                className="rounded text-indigo-600"
                              />
                              <div>
                                <span className="text-xs font-medium text-slate-700">{batch.name}</span>
                                <span className="text-[10px] text-slate-400 ml-1">({batch.code})</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.visibility_scope && formData.visibility_scope === 'batches' && (
                        <p className="text-red-600 text-[10px] mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.visibility_scope}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Program Selection (shown when program scope is selected) */}
                  {formData.visibility_scope === 'program' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">Select Program:</p>
                      {programs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No programs available</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {programs.map((program) => (
                            <label key={program.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${String(formData.program_id) === String(program.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                              <input
                                type="radio"
                                name="program_selection"
                                checked={String(formData.program_id) === String(program.id)}
                                onChange={() => handleInputChange('program_id', program.id)}
                                className="w-3 h-3 text-indigo-600"
                              />
                              <div>
                                <span className="text-xs font-medium text-slate-700">{program.name}</span>
                                {program.category && (
                                  <span className="text-[10px] text-slate-400 ml-1">({program.category})</span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.visibility_scope && formData.visibility_scope === 'program' && (
                        <p className="text-red-600 text-[10px] mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.visibility_scope}
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">Passing Marks (%) *</label>
                    <input
                      type="number"
                      value={formData.passing_marks}
                      onChange={(e) => handleInputChange('passing_marks', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.passing_marks ? 'border-red-300' : 'border-slate-300'
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
                    className={`w-5 h-5 text-slate-500 transition-transform ${advancedExpanded ? 'rotate-180' : ''
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
                          <label className="text-xs font-medium text-slate-700">Delay Results Display</label>
                          <p className="text-xs text-slate-500">Only show scores after the exam ends</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.show_result_after_exam_end}
                            onChange={(e) => handleInputChange('show_result_after_exam_end', e.target.checked)}
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
                  {isEditMode && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600">Status</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${formData.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                        }`}>
                        {formData.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  )}
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

          {/* Sticky Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50 transition-all">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <div className="hidden lg:flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1.5">Exam Setting</span>
                  <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{formData.title || 'Untitled Exam'}</span>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1.5">Pattern Selection</span>
                  <div className="flex items-center gap-2">
                    <Zap className={`w-3 h-3 ${selectedPattern ? 'text-purple-500' : 'text-slate-300'}`} />
                    <span className="text-sm font-bold text-slate-800">{selectedPattern?.name || 'Incomplete'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => navigate(`${basePath}/exams`)}
                  className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>

                <div className="flex-grow md:flex-grow-0 flex items-center gap-3">
                  {!isEditMode ? (
                    <>
                      <button
                        onClick={() => handleSubmit(true)}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-all border border-slate-200"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Draft'}
                      </button>
                      <button
                        onClick={() => handleSubmit(false)}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-100 transition-all active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {saving ? 'Publishing...' : 'Publish Exam'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSubmit(formData.status === 'draft')}
                      disabled={saving}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Updating...' : 'Update Exam'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20, x: 20 }}
              className="fixed top-6 right-6 z-[100] bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-500/50 backdrop-blur-sm"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
