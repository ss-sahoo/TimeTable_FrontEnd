import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import { useApi, api } from '@/react-app/hooks/useApi';
import { Exam, ExamSubject, Question, CreateQuestion } from '@/shared/types';
import RichTextEditor from '@/react-app/components/RichTextEditor';
import AIImageToText from '@/react-app/components/AIImageToText';

export default function EnhancedQuestionEditor() {
  const { examId, questionNumber } = useParams<{ examId: string; questionNumber: string }>();
  const navigate = useNavigate();
  const currentQuestionNumber = parseInt(questionNumber || '1');

  const [formData, setFormData] = useState<CreateQuestion>({
    subject: '',
    question_number: currentQuestionNumber,
    section_name: '',
    question_type: 'Single Correct MCQ',
    text: '',
    options: ['', '', '', ''],
    correct_option: '',
    solution: '',
  });

  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: exam } = useApi<Exam>(`/api/exams/${examId}`);
  const { data: subjects } = useApi<ExamSubject[]>(`/api/exams/${examId}/subjects`);
  const { data: existingQuestion, refetch: refetchQuestion } = useApi<Question>(`/api/questions/${currentQuestionNumber}?exam_id=${examId}`);

  // Initialize form when question data loads
  useEffect(() => {
    if (existingQuestion) {
      setFormData({
        subject: existingQuestion.subject,
        question_number: existingQuestion.question_number,
        section_name: existingQuestion.section_name,
        question_type: existingQuestion.question_type,
        text: existingQuestion.text,
        options: existingQuestion.options ? (Array.isArray(existingQuestion.options) ? existingQuestion.options : JSON.parse(existingQuestion.options)) : ['', '', '', ''],
        correct_option: existingQuestion.correct_option || '',
        solution: existingQuestion.solution || '',
      });
      
      if (existingQuestion.options) {
        const parsedOptions = Array.isArray(existingQuestion.options) 
          ? existingQuestion.options 
          : JSON.parse(existingQuestion.options);
        setOptions(parsedOptions);
      }
    } else {
      // Set default subject and section based on question number
      if (subjects && subjects.length > 0) {
        const defaultSubject = subjects.find(s => 
          currentQuestionNumber >= s.start_question && currentQuestionNumber <= s.end_question
        ) || subjects[0];
        
        // Determine section based on question number ranges
        let sectionName = 'Part A';
        let questionType: CreateQuestion['question_type'] = 'Single Correct MCQ';
        
        // This is a simplified logic - in real app, you'd get this from sections data
        if (currentQuestionNumber <= 30) {
          sectionName = 'Part A';
          questionType = 'Single Correct MCQ';
        } else if (currentQuestionNumber <= 60) {
          sectionName = 'Part B';
          questionType = 'Numerical';
        } else {
          sectionName = 'Part C';
          questionType = 'Subjective';
        }
        
        setFormData(prev => ({
          ...prev,
          subject: defaultSubject.name,
          question_number: currentQuestionNumber,
          section_name: sectionName,
          question_type: questionType,
        }));
      }
    }
  }, [existingQuestion, subjects, currentQuestionNumber]);

  const handleInputChange = (field: keyof CreateQuestion, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const addOption = () => {
    setOptions(prev => [...prev, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    handleInputChange('options', newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      handleInputChange('options', newOptions);
    }
  };

  const handleSave = async () => {
    if (!formData.text.trim()) {
      setSaveStatus('error');
      return;
    }

    setLoading(true);
    setSaveStatus('saving');

    try {
      const dataToSave = {
        ...formData,
        options: formData.question_type === 'Single Correct MCQ' ? options.filter(opt => opt.trim()) : undefined,
      };

      if (existingQuestion) {
        await api.put(`/api/questions/${existingQuestion.id}`, dataToSave);
      } else {
        await api.post(`/api/exams/${examId}/questions`, dataToSave);
      }

      setSaveStatus('saved');
      refetchQuestion();
      
      // Clear saved status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const navigateToQuestion = (newQuestionNumber: number) => {
    navigate(`/exam/${examId}/question/${newQuestionNumber}`);
  };

  const getQuestionBounds = () => {
    if (!subjects) return { min: 1, max: 100 };
    
    const currentSubject = subjects.find(s => 
      currentQuestionNumber >= s.start_question && currentQuestionNumber <= s.end_question
    );
    
    if (currentSubject) {
      return { min: currentSubject.start_question, max: currentSubject.end_question };
    }
    
    return { min: 1, max: Math.max(...subjects.map(s => s.end_question)) };
  };

  const getSectionInfo = (questionNum: number) => {
    if (questionNum <= 30) {
      return { name: 'Part A', type: 'Single Correct MCQ', color: 'bg-green-100 text-green-700' };
    } else if (questionNum <= 60) {
      return { name: 'Part B', type: 'Numerical', color: 'bg-blue-100 text-blue-700' };
    } else {
      return { name: 'Part C', type: 'Subjective', color: 'bg-purple-100 text-purple-700' };
    }
  };

  const currentSection = getSectionInfo(currentQuestionNumber);
  const { min, max } = getQuestionBounds();

  if (!exam || !subjects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading question editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/exam/${examId}`)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {exam.title} &gt; {formData.subject}
                </h1>
                <p className="text-slate-600">Question Editor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateToQuestion(Math.max(min, currentQuestionNumber - 1))}
                disabled={currentQuestionNumber <= min}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg font-medium text-sm ${currentSection.color}`}>
                  {currentSection.name}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-lg">
                  {currentQuestionNumber}
                </span>
              </div>
              
              <button
                onClick={() => navigateToQuestion(Math.min(max, currentQuestionNumber + 1))}
                disabled={currentQuestionNumber >= max}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              {/* Question Header */}
              <div className="mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Question {currentQuestionNumber}
                  </h2>
                  <div className="text-sm text-slate-600">
                    {currentSection.name} - {currentSection.type}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name} ({subject.start_question}-{subject.end_question})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Section
                    </label>
                    <input
                      type="text"
                      value={formData.section_name}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="space-y-6">
                {/* Question Text */}
                <RichTextEditor
                  label="Question Text *"
                  value={formData.text}
                  onChange={(value) => handleInputChange('text', value)}
                  placeholder="Enter your question here..."
                />

                {/* Options (for MCQ) */}
                {formData.question_type === 'Single Correct MCQ' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Options
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 mt-1 flex-shrink-0">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <div className="flex-1">
                            <RichTextEditor
                              value={option}
                              onChange={(value) => updateOption(index, value)}
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors mt-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={formData.correct_option}
                    onChange={(e) => handleInputChange('correct_option', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      formData.question_type === 'Single Correct MCQ' 
                        ? "e.g., A, B, C, D" 
                        : formData.question_type === 'Numerical'
                        ? "e.g., 42, 3.14"
                        : "Enter the correct answer or key points"
                    }
                  />
                </div>

                {/* Solution */}
                <RichTextEditor
                  label="Solution/Explanation"
                  value={formData.solution || ''}
                  onChange={(value) => handleInputChange('solution', value)}
                  placeholder="Provide a detailed solution or explanation..."
                />

                {/* Save Button */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saved' && (
                      <span className="text-green-600 text-sm">✓ Question saved successfully</span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-red-600 text-sm">Please fill in the question text</span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : saveStatus === 'saving' ? 'Saving...' : 'Save Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="lg:col-span-1">
            <AIImageToText />
          </div>
        </div>
      </div>
    </div>
  );
}
