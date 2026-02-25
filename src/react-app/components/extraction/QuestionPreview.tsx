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
  Settings,
  X,
} from 'lucide-react';
import LaTeXRenderer from '../LaTeXRenderer';

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
  structure?: any;
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
  const [structureEditingId, setStructureEditingId] = useState<number | null>(null);
  const [structureForm, setStructureForm] = useState<any>(null);

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

  const startStructureEdit = (question: ExtractedQuestion) => {
    setStructureEditingId(question.id);
    setStructureForm(question.structure || { nested_parts: [] });
  };

  const saveStructure = async () => {
    if (!structureEditingId) return;

    try {
      await api.patch(`/questions/extracted-questions/${structureEditingId}/`, {
        structure: structureForm
      });

      setQuestions(questions.map(q =>
        q.id === structureEditingId ? { ...q, structure: structureForm } : q
      ));

      setStructureEditingId(null);
      setStructureForm(null);
    } catch (err) {
      console.error('Failed to update structure:', err);
      alert('Failed to update structure');
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

  // Recursive helper to render nested parts
  const renderNestedParts = (parts: any[], containerClass: string = '') => {
    if (!parts || parts.length === 0) return null;

    return (
      <div className={containerClass}>
        <div className="space-y-3">
          {parts.map((item: any, idx: number) => (
            <div key={idx} className="relative">
              {item.type === 'choice_group' ? (
                <div className="border-l-4 border-amber-300 pl-4 py-1 space-y-3">
                  <div className="flex items-center space-x-2 -ml-6 mb-1">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-amber-200 uppercase tracking-wider">Choice (OR)</span>
                  </div>
                  {(item.options || []).map((option: any, oIdx: number) => (
                    <React.Fragment key={oIdx}>
                      <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-50 shadow-sm">
                        <div className="flex items-start space-x-2">
                          {option.label && <span className="font-bold text-amber-800 text-xs min-w-[15px]">{option.label}.</span>}
                          <div className="flex-1">
                            <LaTeXRenderer content={option.question_text || option.text || ''} />
                            {option.marks && <span className="text-[9px] font-bold text-amber-600 ml-2 uppercase">[{option.marks}m]</span>}
                            {(option.sub_parts || option.parts) && renderNestedParts(option.sub_parts || option.parts, 'ml-4 mt-2')}
                          </div>
                        </div>
                      </div>
                      {oIdx < item.options.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <span className="px-2 text-[9px] font-black text-amber-300 uppercase tracking-widest">OR</span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="flex items-start space-x-2">
                  <span className="text-gray-700 font-bold text-xs min-w-[20px]">{item.label || (idx + 1)}.</span>
                  <div className="flex-1">
                    <div className="text-gray-700 text-sm leading-relaxed">
                      <LaTeXRenderer content={item.question_text || item.text || ''} />
                      {item.marks && <span className="text-[9px] font-bold text-blue-500 ml-1 uppercase">({item.marks}m)</span>}
                    </div>
                    {(item.sub_parts || item.parts) && renderNestedParts(item.sub_parts || item.parts, 'mt-2 ml-4')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleDownloadAll = () => {
    const groupedBySubject = questions.reduce((acc, q) => {
      const subject = q.suggested_subject || q.assigned_subject || 'Uncategorized';
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(q);
      return acc;
    }, {} as Record<string, ExtractedQuestion[]>);

    let content = '=== EXTRACTED QUESTIONS ===\n\n';
    for (const [subject, subjectQuestions] of Object.entries(groupedBySubject)) {
      content += `SUBJECT: ${subject}\n${'-'.repeat(subject.length + 9)}\n`;
      subjectQuestions.forEach((q, i) => {
        content += `${i + 1}. ${q.question_text}\n`;
        if (q.options?.length) q.options.forEach((opt, j) => content += `   ${String.fromCharCode(65 + j)}) ${opt}\n`);
        content += `   Ans: ${q.correct_answer}\n\n`;
      });
      content += '\n';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_questions.txt';
    a.click();
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Subject Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-500">Total Questions</div>
          <div className="text-2xl font-bold text-indigo-600">{questions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-sm text-gray-500">Selected</div>
          <div className="text-2xl font-bold text-blue-600">{selectedIds.size}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm col-span-2">
          <div className="flex justify-between items-center h-full">
            <button onClick={handleDownloadAll} className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium">
              <Download size={18} />
              <span>Export All Questions</span>
            </button>
            <button onClick={onNext} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">
              Proceed to Mapping →
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(question.id)}
                    onChange={() => toggleSelection(question.id)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {index + 1}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100 uppercase uppercase">
                        {question.suggested_subject || 'Uncategorized'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getConfidenceColor(question.confidence_score)} uppercase`}>
                        {(question.confidence_score * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button onClick={() => startStructureEdit(question)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Structure">
                    <Settings size={18} />
                  </button>
                  <button onClick={() => startEdit(question)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteQuestion(question.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === question.id ? null : question.id)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    {expandedId === question.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              <div className="pl-9">
                {editingId === question.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Question Text</label>
                      <textarea
                        value={editForm.question_text || ''}
                        onChange={e => setEditForm({ ...editForm, question_text: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                        placeholder="Enter question text..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Correct Answer / Key</label>
                        <input
                          type="text"
                          value={editForm.correct_answer || ''}
                          onChange={e => setEditForm({ ...editForm, correct_answer: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., A, or explicit answer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Difficulty</label>
                        <select
                          value={editForm.difficulty || 'medium'}
                          onChange={e => setEditForm({ ...editForm, difficulty: e.target.value })}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Model Answer / Detailed Solution</label>
                      <textarea
                        value={editForm.solution || ''}
                        onChange={e => setEditForm({ ...editForm, solution: e.target.value })}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                        placeholder="Enter detailed step-by-step solution..."
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">Save Changes</button>
                      <button onClick={cancelEdit} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gray-800 text-lg leading-relaxed">
                      <LaTeXRenderer content={question.question_text} />
                    </div>

                    {/* Hierarchical Structure Rendering */}
                    {question.structure?.nested_parts && question.structure.nested_parts.length > 0 ? (
                      <div className="mt-4 border-l-2 border-gray-100">
                        {renderNestedParts(question.structure.nested_parts, 'pl-6')}
                      </div>
                    ) : (
                      <button onClick={() => startStructureEdit(question)} className="mt-2 text-xs text-indigo-500 font-medium hover:underline flex items-center">
                        + Configure Question Parts (Compulsory/OR)
                      </button>
                    )}

                    {/* MCQ Options */}
                    {question.options?.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {question.options.map((opt, i) => (
                          <div key={i} className={`p-3 rounded-xl border ${opt === question.correct_answer ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-gray-400">{String.fromCharCode(65 + i)}</span>
                              <div className="flex-1 text-sm"><LaTeXRenderer content={opt} /></div>
                              {opt === question.correct_answer && <CheckCircle className="text-green-500" size={16} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {expandedId === question.id && (
              <div className="bg-gray-50/50 border-t p-5 pl-14 space-y-4">
                {question.solution && (
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Solution</div>
                    <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100"><LaTeXRenderer content={question.solution} /></div>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="px-3 py-1.5 bg-white rounded-lg border text-xs"><span className="text-gray-400 mr-2">Difficulty:</span><span className="capitalize font-medium">{question.difficulty}</span></div>
                  <div className="px-3 py-1.5 bg-white rounded-lg border text-xs"><span className="text-gray-400 mr-2">Type:</span><span className="capitalize font-medium">{question.question_type.replace('_', ' ')}</span></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Structure Editor Modal */}
      {structureEditingId && structureForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-indigo-600 text-white">
              <div className="flex items-center space-x-3">
                <Settings size={24} />
                <div>
                  <h3 className="text-xl font-bold">Edit Question Structure</h3>
                  <p className="text-indigo-100 text-sm">Configure compulsory parts and internal choices (OR)</p>
                </div>
              </div>
              <button onClick={() => setStructureEditingId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-700">Question Parts</h4>
                <button
                  onClick={() => {
                    const parts = [...(structureForm.nested_parts || [])];
                    parts.push({ type: 'compulsory', label: '', text: '', marks: 1 });
                    setStructureForm({ ...structureForm, nested_parts: parts });
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                >
                  + Add Root Part
                </button>
              </div>

              <div className="space-y-4">
                {(structureForm.nested_parts || []).map((part: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group">
                    <button
                      onClick={() => {
                        const parts = [...structureForm.nested_parts];
                        parts.splice(idx, 1);
                        setStructureForm({ ...structureForm, nested_parts: parts });
                      }}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Part Type</label>
                        <select
                          value={part.type}
                          onChange={(e) => {
                            const parts = [...structureForm.nested_parts];
                            const newType = e.target.value;
                            parts[idx] = {
                              ...part,
                              type: newType,
                              options: newType === 'choice_group' ? (part.options || [{ label: '', text: '', marks: 1 }, { label: '', text: '', marks: 1 }]) : undefined,
                              sub_parts: newType === 'choice_group' ? undefined : (part.sub_parts || [])
                            };
                            setStructureForm({ ...structureForm, nested_parts: parts });
                          }}
                          className="w-full mt-1 p-2 bg-gray-50 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white border-gray-200"
                        >
                          <option value="compulsory">Compulsory Part</option>
                          <option value="choice_group">Internal Choice (OR)</option>
                        </select>
                      </div>

                      {part.type === 'compulsory' ? (
                        <div className="col-span-9 space-y-4">
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Label</label>
                              <input value={part.label || ''} onChange={e => {
                                const parts = [...structureForm.nested_parts];
                                parts[idx].label = e.target.value;
                                setStructureForm({ ...structureForm, nested_parts: parts });
                              }} className="w-full mt-1 p-2 border rounded-lg text-sm font-bold text-center" placeholder="(a)" />
                            </div>
                            <div className="col-span-8">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                              <textarea value={part.text || ''} onChange={e => {
                                const parts = [...structureForm.nested_parts];
                                parts[idx].text = e.target.value;
                                setStructureForm({ ...structureForm, nested_parts: parts });
                              }} className="w-full mt-1 p-2 border rounded-lg text-sm" rows={1} placeholder="Part text..." />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Marks</label>
                              <input type="number" value={part.marks || 0} onChange={e => {
                                const parts = [...structureForm.nested_parts];
                                parts[idx].marks = parseInt(e.target.value) || 0;
                                setStructureForm({ ...structureForm, nested_parts: parts });
                              }} className="w-full mt-1 p-2 border rounded-lg text-sm" />
                            </div>
                          </div>

                          {/* Sub-parts Management */}
                          <div className="ml-8 p-3 bg-indigo-50/30 rounded-lg border border-dashed border-indigo-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Sub-parts (i, ii)</span>
                              <button onClick={() => {
                                const parts = [...structureForm.nested_parts];
                                if (!parts[idx].sub_parts) parts[idx].sub_parts = [];
                                parts[idx].sub_parts.push({ label: '', text: '', marks: 1 });
                                setStructureForm({ ...structureForm, nested_parts: parts });
                              }} className="text-[10px] font-bold text-indigo-600 hover:underline">+ Add Sub-part</button>
                            </div>
                            <div className="space-y-2">
                              {(part.sub_parts || []).map((sp: any, spIdx: number) => (
                                <div key={spIdx} className="flex items-center gap-2 group/sp">
                                  <input
                                    value={sp.label}
                                    onChange={e => {
                                      const parts = [...structureForm.nested_parts];
                                      parts[idx].sub_parts[spIdx].label = e.target.value;
                                      setStructureForm({ ...structureForm, nested_parts: parts });
                                    }}
                                    className="w-10 p-1 border rounded text-[10px] text-center font-bold"
                                    placeholder="(i)"
                                  />
                                  <input
                                    value={sp.text}
                                    onChange={e => {
                                      const parts = [...structureForm.nested_parts];
                                      parts[idx].sub_parts[spIdx].text = e.target.value;
                                      setStructureForm({ ...structureForm, nested_parts: parts });
                                    }}
                                    className="flex-1 p-1 border rounded text-[10px]"
                                    placeholder="Sub-part content..."
                                  />
                                  <button onClick={() => {
                                    const parts = [...structureForm.nested_parts];
                                    parts[idx].sub_parts.splice(spIdx, 1);
                                    setStructureForm({ ...structureForm, nested_parts: parts });
                                  }} className="opacity-0 group-hover/sp:opacity-100 text-gray-300 hover:text-red-500">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-9 space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-amber-500 uppercase">OR Selection Block</label>
                            <button onClick={() => {
                              const parts = [...structureForm.nested_parts];
                              parts[idx].options.push({ label: '', text: '', marks: 1 });
                              setStructureForm({ ...structureForm, nested_parts: parts });
                            }} className="text-xs font-bold text-amber-600 hover:underline">+ Add Choice</button>
                          </div>
                          {part.options.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                              <div className="flex items-center gap-3">
                                <input value={opt.label} onChange={e => {
                                  const parts = [...structureForm.nested_parts];
                                  parts[idx].options[oIdx].label = e.target.value;
                                  setStructureForm({ ...structureForm, nested_parts: parts });
                                }} className="w-12 p-1.5 border border-amber-200 rounded text-xs text-center font-bold" placeholder="c" />
                                <input value={opt.text} onChange={e => {
                                  const parts = [...structureForm.nested_parts];
                                  parts[idx].options[oIdx].text = e.target.value;
                                  setStructureForm({ ...structureForm, nested_parts: parts });
                                }} className="flex-1 p-1.5 border border-amber-200 rounded text-xs" placeholder="Choice content..." />
                                <input type="number" value={opt.marks} onChange={e => {
                                  const parts = [...structureForm.nested_parts];
                                  parts[idx].options[oIdx].marks = parseInt(e.target.value) || 0;
                                  setStructureForm({ ...structureForm, nested_parts: parts });
                                }} className="w-12 p-1.5 border border-amber-200 rounded text-xs" />
                                <button onClick={() => {
                                  const parts = [...structureForm.nested_parts];
                                  parts[idx].options.splice(oIdx, 1);
                                  setStructureForm({ ...structureForm, nested_parts: parts });
                                }} className="text-amber-400 hover:text-red-500"><Trash2 size={14} /></button>
                              </div>

                              {/* Nested Sub-parts for choice */}
                              <div className="ml-8 p-3 bg-white/40 rounded-lg border border-dashed border-amber-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Nested Parts for choice</span>
                                  <button onClick={() => {
                                    const parts = [...structureForm.nested_parts];
                                    if (!parts[idx].options[oIdx].sub_parts) parts[idx].options[oIdx].sub_parts = [];
                                    parts[idx].options[oIdx].sub_parts.push({ label: '', text: '', marks: 1 });
                                    setStructureForm({ ...structureForm, nested_parts: parts });
                                  }} className="text-[9px] font-bold text-amber-600 hover:underline">+ Add Part</button>
                                </div>
                                <div className="space-y-2">
                                  {(opt.sub_parts || []).map((sp: any, spIdx: number) => (
                                    <div key={spIdx} className="flex items-center gap-2 group/sp">
                                      <input
                                        value={sp.label}
                                        onChange={e => {
                                          const parts = [...structureForm.nested_parts];
                                          parts[idx].options[oIdx].sub_parts[spIdx].label = e.target.value;
                                          setStructureForm({ ...structureForm, nested_parts: parts });
                                        }}
                                        className="w-10 p-1 border border-amber-100 rounded text-[10px] text-center font-bold"
                                        placeholder="(i)"
                                      />
                                      <input
                                        value={sp.text}
                                        onChange={e => {
                                          const parts = [...structureForm.nested_parts];
                                          parts[idx].options[oIdx].sub_parts[spIdx].text = e.target.value;
                                          setStructureForm({ ...structureForm, nested_parts: parts });
                                        }}
                                        className="flex-1 p-1 border border-amber-100 rounded text-[10px]"
                                        placeholder="Sub-part content..."
                                      />
                                      <button onClick={() => {
                                        const parts = [...structureForm.nested_parts];
                                        parts[idx].options[oIdx].sub_parts.splice(spIdx, 1);
                                        setStructureForm({ ...structureForm, nested_parts: parts });
                                      }} className="opacity-0 group-hover/sp:opacity-100 text-amber-300 hover:text-red-500">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-400 italic flex items-center">
                <AlertTriangle size={14} className="mr-2 text-amber-400" />
                Updating structure will overwrite existing part data for this question.
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setStructureEditingId(null)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium tracking-tight">Discard</button>
                <button onClick={saveStructure} className="px-8 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">Save Structure</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPreview;
