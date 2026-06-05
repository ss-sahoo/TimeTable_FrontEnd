import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { api, getErrorMessage, extractApiError } from '../hooks/useApi';

import {
    FileText,
    Download,
    Upload,
    Play,
    CheckCircle,
    AlertCircle,
    Clock,
    RefreshCw,
    Eye,
    Plus,
    ChevronDown,
    ChevronRight,
    Award,
    ExternalLink
} from 'lucide-react';

interface OMRSheet {
    id: number;
    exam: number;
    sheet_id: string;
    pdf_file: string;
    answer_key_pdf: string | null;
    status: string;
    created_at: string;
    metadata?: any;
}

interface OMRSubmission {
    id: number;
    exam: number;
    omr_sheet: number;
    scanned_pdf: string;
    status: string;
    evaluation_result: any;
    evaluation_results?: EvaluationResults;
    score: number | null;
    max_score: number | null;
    percentage?: number | null;
    created_at: string;
    submitted_at?: string;
    student_name?: string;
    student_email?: string;
    annotated_pdf?: string;
    annotated_pdf_url?: string;
}

interface EvaluationDetail {
    question: string;
    verdict: 'CORRECT' | 'INCORRECT' | 'NOT_ATTEMPTED';
    student_answer: string[];
    correct_answer: string[];
    marks_awarded: number;
    bubble_filled_remark?: string;
}

interface EvaluationResults {
    score: number;
    max_score: number;
    percentage: number;
    correct: number;
    incorrect: number;
    attempted: number;
    total_questions: number;
    pass: boolean;
    details: EvaluationDetail[];
}

interface AnswerKey {
    id: number;
    exam: number;
    answers: Record<string, {
        correct: string[];
        marks: number;
        negative: number;
    }>;
    updated_at: string;
}

// Interface for exam question with correct answers
interface ExamQuestionData {
    id: number;
    question_number: number;
    section_name?: string;
    question: {
        id: number;
        question_text: string;
        question_type: string;
        options: string[];
        correct_answer: string;
        marks: number;
        negative_marks: number;
        subject?: string;
    };
    marks: number;
    negative_marks: number;
}

interface OMRManagementProps {
    examId: number;
    examTitle?: string;
    patternId?: number;
}


const slugifySubject = (subject: string) =>
    subject
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function OMRManagement({ examId, examTitle, patternId }: OMRManagementProps) {
    const location = useLocation();
    const isSuperAdminPath = location.pathname.startsWith('/superadmin');
    const isCenterAdminPath = location.pathname.startsWith('/center-admin');
    const basePath = isSuperAdminPath ? '/superadmin' : (isCenterAdminPath ? '/center-admin' : '');

    const [loading, setLoading] = useState(true);

    const [generating, setGenerating] = useState(false);
    const [sheets, setSheets] = useState<OMRSheet[]>([]);
    const [submissions, setSubmissions] = useState<OMRSubmission[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [expandedSheet, setExpandedSheet] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'sheets' | 'submissions' | 'answer_key'>('sheets');
    const [, setAnswerKey] = useState<AnswerKey | null>(null);

    // Exam questions state (for auto-populating answer key)
    const [examQuestions, setExamQuestions] = useState<ExamQuestionData[]>([]);

    // Answer key form state
    const [answerFormData, setAnswerFormData] = useState<Record<string, {
        correct: string[];
        marks: number;
        negative: number;
    }>>({});
    const [totalQuestions, setTotalQuestions] = useState(20);
    const [savingAnswerKey, setSavingAnswerKey] = useState(false);
    const [defaultMarks, setDefaultMarks] = useState(4);
    const [defaultNegative, setDefaultNegative] = useState(1);

    // Helper function to convert correct_answer to option letter (A, B, C, D)
    const getAnswerLetter = (question: ExamQuestionData['question']): string[] => {
        if (!question.correct_answer || !question.options || question.options.length === 0) {
            return [];
        }

        const correctAnswer = question.correct_answer.trim().toUpperCase();

        // If already a letter (A, B, C, D), return it
        if (['A', 'B', 'C', 'D'].includes(correctAnswer)) {
            return [correctAnswer];
        }

        // Check if it's comma-separated letters (for multiple correct)
        if (/^[A-D](,[A-D])*$/i.test(correctAnswer.replace(/\s/g, ''))) {
            return correctAnswer.split(',').map(l => l.trim().toUpperCase()).filter(l => ['A', 'B', 'C', 'D'].includes(l));
        }

        // Try to find the option index by matching text
        const optionIndex = question.options.findIndex(
            opt => opt.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
        );

        if (optionIndex !== -1 && optionIndex < 4) {
            return [String.fromCharCode(65 + optionIndex)]; // 65 = 'A'
        }

        // Try partial match
        const partialMatchIndex = question.options.findIndex(
            opt => opt.toLowerCase().includes(question.correct_answer.toLowerCase()) ||
                question.correct_answer.toLowerCase().includes(opt.toLowerCase())
        );

        if (partialMatchIndex !== -1 && partialMatchIndex < 4) {
            return [String.fromCharCode(65 + partialMatchIndex)];
        }

        return [];
    };

    useEffect(() => {
        fetchOMRData();
    }, [examId]);

    const fetchOMRData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [sheetsRes, submissionsRes, answerKeyRes, questionsRes] = await Promise.all([
                api.get(`/omr/sheets/?exam_id=${examId}`),
                api.get(`/omr/submissions/?exam_id=${examId}`),
                api.get(`/omr/answer-keys/exam/${examId}/`).catch(() => ({ data: null })),
                api.get(`/questions/exams/${examId}/questions/`).catch(() => ({ data: [] }))
            ]);

            setSheets(sheetsRes.data.results || sheetsRes.data || []);
            setSubmissions(submissionsRes.data.results || submissionsRes.data || []);
            setAnswerKey(answerKeyRes.data);

            // Store and SORT exam questions by section/subject to ensure sequential numbering
            const untypedQuestions = questionsRes.data.results || questionsRes.data || [];
            const sortedQuestions = [...untypedQuestions].sort((a: any, b: any) => {
                const secA = (a.section_name || a.question?.subject || 'General').toLowerCase();
                const secB = (b.section_name || b.question?.subject || 'General').toLowerCase();
                if (secA !== secB) return secA.localeCompare(secB);
                return (a.question_number || 0) - (b.question_number || 0);
            });
            setExamQuestions(sortedQuestions);

            // Update total questions based on exam questions
            if (sortedQuestions.length > 0) {
                setTotalQuestions(sortedQuestions.length);
            }

            // Always prioritize derived answer key from sorted questions to stay in sync with OMR
            const autoAnswerData: Record<string, { correct: string[]; marks: number; negative: number }> = {};
            sortedQuestions.forEach((eq: ExamQuestionData, index: number) => {
                const qNum = index + 1;
                const qKey = `Q${qNum}`;
                const question = eq.question;

                if (question) {
                    const answerLetters = getAnswerLetter(question);
                    const marks = eq.marks || question.marks || defaultMarks;
                    const negative = eq.negative_marks || question.negative_marks || defaultNegative;

                    autoAnswerData[qKey] = {
                        correct: answerLetters,
                        marks: typeof marks === 'number' ? marks : parseFloat(marks as any) || defaultMarks,
                        negative: typeof negative === 'number' ? negative : parseFloat(negative as any) || defaultNegative
                    };
                }
            });
            setAnswerFormData(autoAnswerData);

            if (answerKeyRes.data?.answers) {
                setAnswerKey(answerKeyRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch OMR data:', err);
            setError('Failed to load OMR data');
        } finally {
            setLoading(false);
        }
    };


    const handleGenerateSheet = async () => {
        try {
            setGenerating(true);
            setError(null);
            await api.post(`/omr/sheets/generate/${examId}/`);
            setSuccess('OMR sheet generation started!');
            await fetchOMRData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to generate OMR sheet:', err);
            setError(getErrorMessage(err, 'Failed to generate OMR sheet'));
        } finally {
            setGenerating(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUploadSubmission = async () => {
        if (!selectedFile) return;
        try {
            setUploading(true);
            setError(null);
            const formData = new FormData();
            formData.append('files', selectedFile);
            formData.append('auto_evaluate', 'true');

            await api.post(`/omr/submissions/upload/${examId}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess('OMR sheet uploaded and evaluation started!');
            setSelectedFile(null);
            await fetchOMRData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to upload OMR submission:', err);
            setError(getErrorMessage(err, 'Failed to upload scanned sheet'));
        } finally {
            setUploading(false);
        }
    };

    const handleEvaluate = async (submissionId: number) => {
        try {
            setError(null);
            await api.post(`/omr/submissions/${submissionId}/evaluate/`);
            setSuccess('Evaluation started!');
            await fetchOMRData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to evaluate submission:', err);
            setError(getErrorMessage(err, 'Failed to evaluate submission'));
        }
    };

    // Save answer key to backend
    const handleSaveAnswerKey = async () => {
        try {
            setSavingAnswerKey(true);
            setError(null);

            // Validate: ensure all questions have at least one answer
            const emptyQuestions: string[] = [];
            for (let i = 1; i <= totalQuestions; i++) {
                const qKey = `Q${i}`;
                if (!answerFormData[qKey] || answerFormData[qKey].correct.length === 0) {
                    emptyQuestions.push(qKey);
                }
            }

            if (emptyQuestions.length > 0) {
                setError(`Please select answers for: ${emptyQuestions.slice(0, 5).join(', ')}${emptyQuestions.length > 5 ? '...' : ''}`);
                setSavingAnswerKey(false);
                return;
            }

            // Build the payload
            const payload: Record<string, any> = {};
            for (let i = 1; i <= totalQuestions; i++) {
                const qKey = `Q${i}`;
                payload[qKey] = {
                    correct: answerFormData[qKey].correct,
                    marks: answerFormData[qKey].marks ?? defaultMarks,
                    negative: answerFormData[qKey].negative ?? defaultNegative
                };
            }

            const response = await api.post(`/omr/answer-keys/set-answers/${examId}/`, payload);

            setSuccess('Answer key saved successfully!');
            setAnswerKey(response.data.answer_key);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to save answer key:', err);
            const apiErr = extractApiError(err);
            const legacyDetails = err?.response?.data?.details;
            const detailsStr = Array.isArray(legacyDetails) ? legacyDetails.join(', ') : undefined;
            setError(apiErr.detail || detailsStr || 'Failed to save answer key');
        } finally {
            setSavingAnswerKey(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'generated':
            case 'completed':
            case 'evaluated':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {status === 'generated' ? 'Generated' : status === 'evaluated' ? 'Evaluated' : 'Completed'}
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Processing
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                        {status}
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">OMR Sheet Management</h2>
                        <p className="text-xs text-slate-600">{examTitle || 'Manage OMR sheets and evaluations'}</p>
                    </div>
                </div>
                <button
                    onClick={handleGenerateSheet}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                >
                    {generating ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Generate OMR Sheet
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {success}
                </div>
            )}

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('sheets')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'sheets' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    OMR Sheets ({sheets.length})
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'submissions' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Submissions ({submissions.length})
                </button>
                <button
                    onClick={() => setActiveTab('answer_key')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'answer_key' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Answer Key
                </button>
            </div>

            {activeTab === 'sheets' && (
                <div className="space-y-3">
                    {sheets.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-sm">No OMR sheets generated yet</p>
                        </div>
                    ) : (
                        sheets.map((sheet) => (
                            <div key={sheet.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setExpandedSheet(expandedSheet === sheet.id ? null : sheet.id)} className="p-1 text-slate-400 hover:text-slate-600">
                                            {expandedSheet === sheet.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                        <div>
                                            <p className="font-medium text-slate-900">Sheet ID: {sheet.sheet_id}</p>
                                            <p className="text-xs text-slate-500">Created: {new Date(sheet.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(sheet.status)}
                                        <div className="flex gap-2">
                                            {sheet.pdf_file && (
                                                <a href={sheet.pdf_file} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'submissions' && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total</p>
                            <p className="text-xl font-black text-slate-900">{submissions.length}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase tracking-wider text-green-500 font-bold mb-1">Evaluated</p>
                            <p className="text-xl font-black text-green-600">{submissions.filter(s => s.status === 'evaluated').length}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase tracking-wider text-amber-500 font-bold mb-1">Pending</p>
                            <p className="text-xl font-black text-amber-600">{submissions.filter(s => ['pending', 'processing'].includes(s.status)).length}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-[10px] uppercase tracking-wider text-red-500 font-bold mb-1">Failed</p>
                            <p className="text-xl font-black text-red-600">{submissions.filter(s => s.status === 'failed').length}</p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">Upload Scanned OMR Sheets</p>
                                <p className="text-xs text-slate-500">PDF or image files</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} className="hidden" id="omr-upload" />
                            <label htmlFor="omr-upload" className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                                Select File
                            </label>
                            {selectedFile && (
                                <button onClick={handleUploadSubmission} disabled={uploading} className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {submissions.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">No submissions yet</div>
                        ) : (
                            submissions.map((submission) => (
                                <div key={submission.id} className="border border-slate-200 rounded-lg p-4 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{submission.student_name || `Submission #${submission.id}`}</p>
                                            <p className="text-xs text-slate-500">{new Date(submission.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {submission.score !== null && <p className="font-bold">{submission.score}/{submission.max_score}</p>}
                                            {getStatusBadge(submission.status)}

                                            {/* Annotated PDF Download Button */}
                                            {(submission.annotated_pdf || submission.annotated_pdf_url) && (
                                                <a
                                                    href={submission.annotated_pdf_url || submission.annotated_pdf}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Annotated Sheet"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            )}

                                            <button onClick={() => handleEvaluate(submission.id)} className="p-2 hover:bg-slate-100 rounded-lg" title="Re-evaluate">
                                                <Play className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {activeTab === 'answer_key' && (
                <>
                    {/* Configuration Section */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Award className="w-6 h-6 text-green-600" />
                                <div>
                                    <h3 className="text-sm font-bold text-green-800">Answer Key Configuration</h3>
                                    <p className="text-xs text-green-600">
                                        {examQuestions.length > 0
                                            ? `Auto-synced from ${examQuestions.length} exam questions. Click "Sync from Exam" to refresh.`
                                            : 'Select correct answers for each question or sync from exam'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-slate-600">Questions:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={totalQuestions}
                                        onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 20)}
                                        className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-slate-600">Default Marks:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={defaultMarks}
                                        onChange={(e) => setDefaultMarks(parseFloat(e.target.value) || 1)}
                                        className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-slate-600">Negative:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.25"
                                        value={defaultNegative}
                                        onChange={(e) => setDefaultNegative(parseFloat(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Answers are synced from Exam Questions
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Questions Grid with Section Headers */}
                    <div className="space-y-6">
                        {(() => {
                            // Group questions by section - collect all question indices per section
                            const sectionMap: Map<string, { section: string; subject: string; questionIndices: number[] }> = new Map();

                            const subjectQuestionCount: Record<string, number> = {};
                            const questionSubjectInfo: Record<number, { index: number; slug: string }> = {};

                            examQuestions.forEach((eq, idx) => {
                                const sectionName = eq.section_name || 'Section';
                                const subject = eq.question?.subject || sectionName;
                                const key = `${subject}-${sectionName}`;

                                const subjectSlug = slugifySubject(subject);
                                if (!subjectQuestionCount[subjectSlug]) {
                                    subjectQuestionCount[subjectSlug] = 0;
                                }
                                subjectQuestionCount[subjectSlug]++;
                                questionSubjectInfo[idx + 1] = {
                                    index: subjectQuestionCount[subjectSlug],
                                    slug: subjectSlug
                                };

                                if (!sectionMap.has(key)) {

                                    sectionMap.set(key, {
                                        section: sectionName,
                                        subject: subject,
                                        questionIndices: []
                                    });
                                }
                                sectionMap.get(key)!.questionIndices.push(idx + 1); // 1-indexed for Q1, Q2, etc.
                            });

                            const sectionGroups = Array.from(sectionMap.values());

                            // If no sections found, create a single "All Questions" group
                            if (sectionGroups.length === 0) {
                                sectionGroups.push({
                                    section: 'All Questions',
                                    subject: 'General',
                                    questionIndices: Array.from({ length: totalQuestions }, (_, i) => i + 1)
                                });
                            }

                            return sectionGroups.map((group, groupIdx) => (
                                <div key={groupIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    {/* Section Header */}
                                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                    <span className="text-sm font-bold">{groupIdx + 1}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">
                                                        {group.subject !== group.section
                                                            ? `${group.subject} - Section ${group.section}`
                                                            : group.section}
                                                    </h4>
                                                    <p className="text-xs text-white/80">
                                                        {group.questionIndices.length} questions (Q{Math.min(...group.questionIndices)} - Q{Math.max(...group.questionIndices)})
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                                    {group.questionIndices.filter(qNum => (answerFormData[`Q${qNum}`]?.correct || []).length > 0).length} / {group.questionIndices.length} answered
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Questions in this section */}
                                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {group.questionIndices.map((qNum) => {
                                            const qKey = `Q${qNum}`;
                                            const currentAnswers = answerFormData[qKey]?.correct || [];

                                            return (
                                                <div
                                                    key={qNum}
                                                    className={`p-3 rounded-lg border-2 transition-all ${currentAnswers.length > 0
                                                        ? 'border-green-300 bg-green-50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Link
                                                            to={`${basePath}/pattern/${patternId}/question/${questionSubjectInfo[qNum]?.slug}/${questionSubjectInfo[qNum]?.index}?examId=${examId}`}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                                            title="View/Edit Question Details"
                                                        >
                                                            Q{qNum}
                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                        </Link>
                                                        {currentAnswers.length > 0 && (
                                                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1.5">
                                                        {['A', 'B', 'C', 'D'].map((option) => {
                                                            const isSelected = currentAnswers.includes(option);
                                                            return (
                                                                <button
                                                                    key={option}
                                                                    disabled={true}
                                                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-not-allowed ${isSelected
                                                                        ? 'bg-green-600 text-white shadow-md scale-105'
                                                                        : 'bg-slate-100 text-slate-400'
                                                                        }`}
                                                                >
                                                                    {option}
                                                                </button>

                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    {Object.values(answerFormData).filter(a => a.correct.length > 0).length} of {totalQuestions} questions answered
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Total Marks: {totalQuestions * defaultMarks} | Per Question: +{defaultMarks} / -{defaultNegative}
                                </p>
                            </div>
                            <button
                                onClick={handleSaveAnswerKey}
                                disabled={savingAnswerKey}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg"
                            >
                                {savingAnswerKey ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    'Save Answer Key'
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
