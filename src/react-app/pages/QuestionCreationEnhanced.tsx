import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle,
  Target,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Zap,
  BookOpen,
  RefreshCw,
  Loader2,
  MessageSquare,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useApi, api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import AIImageToText from '../components/AIImageToText';

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  question_type: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
  negative_marking: number;
  min_questions_to_attempt: number;
  question_configurations?: Record<number, {
    is_nested: boolean;
    nested_type?: 'internal_choice' | 'multipart' | 'mixed';
    description?: string;
    options?: Array<{
      type?: 'compulsory' | 'choice_group';
      label: string;
      description?: string;
      marks?: number;
      options?: Array<{
        label: string;
        marks: number;
        description?: string;
        sub_parts?: Array<{ label: string; marks: number; description?: string }>;
      }>;
      parts?: Array<{ label: string; marks: number; description?: string }>; // legacy/alternate
      sub_parts?: Array<{ label: string; marks: number; description?: string }>;
    }>;
    sub_questions?: Array<{
      label: string;
      marks: number;
      description?: string;
    }>;
  }>;
}

interface Pattern {
  id: number;
  name: string;
  description: string;
  total_questions: number;
  sections: PatternSection[];
}

interface QuestionFormData {
  question_text: string;
  question_type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correct_answer: string;
  solution: string;
  explanation: string;
  marks: number;
  negative_marks: number;
  subject: string;
  topic: string;
  pattern_section: number | null;
  structure?: any;
}

interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  options: string[];
  correct_answer: string;
  solution: string;
  explanation: string;
  marks: number;
  negative_marks: number;
  subject: string;
  topic: string;
  pattern_section: number;
  pattern_section_id?: number | null;
  question_number?: number | null;
  question_number_in_pattern?: number | null;
  structure?: any;
}

interface SectionStats {
  section_id: number;
  section_name: string;
  subject: string;
  question_type: string;
  total_needed: number;
  total_added: number;
  remaining: number;
  progress_percentage: number;
}

interface SubjectSection extends PatternSection {
  subject_start: number;
  subject_end: number;
  subject_section_index: number;
}

interface SubjectGroup {
  subject: string;
  slug: string;
  sections: SubjectSection[];
  total_questions: number;
}

interface AIQuestionPayload {
  question_text?: string;
  options?: unknown[];
  correct_answer?: unknown;
  solution?: string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  // For nested questions
  structure?: {
    nested_parts?: Array<{
      label?: string;
      text?: string;
      sub_parts?: Array<{
        label?: string;
        text?: string;
      }>;
      options?: Array<{
        label?: string;
        text?: string;
        sub_parts?: Array<{
          label?: string;
          text?: string;
        }>;
      }>;
    }>;
  };
}

const stripOptionContent = (value?: string | null) =>
  value
    ? value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    : '';

const normalizeOptionValue = (value?: string | null) =>
  stripOptionContent(value).toLowerCase();

const normalizeLatexText = (value?: string | null) =>
  (value || '')
    .replace(/```json|```/gi, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/^\s*["'`]+|["'`]+\s*$/g, '')
    .replace(/^\$+|\$+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const extractAnswerText = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';

  // If AI returns a JSON string instead of just the answer, extract "correct_answer".
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.correct_answer !== 'undefined') {
        return String(parsed.correct_answer).trim();
      }
    } catch {
      // ignore parse errors; continue with raw text
    }
  }
  return text;
};

const sanitizeHumanReadableText = (raw: unknown): string => {
  if (raw === null || raw === undefined) return '';
  let text = String(raw);

  text = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();

  return text;
};

const extractJsonObjectFromText = (raw: unknown): Record<string, unknown> | null => {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    // continue
  }

  // Fallback: parse first object-looking block
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const resolveOptionIndexFromAnswer = (answer: unknown, options: string[]): number => {
  const raw = extractAnswerText(answer);
  if (!raw) return -1;

  // A / B / C / D style
  const letterMatch = raw.match(/(?:^|\b)([A-Z])(?:\)|:|\.|\b)/i);
  if (letterMatch) {
    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length && safeOptionString(options[idx]).trim()) return idx;
  }

  // 1 / 2 / 3 / 4 style
  const numberMatch = raw.match(/^\s*\(?(\d+)\)?\s*$/);
  if (numberMatch) {
    const idx = Number(numberMatch[1]) - 1;
    if (idx >= 0 && idx < options.length && safeOptionString(options[idx]).trim()) return idx;
  }

  const normalizedAnswer = normalizeLatexText(raw);
  if (!normalizedAnswer) return -1;

  for (let i = 0; i < options.length; i += 1) {
    const normalizedOption = normalizeLatexText(safeOptionString(options[i]));
    if (!normalizedOption) continue;

    if (
      normalizedAnswer === normalizedOption ||
      normalizedAnswer.includes(normalizedOption) ||
      normalizedOption.includes(normalizedAnswer)
    ) {
      return i;
    }
  }

  return -1;
};

/**
 * Normalize options array to ensure all items are strings.
 * Handles both string arrays and object arrays (e.g., {text: 'option'} or {value: 'option'}).
 * Falls back to default empty options if input is invalid.
 */
const normalizeOptionsToStrings = (options: unknown): string[] => {
  if (!options || !Array.isArray(options)) {
    return ['', '', '', ''];
  }

  return options.map((opt: unknown) => {
    if (typeof opt === 'string') {
      return opt;
    }
    if (opt && typeof opt === 'object') {
      // Handle common object formats for options
      const objOpt = opt as Record<string, unknown>;
      if (typeof objOpt.text === 'string') return objOpt.text;
      if (typeof objOpt.value === 'string') return objOpt.value;
      if (typeof objOpt.content === 'string') return objOpt.content;
      if (typeof objOpt.option === 'string') return objOpt.option;
      if (typeof objOpt.label === 'string') return objOpt.label;
      // Try to stringify if nothing else works
      try {
        return JSON.stringify(opt);
      } catch {
        return '';
      }
    }
    // Fallback: convert to string
    return String(opt ?? '');
  });
};

/**
 * Safely convert an option to string for comparison/display.
 * Handles both string options and object options.
 */
const safeOptionString = (opt: unknown): string => {
  if (typeof opt === 'string') return opt;
  if (opt && typeof opt === 'object') {
    const objOpt = opt as Record<string, unknown>;
    if (typeof objOpt.text === 'string') return objOpt.text;
    if (typeof objOpt.value === 'string') return objOpt.value;
    if (typeof objOpt.content === 'string') return objOpt.content;
    if (typeof objOpt.option === 'string') return objOpt.option;
    if (typeof objOpt.label === 'string') return objOpt.label;
  }
  return String(opt ?? '');
};

/**
 * Convert a letter answer (A, B, C, D) to the actual option text
 * If the answer is already the option text or not a letter, return as-is
 */
const convertLetterAnswerToOptionText = (answer: string, options: string[]): string => {
  if (!answer || !options || options.length === 0) return answer;

  const trimmedAnswer = answer.trim().toUpperCase();

  // Check if it's a single letter A-Z
  if (trimmedAnswer.length === 1 && /^[A-Z]$/.test(trimmedAnswer)) {
    const index = trimmedAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    if (index >= 0 && index < options.length && options[index]) {
      return options[index];
    }
  }

  // For multiple choice answers like "A, B, C" or "A|B|C"
  if (/^[A-Z]([,|]\s*[A-Z])*$/i.test(trimmedAnswer.replace(/\s/g, ''))) {
    const letters = trimmedAnswer.split(/[,|]/).map(l => l.trim().toUpperCase());
    const convertedOptions = letters
      .map(letter => {
        const index = letter.charCodeAt(0) - 65;
        return (index >= 0 && index < options.length) ? options[index] : letter;
      })
      .filter(Boolean);
    return convertedOptions.join('|');
  }

  // Return as-is if not a letter format
  return answer;
};

export default function EnhancedQuestionEditor() {
  const { patternId, subjectSlug: subjectSlugParam, questionNumber: questionParam } = useParams<{ patternId: string; subjectSlug?: string; questionNumber?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const examIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const examIdRaw = params.get('examId');
    if (!examIdRaw) return null;
    const parsed = Number(examIdRaw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [location.search]);
  const { user } = useAuthContext();
  const [currentSubjectSlug, setCurrentSubjectSlug] = useState<string | null>(subjectSlugParam ?? null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(() => {
    const parsed = Number(questionParam);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [currentSection, setCurrentSection] = useState<SubjectSection | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSolving, setAiSolving] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'mcq',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correct_answer: '',
    solution: '',
    explanation: '',
    marks: 1,
    negative_marks: 1,
    subject: '',
    topic: '',
    pattern_section: null,
    structure: {},
  });
  const [fixingNumbers, setFixingNumbers] = useState(false);
  // Track which question numbers already exist in current section
  const [existingNumbers, setExistingNumbers] = useState<Set<number>>(new Set());
  const [existingNumbersBySection, setExistingNumbersBySection] = useState<Record<number, Set<number>>>({});
  const [existingQuestionsBySection, setExistingQuestionsBySection] = useState<Record<number, Map<number, QuestionData>>>({});
  const [sectionAbsoluteRanges, setSectionAbsoluteRanges] = useState<Record<number, { start: number; end: number; length: number }>>({});
  const [bulkDataLoaded, setBulkDataLoaded] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Default to true as per user request

  const computeAbsoluteQuestionNumber = useCallback(
    (section: SubjectSection | null, subjectQuestionNumber: number) => {
      if (!section) {
        return subjectQuestionNumber;
      }

      // First check if we have a cached question with this subject-local number
      const sectionMap = existingQuestionsBySection[section.id];
      const existingQuestion = sectionMap?.get(subjectQuestionNumber);
      const existingAbsolute = existingQuestion?.question_number;
      if (existingAbsolute !== undefined && existingAbsolute !== null && Number.isFinite(Number(existingAbsolute))) {
        return Number(existingAbsolute);
      }

      // Use the section's actual start_question to compute the database question_number
      // The database stores questions with question_number = section.start_question + offset
      // where offset is the position within the subject (0-indexed)
      const relativeOffset = subjectQuestionNumber - section.subject_start;
      const clampedOffset = Math.max(0, Math.min(section.end_question - section.start_question, relativeOffset));
      return section.start_question + clampedOffset;
    },
    [existingQuestionsBySection]
  );

  const buildNumbersSetForSection = useCallback((section: SubjectSection, results: QuestionData[]) => {
    const nums = new Set<number>();
    const questionMap = new Map<number, QuestionData>();

    // Sort results by question_number or id to ensure consistent ordering
    const sortedResults = [...results].sort((a, b) => {
      const aNum = a.question_number ?? a.id ?? 0;
      const bNum = b.question_number ?? b.id ?? 0;
      return aNum - bNum;
    });

    sortedResults.forEach((q, index) => {
      let subjectLocal: number | null = null;

      // First try question_number_in_pattern (subject-local number)
      const subjectLocalRaw =
        q.question_number_in_pattern !== undefined && q.question_number_in_pattern !== null
          ? Number(q.question_number_in_pattern)
          : null;

      if (subjectLocalRaw !== null && Number.isFinite(subjectLocalRaw) && subjectLocalRaw > 0) {
        subjectLocal = subjectLocalRaw;
      } else {
        // Fall back to question_number (database question number within section range)
        const dbQuestionNumber =
          q.question_number !== undefined && q.question_number !== null
            ? Number(q.question_number)
            : null;

        if (
          dbQuestionNumber !== null &&
          Number.isFinite(dbQuestionNumber) &&
          dbQuestionNumber >= section.start_question &&
          dbQuestionNumber <= section.end_question
        ) {
          // Convert database question_number to subject-local number
          const offset = dbQuestionNumber - section.start_question;
          subjectLocal = section.subject_start + offset;
        } else {
          // Last resort: use index-based numbering
          subjectLocal = section.subject_start + index;
        }
      }

      if (subjectLocal !== null && subjectLocal >= section.subject_start && subjectLocal <= section.subject_end) {
        if (!nums.has(subjectLocal)) {
          nums.add(subjectLocal);
          questionMap.set(subjectLocal, q);
        }
      }
    });

    return { numbers: nums, map: questionMap };
  }, []);

  // Optimized bulk loading of all questions for the pattern
  const loadAllPatternQuestions = useCallback(
    async (patternIdToLoad: string, sections: SubjectSection[]) => {
      try {
        const res = await api.get(
          `/questions/pattern-questions/?pattern_id=${patternIdToLoad}${examIdFromQuery ? `&exam_id=${examIdFromQuery}` : ''
          }`,
        );

        const data = res.data as {
          questions_by_section: Record<string | number, QuestionData[]>;
          existing_numbers_by_section: Record<string | number, number[]>;
          sections: Array<{
            section_id: number;
            total_added: number;
            total_needed: number;
            progress_percentage: number;
          }>;
        };

        // Process all sections at once
        const newExistingNumbersBySection: Record<number, Set<number>> = {};
        const newExistingQuestionsBySection: Record<number, Map<number, QuestionData>> = {};

        sections.forEach((section) => {
          // JSON serializes object keys as strings, so we need to handle both
          const sectionQuestions = data.questions_by_section[section.id] ||
            data.questions_by_section[String(section.id)] ||
            [];
          const { numbers: nums, map } = buildNumbersSetForSection(section, sectionQuestions);
          newExistingNumbersBySection[section.id] = nums;
          newExistingQuestionsBySection[section.id] = map;
        });

        setExistingNumbersBySection(newExistingNumbersBySection);
        setExistingQuestionsBySection(newExistingQuestionsBySection);
        setBulkDataLoaded(true);

        // Update section stats from bulk response - merge with section data
        if (data.sections) {
          setSectionStats(data.sections.map(s => {
            const section = sections.find(sec => sec.id === s.section_id);
            return {
              section_id: s.section_id,
              section_name: section?.name || '',
              subject: section?.subject || '',
              question_type: section?.question_type || '',
              total_needed: s.total_needed,
              total_added: s.total_added,
              remaining: s.total_needed - s.total_added,
              progress_percentage: s.progress_percentage,
            };
          }));
        }

        return true;
      } catch (err) {
        console.error('Failed to load bulk pattern questions, falling back to individual loads', err);
        return false;
      }
    },
    [examIdFromQuery, buildNumbersSetForSection],
  );

  const loadSectionNumbers = useCallback(
    async (section: SubjectSection, updateCurrent = false) => {
      // Skip if bulk data is already loaded
      if (bulkDataLoaded && existingNumbersBySection[section.id]) {
        if (updateCurrent) {
          setExistingNumbers(existingNumbersBySection[section.id]);
        }
        return;
      }

      try {
        // Fetch ALL questions for this section using optimized endpoint
        const res = await api.get(
          `/questions/section-questions/${section.id}/${examIdFromQuery ? `?exam_id=${examIdFromQuery}` : ''
          }`,
        );

        const data = res.data as {
          questions: QuestionData[];
          existing_numbers: number[];
          questions_map: Record<number, QuestionData>;
        };

        const resultsArray = data.questions || [];
        const { numbers: nums, map } = buildNumbersSetForSection(section, resultsArray);

        setExistingNumbersBySection((prev) => ({
          ...prev,
          [section.id]: nums,
        }));

        setExistingQuestionsBySection((prev) => ({
          ...prev,
          [section.id]: map,
        }));

        if (updateCurrent) {
          setExistingNumbers(nums);
        }
      } catch (err) {
        console.error('Failed to load existing numbers', err);
        if (updateCurrent) {
          setExistingNumbers(new Set());
        }
      }
    },
    [examIdFromQuery, buildNumbersSetForSection, bulkDataLoaded, existingNumbersBySection],
  );

  const fetchSectionStats = useCallback(async (patternData: Pattern) => {
    try {
      const stats: SectionStats[] = [];

      const queryExam = examIdFromQuery ? `&exam=${examIdFromQuery}` : '';

      for (const section of patternData.sections) {
        const totalNeeded = section.end_question - section.start_question + 1;

        // Fetch questions for this section - use count from paginated response
        const response = await api.get(`/questions/questions/?pattern_section=${section.id}${queryExam}`);
        // Use 'count' from paginated response for total, not results.length which is just the first page
        const totalAdded = response.data?.count ?? response.data?.results?.length ?? response.data?.length ?? 0;

        // Map question type to display name
        const questionTypeDisplay = getQuestionTypeDisplayName(section.question_type);

        stats.push({
          section_id: section.id,
          section_name: section.name,
          subject: section.subject,
          question_type: questionTypeDisplay,
          total_needed: totalNeeded,
          total_added: totalAdded,
          remaining: totalNeeded - totalAdded,
          progress_percentage: totalNeeded > 0 ? (totalAdded / totalNeeded) * 100 : 0,
        });
      }

      setSectionStats(stats);
    } catch (err) {
      console.error('Failed to fetch section stats:', err);
    }
  }, [examIdFromQuery]);

  const computeSectionAbsoluteRanges = useCallback((patternData: Pattern) => {
    const ranges: Record<number, { start: number; end: number; length: number }> = {};
    let cursor = 1;
    patternData.sections.forEach(section => {
      const length = Math.max(1, section.end_question - section.start_question + 1);
      ranges[section.id] = {
        start: cursor,
        end: cursor + length - 1,
        length,
      };
      cursor += length;
    });

    return ranges;
  }, []);

  const buildSubjectGroups = useCallback((patternData: Pattern): SubjectGroup[] => {
    const subjectTotals = new Map<string, number>();
    const subjectGroupsMap = new Map<string, SubjectGroup>();
    const orderedGroups: SubjectGroup[] = [];

    // Ensure sections are processed in ascending order so numbering is deterministic
    const sortedSections = [...patternData.sections].sort((a, b) => {
      if (a.subject === b.subject) {
        return a.start_question - b.start_question;
      }
      return a.start_question - b.start_question;
    });

    sortedSections.forEach((section) => {
      const subjectName = section.subject || 'General';
      const currentTotal = subjectTotals.get(subjectName) || 0;
      const sectionLength = section.end_question - section.start_question + 1;
      const subjectStart = currentTotal + 1;
      const subjectEnd = subjectStart + sectionLength - 1;

      const extendedSection: SubjectSection = {
        ...section,
        subject_start: subjectStart,
        subject_end: subjectEnd,
        subject_section_index: (subjectGroupsMap.get(subjectName)?.sections.length || 0) + 1,
      };

      if (!subjectGroupsMap.has(subjectName)) {
        const group: SubjectGroup = {
          subject: subjectName,
          slug: slugifySubject(subjectName),
          sections: [extendedSection],
          total_questions: subjectEnd,
        };
        subjectGroupsMap.set(subjectName, group);
        orderedGroups.push(group);
      } else {
        const group = subjectGroupsMap.get(subjectName)!;
        group.sections = [...group.sections, extendedSection];
        group.total_questions = subjectEnd;
        subjectGroupsMap.set(subjectName, group);
      }

      subjectTotals.set(subjectName, subjectEnd);
    });

    return orderedGroups.map(group => ({
      ...group,
      sections: group.sections.sort((a, b) => a.subject_start - b.subject_start),
    }));
  }, []);

  const fetchPattern = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setBulkDataLoaded(false);
      const response = await api.get(`/patterns/patterns/${id}/`);
      const patternData = response.data;
      setExistingNumbers(new Set());
      setExistingNumbersBySection({});
      setExistingQuestionsBySection({});
      setPattern(patternData);
      const groups = buildSubjectGroups(patternData);
      setSubjectGroups(groups);
      const ranges = computeSectionAbsoluteRanges(patternData);
      setSectionAbsoluteRanges(ranges);

      // Flatten all sections from groups for bulk loading
      const allSections = groups.flatMap(g => g.sections);

      // Try bulk loading first (much faster)
      const bulkSuccess = await loadAllPatternQuestions(id, allSections);

      // Fall back to individual section stats if bulk fails
      if (!bulkSuccess) {
        await fetchSectionStats(patternData);
      }
    } catch (err) {
      console.error('Failed to fetch pattern:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchSectionStats, buildSubjectGroups, computeSectionAbsoluteRanges, loadAllPatternQuestions]);

  const absoluteQuestionNumber = useMemo(
    () => computeAbsoluteQuestionNumber(currentSection, currentQuestionNumber),
    [computeAbsoluteQuestionNumber, currentSection, currentQuestionNumber]
  );

  const { data: existingQuestion, refetch: refetchQuestion, loading: questionLoading } = useApi<{
    results?: QuestionData[];
  } | QuestionData[]>(
    patternId && currentSection
      ? `/questions/questions/?pattern_section=${currentSection.id}&question_number=${absoluteQuestionNumber}${examIdFromQuery ? `&exam=${examIdFromQuery}` : ''
      }`
      : ''
  );

  useEffect(() => {
    if (patternId) {
      fetchPattern(patternId);
    }
  }, [patternId, fetchPattern]);

  const currentSubjectGroup = useMemo(() => {
    if (subjectGroups.length === 0) {
      return null;
    }
    return subjectGroups.find(group => group.slug === currentSubjectSlug) ?? subjectGroups[0];
  }, [subjectGroups, currentSubjectSlug]);

  const groupedSectionStats = useMemo(() => {
    if (subjectGroups.length === 0) {
      return [] as Array<{ subject: string; slug: string; sections: Array<{ section: SubjectSection; stats?: SectionStats }> }>;
    }

    return subjectGroups.map(group => ({
      subject: group.subject,
      slug: group.slug,
      sections: group.sections.map(section => ({
        section,
        stats: sectionStats.find(stat => stat.section_id === section.id),
      })),
    }));
  }, [subjectGroups, sectionStats]);

  useEffect(() => {
    if (!pattern || !currentSubjectGroup || !currentQuestionNumber) {
      return;
    }

    const section =
      currentSubjectGroup.sections.find(
        (s) => currentQuestionNumber >= s.subject_start && currentQuestionNumber <= s.subject_end,
      ) ?? currentSubjectGroup.sections[0];

    if (section) {
      setCurrentSection(section);
      setFormData((prev) => ({
        ...prev,
        question_type: section.question_type,
        marks: section.marks_per_question,
        negative_marks: section.negative_marking,
        subject: section.subject,
        pattern_section: section.id,
      }));

      loadSectionNumbers(section, true);
    }
  }, [pattern, currentSubjectGroup, currentQuestionNumber, loadSectionNumbers]);

  useEffect(() => {
    // Skip if bulk data is already loaded
    if (bulkDataLoaded || !currentSubjectGroup) return;

    currentSubjectGroup.sections.forEach((section) => {
      if (!existingNumbersBySection[section.id]) {
        loadSectionNumbers(section, section.id === currentSection?.id);
      }
    });
  }, [currentSubjectGroup, existingNumbersBySection, loadSectionNumbers, currentSection?.id, bulkDataLoaded]);

  useEffect(() => {
    if (!patternId || subjectGroups.length === 0) {
      return;
    }

    const availableSlugs = subjectGroups.map(group => group.slug);
    const resolvedSlug = subjectSlugParam && availableSlugs.includes(subjectSlugParam)
      ? subjectSlugParam
      : currentSubjectSlug && availableSlugs.includes(currentSubjectSlug)
        ? currentSubjectSlug
        : subjectGroups[0].slug;

    const activeGroup = subjectGroups.find(group => group.slug === resolvedSlug) ?? subjectGroups[0];

    let resolvedQuestionNumber = Number(questionParam);
    if (!Number.isFinite(resolvedQuestionNumber) || resolvedQuestionNumber < 1) {
      resolvedQuestionNumber = currentQuestionNumber;
    }
    if (!Number.isFinite(resolvedQuestionNumber) || resolvedQuestionNumber < 1 || resolvedQuestionNumber > activeGroup.total_questions) {
      resolvedQuestionNumber = 1;
    }

    if (currentSubjectSlug !== resolvedSlug) {
      setCurrentSubjectSlug(resolvedSlug);
    }

    if (currentQuestionNumber !== resolvedQuestionNumber) {
      setCurrentQuestionNumber(resolvedQuestionNumber);
    }

    const currentPathSlug = subjectSlugParam ?? null;
    const currentPathNumber = Number(questionParam);
    if (currentPathSlug !== resolvedSlug || !Number.isFinite(currentPathNumber) || currentPathNumber !== resolvedQuestionNumber) {
      const querySuffix = examIdFromQuery ? `?examId=${examIdFromQuery}` : '';
      navigate(`/pattern/${patternId}/question/${resolvedSlug}/${resolvedQuestionNumber}${querySuffix}`, { replace: true });
    }
  }, [subjectGroups, patternId, subjectSlugParam, questionParam, currentSubjectSlug, currentQuestionNumber, navigate, examIdFromQuery]);

  // Load existing question data when found, or reset form for new questions
  useEffect(() => {
    const sectionMap = currentSection ? existingQuestionsBySection[currentSection.id] : undefined;
    const mappedExisting = sectionMap?.get(currentQuestionNumber);

    if (mappedExisting) {
      console.log('Loading existing question from cached map:', mappedExisting);
      const options = mappedExisting.options || ['', '', '', ''];
      const rawAnswer = mappedExisting.correct_answer || '';
      // Convert letter answers (A, B, C, D) to actual option text for MCQ questions
      const questionType = mappedExisting.question_type || 'mcq';
      const correctAnswer = (questionType === 'single_mcq' || questionType === 'mcq' || questionType === 'multiple_mcq')
        ? convertLetterAnswerToOptionText(rawAnswer, options)
        : rawAnswer;

      setFormData({
        question_text: mappedExisting.question_text || '',
        question_type: questionType,
        difficulty: (mappedExisting.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        options: options,
        correct_answer: correctAnswer,
        solution: mappedExisting.solution || '',
        explanation: mappedExisting.explanation || '',
        marks: mappedExisting.marks || 1,
        negative_marks: mappedExisting.negative_marks || 1,
        subject: mappedExisting.subject || '',
        topic: mappedExisting.topic || '',
        pattern_section: mappedExisting.pattern_section,
        structure: mappedExisting.structure || {},
      });
      return;
    }

    if (existingQuestion && 'results' in existingQuestion && existingQuestion.results && existingQuestion.results.length > 0) {
      const question = existingQuestion.results[0] as QuestionData;

      // SAFETY: Only load if it matches the current slot we're editing
      if (question.question_number !== absoluteQuestionNumber && absoluteQuestionNumber !== null) {
        return;
      }

      console.log('Loading existing question from results:', question);
      const options = normalizeOptionsToStrings(question.options);
      const rawAnswer = question.correct_answer || '';
      const questionType = question.question_type || 'mcq';
      const correctAnswer = (questionType === 'single_mcq' || questionType === 'mcq' || questionType === 'multiple_mcq')
        ? convertLetterAnswerToOptionText(String(rawAnswer), options)
        : String(rawAnswer);

      setFormData({
        question_text: question.question_text || '',
        question_type: questionType,
        difficulty: (question.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        options: options,
        correct_answer: correctAnswer,
        solution: question.solution || '',
        explanation: question.explanation || '',
        marks: question.marks || 1,
        negative_marks: question.negative_marks || 1,
        subject: question.subject || '',
        topic: question.topic || '',
        pattern_section: question.pattern_section,
        structure: question.structure || {},
      });
    } else if (existingQuestion && Array.isArray(existingQuestion) && existingQuestion.length > 0) {
      const question = existingQuestion[0] as QuestionData;

      // SAFETY: Only load if it matches the current slot we're editing
      if (question.question_number !== absoluteQuestionNumber && absoluteQuestionNumber !== null) {
        return;
      }

      console.log('Loading existing question from array:', question);
      const options = normalizeOptionsToStrings(question.options);
      const rawAnswer = question.correct_answer || '';
      const questionType = question.question_type || 'mcq';
      const correctAnswer = (questionType === 'single_mcq' || questionType === 'mcq' || questionType === 'multiple_mcq')
        ? convertLetterAnswerToOptionText(String(rawAnswer), options)
        : String(rawAnswer);

      setFormData({
        question_text: question.question_text || '',
        question_type: questionType,
        difficulty: (question.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        options: options,
        correct_answer: correctAnswer,
        solution: question.solution || '',
        explanation: question.explanation || '',
        marks: question.marks || 1,
        negative_marks: question.negative_marks || 1,
        subject: question.subject || '',
        topic: question.topic || '',
        pattern_section: question.pattern_section,
        structure: question.structure || {},
      });
    } else {
      // If we've reached here and questionLoading is false (API finished)
      // and we didn't find data in cache OR API results
      // Reset the form for a NEW question
      if (!questionLoading && !mappedExisting) {
        console.log('Resetting form for new question slot...');
        const config = currentSection?.question_configurations?.[currentQuestionNumber];
        const initialStructure = config?.is_nested ? {
          is_nested: true,
          nested_type: config.nested_type,
          parts: (config.nested_type === 'internal_choice' || config.nested_type === 'mixed')
            ? config.options?.map(opt => ({ ...opt, question_text: '' }))
            : config.sub_questions?.map(sub => ({ ...sub, question_text: '' }))
        } : {};

        setFormData({
          question_text: '',
          question_type: currentSection?.question_type || 'mcq',
          difficulty: 'medium',
          options: ['', '', '', ''],
          correct_answer: '',
          solution: '',
          explanation: '',
          marks: currentSection?.marks_per_question || 1,
          negative_marks: currentSection?.negative_marking || 1,
          subject: currentSection?.subject || '',
          topic: '',
          pattern_section: currentSection?.id ?? null,
          structure: initialStructure
        });
      }
    }
  }, [existingQuestion, currentSection, currentQuestionNumber, existingQuestionsBySection, absoluteQuestionNumber, questionLoading]);

  const getQuestionTypeDisplayName = (type: string): string => {
    const typeMapping: Record<string, string> = {
      'single_mcq': 'Single Correct MCQ',
      'multiple_mcq': 'Multiple Correct MCQ',
      'numerical': 'Numerical',
      'subjective': 'Subjective',
      'true_false': 'True/False',
      'fill_blank': 'Fill in the Blanks',
      'mcq': 'Single Correct MCQ', // Backward compatibility
      'Single Correct MCQ': 'Single Correct MCQ',
      'Multiple Correct MCQ': 'Multiple Correct MCQ',
      'Numerical': 'Numerical',
      'Subjective': 'Subjective',
      'True/False': 'True/False',
      'Fill in the Blanks': 'Fill in the Blanks'
    };
    return typeMapping[type] || type.toUpperCase();
  };

  const renderQuestionTypeSpecificUI = () => {
    const questionType = formData.question_type.toLowerCase();

    // PRIORITIZE STRUCTURED/NESTED UI:
    // If the question has a nested structure, show the structured editor regardless of its top-level type label.
    // This provides a safety net if AI or user incorrectly labels a passage as 'single_mcq'.
    const config = currentSection?.question_configurations?.[currentQuestionNumber];

    // Check if the question data specifically indicates a nested structure
    const hasStoredStructure = formData.structure?.is_nested &&
      ((formData.structure?.parts && formData.structure.parts.length > 0) ||
        (formData.structure?.nested_parts && formData.structure.nested_parts.length > 0));

    // Check if the question type is explicitly one that requires a nested structure
    const isExplicitlyNestedType = ['multipart', 'internal_choice', 'mixed'].includes(questionType);

    // Only show structured UI if it's an explicit nested type OR it already has stored nested data.
    // This prevents simple 'subjective' questions from being forced into a nested UI.
    const isNested = isExplicitlyNestedType || hasStoredStructure;

    const nestedType = formData.structure?.nested_type || config?.nested_type || (isExplicitlyNestedType ? questionType : 'multipart');

    if (isNested) {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 mb-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold mb-1">
              <FileText className="w-5 h-5" />
              Structured Question: {
                nestedType === 'internal_choice' ? 'Internal Choice (OR)' :
                  nestedType === 'mixed' ? 'Mixed Mode (Parts + OR)' :
                    'Multi-Part (a, b, c)'
              }
            </div>
            <p className="text-sm text-indigo-700">
              This question has been configured as a structured question. Please provide content for each part below.
            </p>
          </div>

          <div className="space-y-8">
            {(() => {
              // Determine the correct data source for parts
              let partsData = formData.structure?.parts || formData.structure?.nested_parts;
              if (!partsData || partsData.length === 0) {
                if (nestedType === 'internal_choice') {
                  partsData = config?.options || [];
                } else if (nestedType === 'mixed') {
                  partsData = config?.options || [];
                } else if (nestedType === 'multipart') {
                  // For multipart, prefer options over sub_questions if options has data
                  partsData = (config?.options && config.options.length > 0) ? config.options : (config?.sub_questions || []);
                } else {
                  partsData = config?.sub_questions || config?.options || [];
                }
              }
              return partsData;
            })().map((item: any, idx: number) => {
              const isChoiceGroup = item.type === 'choice_group' || nestedType === 'internal_choice';

              if (isChoiceGroup) {
                const choices = item.options || [item];
                return (
                  <div key={idx} className="space-y-4">
                    {item.type === 'choice_group' && (
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 mb-2">Internal Choice Group</div>
                    )}
                    <div className="space-y-4">
                      {choices.map((choice: any, cIdx: number) => (
                        <div key={cIdx}>
                          <div className="bg-white rounded-2xl border-2 border-indigo-50 shadow-sm overflow-hidden">
                            <div className="bg-indigo-50/30 px-6 py-3 border-b border-indigo-50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-indigo-700">
                                  {item.type === 'choice_group' ? `Choice ${String.fromCharCode(cIdx + 65)}` : choice.label || `Choice ${String.fromCharCode(65 + cIdx)}`}
                                </span>
                                {choice.description && <span className="text-[10px] font-medium text-slate-400">({choice.description})</span>}
                              </div>
                              {choice.marks && <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">+{choice.marks} Marks</span>}
                            </div>
                            <div className="p-6 space-y-4">
                              <RichTextEditor
                                value={
                                  (item.type === 'choice_group'
                                    ? (formData.structure?.parts?.[idx]?.options?.[cIdx]?.question_text || formData.structure?.nested_parts?.[idx]?.options?.[cIdx]?.question_text)
                                    : (formData.structure?.parts?.[idx]?.question_text || formData.structure?.nested_parts?.[idx]?.question_text)) || ''
                                }
                                onChange={(val) => {
                                  const newStructure = { ...formData.structure };
                                  if (!newStructure.nested_parts) {
                                    let sourceData;
                                    if (nestedType === 'multipart' && config?.options?.length > 0) {
                                      sourceData = config.options;
                                    } else if (nestedType === 'internal_choice' || nestedType === 'mixed') {
                                      sourceData = config?.options || [];
                                    } else {
                                      sourceData = config?.sub_questions || config?.options || [];
                                    }
                                    newStructure.nested_parts = (formData.structure?.parts || sourceData).map((o: any) => ({ ...o }));
                                  }

                                  if (!newStructure.nested_parts[idx]) newStructure.nested_parts[idx] = { ...item };

                                  const targetPart = newStructure.nested_parts[idx];
                                  if (item.type === 'choice_group') {
                                    if (!targetPart.options) targetPart.options = [...(item.options || [])];
                                    targetPart.options[cIdx] = { ...targetPart.options[cIdx], question_text: val };
                                  } else {
                                    targetPart.question_text = val;
                                  }

                                  newStructure.parts = newStructure.nested_parts;
                                  handleInputChange('structure', newStructure);
                                }}
                                placeholder="Enter choice content..."
                              />

                              {/* Sub-parts for this Choice */}
                              {(choice.sub_parts || choice.parts || []).map((sp: any, spIdx: number) => (
                                <div key={spIdx} className="ml-8 space-y-2 mt-4">
                                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                    Part {sp.label || (spIdx + 1)} ({sp.marks} marks)
                                  </label>
                                  <RichTextEditor
                                    value={
                                      (item.type === 'choice_group'
                                        ? (formData.structure?.parts?.[idx]?.options?.[cIdx]?.sub_parts?.[spIdx]?.question_text || formData.structure?.nested_parts?.[idx]?.options?.[cIdx]?.sub_parts?.[spIdx]?.question_text || formData.structure?.parts?.[idx]?.options?.[cIdx]?.parts?.[spIdx]?.question_text || formData.structure?.nested_parts?.[idx]?.options?.[cIdx]?.parts?.[spIdx]?.question_text)
                                        : (formData.structure?.parts?.[idx]?.sub_parts?.[spIdx]?.question_text || formData.structure?.nested_parts?.[idx]?.sub_parts?.[spIdx]?.question_text || formData.structure?.parts?.[idx]?.parts?.[spIdx]?.question_text || formData.structure?.nested_parts?.[idx]?.parts?.[spIdx]?.question_text)) || ''
                                    }
                                    onChange={(val) => {
                                      const newStructure = { ...formData.structure };
                                      if (!newStructure.nested_parts) {
                                        let sourceData;
                                        if (nestedType === 'multipart' && config?.options?.length > 0) {
                                          sourceData = config.options;
                                        } else if (nestedType === 'internal_choice' || nestedType === 'mixed') {
                                          sourceData = config?.options || [];
                                        } else {
                                          sourceData = config?.sub_questions || config?.options || [];
                                        }
                                        newStructure.nested_parts = (formData.structure?.parts || sourceData).map((o: any) => ({ ...o }));
                                      }

                                      if (!newStructure.nested_parts[idx]) newStructure.nested_parts[idx] = { ...item };
                                      const targetPart = newStructure.nested_parts[idx];

                                      if (item.type === 'choice_group') {
                                        if (!targetPart.options) targetPart.options = [...(item.options || [])];
                                        const targetChoice = targetPart.options[cIdx];
                                        if (!targetChoice.sub_parts) targetChoice.sub_parts = [...(choice.sub_parts || choice.parts || [])];
                                        targetChoice.sub_parts[spIdx] = { ...targetChoice.sub_parts[spIdx], question_text: val };
                                      } else {
                                        if (!targetPart.sub_parts) targetPart.sub_parts = [...(item.sub_parts || item.parts || [])];
                                        targetPart.sub_parts[spIdx] = { ...targetPart.sub_parts[spIdx], question_text: val };
                                      }

                                      newStructure.parts = newStructure.nested_parts;
                                      handleInputChange('structure', newStructure);
                                    }}
                                    placeholder={`Enter text for part ${sp.label}...`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          {cIdx < choices.length - 1 && (
                            <div className="text-[10px] font-black text-indigo-300 text-center py-2 tracking-[0.2em]">— OR —</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Compulsory Part
              return (
                <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold">{item.label || String.fromCharCode(97 + idx)}</span>
                      <div>
                        <label className="text-sm font-bold text-slate-700">Part {item.label || String.fromCharCode(97 + idx)}</label>
                        {item.description && <div className="text-[10px] text-slate-400 font-medium">{item.description}</div>}
                      </div>
                    </div>
                    {item.marks && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">+{item.marks} Marks</span>}
                  </div>

                  <RichTextEditor
                    value={(formData.structure?.parts?.[idx]?.question_text || formData.structure?.nested_parts?.[idx]?.question_text) || ''}
                    onChange={(val) => {
                      const newStructure = { ...formData.structure };
                      if (!newStructure.nested_parts) {
                        // Use the same logic as render to initialize nested_parts
                        let sourceData;
                        if (nestedType === 'multipart' && config?.options?.length > 0) {
                          sourceData = config.options;
                        } else if (nestedType === 'internal_choice' || nestedType === 'mixed') {
                          sourceData = config?.options || [];
                        } else {
                          sourceData = config?.sub_questions || config?.options || [];
                        }
                        newStructure.nested_parts = (formData.structure?.parts || sourceData).map((o: any) => ({ ...o }));
                      }

                      if (!newStructure.nested_parts[idx]) newStructure.nested_parts[idx] = { ...item };
                      newStructure.nested_parts[idx].question_text = val;

                      newStructure.parts = newStructure.nested_parts;
                      handleInputChange('structure', newStructure);
                    }}
                    placeholder={`Enter text for part ${item.label || String.fromCharCode(97 + idx)}...`}
                  />

                  {/* Sub-parts for compulsory part */}
                  {(item.sub_parts || item.parts || []).map((sp: any, spIdx: number) => (
                    <div key={spIdx} className="ml-8 space-y-2 mt-4">
                      <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        Sub-Part {sp.label || (spIdx + 1)} ({sp.marks} marks)
                      </label>
                      <RichTextEditor
                        value={
                          (formData.structure?.parts?.[idx]?.sub_parts?.[spIdx]?.question_text ||
                            formData.structure?.nested_parts?.[idx]?.sub_parts?.[spIdx]?.question_text ||
                            formData.structure?.parts?.[idx]?.parts?.[spIdx]?.question_text ||
                            formData.structure?.nested_parts?.[idx]?.parts?.[spIdx]?.question_text) || ''
                        }
                        onChange={(val) => {
                          const newStructure = { ...formData.structure };
                          if (!newStructure.nested_parts) {
                            let sourceData;
                            if (nestedType === 'multipart' && config?.options?.length > 0) {
                              sourceData = config.options;
                            } else if (nestedType === 'internal_choice' || nestedType === 'mixed') {
                              sourceData = config?.options || [];
                            } else {
                              sourceData = config?.sub_questions || config?.options || [];
                            }
                            newStructure.nested_parts = (formData.structure?.parts || sourceData).map((o: any) => ({ ...o }));
                          }

                          if (!newStructure.nested_parts[idx]) newStructure.nested_parts[idx] = { ...item };
                          const targetPart = newStructure.nested_parts[idx];
                          if (!targetPart.sub_parts) targetPart.sub_parts = [...(item.sub_parts || item.parts || [])];

                          targetPart.sub_parts[spIdx] = {
                            ...targetPart.sub_parts[spIdx],
                            question_text: val
                          };

                          newStructure.parts = newStructure.nested_parts;
                          handleInputChange('structure', newStructure);
                        }}
                        placeholder={`Enter text for sub-part ${sp.label}...`}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> The above structured content is what students will see. The main "Question Text" field at the top can be used for common instructions or context if needed.
            </p>
          </div>
        </div>
      );
    }

    if (questionType === 'single_mcq' || questionType === 'single correct mcq' || questionType === 'mcq') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              Answer Options *
            </label>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>

          <div className="space-y-4">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 mt-2">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">
                  <RichTextEditor
                    value={option}
                    onChange={(value) => updateOption(index, value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)} - Enter text, equations, or paste images`}
                  />
                </div>
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 mt-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (questionType === 'multiple_mcq' || questionType === 'multiple correct mcq') {
      return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              Answer Options (Multiple Correct) *
            </label>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>

          <div className="space-y-4">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 mt-2">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">
                  <RichTextEditor
                    value={option}
                    onChange={(value) => updateOption(index, value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)} - Enter text, equations, or paste images`}
                  />
                </div>
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 mt-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Note:</strong> For Multiple Correct MCQ, students can select more than one correct option.
              You'll specify the correct answers in the "Correct Answer" field below.
            </p>
          </div>
        </div>
      );
    }

    if (questionType === 'numerical') {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Numerical Answer</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Expected Answer Format
              </label>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">Examples:</p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• <code className="bg-blue-100 px-2 py-1 rounded">3.14</code> (decimal)</li>
                  <li>• <code className="bg-blue-100 px-2 py-1 rounded">42</code> (integer)</li>
                  <li>• <code className="bg-blue-100 px-2 py-1 rounded">2.45</code> (with 2 decimal places)</li>
                </ul>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Tolerance Range (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 0.01 for ±0.01 tolerance"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      );
    }

    if (questionType === 'subjective') {
      return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-900">Subjective Answer</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Expected Answer Length
              </label>
              <select className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option value="short">Short Answer (1-2 sentences)</option>
                <option value="medium">Medium Answer (1-2 paragraphs)</option>
                <option value="long">Long Answer (3+ paragraphs)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Key Points to Include
              </label>
              <textarea
                placeholder="List key points that should be covered in the answer..."
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-20"
              />
            </div>


          </div>
          <div className="mt-4 border-t border-purple-200 pt-4">
            <label className="block text-sm font-medium text-purple-800 mb-2 flex items-center justify-between">
              <span>Model Answer / Detailed Solution (Required for AI Evaluation)</span>
              <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                AI Reference
              </span>
            </label>

            <div className="mb-4">
              <AIImageToText
                className="mb-3 bg-white/80"
                onExtractedText={(text) => handleInputChange('solution', text)}
                onExtractedQuestion={(data) => {
                  // Prioritize solution field from extraction, then correct_answer, then extracted text
                  const answerText = data.solution || data.correct_answer || data.question_text || '';
                  if (answerText) handleInputChange('solution', answerText);
                }}
              />
            </div>

            <div className="bg-white rounded-lg border border-purple-300 overflow-hidden shadow-sm">
              <RichTextEditor
                value={formData.solution}
                onChange={(val) => handleInputChange('solution', val)}
                placeholder="Enter the ideal answer here. The AI will compare student responses against this model answer."
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200 mt-4">
            <p className="text-sm text-purple-700">
              <strong>Note:</strong> Provides a clear model answer to ensure accurate AI evaluation. For subjective questions, the AI checks for key concepts matching your model answer.
            </p>
          </div>
        </div >

      );
    }

    if (questionType === 'true_false') {
      return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">True/False Question</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 mb-3">
                <strong>Instructions:</strong> Students will see "True" and "False" options. Select the correct answer below.
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tf_answer"
                    value="True"
                    checked={formData.correct_answer === 'True'}
                    onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                    className="text-green-600"
                  />
                  <span className="text-green-800 font-medium">True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tf_answer"
                    value="False"
                    checked={formData.correct_answer === 'False'}
                    onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                    className="text-green-600"
                  />
                  <span className="text-green-800 font-medium">False</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (questionType === 'fill_blank') {
      return (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-orange-900">Fill in the Blanks</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-2">
                Blank Positions
              </label>
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-700 mb-2">
                  Use <code className="bg-orange-100 px-2 py-1 rounded">_____</code> or <code className="bg-orange-100 px-2 py-1 rounded">[blank]</code> in your question text to indicate where students should fill in answers.
                </p>
                <p className="text-sm text-orange-600">
                  Example: "The capital of France is _____ and it has a population of _____ million."
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-2">
                Correct Answer(s) *
              </label>
              <p className="text-xs text-orange-600 mb-2">
                Enter all acceptable answers separated by semicolons (;). Example: "Watt;W;watt"
              </p>
              <input
                type="text"
                value={formData.correct_answer}
                onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                placeholder="e.g., Watt;W or Paris;paris"
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-orange-500 mt-1">
                Separate multiple acceptable answers with semicolons (case insensitive matching)
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleInputChange = (field: keyof QuestionFormData, value: string | number | string[] | any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const addOption = () => {
    setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSave = async () => {
    // For nested/subjective questions, question_text can be empty (content is in parts)
    const isNestedQuestion = formData.structure?.is_nested ||
      currentSection?.question_configurations?.[currentQuestionNumber]?.is_nested;

    if (!isNestedQuestion && !formData.question_text.trim()) {
      setSaveStatus('error');
      return;
    }

    // Validate correct_answer for true/false questions
    if (formData.question_type === 'true_false' && !formData.correct_answer) {
      toast.error('Please select the correct answer (True or False)');
      setSaveStatus('error');
      return;
    }

    // Validate correct_answer for fill_blank questions
    if (formData.question_type === 'fill_blank' && !formData.correct_answer.trim()) {
      toast.error('Please enter the correct answer(s) for fill in the blank');
      setSaveStatus('error');
      return;
    }

    // Validate correct_answer for single/mcq questions
    if ((formData.question_type === 'single_mcq' || formData.question_type === 'mcq') && !formData.correct_answer.trim()) {
      toast.error('Please choose the correct option for this question.');
      setSaveStatus('error');
      return;
    }

    if (!user?.institute?.id && !user?.institute_id) {
      console.error('No institute found for user:', user);
      setSaveStatus('error');
      return;
    }

    setLoading(true);
    setSaveStatus('saving');

    try {
      const patternSectionId = formData.pattern_section ?? currentSection?.id ?? null;
      const patternSectionName = currentSection?.name ?? '';
      const absoluteQuestionNumberForSave = computeAbsoluteQuestionNumber(currentSection ?? null, currentQuestionNumber);
      // For nested questions, ensure question_text has a value (backend requires it)
      const questionTextToSave = formData.question_text.trim() ||
        (isNestedQuestion ? 'Answer the following:' : formData.question_text);

      const dataToSave = {
        ...formData,
        question_text: questionTextToSave,
        options:
          formData.question_type === 'single_mcq' ||
            formData.question_type === 'multiple_mcq' ||
            formData.question_type === 'mcq'
            ? formData.options.filter(opt => safeOptionString(opt).trim())
            : [],
        question_number: absoluteQuestionNumberForSave,
        question_number_in_pattern: currentQuestionNumber,
        pattern_section_id: patternSectionId,
        pattern_section_name: patternSectionName,
        exam: examIdFromQuery,
        institute: user?.institute?.id || user?.institute_id,
      };

      let questionToUpdate: QuestionData | null = null;

      // SAFETY CHECK: Only use existing question if we are NOT currently loading data
      // and the data we have matches BOTH the absolute question number AND the section.
      if (!questionLoading && existingQuestion) {
        let candidate: QuestionData | null = null;
        if ('results' in existingQuestion && existingQuestion.results && existingQuestion.results.length > 0) {
          candidate = existingQuestion.results[0] as QuestionData;
        } else if (Array.isArray(existingQuestion) && existingQuestion.length > 0) {
          candidate = existingQuestion[0] as QuestionData;
        }

        // Only update if it's the SAME question number AND section we're currently looking at
        if (
          candidate &&
          candidate.question_number === absoluteQuestionNumberForSave &&
          candidate.pattern_section_id === patternSectionId
        ) {
          questionToUpdate = candidate;
        }
      }

      // Fallback to cached bulk-loaded data if API result is pending or mismatch
      if (!questionToUpdate) {
        const sectionMap = currentSection ? existingQuestionsBySection[currentSection.id] : undefined;
        const mappedExisting = sectionMap?.get(currentQuestionNumber) ?? null;
        if (mappedExisting && mappedExisting.question_number === absoluteQuestionNumberForSave) {
          questionToUpdate = mappedExisting;
        }
      }

      console.log('Save operation:', {
        questionToUpdate,
        existingQuestion,
        dataToSave,
        userInstitute: user?.institute?.id || user?.institute_id,
        userObject: user
      });

      if (questionToUpdate) {
        const targetId = questionToUpdate.id;
        console.log('Updating existing question:', targetId, dataToSave);
        await api.put(`/questions/questions/${targetId}/`, dataToSave);
      } else {
        // Create new question
        console.log('Creating new question:', dataToSave);
        await api.post('/questions/questions/', dataToSave);
      }
      setSaveStatus('saved');

      // Refresh the question data to get the updated version
      await refetchQuestion();

      // Refresh the section data - use bulk reload if available
      if (pattern && patternId) {
        const allSections = subjectGroups.flatMap(g => g.sections);
        const bulkSuccess = await loadAllPatternQuestions(patternId, allSections);
        if (!bulkSuccess) {
          await fetchSectionStats(pattern);
          if (currentSection) {
            await loadSectionNumbers(currentSection, true);
          }
        } else if (currentSection && existingNumbersBySection[currentSection.id]) {
          setExistingNumbers(existingNumbersBySection[currentSection.id]);
        }
      }

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleFixQuestionNumbers = async () => {
    if (!patternId) return;

    setFixingNumbers(true);
    try {
      const payload: { pattern_id: number; exam_id?: number } = {
        pattern_id: Number(patternId),
      };
      if (examIdFromQuery) {
        payload.exam_id = examIdFromQuery;
      }

      await api.post('/questions/fix-question-numbers/', payload);

      // Reload all data after fix
      const allSections = subjectGroups.flatMap(g => g.sections);
      await loadAllPatternQuestions(patternId, allSections);

      if (currentSection && existingNumbersBySection[currentSection.id]) {
        setExistingNumbers(existingNumbersBySection[currentSection.id]);
      }
    } catch (error) {
      console.error('Failed to fix question numbers:', error);
    } finally {
      setFixingNumbers(false);
    }
  };

  const handleGenerateAIQuestion = async () => {
    const activeSection = currentSection;
    const effectiveQuestionType = (activeSection?.question_type || formData.question_type || '').toLowerCase();

    if (!activeSection) {
      setAiError('Select a section before generating a question.');
      return;
    }

    setAiGenerating(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      // Get the question configuration for nested questions
      const questionConfig = activeSection?.question_configurations?.[currentQuestionNumber];
      const isNestedQuestion = questionConfig?.is_nested || false;

      const response = await api.post('/questions/ai/generate-question/', {
        question_type: activeSection.question_type || formData.question_type,
        subject: activeSection.subject || formData.subject,
        topic: formData.topic,
        difficulty: formData.difficulty,
        instructions: aiPrompt,
        marks: activeSection.marks_per_question,
        pattern_section_name: activeSection.name,
        question_number: currentQuestionNumber,
        exam_id: examIdFromQuery,
        // Send question configuration for nested questions
        is_nested: isNestedQuestion,
        nested_type: questionConfig?.nested_type,
        question_configuration: isNestedQuestion ? questionConfig : null,
      });

      const aiQuestion = response.data?.question as AIQuestionPayload | undefined;
      if (!aiQuestion) {
        throw new Error('AI did not return a question payload.');
      }

      const rawOptions = Array.isArray(aiQuestion.options) ? aiQuestion.options.map((opt) => String(opt)) : [];
      let normalizedOptions = rawOptions.map((opt) => opt.trim()).filter((opt) => opt.length > 0);

      const isSingleChoice = ['single_mcq', 'mcq', 'single correct mcq'].includes(effectiveQuestionType);
      const isMultipleChoice = ['multiple_mcq', 'multiple correct mcq'].includes(effectiveQuestionType);
      const isTrueFalse = ['true_false', 'true/false'].includes(effectiveQuestionType);

      if (isSingleChoice || isMultipleChoice) {
        const desiredLength = Math.max(normalizedOptions.length, formData.options.length || 4, 4);
        const paddedOptions = Array.from({ length: desiredLength }, (_, idx) => normalizedOptions[idx] || '');
        normalizedOptions = paddedOptions;
      } else if (isTrueFalse) {
        normalizedOptions = ['True', 'False'];
      } else {
        normalizedOptions = [];
      }

      const mapAnswerValue = (value: unknown) => {
        if (normalizedOptions.length === 0) {
          return String(value ?? '').trim();
        }

        if (typeof value === 'number') {
          const idx = value - 1;
          return normalizedOptions[idx] || String(value);
        }

        const textValue = String(value ?? '').trim();
        if (!textValue) return '';

        if (textValue.length === 1 && /[A-Z]/i.test(textValue)) {
          const idx = textValue.toUpperCase().charCodeAt(0) - 65;
          return normalizedOptions[idx] || textValue;
        }

        return textValue;
      };

      let correctAnswerValue = aiQuestion.correct_answer ?? '';

      if (isMultipleChoice) {
        if (Array.isArray(correctAnswerValue)) {
          const processed = correctAnswerValue
            .map(mapAnswerValue)
            .map((entry) => entry.split(/[|,]/g))
            .flat()
            .map((entry) => entry.trim())
            .filter(Boolean);
          correctAnswerValue = Array.from(new Set(processed)).join('|');
        } else if (typeof correctAnswerValue === 'string') {
          const parts = correctAnswerValue.split(/[|,]/g).map((part) => part.trim()).filter(Boolean);
          const processed = parts.map(mapAnswerValue).map((entry) => entry.trim()).filter(Boolean);
          correctAnswerValue = Array.from(new Set(processed)).join('|');
        } else {
          correctAnswerValue = mapAnswerValue(correctAnswerValue);
        }
      } else {
        if (Array.isArray(correctAnswerValue)) {
          correctAnswerValue = mapAnswerValue(correctAnswerValue[0]);
        } else {
          correctAnswerValue = mapAnswerValue(correctAnswerValue);
        }
      }

      if (isTrueFalse && typeof correctAnswerValue === 'string') {
        const normalized = correctAnswerValue.toLowerCase();
        correctAnswerValue = normalized === 'true' ? 'True' : normalized === 'false' ? 'False' : correctAnswerValue;
      }
      if (typeof correctAnswerValue === 'string') {
        correctAnswerValue = correctAnswerValue.trim();
      }

      const finalCorrectAnswer =
        typeof correctAnswerValue === 'string'
          ? correctAnswerValue
          : String(correctAnswerValue ?? '').trim();

      const aiDifficultyRaw = String(aiQuestion.difficulty || '').toLowerCase();
      const mappedDifficulty = ['easy', 'medium', 'hard'].includes(aiDifficultyRaw) ? (aiDifficultyRaw as 'easy' | 'medium' | 'hard') : formData.difficulty;

      // Handle nested questions - populate structure with AI-generated parts
      if (isNestedQuestion && aiQuestion.structure?.nested_parts) {
        const aiParts = aiQuestion.structure.nested_parts;

        // Get config parts to merge with
        let configParts: any[] = [];
        if (questionConfig?.options && questionConfig.options.length > 0) {
          configParts = questionConfig.options;
        } else if (questionConfig?.sub_questions && questionConfig.sub_questions.length > 0) {
          configParts = questionConfig.sub_questions;
        }

        // Merge AI-generated text with config structure
        const mergedParts = configParts.map((configPart: any, idx: number) => {
          const aiPart = aiParts.find((ap: any) =>
            ap.label?.toLowerCase() === configPart.label?.toLowerCase()
          ) || aiParts[idx];

          const merged: any = { ...configPart };

          if (aiPart) {
            if (configPart.type === 'choice_group' && configPart.options) {
              // Handle choice groups
              const aiOptions = aiPart.options || [];
              merged.options = configPart.options.map((co: any, coIdx: number) => {
                const aiOpt = aiOptions[coIdx];
                const mergedOpt: any = { ...co, question_text: aiOpt?.text || '' };

                // Handle sub_parts inside choice options
                if (co.sub_parts && aiOpt?.sub_parts) {
                  mergedOpt.sub_parts = co.sub_parts.map((csp: any, spIdx: number) => {
                    const aiSp = aiOpt.sub_parts[spIdx];
                    return { ...csp, question_text: aiSp?.text || '' };
                  });
                }
                return mergedOpt;
              });
            } else {
              // Regular part
              merged.question_text = aiPart.text || '';

              // Handle sub_parts
              if (configPart.sub_parts || configPart.parts) {
                const configSubParts = configPart.sub_parts || configPart.parts || [];
                const aiSubParts = aiPart.sub_parts || [];

                merged.sub_parts = configSubParts.map((csp: any, spIdx: number) => {
                  const aiSp = aiSubParts.find((asp: any) =>
                    asp.label?.toLowerCase() === csp.label?.toLowerCase()
                  ) || aiSubParts[spIdx];
                  return { ...csp, question_text: aiSp?.text || '' };
                });
              }
            }
          }
          return merged;
        });

        // Update form with nested structure
        setFormData((prev) => ({
          ...prev,
          question_text: aiQuestion.question_text || 'Answer the following:',
          difficulty: mappedDifficulty,
          topic: aiQuestion.topic || prev.topic,
          structure: {
            is_nested: true,
            nested_type: questionConfig?.nested_type || 'multipart',
            parts: mergedParts,
            nested_parts: mergedParts
          }
        }));
      } else {
        // Non-nested question - original logic
        setFormData((prev) => ({
          ...prev,
          question_text: aiQuestion.question_text || prev.question_text,
          options: (isSingleChoice || isMultipleChoice || isTrueFalse) ? normalizedOptions : prev.options,
          correct_answer: finalCorrectAnswer || prev.correct_answer,
          solution: aiQuestion.solution || prev.solution,
          explanation: aiQuestion.explanation || aiQuestion.solution || prev.explanation,
          difficulty: mappedDifficulty,
          topic: aiQuestion.topic || prev.topic,
        }));
      }
      setSaveStatus('idle');

      setAiSuccess(response.data?.message || 'AI generated a draft question. Review before saving.');
    } catch (error: unknown) {
      console.error('AI generation failed:', error);
      const responseMessage =
        typeof error === 'object' && error !== null && 'response' in error && (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      const fallbackMessage =
        typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : undefined;
      setAiError(responseMessage || fallbackMessage || 'Failed to generate question. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAISolve = async () => {
    if (!formData.question_text) {
      setAiError('Please enter question text before solving.');
      return;
    }

    setAiSolving(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      const response = await api.post('/questions/ai/solve-question/', {
        question_text: formData.question_text,
        options: formData.options,
        question_type: formData.question_type,
        subject: formData.subject || currentSection?.subject,
      });

      const data = response.data || {};
      const parsedFromSolution = extractJsonObjectFromText(data.solution);
      const parsedFromExplanation = extractJsonObjectFromText(data.explanation);
      const embedded = parsedFromSolution || parsedFromExplanation || {};

      const rawCorrectAnswer = data.correct_answer ?? embedded.correct_answer ?? '';
      const rawSolution = data.solution ?? embedded.solution ?? '';
      const rawExplanation = data.explanation ?? embedded.explanation ?? '';

      // Extract raw result
      let finalCorrectAnswer = rawCorrectAnswer || '';
      const currentOptions = formData.options || [];
      const questionType = formData.question_type.toLowerCase();

      // Mapping logic for MCQs to ensure the correct option is selected in the dropdown
      const isMCQ = ['single_mcq', 'mcq', 'multiple_mcq', 'multiple correct mcq'].includes(questionType);

      if (isMCQ && finalCorrectAnswer) {
        const mapValue = (val: any): string => {
          const textVal = extractAnswerText(val);
          if (!textVal) return '';

          const idx = resolveOptionIndexFromAnswer(textVal, currentOptions);
          if (idx >= 0 && currentOptions[idx]) return currentOptions[idx];

          return textVal;
        };

        if (Array.isArray(finalCorrectAnswer)) {
          finalCorrectAnswer = finalCorrectAnswer.map(mapValue).join('|');
        } else if (questionType.includes('multiple')) {
          const parts = String(finalCorrectAnswer).split(/[|,]/).map(p => p.trim());
          finalCorrectAnswer = parts.map(mapValue).filter(Boolean).join('|');
        } else {
          finalCorrectAnswer = mapValue(finalCorrectAnswer);
        }
      }

      const finalSolution = sanitizeHumanReadableText(
        rawSolution || (typeof embedded.solution === 'string' ? embedded.solution : '')
      );
      const finalExplanation = sanitizeHumanReadableText(
        rawExplanation || (typeof embedded.explanation === 'string' ? embedded.explanation : '')
      );

      setFormData(prev => ({
        ...prev,
        correct_answer: finalCorrectAnswer || prev.correct_answer,
        solution: finalSolution || prev.solution,
        explanation: finalExplanation || finalSolution || prev.explanation
      }));

      setAiSuccess('AI has solved the question successfully.');
    } catch (error: any) {
      console.error('AI solver failed:', error);
      const responseMessage =
        typeof error === 'object' && error !== null && 'response' in error && (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      const fallbackMessage =
        typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : undefined;
      setAiError(responseMessage || fallbackMessage || 'Failed to solve question with AI.');
    } finally {
      setAiSolving(false);
    }
  };

  const navigateToQuestion = (subjectSlug: string, newQuestionNumber: number) => {
    if (!patternId) return;
    const group = subjectGroups.find(g => g.slug === subjectSlug);
    if (!group) return;

    const clamped = Math.min(Math.max(newQuestionNumber, 1), group.total_questions || 1);
    const querySuffix = examIdFromQuery ? `?examId=${examIdFromQuery}` : '';
    navigate(`/pattern/${patternId}/question/${subjectSlug}/${clamped}${querySuffix}`, { replace: true });
  };


  const handleSubjectChange = (subjectSlug: string) => {
    if (!patternId) return;
    const group = subjectGroups.find(g => g.slug === subjectSlug);
    if (!group) return;
    const desiredNumber = currentQuestionNumber <= group.total_questions ? currentQuestionNumber : 1;
    const querySuffix = examIdFromQuery ? `?examId=${examIdFromQuery}` : '';
    navigate(`/pattern/${patternId}/question/${subjectSlug}/${Math.max(1, desiredNumber)}${querySuffix}`, { replace: true });
  };


  const getSectionColor = (type: string) => {
    switch (type) {
      case 'single_mcq':
      case 'mcq': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'multiple_mcq': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'numerical': return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case 'subjective': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'true_false': return 'bg-green-50 border-green-200 text-green-800';
      case 'fill_blank': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getAnswerPreviewExample = () => {
    const { question_type, correct_answer, marks, negative_marks } = formData;

    if (!correct_answer) return null;

    switch (question_type) {
      case 'numerical': {
        const numAnswer = parseFloat(correct_answer);
        if (isNaN(numAnswer)) return null;

        const tolerance = 0.1;
        const minRange = (numAnswer - tolerance).toFixed(2);
        const maxRange = (numAnswer + tolerance).toFixed(2);

        return (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-purple-900">Answer Preview & Calculation</h4>
                <p className="text-xs text-purple-700">Live evaluation examples</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-700 mb-2">Correct Answer:</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {numAnswer}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Accepted Range: <span className="font-semibold">{minRange}</span> to <span className="font-semibold">{maxRange}</span> (±{tolerance})
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm space-y-2.5">
                <p className="text-xs font-bold text-slate-800 mb-3">📊 Student Answer Scenarios:</p>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-slate-700">Enters: <strong className="text-green-700">{numAnswer}</strong></span>
                  </div>
                  <span className="text-green-600 font-bold text-sm">+{marks} marks ✓</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-slate-700">Enters: <strong className="text-green-700">{(numAnswer + 0.05).toFixed(2)}</strong></span>
                  </div>
                  <span className="text-green-600 font-bold text-sm">+{marks} marks ✓</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-slate-700">Enters: <strong className="text-red-700">{(numAnswer + 0.15).toFixed(2)}</strong></span>
                  </div>
                  <span className="text-red-600 font-bold text-sm">{negative_marks} marks ✗</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-400 rounded-full flex items-center justify-center">
                      <div className="w-4 h-0.5 bg-white"></div>
                    </div>
                    <span className="text-sm text-slate-700">Leaves blank</span>
                  </div>
                  <span className="text-slate-600 font-bold text-sm">0 marks</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'single_mcq':
      case 'mcq': {
        const correctIndex = formData.options.findIndex(
          (opt) => normalizeOptionValue(opt) === normalizeOptionValue(correct_answer),
        );
        return (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900">Single Correct MCQ Preview</h4>
                <p className="text-xs text-blue-700">Marking breakdown</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-slate-600 mb-2">Correct Answer:</p>
                <p className="text-2xl font-bold text-blue-600">
                  Option {correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '?'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                <p className="text-xs font-bold text-slate-800 mb-3">📊 Marking Scenarios:</p>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-slate-700">Selects correct option</span>
                  <span className="text-green-600 font-bold">+{marks} marks</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-slate-700">Selects wrong option</span>
                  <span className="text-red-600 font-bold">{negative_marks} marks</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-700">No selection</span>
                  <span className="text-slate-600 font-bold">0 marks</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'multiple_mcq': {
        const selectedAnswers = correct_answer
          ? correct_answer.split('|').filter(Boolean)
          : [];
        const normalizedSelectedAnswers = selectedAnswers.map((answer) =>
          normalizeOptionValue(answer),
        );
        return (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-purple-900">Multiple Correct MCQ Preview</h4>
                <p className="text-xs text-purple-700">Marking breakdown</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-slate-600 mb-2">Correct Answers:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAnswers.map((answer, index) => {
                    const optionIndex = formData.options.findIndex(
                      (opt) => normalizeOptionValue(opt) === normalizeOptionValue(answer),
                    );
                    return (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {optionIndex >= 0 ? String.fromCharCode(65 + optionIndex) : '?'}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                <p className="text-xs font-bold text-slate-800 mb-3">📊 Marking Scenarios:</p>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-slate-700">Selects all correct options</span>
                  <span className="text-green-600 font-bold">+{marks} marks</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm text-slate-700">Selects some correct options</span>
                  <span className="text-yellow-600 font-bold">Partial marks</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-slate-700">Selects wrong options</span>
                  <span className="text-red-600 font-bold">-{negative_marks} marks</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'subjective': {
        return (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-orange-900">Subjective Evaluation</h4>
                <p className="text-xs text-orange-700">Manual grading required</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <p className="text-sm font-semibold text-orange-800">No Automatic Grading</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="text-sm text-slate-700">Any attempt submitted</span>
                  <span className="text-green-600 font-bold">Up to {marks} marks</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-700">No attempt</span>
                  <span className="text-slate-600 font-bold">0 marks</span>
                </div>
              </div>
              <p className="text-xs text-orange-700 mt-3 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Teacher will manually evaluate after exam completion
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getSectionInfo = (questionNum: number) => {
    if (!pattern) return null;
    return pattern.sections.find(
      (s: PatternSection) => questionNum >= s.start_question && questionNum <= s.end_question
    );
  };

  const getQuestionBounds = () => {
    if (!pattern) return { min: 1, max: 100 };
    return {
      min: Math.min(...pattern.sections.map((s: PatternSection) => s.start_question)),
      max: Math.max(...pattern.sections.map((s: PatternSection) => s.end_question)),
    };
  };

  const { min, max } = getQuestionBounds();
  const sectionInfo = currentSection ?? getSectionInfo(currentQuestionNumber);

  if (loading || !pattern) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading question editor...</p>
        </div>
      </div>
    );
  }

  // Removed full-screen questionLoading blocker to prevent "refresh" feeling

  if (!user?.institute?.id && !user?.institute_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Institute Required</h1>
          <p className="text-slate-600 mb-6">You need to be associated with an institute to create or edit questions.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100] overflow-y-auto' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`}>
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 backdrop-blur-lg bg-white/95">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  navigate(-1);
                }}

                className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {pattern.name}
                </h1>
                <p className="text-sm text-slate-600">{formData.subject} • Question Editor</p>
              </div>
            </div>

            {/* Center - Question Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateToQuestion(currentSubjectSlug || subjectGroups[0].slug, currentQuestionNumber - 1)}
                disabled={currentQuestionNumber <= min}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 disabled:hover:scale-100"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>

              <div className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg transition-all transform hover:scale-105">
                {sectionInfo && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-semibold rounded-lg">
                    {sectionInfo.name}
                  </span>
                )}
                <span className="text-white font-bold text-2xl">
                  Q{currentQuestionNumber}
                </span>
                {existingQuestion && (
                  ('results' in existingQuestion && existingQuestion.results && existingQuestion.results.length > 0) ||
                  (Array.isArray(existingQuestion) && existingQuestion.length > 0)
                ) ? (
                  <span className="px-3 py-1 bg-orange-500/80 backdrop-blur text-white text-xs font-semibold rounded-lg">
                    Editing
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-500/80 backdrop-blur text-white text-xs font-semibold rounded-lg">
                    New
                  </span>
                )}
              </div>

              <button
                onClick={() => navigateToQuestion(currentSubjectSlug || subjectGroups[0].slug, currentQuestionNumber + 1)}
                disabled={currentQuestionNumber >= max}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 disabled:hover:scale-100"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            {/* Right Side - Actions & Save */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-all border border-indigo-200 hover:scale-105 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1"></div>

              <button
                onClick={handleFixQuestionNumbers}
                disabled={fixingNumbers}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all hover:scale-110 disabled:opacity-50 border border-amber-200"
                title="Fix question numbering"
              >
                {fixingNumbers ? (
                  <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-700" />
                )}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all hover:scale-110 border border-slate-200"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleSave}
                disabled={loading || saveStatus === 'saving'}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Info Banner */}
            {sectionInfo && (
              <div className={`border-2 rounded-2xl p-5 shadow-lg ${getSectionColor(sectionInfo.question_type)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-bold text-lg">{sectionInfo.name}</h3>
                    </div>
                    <p className="text-sm opacity-90">{sectionInfo.subject} • {getQuestionTypeDisplayName(sectionInfo.question_type)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">+{sectionInfo.marks_per_question}</p>
                    <p className="text-xs opacity-75">
                      {sectionInfo.question_type === 'subjective' ? 'No penalty' : `${sectionInfo.negative_marking} penalty`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Question Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 relative">
              {/* Inline Loading Overlay (only if no cache) */}
              {questionLoading && !((currentSection && existingQuestionsBySection[currentSection.id]?.get(currentQuestionNumber))) && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-600">Syncing Question Data...</p>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                {/* AI Question Assistant Banner - Removed from here to floating drawer */}

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Question Text *
                  </label>
                  <RichTextEditor
                    value={formData.question_text}
                    onChange={(value) => handleInputChange('question_text', value)}
                    placeholder="Enter your question here... You can use formatting, equations, and more!"
                  />
                </div>

                {/* Question Type Specific UI */}
                {renderQuestionTypeSpecificUI()}

                {/* Correct Answer - Hide for true_false and fill_blank as they're handled above */}
                {/* Correct Answer Section */}
                {!['subjective'].includes(formData.question_type.toLowerCase()) && (
                  <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Correct Answer *
                      </label>
                      <button
                        type="button"
                        onClick={handleAISolve}
                        disabled={aiSolving || !formData.question_text}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100 transform hover:scale-105"
                      >
                        {aiSolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Solve with AI
                      </button>
                    </div>
                    {(formData.question_type === 'single_mcq' || formData.question_type === 'mcq') ? (
                      <select
                        value={
                          (() => {
                            if (!formData.correct_answer) return '';
                            const idx = resolveOptionIndexFromAnswer(formData.correct_answer, formData.options);
                            return idx >= 0 ? String(idx) : '';
                          })()
                        }
                        onChange={(e) => {
                          if (e.target.value === '') {
                            handleInputChange('correct_answer', '');
                            return;
                          }
                          const selectedIndex = Number(e.target.value);
                          if (!Number.isNaN(selectedIndex) && formData.options[selectedIndex]) {
                            handleInputChange('correct_answer', formData.options[selectedIndex]);
                          } else {
                            handleInputChange('correct_answer', '');
                          }
                        }}
                        className="w-full px-4 py-3.5 border-2 border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-green-50 font-medium"
                      >
                        <option value="">Select correct option...</option>
                        {formData.options.map((option, index) => {
                          if (!safeOptionString(option).trim()) return null;
                          return (
                            <option key={index} value={index}>
                              {String.fromCharCode(65 + index)}:{' '}
                              {stripOptionContent(option).substring(0, 50) || 'Option'}
                            </option>
                          );
                        })}
                      </select>
                    ) : formData.question_type === 'multiple_mcq' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-purple-700 font-medium">Select all correct options:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {formData.options.filter(o => safeOptionString(o).trim()).map((option, index) => {
                            const isChecked =
                              normalizeOptionValue(option) !== '' &&
                              (formData.correct_answer
                                ? formData.correct_answer
                                  .split('|')
                                  .filter(Boolean)
                                  .some(
                                    (answer) =>
                                      normalizeOptionValue(answer) ===
                                      normalizeOptionValue(option),
                                  )
                                : false);
                            return (
                              <label
                                key={index}
                                className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentAnswers = formData.correct_answer
                                      ? formData.correct_answer.split('|').filter(Boolean)
                                      : [];
                                    if (e.target.checked) {
                                      const exists = currentAnswers.some(
                                        (answer) =>
                                          normalizeOptionValue(answer) ===
                                          normalizeOptionValue(option),
                                      );
                                      if (!exists) {
                                        currentAnswers.push(option);
                                      }
                                    } else {
                                      const filtered = currentAnswers.filter(
                                        (answer) =>
                                          normalizeOptionValue(answer) !==
                                          normalizeOptionValue(option),
                                      );
                                      currentAnswers.splice(0, currentAnswers.length, ...filtered);
                                    }
                                    const uniqueAnswers: string[] = [];
                                    currentAnswers.forEach((answer) => {
                                      const normalized = normalizeOptionValue(answer);
                                      const exists = uniqueAnswers.some(
                                        (existing) =>
                                          normalizeOptionValue(existing) === normalized,
                                      );
                                      if (!exists) {
                                        uniqueAnswers.push(answer);
                                      }
                                    });
                                    handleInputChange('correct_answer', uniqueAnswers.join('|'));
                                  }}
                                  className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-purple-800">
                                  {String.fromCharCode(65 + index)}: {safeOptionString(option).replace(/<[^>]*>/g, '').substring(0, 30)}...
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-xs text-purple-600">
                          Selected answers will be stored as: {formData.correct_answer || 'None selected'}
                        </p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.correct_answer}
                        onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                        className="w-full px-4 py-3.5 border-2 border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-green-50 font-medium"
                        placeholder={
                          formData.question_type === 'numerical' ? 'e.g., 3.14, 42, 6.02×10²³' :
                            'Enter correct answer'
                        }
                      />
                    )}
                  </div>
                )}

                {/* Solution */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Solution (Step-by-step)
                  </label>
                  <RichTextEditor
                    value={formData.solution}
                    onChange={(value) => handleInputChange('solution', value)}
                    placeholder="Provide a detailed step-by-step solution..."
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    Explanation (Optional)
                  </label>
                  <RichTextEditor
                    value={formData.explanation}
                    onChange={(value) => handleInputChange('explanation', value)}
                    placeholder="Explain concepts or provide additional insights..."
                  />
                </div>

                {/* Answer Preview */}
                {formData.correct_answer && (
                  <div className="pt-4">
                    {getAnswerPreviewExample()}
                  </div>
                )}

                {/* Save Button - Sticky at bottom */}
                <div className="sticky bottom-0 pt-6 bg-white border-t-2 border-slate-200 -mx-8 -mb-8 px-8 pb-8 rounded-b-2xl">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-3 text-lg"
                  >
                    {loading || saveStatus === 'saving' ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Question...
                      </>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        Save & Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - 1 col */}
          <div className="space-y-6">
            {/* Question Number Navigator (for current section) */}
            {currentSubjectGroup && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Question Navigator</h3>
                    <p className="text-xs text-slate-600">Navigate questions grouped by subject & section</p>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    {currentSubjectGroup.subject} • {currentSubjectGroup.total_questions} questions
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {subjectGroups.map(group => {
                    const isActive = group.slug === currentSubjectGroup.slug;
                    return (
                      <button
                        key={group.slug}
                        onClick={() => handleSubjectChange(group.slug)}
                        className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                      >
                        {group.subject}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-5">
                  {currentSubjectGroup.sections.map(section => {
                    const isCurrentSection = section.id === currentSection?.id;
                    const cachedNumbers = existingNumbersBySection[section.id];
                    const numbersSet = cachedNumbers
                      ? cachedNumbers
                      : isCurrentSection
                        ? existingNumbers
                        : new Set<number>();

                    return (
                      <div
                        key={section.id}
                        className={`rounded-xl border transition-all p-4 ${isCurrentSection
                          ? 'border-blue-400 bg-blue-50 shadow-md'
                          : 'border-slate-200 bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{section.name}</h4>
                            <p className="text-xs text-slate-500">
                              Section {section.subject_section_index} • Q{section.subject_start}–{section.subject_end}
                            </p>
                          </div>
                          <div className="text-xs text-slate-500">
                            {section.marks_per_question} marks/question
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: section.subject_end - section.subject_start + 1 }).map((_, idx) => {
                            const num = section.subject_start + idx;
                            const isCurrent = isCurrentSection && num === currentQuestionNumber;
                            const isExisting = numbersSet.has(num);
                            return (
                              <button
                                key={`${section.id}-${num}`}
                                onClick={() => navigateToQuestion(currentSubjectGroup.slug, num)}
                                className={`h-10 rounded-lg border text-sm font-semibold transition-all ${isCurrent
                                  ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                                  : isExisting
                                    ? 'border-emerald-400 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                  }`}
                                title={isExisting ? 'Already added' : 'Empty'}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-300 inline-block"></span> Added</span>
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block"></span> Current</span>
                </div>
              </div>
            )}

            {/* AI Assistant */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Assistant
                </h3>
              </div>
              <div className="p-4">
                <AIImageToText
                  onExtractedText={(text) => {
                    // Set the extracted text as question text
                    handleInputChange('question_text', text);
                  }}
                  onExtractedQuestion={(data) => {
                    // DEBUG: Log what AI returned
                    console.log('AI Extracted Data:', JSON.stringify(data, null, 2));
                    console.log('is_nested:', data.is_nested);
                    console.log('structure:', data.structure);

                    // Auto-fill the question form with extracted data
                    // For nested questions, set a default question_text
                    // Only set question_text for non-nested questions (MCQ, simple subjective)
                    if (!data.is_nested && data.question_text) {
                      handleInputChange('question_text', data.question_text);
                    }
                    // If nested, set default question_text (backend requires non-empty)
                    if (data.is_nested) {
                      handleInputChange('question_text', data.question_text || 'Answer the following:');
                    }
                    if (data.options && data.options.length > 0) {
                      // Pad options to 4 if needed
                      const paddedOptions = [...data.options];
                      while (paddedOptions.length < 4) {
                        paddedOptions.push('');
                      }
                      setFormData(prev => ({ ...prev, options: paddedOptions }));
                    }
                    if (data.correct_answer) {
                      // Convert letter answer to option text if needed
                      const answer = data.correct_answer.toUpperCase();
                      if (answer.length === 1 && answer >= 'A' && answer <= 'D' && data.options) {
                        const index = answer.charCodeAt(0) - 65;
                        if (data.options[index]) {
                          handleInputChange('correct_answer', data.options[index]);
                        }
                      } else {
                        handleInputChange('correct_answer', data.correct_answer);
                      }
                    }
                    if (data.solution) {
                      handleInputChange('solution', data.solution);
                    }
                    if (data.explanation) {
                      handleInputChange('explanation', data.explanation);
                    }

                    // Handle nested structure from AI extraction
                    if (data.is_nested && data.structure?.nested_parts) {
                      const config = currentSection?.question_configurations?.[currentQuestionNumber];
                      const aiParts = data.structure.nested_parts;

                      // Get the pattern configuration parts
                      let configParts: any[] = [];
                      if (config?.options && config.options.length > 0) {
                        configParts = config.options;
                      } else if (config?.sub_questions && config.sub_questions.length > 0) {
                        configParts = config.sub_questions;
                      }

                      // Helper function to find AI part - handles both direct parts and choice_group
                      const findAiPart = (configPart: any, idx: number) => {
                        // Check if AI returned a choice_group that matches
                        const aiChoiceGroup = aiParts.find((ap: any) => ap.type === 'choice_group');

                        if (configPart.type === 'choice_group' && aiChoiceGroup) {
                          return aiChoiceGroup;
                        }

                        // Try to find by label
                        let match = aiParts.find((ap: any) =>
                          ap.label?.toLowerCase() === configPart.label?.toLowerCase()
                        );

                        // If config is inside a choice_group options, look in AI choice_group options too
                        if (!match && aiChoiceGroup?.options) {
                          match = aiChoiceGroup.options.find((opt: any) =>
                            opt.label?.toLowerCase() === configPart.label?.toLowerCase() ||
                            opt.label?.toLowerCase() === configPart.description?.toLowerCase()
                          );
                        }

                        return match || aiParts[idx];
                      };

                      // Merge AI-extracted text with pattern config structure
                      const mergedParts = configParts.map((configPart: any, idx: number) => {
                        const aiPart = findAiPart(configPart, idx);
                        const merged: any = { ...configPart };

                        if (aiPart) {
                          // For choice_group, handle options inside
                          if (configPart.type === 'choice_group' && configPart.options) {
                            const aiOptions = aiPart.options || [];
                            merged.options = configPart.options.map((co: any, coIdx: number) => {
                              const aiOpt = aiOptions[coIdx] || aiOptions.find((ao: any) =>
                                ao.label?.toLowerCase() === co.label?.toLowerCase() ||
                                ao.label?.toLowerCase() === co.description?.toLowerCase()
                              );

                              const mergedOpt: any = { ...co, question_text: aiOpt?.text || '' };

                              // Handle sub_parts inside choice options
                              if (co.sub_parts && aiOpt?.sub_parts) {
                                mergedOpt.sub_parts = co.sub_parts.map((csp: any, spIdx: number) => {
                                  const aiSp = aiOpt.sub_parts[spIdx] || aiOpt.sub_parts.find((sp: any) =>
                                    sp.label?.toLowerCase() === csp.label?.toLowerCase()
                                  );
                                  return { ...csp, question_text: aiSp?.text || '' };
                                });
                              }

                              return mergedOpt;
                            });
                          } else {
                            // Regular part - set question text
                            merged.question_text = aiPart.text || '';

                            // Handle sub_parts
                            if (configPart.sub_parts || configPart.parts) {
                              const configSubParts = configPart.sub_parts || configPart.parts || [];
                              const aiSubParts = aiPart.sub_parts || [];

                              merged.sub_parts = configSubParts.map((csp: any, spIdx: number) => {
                                const aiSp = aiSubParts.find((asp: any) =>
                                  asp.label?.toLowerCase() === csp.label?.toLowerCase()
                                ) || aiSubParts[spIdx];

                                return {
                                  ...csp,
                                  question_text: aiSp?.text || ''
                                };
                              });
                            }
                          }
                        }

                        return merged;
                      });

                      // Update the form structure
                      handleInputChange('structure', {
                        is_nested: true,
                        nested_type: config?.nested_type || 'multipart',
                        parts: mergedParts,
                        nested_parts: mergedParts
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Section Progress */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Progress Tracker</h3>
                  <p className="text-xs text-slate-600">Section completion status</p>
                </div>
              </div>

              <div className="space-y-6">
                {groupedSectionStats.map(group => (
                  <div key={group.slug} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        {group.subject}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {group.sections.reduce((acc, { section }) => acc + (section.subject_end - section.subject_start + 1), 0)} questions
                      </span>
                    </div>
                    <div className="space-y-3">
                      {group.sections.map(({ section, stats }) => {
                        const sectionLength = section.subject_end - section.subject_start + 1;
                        const totalAdded = stats?.total_added ?? 0;
                        const remaining = Math.max(sectionLength - totalAdded, 0);
                        const progressPercentage = Math.min((totalAdded / sectionLength) * 100, 100);
                        const isComplete = progressPercentage >= 100;
                        const isCurrent = section.id === currentSection?.id;

                        return (
                          <div
                            key={section.id}
                            className={`p-4 rounded-xl border-2 transition-all ${isCurrent
                              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-lg'
                              : isComplete
                                ? 'bg-green-50 border-green-300'
                                : 'bg-slate-50 border-slate-200'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="text-sm font-bold text-slate-800">{section.name}</h5>
                                <p className="text-xs text-slate-600">
                                  Section {section.subject_section_index} • Q{section.subject_start}–{section.subject_end} • {section.question_type.toUpperCase()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">{totalAdded}/{sectionLength}</p>
                                <p className="text-xs text-slate-600">{progressPercentage.toFixed(0)}%</p>
                              </div>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                              <div
                                className={`h-3 rounded-full transition-all duration-700 ${isComplete
                                  ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
                                  : 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500'
                                  }`}
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-xs font-semibold ${isComplete ? 'text-green-600' : remaining <= 3 ? 'text-orange-600' : 'text-blue-600'
                                }`}>
                                {isComplete ? '✓ Complete!' : `${remaining} remaining`}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-amber-900">Pro Tips</h3>
              </div>
              <ul className="space-y-3 text-sm text-amber-900">
                <li className="flex items-start gap-3 p-2 bg-white/60 rounded-lg">
                  <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Use rich text for equations and formatting</span>
                </li>
                <li className="flex items-start gap-3 p-2 bg-white/60 rounded-lg">
                  <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Check the answer preview for accuracy</span>
                </li>
                <li className="flex items-start gap-3 p-2 bg-white/60 rounded-lg">
                  <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Provide detailed solutions for clarity</span>
                </li>
                <li className="flex items-start gap-3 p-2 bg-white/60 rounded-lg">
                  <Target className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Use AI assistant for quick text extraction</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* AI Chatbot Floating Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out border-l border-slate-200 ${isAiChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">AI Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Gemini Pro</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAiChatOpen(false);
                setAiPrompt('');
                setAiError(null);
                setAiSuccess(null);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Chat interface */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 italic text-slate-600 text-sm">
              "Describe the concept or nuance you want covered. I'll draft a {getQuestionTypeDisplayName(currentSection?.question_type || formData.question_type)} for you."
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Prompt</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiPrompt(e.target.value);
                    if (aiError) setAiError(null);
                    if (aiSuccess) setAiSuccess(null);
                  }}
                  placeholder="e.g., Create a challenging problem on friction involving inclined planes..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[120px] resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAIQuestion}
                disabled={aiGenerating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transform hover:scale-[1.02]"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing & Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Draft Question
                  </>
                )}
              </button>

              {aiError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
              {aiSuccess && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{aiSuccess}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Suggestions</h4>
              <div className="flex flex-wrap gap-2">
                {['Basic concept', 'Problem solving', 'Complex scenario', 'Theoretical'].map(sug => (
                  <button
                    key={sug}
                    onClick={() => setAiPrompt(prev => prev + (prev ? ' ' : '') + sug)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              Gemini Pro AI • Verify generated content
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop for Drawer */}
      {isAiChatOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[105] transition-opacity duration-300"
          onClick={() => setIsAiChatOpen(false)}
        />
      )}
    </div>
  );
}

const slugifySubject = (subject: string) =>
  subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'subject';
