import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
    Upload,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Loader2,
    Cpu,
    X,
    KeyRound,
    Send,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface AnswerKeyJob {
    job_id: string;
    status: JobStatus;
    progress_percent: number;
    error_message: string;
}

interface AnswerKeyRow {
    id: number;
    question_number: number;
    extracted_answer: string;
    current_answer: string;
    match_status: 'matched' | 'unmatched';
    matched_question_id: number | null;
    skip: boolean;
    is_applied: boolean;
    apply_error: string;
}

interface AnswerKeyPreview {
    job_id: string;
    status: 'completed';
    summary: { total: number; matched: number; unmatched: number };
    rows: AnswerKeyRow[];
}

interface ApplyResult {
    job_id: string;
    updated: number;
    skipped: number;
    unmatched: number;
    errors: { row_id: number; error: string }[];
}

type Phase = 'select' | 'processing' | 'review' | 'applied';

export default function AnswerKeyUploadPage() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState<any>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [phase, setPhase] = useState<Phase>('select');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [jobStatusText, setJobStatusText] = useState('Initializing...');

    const [summary, setSummary] = useState<AnswerKeyPreview['summary']>({ total: 0, matched: 0, unmatched: 0 });
    const [rows, setRows] = useState<AnswerKeyRow[]>([]);
    const [rowSavingId, setRowSavingId] = useState<number | null>(null);
    const [rowSavedId, setRowSavedId] = useState<number | null>(null);

    const [applying, setApplying] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
    const [errorsOpen, setErrorsOpen] = useState(false);

    // Fetch exam for header context
    useEffect(() => {
        if (!examId) return;
        (async () => {
            try {
                const res = await api.get(`/exams/exams/${examId}/`);
                setExam(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingConfig(false);
            }
        })();
    }, [examId]);

    // Poll job status
    useEffect(() => {
        if (!jobId || phase !== 'processing') return;

        const interval = setInterval(async () => {
            try {
                const res = await api.get<AnswerKeyJob>(`/questions/answer-keys/${jobId}/status/`);
                const job = res.data;

                if (job.status === 'completed') {
                    setProgress(100);
                    setJobStatusText('Extraction complete');
                    const previewRes = await api.get<AnswerKeyPreview>(`/questions/answer-keys/${jobId}/preview/`);
                    setSummary(previewRes.data.summary);
                    setRows(previewRes.data.rows);
                    setTimeout(() => setPhase('review'), 600);
                } else if (job.status === 'failed') {
                    setError(job.error_message || 'Extraction failed');
                    setPhase('select');
                } else {
                    setJobStatusText(job.status === 'pending' ? 'Queued for processing...' : 'Processing answer key...');
                    setProgress(job.progress_percent || 0);
                }
            } catch (e: any) {
                console.error(e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, phase]);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles?.length) {
            setFile(acceptedFiles[0]);
            setError(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
        },
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file || !exam) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('exam_id', String(exam.id));

        try {
            const res = await api.post('/questions/answer-keys/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setJobId(res.data.job_id);
            setProgress(0);
            setJobStatusText('Initializing...');
            setPhase('processing');
        } catch (err: any) {
            console.error(err);
            const msg = getErrorMessage(err, err.message || 'Upload failed');
            setError(msg);
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleRetry = () => {
        setFile(null);
        setError(null);
        setJobId(null);
        setProgress(0);
        setRows([]);
        setSummary({ total: 0, matched: 0, unmatched: 0 });
        setPhase('select');
    };

    const patchRow = async (rowId: number, patch: Partial<Pick<AnswerKeyRow, 'extracted_answer' | 'skip'>>) => {
        setRowSavingId(rowId);
        try {
            const res = await api.patch<AnswerKeyRow>(`/questions/extracted-answers/${rowId}/`, patch);
            setRows((prev) => prev.map((r) => (r.id === rowId ? res.data : r)));
            setRowSavedId(rowId);
            setTimeout(() => {
                setRowSavedId((cur) => (cur === rowId ? null : cur));
            }, 1200);
        } catch (err: any) {
            const msg = getErrorMessage(err, 'Failed to update row');
            toast.error(msg);
        } finally {
            setRowSavingId((cur) => (cur === rowId ? null : cur));
        }
    };

    const handleApply = async () => {
        if (!jobId) return;
        setApplying(true);
        setConfirmOpen(false);
        try {
            const res = await api.post<ApplyResult>(`/questions/answer-keys/${jobId}/apply/`, {});
            setApplyResult(res.data);
            setPhase('applied');
        } catch (err: any) {
            const msg = getErrorMessage(err, err.message || 'Failed to apply answers');
            toast.error(msg);
        } finally {
            setApplying(false);
        }
    };

    const handleDone = () => {
        navigate(`/exams/${examId}`);
    };

    // --- RENDER ---

    if (loadingConfig) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // SELECT
    if (phase === 'select') {
        return (
            <div className="min-h-screen bg-slate-50 p-8 relative overflow-hidden">
                <button
                    onClick={() => navigate(`/exams/${examId}`)}
                    className="fixed left-6 top-6 z-50 rounded-full bg-white p-3 shadow-lg ring-1 ring-slate-100 hover:scale-105 active:scale-95"
                    title="Back to exam"
                >
                    <X className="h-6 w-6 text-slate-500" />
                </button>
                <main className="mx-auto max-w-4xl relative z-10 pt-20">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="rounded-2xl bg-indigo-100 p-3">
                            <KeyRound className="h-7 w-7 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Upload Answer Key</h1>
                    </div>
                    <p className="text-center text-slate-600 mb-8">
                        Extract correct answers from an answer-key document and apply them to
                        <span className="font-semibold text-slate-800"> {exam?.name || 'this exam'}</span>.
                    </p>

                    <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            <p className="font-semibold mb-0.5">This will OVERWRITE existing answers for matched question numbers.</p>
                            <p className="text-amber-800">
                                The current correct answer on each matched question will be replaced. This cannot be undone — make sure
                                you review the extracted values before applying.
                            </p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl bg-white p-10 shadow-xl ring-1 ring-slate-900/5"
                    >
                        <div
                            {...getRootProps()}
                            className={`group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                                isDragActive
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className="rounded-full bg-indigo-50 p-6 shadow-sm group-hover:scale-110 transition-transform">
                                <Upload className="h-10 w-10 text-indigo-600" />
                            </div>
                            <p className="mt-6 text-xl font-medium text-slate-800">
                                {file ? file.name : 'Drop answer-key file here'}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">PDF, DOCX, PNG, or JPG</p>
                        </div>

                        {error && (
                            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2 text-sm text-red-700">
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {file && (
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="mt-6 w-full rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" /> Upload & Extract
                                    </>
                                )}
                            </button>
                        )}
                    </motion.div>
                </main>
            </div>
        );
    }

    // PROCESSING
    if (phase === 'processing') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-8 max-w-2xl mx-auto text-center px-8">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-75"></div>
                    <div className="relative rounded-full bg-white p-8 shadow-xl ring-1 ring-slate-100">
                        <Cpu className="h-16 w-16 animate-pulse text-indigo-600" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{jobStatusText}</h2>
                    <p className="text-slate-500">
                        Extracting answers from <span className="font-bold text-slate-800">{file?.name}</span>
                    </p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <p className="text-xs text-slate-400">{progress}% complete</p>
            </div>
        );
    }

    // REVIEW
    if (phase === 'review') {
        return (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 rounded-full">
                            <KeyRound className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">Review Extracted Answers</h1>
                            <p className="text-xs text-slate-500">
                                {summary.matched} matched · {summary.unmatched} unmatched · {summary.total} total
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/exams/${examId}`)}
                            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setConfirmOpen(true)}
                            disabled={applying || summary.matched === 0}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Apply answers
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900">
                                <p className="font-semibold">
                                    Applying will overwrite the correct answer for {summary.matched} matched question
                                    {summary.matched === 1 ? '' : 's'}. This cannot be undone.
                                </p>
                                <p className="text-amber-800 mt-1">
                                    For multi-correct MCQs, separate values with a comma (e.g. <code className="font-mono">A, C</code>) or
                                    pipe.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold w-16">Q#</th>
                                        <th className="px-4 py-3 text-left font-semibold">Current answer</th>
                                        <th className="px-4 py-3 text-left font-semibold w-64">Extracted answer</th>
                                        <th className="px-4 py-3 text-left font-semibold w-32">Status</th>
                                        <th className="px-4 py-3 text-center font-semibold w-24">Skip</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((row) => (
                                        <ReviewRow
                                            key={row.id}
                                            row={row}
                                            saving={rowSavingId === row.id}
                                            justSaved={rowSavedId === row.id}
                                            onPatch={(patch) => patchRow(row.id, patch)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {confirmOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6">
                                <div className="flex gap-3 items-start mb-4">
                                    <div className="rounded-full bg-amber-100 p-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Apply answer key?</h3>
                                        <p className="text-sm text-slate-600 mt-1">
                                            This will overwrite the correct answer on {summary.matched} matched question
                                            {summary.matched === 1 ? '' : 's'}. Existing answers will be replaced. This action cannot be
                                            undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex justify-end gap-2">
                                <button
                                    onClick={() => setConfirmOpen(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-5 py-2 text-sm font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    <Send className="h-4 w-4" /> Apply answers
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // APPLIED
    if (phase === 'applied' && applyResult) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <main className="mx-auto max-w-2xl pt-20">
                    <div className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-900/5 p-10">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="rounded-full bg-green-100 p-4 mb-4">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">Answers applied</h2>
                            <p className="text-slate-500 text-sm">{exam?.name}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-center">
                                <div className="text-3xl font-extrabold text-green-700">{applyResult.updated}</div>
                                <div className="text-xs font-semibold text-green-800 uppercase tracking-wide mt-1">Updated</div>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                                <div className="text-3xl font-extrabold text-slate-700">{applyResult.skipped}</div>
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-1">Skipped</div>
                            </div>
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
                                <div className="text-3xl font-extrabold text-amber-700">{applyResult.unmatched}</div>
                                <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide mt-1">Unmatched</div>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 text-center mb-6">
                            {applyResult.updated} answer{applyResult.updated === 1 ? '' : 's'} applied. {applyResult.skipped} skipped.{' '}
                            {applyResult.unmatched} could not be matched.
                        </p>

                        {applyResult.errors.length > 0 && (
                            <div className="mb-6 rounded-xl border border-red-200 bg-red-50">
                                <button
                                    onClick={() => setErrorsOpen((v) => !v)}
                                    className="w-full flex items-center justify-between p-4 text-left"
                                >
                                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                                        <AlertCircle className="h-4 w-4" />
                                        {applyResult.errors.length} row{applyResult.errors.length === 1 ? '' : 's'} could not be applied
                                    </div>
                                    {errorsOpen ? (
                                        <ChevronUp className="h-4 w-4 text-red-700" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-red-700" />
                                    )}
                                </button>
                                {errorsOpen && (
                                    <ul className="border-t border-red-200 divide-y divide-red-100 max-h-64 overflow-y-auto">
                                        {applyResult.errors.map((e) => (
                                            <li key={e.row_id} className="px-4 py-2 text-xs text-red-800">
                                                <span className="font-mono font-bold">Row #{e.row_id}:</span> {e.error}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex-1 px-5 py-3 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                                Upload another
                            </button>
                            <button
                                onClick={handleDone}
                                className="flex-1 px-5 py-3 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return null;
}

// --- Subcomponents ---

interface ReviewRowProps {
    row: AnswerKeyRow;
    saving: boolean;
    justSaved: boolean;
    onPatch: (patch: Partial<Pick<AnswerKeyRow, 'extracted_answer' | 'skip'>>) => void;
}

function ReviewRow({ row, saving, justSaved, onPatch }: ReviewRowProps) {
    const [draft, setDraft] = useState(row.extracted_answer);
    const initialRef = useRef(row.extracted_answer);

    useEffect(() => {
        setDraft(row.extracted_answer);
        initialRef.current = row.extracted_answer;
    }, [row.extracted_answer]);

    const commit = () => {
        const trimmed = draft.trim();
        if (trimmed === initialRef.current) return;
        onPatch({ extracted_answer: trimmed });
    };

    const isUnmatched = row.match_status === 'unmatched';

    return (
        <tr className={`${isUnmatched ? 'bg-amber-50/40' : ''} ${row.skip ? 'opacity-50' : ''}`}>
            <td className="px-4 py-3 font-mono font-semibold text-slate-700">{row.question_number}</td>
            <td className="px-4 py-3 text-slate-600">
                {row.current_answer ? (
                    <span className="line-clamp-2">{row.current_answer}</span>
                ) : (
                    <span className="text-slate-400 italic">empty</span>
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        placeholder='e.g. "A" or "A, C"'
                        disabled={row.skip || row.is_applied}
                        className="flex-1 px-3 py-1.5 text-sm rounded-md border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                    {justSaved && !saving && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                </div>
            </td>
            <td className="px-4 py-3">
                {isUnmatched ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Unmatched
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" /> Matched
                    </span>
                )}
            </td>
            <td className="px-4 py-3 text-center">
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={row.skip}
                        onChange={(e) => onPatch({ skip: e.target.checked })}
                        disabled={row.is_applied}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                </label>
            </td>
        </tr>
    );
}
