/**
 * QuestionPreview Component
 * Display and edit extracted questions before import
 * Focus on subject categorization with download capability
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../hooks/useApi';
import {
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  Download,
  FileText,
} from 'lucide-react';
import LaTeXRenderer, { hasLaTeX } from '../LaTeXRenderer';

interface ExtractedQuestion {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  solution: string;
  explanation: string;
  difficulty: string;
  confidence_score: number;
  requires_review: boolean;
  suggested_subject: string;
  suggested_section_id: number | null;
  assigned_subject: string;
  assigned_section_id: number | null;
}

interface QuestionPreviewProps {
  jobId: string;
  onQuestionsLoaded: (questions: ExtractedQuestion[]) => void;
  onSelectionChange: (selectedIds: number[]) => void;
  onNext?: () => void;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  jobId,
  onQuestionsLoaded,
  onSelectionChange,
  onNext,
}) => {
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtractedQuestion>>({});

  useEffect(() => {
    fetchQuestions();
  }, [jobId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/questions/extracted/${jobId}/`);
      const data = response.data.questions as ExtractedQuestion[];
      setQuestions(data);
      onQuestionsLoaded(data);
      
      // Select all by default
      const allIds = new Set(data.map(q => q.id));
      setSelectedIds(allIds);
      onSelectionChange(Array.from(allIds));
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Failed to load extracted questions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
      onSelectionChange([]);
    } else {
      const allIds = new Set(questions.map(q => q.id));
      setSelectedIds(allIds);
      onSelectionChange(Array.from(allIds));
    }
  };

  const startEdit = (question: ExtractedQuestion) => {
    setEditingId(question.id);
    setEditForm(question);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      await api.patch(`/questions/extracted-questions/${editingId}/`, editForm);
      
      // Update local state
      setQuestions(questions.map(q => 
        q.id === editingId ? { ...q, ...editForm } : q
      ));
      
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Failed to update question:', err);
      alert('Failed to update question');
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await api.delete(`/questions/extracted-questions/${id}/`);
      setQuestions(questions.filter(q => q.id !== id));
      
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
      onSelectionChange(Array.from(newSelected));
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question');
    }
  };

  const getQuestionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      single_mcq: 'Single Correct MCQ',
      multiple_mcq: 'Multiple Correct MCQ',
      numerical: 'Numerical',
      subjective: 'Subjective',
      true_false: 'True/False',
      fill_blank: 'Fill in the Blanks',
    };
    return labels[type] || type;
  };

  // Download questions for a specific subject
  const handleDownloadSubject = (subject: string, subjectQuestions: ExtractedQuestion[]) => {
    const content = generateSubjectContent(subject, subjectQuestions);
    downloadTextFile(`${subject}_Questions.txt`, content);
  };

  // Download all questions grouped by subject
  const handleDownloadAll = () => {
    const groupedBySubject = questions.reduce((acc, q) => {
      const subject = q.suggested_subject || q.assigned_subject || 'Uncategorized';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(q);
      return acc;
    }, {} as Record<string, ExtractedQuestion[]>);

    let content = '=' .repeat(60) + '\n';
    content += 'EXTRACTED QUESTIONS - ALL SUBJECTS\n';
    content += `Total Questions: ${questions.length}\n`;
    content += '=' .repeat(60) + '\n\n';

    for (const [subject, subjectQuestions] of Object.entries(groupedBySubject)) {
      content += generateSubjectContent(subject, subjectQuestions);
      content += '\n\n';
    }

    downloadTextFile('All_Questions_By_Subject.txt', content);
  };

  // Generate content for a subject
  const generateSubjectContent = (subject: string, subjectQuestions: ExtractedQuestion[]): string => {
    let content = '-'.repeat(60) + '\n';
    content += `SUBJECT: ${subject.toUpperCase()}\n`;
    content += `Total Questions: ${subjectQuestions.length}\n`;
    content += '-'.repeat(60) + '\n\n';

    subjectQuestions.forEach((q, index) => {
      content += `Q.${index + 1} ${q.question_text}\n`;
      
      // Add options if present
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, i) => {
          const optionLetter = String.fromCharCode(65 + i); // A, B, C, D...
          content += `   ${optionLetter}) ${opt}\n`;
        });
      }
      
      // Add answer
      if (q.correct_answer) {
        content += `   Answer: ${q.correct_answer}\n`;
      }
      
      // Add solution
      if (q.solution) {
        content += `   Solution: ${q.solution}\n`;
      }
      
      content += '\n';
    });

    return content;
  };

  // Helper to download text file
  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No questions were extracted from the file.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
          <div className="text-xs text-gray-600">Total Questions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {questions.filter(q => q.confidence_score >= 0.8).length}
          </div>
          <div className="text-xs text-gray-600">High Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {questions.filter(q => q.requires_review).length}
          </div>
          <div className="text-xs text-gray-600">Need Review</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{selectedIds.size}</div>
          <div className="text-xs text-gray-600">Selected</div>
        </div>
      </div>

      {/* Subject Distribution with Download - MAIN FOCUS */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-indigo-800">📚 Questions by Subject</h4>
          <button
            onClick={() => handleDownloadAll()}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Download size={16} />
            <span>Download All</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(
            questions.reduce((acc, q) => {
              const subject = q.suggested_subject || q.assigned_subject || 'Uncategorized';
              if (!acc[subject]) {
                acc[subject] = [];
              }
              acc[subject].push(q);
              return acc;
            }, {} as Record<string, ExtractedQuestion[]>)
          ).map(([subject, subjectQuestions]) => (
            <div
              key={subject}
              className="bg-white border border-indigo-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-indigo-100 bg-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-900">{subject}</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">{subjectQuestions.length}</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  {subjectQuestions.length} questions categorized under {subject}
                </p>
                <button
                  onClick={() => handleDownloadSubject(subject, subjectQuestions)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm"
                >
                  <Download size={14} />
                  <span>Download {subject} Questions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectedIds.size === questions.length}
            onChange={toggleSelectAll}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.size} of {questions.length} questions selected
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {onNext && (
            <button
              onClick={onNext}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Mapping →
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              question.requires_review
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Question Header */}
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(question.id)}
                  onChange={() => toggleSelection(question.id)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-500">
                        Q{index + 1}
                      </span>
                      {/* Subject Badge - Primary Focus */}
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                        {question.suggested_subject || question.assigned_subject || 'Uncategorized'}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getConfidenceColor(
                          question.confidence_score
                        )}`}
                      >
                        {(question.confidence_score * 100).toFixed(0)}% confidence
                      </span>
                      {question.requires_review && (
                        <span className="flex items-center text-xs text-yellow-700">
                          <AlertTriangle size={14} className="mr-1" />
                          Needs Review
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEdit(question)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === question.id ? null : question.id)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedId === question.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {editingId === question.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <textarea
                        value={editForm.question_text || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, question_text: e.target.value })
                        }
                        className="w-full p-2 border rounded text-sm"
                        rows={3}
                      />
                      {question.question_type.includes('mcq') && (
                        <div className="space-y-2">
                          {(editForm.options || question.options).map((opt, i) => (
                            <input
                              key={i}
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...(editForm.options || question.options)];
                                newOptions[i] = e.target.value;
                                setEditForm({ ...editForm, options: newOptions });
                              }}
                              className="w-full p-2 border rounded text-sm"
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="text-sm text-gray-900 mb-2">
                        <LaTeXRenderer content={question.question_text} />
                      </div>
                      
                      {question.question_type.includes('mcq') && (
                        <div className="space-y-1 mt-2">
                          {question.options.map((option, i) => (
                            <div
                              key={i}
                              className={`text-sm p-2 rounded ${
                                option === question.correct_answer
                                  ? 'bg-green-100 text-green-900 font-medium'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}. <LaTeXRenderer content={option} />
                              {option === question.correct_answer && (
                                <CheckCircle
                                  size={14}
                                  className="inline ml-2 text-green-600"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.question_type === 'numerical' && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Answer:</span>{' '}
                          <span className="text-green-700">
                            <LaTeXRenderer content={question.correct_answer} />
                          </span>
                        </div>
                      )}
                      
                      {question.question_type === 'true_false' && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Answer:</span>{' '}
                          <span className={question.correct_answer.toLowerCase() === 'true' ? 'text-green-700' : 'text-red-700'}>
                            {question.correct_answer}
                          </span>
                        </div>
                      )}
                      
                      {question.question_type === 'fill_blank' && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Answer:</span>{' '}
                          <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            <LaTeXRenderer content={question.correct_answer} />
                          </span>
                        </div>
                      )}
                      
                      {question.question_type === 'subjective' && question.correct_answer && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Expected Answer:</span>
                          <p className="text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                            <LaTeXRenderer content={question.correct_answer} />
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedId === question.id && editingId !== question.id && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {question.solution && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Solution:
                          </p>
                          <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                            <LaTeXRenderer content={question.solution} />
                          </div>
                        </div>
                      )}
                      {question.explanation && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Explanation:
                          </p>
                          <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                            <LaTeXRenderer content={question.explanation} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          Difficulty: <span className="font-medium capitalize">{question.difficulty}</span>
                        </span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                          Subject: {question.suggested_subject || question.assigned_subject || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionPreview;
