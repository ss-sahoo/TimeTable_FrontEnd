import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, AlertCircle, Loader2, Cpu,
    ArrowLeft, ChevronRight, FileText, Database,
    Zap, Save, Trash2, Edit3, Beaker,
    Filter, MoreHorizontal, Check, X,
    ExternalLink, Info, BookOpen
} from 'lucide-react';
import { api } from '@/react-app/hooks/useApi';

interface ExtractedQuestion {
    id: number;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    solution: string;
    confidence_score: number;
    requires_review: boolean;
    suggested_subject: string;
    suggested_section_id: number;
    assigned_subject?: string;
    assigned_section_id?: number;
    is_imported: boolean;
    import_error?: string;
}

interface ExtractionJob {
    id: string;
    status: string;
    questions_extracted: number;
    processing_time_seconds: number;
    ai_model_used: string;
    file_name: string;
    pattern_name: string;
    exam_title: string;
}

export default function ExtractionReviewPage() {
    const { examId, jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState<ExtractionJob | null>(null);
    const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'review' | 'imported'>('all');

    const [selectedQuestion, setSelectedQuestion] = useState<ExtractedQuestion | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<ExtractedQuestion | null>(null);

    // Fetch Job & Questions
    useEffect(() => {
        if (!jobId) return;

        const fetchData = async () => {
            try {
                const jobRes = await api.get(`/questions/extraction-jobs/${jobId}/`);
                setJob(jobRes.data);

                const questionsRes = await api.get(`/questions/extraction-jobs/${jobId}/questions/`);
                setQuestions(questionsRes.data.questions);
            } catch (err) {
                console.error("Failed to fetch extraction data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [jobId]);

    const handleImport = async () => {
        if (!job || !questions.length) return;

        setImporting(true);
        try {
            // Prepare mappings for bulk import
            const mappings = questions.map((q, idx) => ({
                extracted_question_id: q.id,
                subject: q.assigned_subject || q.suggested_subject || 'General',
                section_id: q.assigned_section_id || q.suggested_section_id,
                question_number: idx + 1 // Simple numbering for now
            }));

            const res = await api.post('/questions/bulk-import-extracted/', {
                job_id: job.id,
                question_ids: questions.map(q => q.id),
                mappings
            });

            // Success! Navigate to exam view or question list
            navigate(`/exams/${examId}`);
        } catch (err) {
            console.error("Import failed", err);
            alert("Failed to import questions. Please check if the pattern capacity is full.");
        } finally {
            setImporting(false);
        }
    };

    const deleteQuestion = async (id: number) => {
        try {
            await api.delete(`/questions/extracted-questions/${id}/`);
            setQuestions(prev => prev.filter(q => q.id !== id));
            if (selectedQuestion?.id === id) setSelectedQuestion(null);
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const updateQuestion = async (id: number, data: Partial<ExtractedQuestion>) => {
        try {
            const res = await api.patch(`/questions/extracted-questions/${id}/`, data);
            setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...res.data } : q));
            setEditingQuestion(null);
            // Re-fetch to get updated validation status
            const updatedRes = await api.get(`/questions/extracted-questions/${id}/`);
            setQuestions(prev => prev.map(q => q.id === id ? updatedRes.data : q));
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const filteredQuestions = questions.filter(q => {
        if (filter === 'review') return q.requires_review;
        if (filter === 'imported') return q.is_imported;
        return true;
    });

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
                <div className="relative mb-4">
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
                    <div className="relative rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Loading Extracted Content...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/exams/${examId}/extraction-v3`)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 leading-none">Extraction Review</h1>
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">V3 AI</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                {job?.file_name} • {job?.questions_extracted} questions found
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('review')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'review' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Needs Review
                                {questions.filter(q => q.requires_review).length > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">
                                        {questions.filter(q => q.requires_review).length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={importing || questions.length === 0}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white transition-all hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:grayscale"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Finalize & Import
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* List Pane */}
                <div className="w-1/2 overflow-y-auto p-6 space-y-4 border-r border-slate-200">
                    <AnimatePresence>
                        {filteredQuestions.map((q, idx) => (
                            <motion.div
                                key={q.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedQuestion(q)}
                                className={`group relative rounded-2xl border p-5 transition-all cursor-pointer ${selectedQuestion?.id === q.id
                                    ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                    }`}
                            >
                                {q.requires_review && (
                                    <div className="absolute top-4 right-4 text-amber-500" title="Needs Review">
                                        <AlertCircle className="h-5 w-5 fill-amber-50" />
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${selectedQuestion?.id === q.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 pr-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                {q.suggested_subject || 'General'}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                                {q.question_type.replace('_', ' ')}
                                            </span>
                                            {q.confidence_score > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] font-medium text-green-600 ml-auto">
                                                    <Zap className="h-3 w-3 fill-green-500" />
                                                    {Math.round(q.confidence_score * 100)}% Match
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="text-slate-800 line-clamp-3 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: q.question_text }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Preview Pane */}
                <div className="flex-1 bg-white overflow-y-auto">
                    {selectedQuestion ? (
                        <div className="p-8 max-w-3xl mx-auto">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Preview</h2>
                                    <p className="text-sm text-slate-500">View and edit extracted details</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditingQuestion(selectedQuestion)}
                                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                        title="Edit Question"
                                    >
                                        <Edit3 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteQuestion(selectedQuestion.id)}
                                        className="p-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                                        title="Discard"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Subject & Type Chips */}
                                <div className="flex flex-wrap gap-2">
                                    <div className="px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2">
                                        <Database className="h-3 w-3" />
                                        Subject: {selectedQuestion.assigned_subject || selectedQuestion.suggested_subject || 'General'}
                                    </div>
                                    <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        Type: {selectedQuestion.question_type.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>

                                {/* Body */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Question Text</h4>
                                    <div
                                        className="text-xl text-slate-900 leading-relaxed font-serif p-6 rounded-3xl bg-slate-50/50 border border-slate-100 min-h-[100px]"
                                        dangerouslySetInnerHTML={{ __html: selectedQuestion.question_text }}
                                    />
                                </div>

                                {/* Options */}
                                {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Options</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedQuestion.options.map((opt, i) => {
                                                const letter = String.fromCharCode(65 + i);
                                                const isCorrect = selectedQuestion.correct_answer === letter || selectedQuestion.correct_answer === opt;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${isCorrect
                                                            ? 'bg-green-50/50 border-green-200 shadow-sm ring-1 ring-green-100'
                                                            : 'bg-white border-slate-100'
                                                            }`}
                                                    >
                                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isCorrect ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {letter}
                                                        </div>
                                                        <div className="flex-1 pt-1 text-slate-700" dangerouslySetInnerHTML={{ __html: opt }} />
                                                        {isCorrect && (
                                                            <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">Correct</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Correct Answer for non-MCQ */}
                                {(!selectedQuestion.options || selectedQuestion.options.length === 0) && (
                                    <div className="bg-green-50/50 rounded-3xl border border-green-100 p-6">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-green-600 mb-2">Answer</h4>
                                        <div className="text-xl font-bold text-green-900">
                                            {selectedQuestion.correct_answer}
                                        </div>
                                    </div>
                                )}

                                {/* Solution */}
                                {selectedQuestion.solution && (
                                    <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-6">
                                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3 flex items-center gap-2">
                                            <Beaker className="h-4 w-4" /> Solution
                                        </h4>
                                        <div className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedQuestion.solution }} />
                                    </div>
                                )}

                                {/* Confidence Warning */}
                                {selectedQuestion.requires_review && (
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
                                        <div>
                                            <p className="font-bold">AI Flagged for Review</p>
                                            <p className="opacity-80">Reason: {selectedQuestion.import_error || "Confidence score below threshold or missing required fields."}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <BookOpen className="h-10 w-10 opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-300">Select a question to preview</h3>
                            <p className="max-w-xs mt-2">Click on any question from the list on the left to see full details and AI extraction notes.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Editing Modal */}
            <AnimatePresence>
                {editingQuestion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingQuestion(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-900">Edit Extracted Content</h3>
                                <button onClick={() => setEditingQuestion(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-700">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Question Text</label>
                                    <textarea
                                        className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 font-serif text-lg min-h-[150px]"
                                        value={editingQuestion.question_text}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Subject</label>
                                        <input
                                            className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
                                            value={editingQuestion.assigned_subject || editingQuestion.suggested_subject || ''}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, assigned_subject: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Correct Answer</label>
                                        <input
                                            className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-3"
                                            value={editingQuestion.correct_answer}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {editingQuestion.options && editingQuestion.options.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Options</label>
                                        <div className="space-y-3">
                                            {editingQuestion.options.map((opt, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <span className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 mt-1">{String.fromCharCode(65 + i)}</span>
                                                    <input
                                                        className="flex-1 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...editingQuestion.options];
                                                            newOpts[i] = e.target.value;
                                                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Solution / Explanation</label>
                                    <textarea
                                        className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 min-h-[100px]"
                                        value={editingQuestion.solution || ''}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, solution: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-4 bg-slate-50/30">
                                <button
                                    onClick={() => setEditingQuestion(null)}
                                    className="px-6 py-3 font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateQuestion(editingQuestion.id, editingQuestion)}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
