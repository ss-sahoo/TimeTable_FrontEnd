import { useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useApi';
import {
    FileText,
    Upload,
    CheckCircle,
    AlertCircle,
    Clock,
    RefreshCw,
    Eye,
    Trash2,
    Brain,
    ChevronDown,
    ChevronRight,
    BarChart3,
    X,
    Save,
    Edit2,
    Maximize2,
    Edit
} from 'lucide-react';

interface EvaluationResult {
    student_name: string;
    total_score: number;
    max_score: number;
    percentage: number;
    grades: Array<{
        question_no: number;
        mark: number;
        max_mark: number;
        reasoning: string;
    }>;
    report: string;
}

interface AnswerSheetSubmission {
    id: number;
    exam: number;
    student_id?: number;
    file_path: string;
    status: string;
    evaluation_result: EvaluationResult | null;
    created_at: string;
}

interface AIEvaluationStatus {
    exam_id: number;
    exam_mode: string;
    ai_evaluation_enabled: boolean;
    marking_strictness: string;
    total_attempts: number;
    ai_evaluated_count: number;
    pending_count: number;
}

interface AnswerSheetUploadProps {
    examId: number;
    examTitle?: string;
}

export default function AnswerSheetUpload({ examId, examTitle }: AnswerSheetUploadProps) {
    const [loading, setLoading] = useState(true);
    const [aiStatus, setAIStatus] = useState<AIEvaluationStatus | null>(null);
    const [submissions, setSubmissions] = useState<AnswerSheetSubmission[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [reviewSubmission, setReviewSubmission] = useState<AnswerSheetSubmission | null>(null);
    const [viewOnlyMode, setViewOnlyMode] = useState(false);
    const [missingAnswers, setMissingAnswers] = useState<Array<{ question_number: number; question_type: string; subject: string }>>([]);

    useEffect(() => {
        fetchData();
    }, [examId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statusRes, submissionsRes] = await Promise.all([
                api.get(`/ai-evaluation/${examId}/ai-evaluation-status/`),
                api.get(`/ai-evaluation/${examId}/submissions/`)
            ]);
            setAIStatus(statusRes.data);
            setSubmissions(submissionsRes.data);
        } catch (err) {
            console.error('Failed to fetch AI evaluation data:', err);
            setError('Failed to load AI evaluation status');
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files).filter(
            file => file.type === 'application/pdf' || file.type.startsWith('image/')
        );
        setSelectedFiles(prev => [...prev, ...files]);
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError(null);
        setMissingAnswers([]);

        let successCount = 0;
        let errorCount = 0;

        for (const file of selectedFiles) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('auto_evaluate', 'true');

                await api.post(`/ai-evaluation/${examId}/upload-answer-sheet/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                successCount++;
            } catch (err: any) {
                console.error(`Failed to upload ${file.name}:`, err);

                // Check for MISSING_ANSWERS specific error
                const responseData = err.response?.data;
                if (responseData?.code === 'MISSING_ANSWERS' && responseData?.missing_answers) {
                    setMissingAnswers(responseData.missing_answers);
                    setError(responseData.error || 'Some questions are missing answers. Please add answers before evaluation.');
                    // Stop processing more files — this is a blocking error
                    break;
                }

                errorCount++;
            }
        }

        if (successCount > 0) {
            setSuccess(`Successfully uploaded ${successCount} answer sheet(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        }
        if (errorCount > 0 && successCount === 0 && missingAnswers.length === 0) {
            setError(`Failed to upload ${errorCount} file(s)`);
        }

        setSelectedFiles([]);
        setUploading(false);
        await fetchData();

        // Only auto-clear non-missing-answer errors 
        if (missingAnswers.length === 0) {
            setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
            case 'evaluated':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Evaluated
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

    const getStrictnessLabel = (strictness: string) => {
        switch (strictness) {
            case 'lenient':
                return { label: 'Lenient', color: 'text-green-600 bg-green-100' };
            case 'moderate':
                return { label: 'Moderate', color: 'text-yellow-600 bg-yellow-100' };
            case 'strict':
                return { label: 'Strict', color: 'text-red-600 bg-red-100' };
            default:
                return { label: strictness, color: 'text-slate-600 bg-slate-100' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">AI Answer Sheet Evaluation</h2>
                        <p className="text-xs text-slate-600">{examTitle || 'Upload and evaluate subjective answer sheets'}</p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* AI Status Card */}
            {aiStatus && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-900">AI Evaluation Status</span>
                        {aiStatus.ai_evaluation_enabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Enabled
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                Disabled
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-slate-500">Total Attempts</p>
                            <p className="text-xl font-bold text-slate-900">{aiStatus.total_attempts}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-slate-500">AI Evaluated</p>
                            <p className="text-xl font-bold text-green-600">{aiStatus.ai_evaluated_count}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-slate-500">Pending</p>
                            <p className="text-xl font-bold text-yellow-600">{aiStatus.pending_count}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-slate-500">Marking Strictness</p>
                            <p className={`text-sm font-medium mt-1 px-2 py-0.5 rounded inline-block ${getStrictnessLabel(aiStatus.marking_strictness).color}`}>
                                {getStrictnessLabel(aiStatus.marking_strictness).label}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Messages */}
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

            {/* Missing Answers Warning */}
            {missingAnswers.length > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-amber-800">
                            {missingAnswers.length} Question(s) Missing Answers
                        </span>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                        The following questions do not have answers or solutions. AI evaluation requires all questions to have reference answers.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {missingAnswers.map((m, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                                Q{m.question_number}
                                <span className="text-amber-500">({m.question_type})</span>
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-amber-600">
                        Please go to the Question Editor and add answers for these questions, then try again.
                    </p>
                    <button
                        onClick={() => { setMissingAnswers([]); setError(null); }}
                        className="mt-2 text-xs text-amber-700 underline hover:text-amber-900"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Upload Zone */}
            <div
                className={`mb-6 p-8 border-2 border-dashed rounded-xl text-center transition-all ${dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 mb-1">
                    Drop answer sheets here or click to upload
                </p>
                <p className="text-xs text-slate-500 mb-4">
                    Supports PDF and image files (PNG, JPG)
                </p>
                <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="answer-sheet-upload"
                />
                <label
                    htmlFor="answer-sheet-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 cursor-pointer transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Select Files
                </label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">
                            Selected Files ({selectedFiles.length})
                        </span>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all"
                        >
                            {uploading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4" />
                                    Upload & Evaluate All
                                </>
                            )}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submissions List */}
            {submissions.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Recent Submissions</h3>
                    <div className="space-y-3">
                        {submissions.map((submission) => (
                            <div
                                key={submission.id}
                                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() =>
                                                setExpandedSubmission(
                                                    expandedSubmission === submission.id ? null : submission.id
                                                )
                                            }
                                            className="p-1 text-slate-400 hover:text-slate-600"
                                        >
                                            {expandedSubmission === submission.id ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {submission.evaluation_result?.student_name || `Submission #${submission.id}`}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Submitted: {new Date(submission.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {submission.evaluation_result && (
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900">
                                                    {submission.evaluation_result.total_score}/{submission.evaluation_result.max_score}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {submission.evaluation_result.percentage.toFixed(1)}%
                                                </p>
                                            </div>
                                        )}
                                        {getStatusBadge(submission.status)}
                                        <button
                                            onClick={() => {
                                                setReviewSubmission(submission);
                                                setViewOnlyMode(false);
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Review & Edit Marks"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReviewSubmission(submission);
                                                setViewOnlyMode(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedSubmission === submission.id && submission.evaluation_result && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-medium text-slate-700 mb-3">Question-wise Scores</h4>
                                        <div className="space-y-2">
                                            {submission.evaluation_result.grades.map((grade, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                                                >
                                                    <span className="text-sm text-slate-700">
                                                        Q{grade.question_no}
                                                    </span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {grade.mark}/{grade.max_mark}
                                                        </span>
                                                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-purple-500"
                                                                style={{
                                                                    width: `${(grade.mark / grade.max_mark) * 100}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {submissions.length === 0 && selectedFiles.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-sm">No answer sheets uploaded yet</p>
                    <p className="text-xs mt-1">Upload PDF or image files to start AI evaluation</p>
                </div>
            )}
            {/* Review Modal */}
            {reviewSubmission && (
                <EvaluationReviewModal
                    submission={reviewSubmission}
                    onClose={() => {
                        setReviewSubmission(null);
                        setViewOnlyMode(false);
                    }}
                    onUpdate={fetchData}
                    examId={examId}
                    viewOnly={viewOnlyMode}
                />
            )}
        </div>
    );
}

interface EvaluationReviewModalProps {
    submission: AnswerSheetSubmission;
    onClose: () => void;
    onUpdate: () => void;
    examId: number;
    viewOnly?: boolean;
}

function EvaluationReviewModal({ submission, onClose, onUpdate, examId, viewOnly = false }: EvaluationReviewModalProps) {
    const [grades, setGrades] = useState(submission.evaluation_result?.grades || []);
    const [totalScore, setTotalScore] = useState(submission.evaluation_result?.total_score || 0);
    const [percentage, setPercentage] = useState(submission.evaluation_result?.percentage || 0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ mark: 0, reasoning: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({
            mark: grades[index].mark,
            reasoning: grades[index].reasoning
        });
    };

    const handleSave = async (index: number) => {
        try {
            setSaving(true);
            setError(null);
            const grade = grades[index];

            const response = await api.post(`/ai-evaluation/${examId}/submissions/${submission.id}/update-mark/`, {
                question_no: (grade as any)['Q.No.'] || grade.question_no,
                part_no: (grade as any)['Part.No.'] || (grade as any).part_no || null,
                mark: editForm.mark,
                reasoning: editForm.reasoning
            });

            if (response.data.success) {
                // Use the grades from the response if available, otherwise update manually
                if (response.data.grades && Array.isArray(response.data.grades)) {
                    setGrades(response.data.grades);
                } else {
                    const newGrades = [...grades];
                    newGrades[index] = {
                        ...newGrades[index],
                        mark: editForm.mark,
                        reasoning: editForm.reasoning
                    };
                    setGrades(newGrades);
                }
                
                // Update total score and percentage from response
                if (response.data.total_score !== undefined) {
                    setTotalScore(response.data.total_score);
                }
                if (response.data.percentage !== undefined) {
                    setPercentage(response.data.percentage);
                }
                
                setEditingIndex(null);
                setError(null);
                
                // Refresh parent data
                await onUpdate();
                
                // Close modal after successful update to show refreshed data
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (err: any) {
            console.error('Failed to update mark:', err);
            setError(err.response?.data?.error || 'Failed to update mark');
        } finally {
            setSaving(false);
        }
    };

    // Construct PDF URL - use localhost instead of 0.0.0.0
    const pdfUrl = submission.file_path ? `http://localhost:8000/media/${submission.file_path}` : '';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Reviewing: {submission.evaluation_result?.student_name || 'Student Submission'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Total Score: <span className="font-bold text-slate-900">{totalScore}/{submission.evaluation_result?.max_score}</span>
                                ({percentage.toFixed(1)}%)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Content - Side by Side */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: PDF Viewer */}
                    <div className="flex-1 bg-slate-700 border-r border-slate-200 flex flex-col">
                        <div className="px-4 py-2 bg-slate-800 text-white text-xs font-medium flex items-center justify-between">
                            <span>Answer Sheet (Original PDF)</span>
                            <div className="flex gap-2">
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-purple-300 flex items-center gap-1"
                                >
                                    <Maximize2 className="w-3 h-3" />
                                    Open Full Window
                                </a>
                            </div>
                        </div>
                        <div className="flex-1 relative bg-slate-800 flex flex-col overflow-hidden">
                            {pdfUrl ? (
                                <>
                                    <embed
                                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                        type="application/pdf"
                                        className="w-full h-full"
                                        style={{ minHeight: '100%' }}
                                    />
                                    {/* Always show open in new tab button for better UX */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur text-slate-700 rounded-lg hover:bg-white shadow-lg text-xs font-medium border border-slate-200"
                                            title="Open PDF in new tab for better viewing"
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                            Open Full PDF
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <FileText className="w-16 h-16 mb-4 text-slate-500" />
                                    <p className="text-sm">PDF not available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Grading Details */}
                    <div className="w-[450px] flex flex-col bg-white">
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                            AI Grading Details & Adjustments
                        </div>

                        {error && (
                            <div className="m-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {grades.map((grade, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border transition-all ${editingIndex === idx ? 'border-purple-300 ring-2 ring-purple-50 shadow-md' : 'border-slate-100 bg-slate-50/50'}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sm font-bold text-slate-700">
                                                Q{(grade as any)['Q.No.'] || grade.question_no}
                                            </span>
                                            {((grade as any)['Part.No.'] || (grade as any).part_no) && (
                                                <span className="text-xs text-slate-500">Part {(grade as any)['Part.No.'] || (grade as any).part_no}</span>
                                            )}
                                        </div>

                                        {editingIndex === idx ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max={grade.max_mark}
                                                    value={editForm.mark}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, mark: parseFloat(e.target.value) || 0 }))}
                                                    className="w-20 px-2 py-1 border border-purple-300 rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-200"
                                                />
                                                <span className="text-xs font-medium text-slate-400">/ {grade.max_mark}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-slate-900">{grade.mark}</span>
                                                <span className="text-xs font-medium text-slate-400">/ {grade.max_mark}</span>
                                                {!viewOnly && (
                                                    <button
                                                        onClick={() => handleEdit(idx)}
                                                        className="p-1 px-2 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded transition-colors flex items-center gap-1"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {editingIndex === idx ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editForm.reasoning}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, reasoning: e.target.value }))}
                                                className="w-full p-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-100 min-h-[100px]"
                                                placeholder="Teacher adjustment reasoning..."
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingIndex(null)}
                                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded"
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSave(idx)}
                                                    disabled={saving}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                    Update Mark
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-600 leading-relaxed bg-white/60 p-2 rounded border border-slate-100 italic">
                                            {grade.reasoning}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                            <p>Manual overrides reflect instantly in student scores.</p>
                            <p>AI generated report is automatically updated.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
