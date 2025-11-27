/**
 * QuestionPreview Component
 * Display and edit extracted questions before import
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
} from 'lucide-react';

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
          <div className="text-sm text-gray-500">
            {questions.filter(q => q.requires_review).length} require review
          </div>
          {onNext && (
            <button
              onClick={onNext}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Mapping
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
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {getQuestionTypeLabel(question.question_type)}
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
                      <p className="text-sm text-gray-900 mb-2">
                        {question.question_text}
                      </p>
                      
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
                              {String.fromCharCode(65 + i)}. {option}
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
                          <span className="text-green-700">{question.correct_answer}</span>
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
                          <p className="text-sm text-gray-700">{question.solution}</p>
                        </div>
                      )}
                      {question.explanation && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Explanation:
                          </p>
                          <p className="text-sm text-gray-700">{question.explanation}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Difficulty: {question.difficulty}</span>
                        {question.suggested_subject && (
                          <span>Suggested: {question.suggested_subject}</span>
                        )}
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
