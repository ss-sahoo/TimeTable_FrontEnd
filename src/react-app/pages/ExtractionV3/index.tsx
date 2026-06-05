import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from "react-toastify";
import {
    Upload, CheckCircle, AlertCircle, Loader2, Cpu,
    BookOpen, X, Zap,
    Edit3, Trash2, Save
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/react-app/hooks/useApi';

// Types for Review
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

export default function ExtractionV3Page() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState<any>(null);
    const [pattern, setPattern] = useState<any>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [file, setFile] = useState<File | null>(null);

    // Process State
    const [step, setStep] = useState<'upload' | 'subject-selection' | 'processing' | 'review'>('upload');
    const [jobId, setJobId] = useState<string | null>(null);

    // Data
    const [patternSubjects, setPatternSubjects] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<ExtractedQuestion | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<ExtractedQuestion | null>(null);
    const [importing, setImporting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'review'>('all');

    // Pipeline Progress
    const [pipelineStatus, setPipelineStatus] = useState<string>('Initializing...');
    const [pipelineProgress, setPipelineProgress] = useState(0);

    // Error Handling
    const [error, setError] = useState<string | null>(null);

    // Fetch Exam & Pattern details
    useEffect(() => {
        if (!examId) return;

        const fetchConfig = async () => {
            try {
                const res = await api.get(`/exams/exams/${examId}/`);
                const data = res.data;
                setExam(data);

                if (data.pattern) {
                    const patId = typeof data.pattern === 'object' ? data.pattern.id : data.pattern;
                    const patRes = await api.get(`/patterns/patterns/${patId}/`);
                    setPattern(patRes.data);

                    // Extract unique subjects from pattern sections
                    if (patRes.data.sections && Array.isArray(patRes.data.sections)) {
                        const subjects = Array.from(new Set(patRes.data.sections.map((s: any) => s.subject)));
                        setPatternSubjects(subjects as string[]);
                        setSelectedSubjects(subjects as string[]); // Select all by default
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load exam configuration");
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, [examId]);

    // Polling Logic for V3 Pipeline
    useEffect(() => {
        if (!jobId || step !== 'processing') return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/questions/extraction-jobs/${jobId}/status/`); // Use status endpoint
                const job = res.data;

                if (job.status === 'completed') {
                    setPipelineProgress(100);
                    setPipelineStatus('Extraction Complete!');

                    // Fetch Questions automatically
                    console.log('Fetching questions for job:', jobId);
                    const qRes = await api.get(`/questions/extraction-jobs/${jobId}/questions/`);
                    if (qRes.data.questions && Array.isArray(qRes.data.questions)) {
                        setQuestions(qRes.data.questions);
                    }
                    setTimeout(() => setStep('review'), 1000);

                } else if (job.status === 'failed') {
                    setError(job.error_message || 'Extraction failed');
                    setStep('upload'); // Or error state
                } else {
                    // Update progress
                    setPipelineStatus('Processing...');
                    setPipelineProgress(job.progress_percent || 0);
                }

            } catch (e) {
                console.error(e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, step]);


    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles?.length) setFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    });

    const toggleSubject = (subj: string) => {
        if (selectedSubjects.includes(subj)) {
            setSelectedSubjects(prev => prev.filter(s => s !== subj));
        } else {
            setSelectedSubjects(prev => [...prev, subj]);
        }
    };

    // STEP 1 -> 2: Review File & Select Subjects
    const handleFileAccepted = () => {
        if (file) setStep('subject-selection');
    };

    // STEP 2 -> 3: Start Extraction
    const handleStartExtraction = async () => {
        if (!file || !exam || !pattern) return;
        if (selectedSubjects.length === 0) {
            toast.error("Please select at least one subject to extract.");
            return;
        }

        setStep('processing');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('exam_id', exam.id);
        formData.append('pattern_id', pattern.id);

        // Pass selected subjects explicitly
        // Since we can't easily pass array in FormData without stringifying or repeated keys
        // Let's use JSON string or comma separated
        formData.append('subjects', JSON.stringify(selectedSubjects));

        try {
            // Using the new V3 upload endpoint which now supports 'subjects' arg
            const res = await api.post('/questions/bulk-extract-v3/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setJobId(res.data.job_id);
        } catch (err: any) {
            console.error(err);
            setStep('upload');
            setError(err.response?.data?.error || 'Upload failed');
        }
    };

    // Import (Same as before)
    const handleImport = async () => {
        if (!jobId || !questions.length) return;
        setImporting(true);
        try {
            const mappings = questions.map((q, idx) => ({
                extracted_question_id: q.id,
                subject: q.assigned_subject || q.suggested_subject || 'General',
                section_id: q.assigned_section_id || q.suggested_section_id,
                question_number: idx + 1
            }));

            await api.post('/questions/bulk-import-extracted/', {
                job_id: jobId,
                question_ids: questions.map(q => q.id),
                mappings
            });

            toast.success('Questions imported successfully!');
            navigate(`/exams/${examId}`);
        } catch (err: any) {
            console.error("Import failed:", err);
            toast.error(`Failed to import: ${err.response?.data?.error || err.message}`);
        } finally {
            setImporting(false);
        }
    };

    const deleteQuestion = async (id: number) => {
        try {
            await api.delete(`/questions/extracted-questions/${id}/`);
            setQuestions(prev => prev.filter(q => q.id !== id));
            if (selectedQuestion?.id === id) setSelectedQuestion(null);
        } catch (err) { console.error(err); }
    };

    const updateQuestion = async (id: number, data: any) => {
        try {
            await api.patch(`/questions/extracted-questions/${id}/`, data);
            const updatedRes = await api.get(`/questions/extracted-questions/${id}/`);
            setQuestions(prev => prev.map(q => q.id === id ? updatedRes.data : q));
            setEditingQuestion(null);
        } catch (err) { console.error(err); }
    };

    // --- RENDERING ---

    if (loadingConfig) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // 1. Upload Screen
    if (step === 'upload') {
        return (
            <div className="min-h-screen bg-slate-50 p-8 relative overflow-hidden">
                <button onClick={() => navigate(`/exams/${examId}`)} className="fixed left-6 top-6 z-50 rounded-full bg-white p-3 shadow-lg ring-1 ring-slate-100 hover:scale-105 active:scale-95">
                    <X className="h-6 w-6 text-slate-500" />
                </button>
                <main className="mx-auto max-w-4xl relative z-10 pt-20">
                    <h1 className="text-5xl font-extrabold text-slate-900 text-center mb-4">New Extraction Flow</h1>
                    <p className="text-center text-slate-600 mb-12">Extract questions for specific subjects directly from your PDF.</p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-12 shadow-xl ring-1 ring-slate-900/5">
                        <div {...getRootProps()} className={`group relative flex min-h-[350px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
                            <input {...getInputProps()} />
                            <div className="rounded-full bg-blue-50 p-6 shadow-sm group-hover:scale-110 transition-transform">
                                <Upload className="h-10 w-10 text-blue-600" />
                            </div>
                            <p className="mt-8 text-2xl font-medium">{file ? file.name : "Drop exam paper here"}</p>
                            <p className="mt-3 text-slate-400">PDFs supported</p>
                        </div>
                        {file && <button onClick={handleFileAccepted} className="mt-8 w-full rounded-xl bg-blue-600 px-8 py-5 text-xl font-bold text-white shadow-lg hover:bg-blue-700 transition-all">Proceed to Subject Selection</button>}
                        {error && <p className="mt-4 text-center text-red-600 font-medium">{error}</p>}
                    </motion.div>
                </main>
            </div>
        );
    }

    // 2. Subject Selection
    if (step === 'subject-selection') {
        return (
            <div className="min-h-screen bg-slate-50 p-8 pt-20">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Select Subjects</h2>
                    <p className="text-slate-600 mb-8">Which subjects do you want to extract from <span className="font-bold">{file?.name}</span>?</p>

                    <div className="grid gap-4 mb-8">
                        {patternSubjects.map((subj, i) => {
                            const isSelected = selectedSubjects.includes(subj);
                            return (
                                <div
                                    key={i}
                                    onClick={() => toggleSubject(subj)}
                                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {subj.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{subj}</h3>
                                        </div>
                                    </div>
                                    {isSelected && <CheckCircle className="h-8 w-8 text-blue-600" />}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep('upload')} className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300">Back</button>
                        <button onClick={handleStartExtraction} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                            <Zap className="h-5 w-5" /> Start Extraction
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Processing
    if (step === 'processing') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-8 max-w-2xl mx-auto text-center px-8">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
                    <div className="relative rounded-full bg-white p-8 shadow-xl ring-1 ring-slate-100">
                        <Cpu className="h-16 w-16 animate-pulse text-blue-600" />
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{pipelineStatus}</h2>
                    <p className="text-slate-500">Extracting questions for: <span className="font-bold text-slate-800">{selectedSubjects.join(', ')}</span></p>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${pipelineProgress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        );
    }

    // 4. Review (Standard)
    const filteredQuestions = questions.filter(q => filter === 'review' ? q.requires_review : true);

    if (step === 'review') {
        return (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-50 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">Extraction Complete</h1>
                            <p className="text-xs text-slate-500">{questions.length} Questions found</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setFilter('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>All</button>
                            <button onClick={() => setFilter('review')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${filter === 'review' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-50'}`}>Review ({questions.filter(q => q.requires_review).length})</button>
                        </div>
                        <button onClick={handleImport} disabled={importing} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-600/20">
                            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Finalize & Import
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-[450px] overflow-y-auto p-6 space-y-4 border-r border-slate-200 bg-white/50">
                        {filteredQuestions.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No questions found</p>
                            </div>
                        ) : (
                            filteredQuestions.map((q, idx) => (
                                <div key={q.id} onClick={() => setSelectedQuestion(q)} className={`group relative rounded-2xl border p-5 transition-all cursor-pointer ${selectedQuestion?.id === q.id ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    {q.requires_review && <AlertCircle className="absolute top-4 right-4 h-4 w-4 text-amber-500" />}
                                    <div className="flex gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${selectedQuestion?.id === q.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex gap-2 mb-2">
                                                <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">{q.suggested_subject || 'N/A'}</span>
                                                <span className="text-[9px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">{q.question_type?.replace('_', ' ') || 'N/A'}</span>
                                            </div>
                                            <div className="text-sm text-slate-800 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.question_text || 'No question text' }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Preview Area */}
                    <div className="flex-1 bg-white overflow-y-auto p-12">
                        {selectedQuestion ? (
                            <div className="max-w-3xl mx-auto">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b">
                                    <h2 className="text-2xl font-bold">Preview Question</h2>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingQuestion(selectedQuestion)} className="p-2.5 rounded-xl border hover:bg-slate-50"><Edit3 className="h-5 w-5" /></button>
                                        <button onClick={() => deleteQuestion(selectedQuestion.id)} className="p-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50"><Trash2 className="h-5 w-5" /></button>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div dangerouslySetInnerHTML={{ __html: selectedQuestion.question_text }} className="text-xl font-serif leading-relaxed p-6 bg-slate-50/50 rounded-3xl" />
                                    {selectedQuestion.options?.map((opt, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border flex gap-4 ${selectedQuestion.correct_answer === String.fromCharCode(65 + i) ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                                            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-sm">{String.fromCharCode(65 + i)}</span>
                                            <div className="pt-1" dangerouslySetInnerHTML={{ __html: opt }} />
                                        </div>
                                    ))}
                                    {selectedQuestion.solution && <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100" dangerouslySetInnerHTML={{ __html: selectedQuestion.solution }} />}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <BookOpen className="h-16 w-16 opacity-20 mb-4" />
                                <p className="text-lg font-bold">Select a question to see details</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Modal (Copied logic) */}
                {editingQuestion && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h3 className="text-xl font-bold">Edit Content</h3>
                                <button onClick={() => setEditingQuestion(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-8 overflow-y-auto space-y-6">
                                <textarea className="w-full rounded-xl border-slate-200 p-4 min-h-[150px] font-serif" value={editingQuestion.question_text} onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="rounded-xl border-slate-200 px-4 py-3" value={editingQuestion.assigned_subject || editingQuestion.suggested_subject} onChange={e => setEditingQuestion({ ...editingQuestion, assigned_subject: e.target.value })} placeholder="Subject" />
                                    <input className="rounded-xl border-slate-200 px-4 py-3" value={editingQuestion.correct_answer} onChange={e => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })} placeholder="Answer" />
                                </div>
                            </div>
                            <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
                                <button onClick={() => setEditingQuestion(null)} className="px-6 py-2 font-bold text-slate-500">Cancel</button>
                                <button onClick={() => updateQuestion(editingQuestion.id, editingQuestion)} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
