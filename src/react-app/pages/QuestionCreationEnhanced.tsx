import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
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
  Loader2
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
  });
  // Track which question numbers already exist in current section
  const [existingNumbers, setExistingNumbers] = useState<Set<number>>(new Set());
  const [existingNumbersBySection, setExistingNumbersBySection] = useState<Record<number, Set<number>>>({});
  const [existingQuestionsBySection, setExistingQuestionsBySection] = useState<Record<number, Map<number, QuestionData>>>({});
  const [sectionAbsoluteRanges, setSectionAbsoluteRanges] = useState<Record<number, { start: number; end: number; length: number }>>({});

  const computeAbsoluteQuestionNumber = useCallback(
    (section: SubjectSection | null, subjectQuestionNumber: number) => {
      if (!section) {
        return subjectQuestionNumber;
      }
      const sectionMap = existingQuestionsBySection[section.id];
      const existingQuestion = sectionMap?.get(subjectQuestionNumber);
      const existingAbsolute = existingQuestion?.question_number;
      if (existingAbsolute !== undefined && existingAbsolute !== null && Number.isFinite(Number(existingAbsolute))) {
        return Number(existingAbsolute);
      }

      const range = sectionAbsoluteRanges[section.id];
      const baseStart = range ? range.start : section.start_question;
      const maxOffset = range ? range.length - 1 : section.subject_end - section.subject_start;
      const relativeOffset = subjectQuestionNumber - section.subject_start;
      const clampedOffset = Math.max(0, Math.min(maxOffset, relativeOffset));
      return baseStart + clampedOffset;
    },
    [existingQuestionsBySection, sectionAbsoluteRanges]
  );

  const buildNumbersSetForSection = useCallback((section: SubjectSection, results: QuestionData[]) => {
    const nums = new Set<number>();
    const range = sectionAbsoluteRanges[section.id];
    const questionMap = new Map<number, QuestionData>();

    results.forEach((q) => {
      const subjectLocalRaw =
        q.question_number_in_pattern !== undefined && q.question_number_in_pattern !== null
          ? Number(q.question_number_in_pattern)
          : null;

      if (subjectLocalRaw !== null && Number.isFinite(subjectLocalRaw)) {
        nums.add(subjectLocalRaw);
        questionMap.set(subjectLocalRaw, q);
        return;
      }

      const absoluteRaw =
        q.question_number !== undefined && q.question_number !== null
          ? Number(q.question_number)
          : null;

      if (
        range &&
        absoluteRaw !== null &&
        Number.isFinite(absoluteRaw) &&
        absoluteRaw >= range.start &&
        absoluteRaw <= range.end
      ) {
        const adjusted = section.subject_start + (absoluteRaw - range.start);
        if (adjusted >= section.subject_start && adjusted <= section.subject_end) {
        nums.add(adjusted);
          questionMap.set(adjusted, q);
      }
      }
    });

    return { numbers: nums, map: questionMap };
  }, [sectionAbsoluteRanges]);

  const loadSectionNumbers = useCallback(
    async (section: SubjectSection, updateCurrent = false) => {
      try {
        const res = await api.get(
          `/questions/questions/?pattern_section=${section.id}${
            examIdFromQuery ? `&exam=${examIdFromQuery}` : ''
          }`,
        );
        const payload = res.data as { results?: QuestionData[] } | QuestionData[] | undefined;
        const resultsArray: QuestionData[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
            ? payload?.results ?? []
            : [];
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
    [examIdFromQuery, buildNumbersSetForSection],
  );

  const fetchSectionStats = useCallback(async (patternData: Pattern) => {
    try {
    const stats: SectionStats[] = [];
    
    const queryExam = examIdFromQuery ? `&exam=${examIdFromQuery}` : '';

    for (const section of patternData.sections) {
      const totalNeeded = section.end_question - section.start_question + 1;
      
      // Fetch questions for this section
      const response = await api.get(`/questions/questions/?pattern_section=${section.id}${queryExam}`);
      const totalAdded = response.data?.results?.length || response.data?.length || 0;
      
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
      const response = await api.get(`/patterns/patterns/${id}/`);
      const patternData = response.data;
      setExistingNumbers(new Set());
      setExistingNumbersBySection({});
      setPattern(patternData);
      const groups = buildSubjectGroups(patternData);
      setSubjectGroups(groups);
      const ranges = computeSectionAbsoluteRanges(patternData);
      setSectionAbsoluteRanges(ranges);
      await fetchSectionStats(patternData);
    } catch (err) {
      console.error('Failed to fetch pattern:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchSectionStats, buildSubjectGroups, computeSectionAbsoluteRanges]);

  const absoluteQuestionNumber = useMemo(
    () => computeAbsoluteQuestionNumber(currentSection, currentQuestionNumber),
    [computeAbsoluteQuestionNumber, currentSection, currentQuestionNumber]
  );

  const { data: existingQuestion, refetch: refetchQuestion, loading: questionLoading } = useApi<{
    results?: QuestionData[];
  } | QuestionData[]>(
    patternId && currentSection
      ? `/questions/questions/?pattern_section=${currentSection.id}&question_number=${absoluteQuestionNumber}${
          examIdFromQuery ? `&exam=${examIdFromQuery}` : ''
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
    if (!currentSubjectGroup) return;

    currentSubjectGroup.sections.forEach((section) => {
      if (!existingNumbersBySection[section.id]) {
        loadSectionNumbers(section, section.id === currentSection?.id);
      }
    });
  }, [currentSubjectGroup, existingNumbersBySection, loadSectionNumbers, currentSection?.id]);

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
      setFormData({
        question_text: mappedExisting.question_text || '',
        question_type: mappedExisting.question_type || 'mcq',
        difficulty: (mappedExisting.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        options: mappedExisting.options || ['', '', '', ''],
        correct_answer: mappedExisting.correct_answer || '',
        solution: mappedExisting.solution || '',
        explanation: mappedExisting.explanation || '',
        marks: mappedExisting.marks || 1,
        negative_marks: mappedExisting.negative_marks || 1,
        subject: mappedExisting.subject || '',
        topic: mappedExisting.topic || '',
        pattern_section: mappedExisting.pattern_section,
      });
      return;
    }

    console.log('Loading question data from API response:', { existingQuestion, currentSection, currentQuestionNumber });
    
    if (existingQuestion && 'results' in existingQuestion && existingQuestion.results && existingQuestion.results.length > 0) {
      const question = existingQuestion.results[0] as QuestionData;
      console.log('Loading existing question from results:', question);
      setFormData({
        question_text: question.question_text || '',
        question_type: question.question_type || 'mcq',
        difficulty: (question.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        options: question.options || ['', '', '', ''],
        correct_answer: question.correct_answer || '',
        solution: question.solution || '',
        explanation: question.explanation || '',
        marks: question.marks || 1,
        negative_marks: question.negative_marks || 1,
        subject: question.subject || '',
        topic: question.topic || '',
        pattern_section: question.pattern_section,
      });
    } else if (existingQuestion && Array.isArray(existingQuestion) && existingQuestion.length > 0) {
      const question = existingQuestion[0] as QuestionData;
      console.log('Loading existing question from array:', question);
      setFormData({
        question_text: question.question_text || '',
        question_type: question.question_type || 'mcq',
        difficulty: (question.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        options: question.options || ['', '', '', ''],
        correct_answer: question.correct_answer || '',
        solution: question.solution || '',
        explanation: question.explanation || '',
        marks: question.marks || 1,
        negative_marks: question.negative_marks || 1,
        subject: question.subject || '',
        topic: question.topic || '',
        pattern_section: question.pattern_section,
      });
    } else {
      // No existing question found - reset form to defaults for new question
      console.log('No existing question found, resetting form');
      if (currentSection) {
        setFormData({
          question_text: '',
          question_type: currentSection.question_type,
          difficulty: 'medium',
          options: ['', '', '', ''],
          correct_answer: '',
          solution: '',
          explanation: '',
          marks: currentSection.marks_per_question,
          negative_marks: currentSection.negative_marking,
          subject: currentSection.subject,
          topic: '',
          pattern_section: currentSection.id,
        });
      }
    }
  }, [existingQuestion, currentSection, currentQuestionNumber, existingQuestionsBySection]);

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
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700">
                <strong>Note:</strong> Subjective questions require manual grading and have no negative marking.
              </p>
            </div>
          </div>
        </div>
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

  const handleInputChange = (field: keyof QuestionFormData, value: string | number | string[]) => {
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
    if (!formData.question_text.trim()) {
      setSaveStatus('error');
      return;
    }

    // Validate correct_answer for true/false questions
    if (formData.question_type === 'true_false' && !formData.correct_answer) {
      alert('Please select the correct answer (True or False)');
      setSaveStatus('error');
      return;
    }

    // Validate correct_answer for fill_blank questions
    if (formData.question_type === 'fill_blank' && !formData.correct_answer.trim()) {
      alert('Please enter the correct answer(s) for fill in the blank');
      setSaveStatus('error');
      return;
    }

    // Validate correct_answer for single/mcq questions
    if ((formData.question_type === 'single_mcq' || formData.question_type === 'mcq') && !formData.correct_answer.trim()) {
      alert('Please choose the correct option for this question.');
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
      const dataToSave = {
        ...formData,
        options:
          formData.question_type === 'single_mcq' ||
          formData.question_type === 'multiple_mcq' ||
          formData.question_type === 'mcq'
            ? formData.options.filter(opt => opt.trim())
            : [],
        question_number: absoluteQuestionNumberForSave,
        question_number_in_pattern: currentQuestionNumber,
        pattern_section_id: patternSectionId,
        pattern_section_name: patternSectionName,
        exam: examIdFromQuery,
        institute: user?.institute?.id || user?.institute_id,
      };

      // Check if we have an existing question to update
      const sectionMap = currentSection ? existingQuestionsBySection[currentSection.id] : undefined;
      const mappedExisting = sectionMap?.get(currentQuestionNumber) ?? null;

      let questionToUpdate: QuestionData | null = null;

      if (mappedExisting) {
        questionToUpdate = mappedExisting;
      } else if (existingQuestion) {
        if ('results' in existingQuestion && existingQuestion.results && existingQuestion.results.length > 0) {
          questionToUpdate = existingQuestion.results[0] as QuestionData;
        } else if (Array.isArray(existingQuestion) && existingQuestion.length > 0) {
          questionToUpdate = existingQuestion[0] as QuestionData;
        }
      }
      
      console.log('Save operation:', { 
        mappedExisting,
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
      
      if (pattern) {
        await fetchSectionStats(pattern);
      }
      if (currentSection) {
        await loadSectionNumbers(currentSection, true);
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

  const navigateToQuestion = (subjectSlug: string, newQuestionNumber: number) => {
    if (!patternId) return;
    const group = subjectGroups.find(g => g.slug === subjectSlug);
    if (!group) return;

    const clamped = Math.min(Math.max(newQuestionNumber, 1), group.total_questions || 1);
    const querySuffix = examIdFromQuery ? `?examId=${examIdFromQuery}` : '';
    navigate(`/pattern/${patternId}/question/${subjectSlug}/${clamped}${querySuffix}`);
  };

  const handleSubjectChange = (subjectSlug: string) => {
    if (!patternId) return;
    const group = subjectGroups.find(g => g.slug === subjectSlug);
    if (!group) return;
    const desiredNumber = currentQuestionNumber <= group.total_questions ? currentQuestionNumber : 1;
    const querySuffix = examIdFromQuery ? `?examId=${examIdFromQuery}` : '';
    navigate(`/pattern/${patternId}/question/${subjectSlug}/${Math.max(1, desiredNumber)}${querySuffix}`);
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

  if (questionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading question data...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/patterns/${patternId}`)}
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
              
              <div className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
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

            {/* Right Side - Save Status */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetchQuestion()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all hover:scale-110"
                title="Refresh question data"
              >
                <RefreshCw className="w-4 h-4 text-slate-700" />
              </button>
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">Saved!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm font-medium">Error</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
              <div className="space-y-6">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                        <Sparkles className="w-4 h-4" />
                        AI Question Assistant
                      </h3>
                      <p className="mt-1 text-xs text-blue-700">
                        Describe the concept or nuance you want covered. We&apos;ll draft a {getQuestionTypeDisplayName(currentSection?.question_type || formData.question_type)} using Google Gemini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAIQuestion}
                      disabled={aiGenerating}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Question
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => {
                      setAiPrompt(e.target.value);
                      if (aiError) setAiError(null);
                      if (aiSuccess) setAiSuccess(null);
                    }}
                    placeholder="e.g., Create a challenging problem on friction involving inclined planes with real-world context."
                    className="mt-4 w-full rounded-xl border border-blue-200 bg-white/80 px-4 py-3 text-sm text-blue-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows={3}
                  />
                  {aiError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-600 flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}
                  {aiSuccess && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs text-emerald-700 flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{aiSuccess}</span>
                    </div>
                  )}
                  <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-blue-500">
                    Powered by Google Gemini · Review the generated content before publishing.
                  </p>
                </div>

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
                {formData.question_type !== 'true_false' && formData.question_type !== 'fill_blank' && (
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Correct Answer *
                  </label>
                  {(formData.question_type === 'single_mcq' || formData.question_type === 'mcq') ? (
                    <select
                      value={
                        formData.correct_answer
                          ? String(
                              formData.options.findIndex(
                                (opt) =>
                                  normalizeOptionValue(opt) ===
                                  normalizeOptionValue(formData.correct_answer),
                              ),
                            )
                          : ''
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
                        if (!option.trim()) return null;
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
                        {formData.options.filter(o => o.trim()).map((option, index) => {
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
                                {String.fromCharCode(65 + index)}: {option.replace(/<[^>]*>/g, '').substring(0, 30)}...
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
                      type={formData.question_type === 'numerical' ? 'number' : 'text'}
                      value={formData.correct_answer}
                      onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                      step={formData.question_type === 'numerical' ? '0.01' : undefined}
                      className="w-full px-4 py-3.5 border-2 border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-green-50 font-medium"
                      placeholder={
                        formData.question_type === 'numerical' ? 'e.g., 3.14, 42, 2.45' :
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
                                className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
                                  isActive
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
                                className={`rounded-xl border transition-all p-4 ${
                                  isCurrentSection
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
                                        className={`h-10 rounded-lg border text-sm font-semibold transition-all ${
                                          isCurrent
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                        } ${
                                          isExisting ? 'ring-2 ring-emerald-300' : ''
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
                <AIImageToText />
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
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isCurrent
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
                                className={`h-3 rounded-full transition-all duration-700 ${
                                  isComplete
                                    ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
                                    : 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-xs font-semibold ${
                                isComplete ? 'text-green-600' : remaining <= 3 ? 'text-orange-600' : 'text-blue-600'
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
    </div>
  );
}

const slugifySubject = (subject: string) =>
  subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'subject';