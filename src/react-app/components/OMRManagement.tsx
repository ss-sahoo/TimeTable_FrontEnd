import { useState, useEffect } from 'react';
import { api } from '../hooks/useApi';
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
    Trash2,
    Plus,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

interface OMRSheet {
    id: number;
    exam: number;
    sheet_id: string;
    pdf_file: string;
    answer_key_pdf: string | null;
    status: string;
    created_at: string;
}

interface OMRSubmission {
    id: number;
    exam: number;
    omr_sheet: number;
    scanned_pdf: string;
    status: string;
    evaluation_result: any;
    score: number | null;
    max_score: number | null;
    created_at: string;
}

interface OMRManagementProps {
    examId: number;
    examTitle?: string;
}

export default function OMRManagement({ examId, examTitle }: OMRManagementProps) {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [sheets, setSheets] = useState<OMRSheet[]>([]);
    const [submissions, setSubmissions] = useState<OMRSubmission[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [expandedSheet, setExpandedSheet] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'sheets' | 'submissions'>('sheets');

    useEffect(() => {
        fetchOMRData();
    }, [examId]);

    const fetchOMRData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [sheetsRes, submissionsRes] = await Promise.all([
                api.get(`/omr/sheets/?exam_id=${examId}`),
                api.get(`/omr/submissions/?exam_id=${examId}`)
            ]);

            setSheets(sheetsRes.data.results || sheetsRes.data || []);
            setSubmissions(submissionsRes.data.results || submissionsRes.data || []);
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

            setSuccess('OMR sheet generated successfully!');
            await fetchOMRData();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Failed to generate OMR sheet:', err);
            setError(err.response?.data?.error || 'Failed to generate OMR sheet');
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
            setError(err.response?.data?.error || 'Failed to upload scanned sheet');
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
            setError(err.response?.data?.error || 'Failed to evaluate submission');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'generated':
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {status === 'generated' ? 'Generated' : 'Completed'}
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

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('sheets')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'sheets'
                            ? 'bg-green-100 text-green-700'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    OMR Sheets ({sheets.length})
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'submissions'
                            ? 'bg-green-100 text-green-700'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Submissions ({submissions.length})
                </button>
            </div>

            {activeTab === 'sheets' && (
                <>
                    {sheets.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-sm">No OMR sheets generated yet</p>
                            <p className="text-xs mt-1">Click "Generate OMR Sheet" to create one</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sheets.map((sheet) => (
                                <div
                                    key={sheet.id}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setExpandedSheet(expandedSheet === sheet.id ? null : sheet.id)}
                                                className="p-1 text-slate-400 hover:text-slate-600"
                                            >
                                                {expandedSheet === sheet.id ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                            <div>
                                                <p className="font-medium text-slate-900">Sheet ID: {sheet.sheet_id}</p>
                                                <p className="text-xs text-slate-500">
                                                    Created: {new Date(sheet.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(sheet.status)}
                                            <div className="flex gap-2">
                                                {sheet.pdf_file && (
                                                    <a
                                                        href={sheet.pdf_file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Download OMR Sheet"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {sheet.answer_key_pdf && (
                                                    <a
                                                        href={sheet.answer_key_pdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Download Answer Key"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedSheet === sheet.id && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-500">Status:</span>
                                                    <span className="ml-2 text-slate-900">{sheet.status}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Created:</span>
                                                    <span className="ml-2 text-slate-900">
                                                        {new Date(sheet.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'submissions' && (
                <>
                    {/* Upload Section */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Upload className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Upload Scanned OMR Sheets</p>
                                    <p className="text-xs text-slate-500">PDF or image files of scanned answer sheets</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="omr-upload"
                                />
                                <label
                                    htmlFor="omr-upload"
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                                >
                                    Select File
                                </label>
                                {selectedFile && (
                                    <>
                                        <span className="text-xs text-slate-600">{selectedFile.name}</span>
                                        <button
                                            onClick={handleUploadSubmission}
                                            disabled={uploading}
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {uploading ? 'Uploading...' : 'Upload & Evaluate'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submissions List */}
                    {submissions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-sm">No submissions yet</p>
                            <p className="text-xs mt-1">Upload scanned OMR sheets to evaluate</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">Submission #{submission.id}</p>
                                            <p className="text-xs text-slate-500">
                                                Submitted: {new Date(submission.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {submission.score !== null && (
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-slate-900">
                                                        {submission.score}/{submission.max_score}
                                                    </p>
                                                    <p className="text-xs text-slate-500">Score</p>
                                                </div>
                                            )}
                                            {getStatusBadge(submission.status)}
                                            <div className="flex gap-2">
                                                {submission.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleEvaluate(submission.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Evaluate"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {submission.scanned_pdf && (
                                                    <a
                                                        href={submission.scanned_pdf}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Scanned Sheet"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
