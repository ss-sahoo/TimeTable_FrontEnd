import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
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
  RefreshCw
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

export default function EnhancedQuestionEditor() {
  const { patternId, questionNumber } = useParams<{ patternId: string; questionNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const currentQuestionNumber = parseInt(questionNumber || '1');

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [currentSection, setCurrentSection] = useState<PatternSection | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  const fetchSectionStats = useCallback(async (patternData: Pattern) => {
    try {
      const stats: SectionStats[] = [];
      
      for (const section of patternData.sections) {
        const totalNeeded = section.end_question - section.start_question + 1;
        
        // Fetch questions for this section
        const response = await api.get(`/questions/questions/?pattern_section=${section.id}`);
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
          progress_percentage: (totalAdded / totalNeeded) * 100,
        });
      }
      
      setSectionStats(stats);
    } catch (err) {
      console.error('Failed to fetch section stats:', err);
    }
  }, []);

  const fetchPattern = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/patterns/patterns/${id}/`);
      setPattern(response.data);
      await fetchSectionStats(response.data);
    } catch (err) {
      console.error('Failed to fetch pattern:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchSectionStats]);

  const { data: existingQuestion, refetch: refetchQuestion, loading: questionLoading } = useApi<{
    results?: QuestionData[];
  } | QuestionData[]>(
    patternId && currentSection ? `/questions/questions/?pattern_section=${currentSection.id}&question_number=${currentQuestionNumber}` : ''
  );

  useEffect(() => {
    if (patternId) {
      fetchPattern(patternId);
    }
  }, [patternId, fetchPattern]);

  useEffect(() => {
    if (pattern && currentQuestionNumber) {
      // Find which section this question belongs to
      const section = pattern.sections.find(
        s => currentQuestionNumber >= s.start_question && currentQuestionNumber <= s.end_question
      );
      if (section) {
        setCurrentSection(section);
        setFormData(prev => ({
          ...prev,
          question_type: section.question_type,
          marks: section.marks_per_question,
          negative_marks: section.negative_marking,
          subject: section.subject,
          pattern_section: section.id,
        }));

        // Load existing questions for navigator
        (async () => {
          try {
            const res = await api.get(`/questions/questions/?pattern_section=${section.id}`);
            const results = res.data?.results || res.data || [];
            const nums = new Set<number>();
            for (const q of results) {
              if (q.question_number_in_pattern) nums.add(Number(q.question_number_in_pattern));
            }
            setExistingNumbers(nums);
          } catch (e) {
            console.error('Failed to load existing numbers', e);
            setExistingNumbers(new Set());
          }
        })();
      }
    }
  }, [pattern, currentQuestionNumber]);

  // Load existing question data when found, or reset form for new questions
  useEffect(() => {
    console.log('Loading question data:', { existingQuestion, currentSection, currentQuestionNumber });
    
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
  }, [existingQuestion, currentSection, currentQuestionNumber]);

  // Refresh existing numbers when current question number changes
  useEffect(() => {
    if (currentSection) {
      (async () => {
        try {
          const res = await api.get(`/questions/questions/?pattern_section=${currentSection.id}`);
          const results = res.data?.results || res.data || [];
          const nums = new Set<number>();
          for (const q of results) {
            if (q.question_number_in_pattern) nums.add(Number(q.question_number_in_pattern));
          }
          setExistingNumbers(nums);
        } catch (e) {
          console.error('Failed to load existing numbers', e);
          setExistingNumbers(new Set());
        }
      })();
    }
  }, [currentQuestionNumber, currentSection]);

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

    if (!user?.institute?.id && !user?.institute_id) {
      console.error('No institute found for user:', user);
      setSaveStatus('error');
      return;
    }

    setLoading(true);
    setSaveStatus('saving');

    try {
      const dataToSave = {
        ...formData,
        options: (formData.question_type === 'single_mcq' || formData.question_type === 'multiple_mcq' || formData.question_type === 'mcq') ? formData.options.filter(opt => opt.trim()) : [],
        question_number_in_pattern: currentQuestionNumber,
        institute: user?.institute?.id || user?.institute_id,
      };

      // Check if we have an existing question to update
      const hasExistingQuestion = existingQuestion && (
        ('results' in existingQuestion && existingQuestion.results && existingQuestion.results.length > 0) ||
        (Array.isArray(existingQuestion) && existingQuestion.length > 0)
      );
      
      console.log('Save operation:', { 
        hasExistingQuestion, 
        existingQuestion, 
        dataToSave, 
        userInstitute: user?.institute?.id || user?.institute_id,
        userObject: user 
      });
      
      if (hasExistingQuestion) {
        // Update existing question
        const question = ('results' in existingQuestion && existingQuestion.results) ? existingQuestion.results[0] as QuestionData : (Array.isArray(existingQuestion) ? existingQuestion[0] as QuestionData : null);
        if (question) {
          console.log('Updating existing question:', question.id, dataToSave);
          await api.put(`/questions/questions/${question.id}/`, dataToSave);
        }
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
      // Refresh numbers list
      if (currentSection) {
        const res = await api.get(`/questions/questions/?pattern_section=${currentSection.id}`);
        const results = res.data?.results || res.data || [];
        const nums = new Set<number>();
        for (const q of results) {
          if (q.question_number_in_pattern) nums.add(Number(q.question_number_in_pattern));
        }
        setExistingNumbers(nums);
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

  const navigateToQuestion = (newQuestionNumber: number) => {
    if (pattern) {
      const minQ = Math.min(...pattern.sections.map(s => s.start_question));
      const maxQ = Math.max(...pattern.sections.map(s => s.end_question));
      
      if (newQuestionNumber >= minQ && newQuestionNumber <= maxQ) {
        navigate(`/pattern/${patternId}/question/${newQuestionNumber}`);
      }
    }
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
        const correctIndex = formData.options.findIndex(opt => opt.trim() === correct_answer.trim());
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
        const selectedAnswers = correct_answer ? correct_answer.split('|') : [];
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
                    const optionIndex = formData.options.findIndex(opt => opt.trim() === answer.trim());
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
  const sectionInfo = getSectionInfo(currentQuestionNumber);

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
                onClick={() => navigateToQuestion(currentQuestionNumber - 1)}
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
                onClick={() => navigateToQuestion(currentQuestionNumber + 1)}
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
                      value={formData.correct_answer}
                      onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                      className="w-full px-4 py-3.5 border-2 border-green-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-green-50 font-medium"
                    >
                      <option value="">Select correct option...</option>
                      {formData.options.filter(o => o.trim()).map((option, index) => (
                        <option key={index} value={option}>
                          {String.fromCharCode(65 + index)}: {option.replace(/<[^>]*>/g, '').substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  ) : formData.question_type === 'multiple_mcq' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-purple-700 font-medium">Select all correct options:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {formData.options.filter(o => o.trim()).map((option, index) => (
                          <label key={index} className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.correct_answer.includes(option)}
                              onChange={(e) => {
                                const currentAnswers = formData.correct_answer ? formData.correct_answer.split('|') : [];
                                if (e.target.checked) {
                                  currentAnswers.push(option);
                                } else {
                                  const index = currentAnswers.indexOf(option);
                                  if (index > -1) currentAnswers.splice(index, 1);
                                }
                                handleInputChange('correct_answer', currentAnswers.join('|'));
                              }}
                              className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-purple-800">
                              {String.fromCharCode(65 + index)}: {option.replace(/<[^>]*>/g, '').substring(0, 30)}...
                            </span>
                          </label>
                        ))}
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
                    {currentSection && (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900">Question Numbers</h3>
                            <p className="text-xs text-slate-600">Click a number to jump</p>
                          </div>
                          <div className="text-xs text-slate-500">
                            Q{currentSection.start_question}–{currentSection.end_question}
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: currentSection.end_question - currentSection.start_question + 1 }).map((_, idx) => {
                            const num = currentSection.start_question + idx;
                            const isCurrent = num === currentQuestionNumber;
                            const isExisting = existingNumbers.has(num);
                            return (
                              <button
                                key={num}
                                onClick={() => navigateToQuestion(num)}
                                className={`h-10 rounded-lg border text-sm font-semibold transition-all
                                  ${isCurrent ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}
                                  ${isExisting ? 'ring-2 ring-emerald-300' : ''}
                                `}
                                title={isExisting ? 'Already added' : 'Empty'}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
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

              <div className="space-y-4">
                {sectionStats.map((stat) => {
                  const isComplete = stat.progress_percentage >= 100;
                  const isCurrent = stat.section_id === currentSection?.id;
                  
                  return (
                    <div
                      key={stat.section_id}
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
                          <h4 className="text-sm font-bold text-slate-800">{stat.section_name}</h4>
                          <p className="text-xs text-slate-600">{stat.subject} • {stat.question_type.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">{stat.total_added}/{stat.total_needed}</p>
                          <p className="text-xs text-slate-600">{stat.progress_percentage.toFixed(0)}%</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${
                            isComplete
                              ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
                              : 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(stat.progress_percentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs font-semibold ${
                          isComplete ? 'text-green-600' : stat.remaining <= 3 ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                          {isComplete ? '✓ Complete!' : `${stat.remaining} remaining`}
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