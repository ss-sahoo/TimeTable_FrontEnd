import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2, ArrowRight, X, FileText, ChevronDown } from 'lucide-react';
import { startExtractionV2, checkExtractionStatusV2, ExtractionV2StatusResponse } from './components/ExtractionV2API';
import { api } from '@/react-app/hooks/useApi';

const ExtractionV2Page = () => {
    const { examId } = useParams<{ examId: string }>();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [patternId, setPatternId] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<ExtractionV2StatusResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [patterns, setPatterns] = useState<any[]>([]);
    const [loadingPatterns, setLoadingPatterns] = useState(true);

    useEffect(() => {
        // Fetch patterns to select from
        const fetchPatterns = async () => {
            try {
                // Ensure we handle pagination or verify the data structure
                // Use /patterns/patterns/ because api/patterns/ includes patterns.urls which defines patterns/
                const response = await api.get('/patterns/patterns/');
                // Check if response.data is array or paginated object
                const patternsData = Array.isArray(response.data) ? response.data :
                    (response.data.results ? response.data.results : []);
                setPatterns(patternsData);
            } catch (err) {
                console.error("Failed to fetch patterns", err);
                setError("Could not load exam patterns. Please refresh.");
            } finally {
                setLoadingPatterns(false);
            }
        };
        fetchPatterns();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (jobId && status?.status !== 'completed' && status?.status !== 'failed') {
            interval = setInterval(async () => {
                try {
                    const statusData = await checkExtractionStatusV2(jobId);
                    setStatus(statusData);
                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setError("Extraction failed. Please try again.");
                    }
                } catch (err) {
                    console.error("Failed to poll status", err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [jobId, status?.status]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleStartExtraction = async () => {
        if (!file || !examId || !patternId) {
            setError("Please select a file and an exam pattern.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const data = await startExtractionV2(file, examId, patternId);
            setJobId(data.job_id);
        } catch (err: any) {
            setError(err.message || "Failed to start extraction");
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Go Back"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">New Extraction <span className="text-blue-600 font-normal opacity-80">(V2)</span></h1>
                            <p className="text-xs text-gray-500 font-medium">AI-Question Extraction Microservice</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10 flex flex-col justify-start">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 overflow-hidden relative">

                    {/* Background Decorative Blob */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                    {/* Step 1: Configuration */}
                    {!jobId && (
                        <div className="space-y-8 relative z-10">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Exam Pattern
                                </label>
                                <div className="relative">
                                    <select
                                        value={patternId}
                                        onChange={(e) => setPatternId(e.target.value)}
                                        className="w-full p-4 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all shadow-sm text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                                        disabled={loadingPatterns}
                                    >
                                        <option value="">
                                            {loadingPatterns ? "Loading Patterns..." : "-- Select Exam Pattern --"}
                                        </option>
                                        {patterns.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                                {patterns.length === 0 && !loadingPatterns && (
                                    <p className="text-xs text-amber-600 mt-2">No patterns found. Please create a pattern first.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Upload Question Paper
                                </label>
                                <div className="group border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer relative bg-gray-50/50">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.docx,.txt"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center pointer-events-none transition-transform group-hover:scale-105 duration-300">
                                        <div className="w-20 h-20 bg-white shadow-sm border border-gray-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:shadow-md transition-shadow">
                                            {file ? <FileText className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {file ? file.name : "Click or Drag to Upload"}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                                            {file
                                                ? <span className="text-green-600 font-medium">Ready to extract</span>
                                                : "Supports PDF, DOCX, TXT (Max 50MB)"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </motion.div>
                            )}

                            <button
                                onClick={handleStartExtraction}
                                disabled={isUploading || !file || !patternId}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:translate-y-px active:translate-y-0"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting to Extraction Service...
                                    </>
                                ) : (
                                    <>
                                        Start AI Extraction <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Progress & Status */}
                    {jobId && (
                        <div className="text-center py-10 space-y-10 relative z-10">
                            <div className="relative">
                                {/* Status Indicator */}
                                <div className="flex justify-center mb-8">
                                    {status?.status === 'completed' ? (
                                        <div className="w-28 h-28 bg-green-50 text-green-600 rounded-full flex items-center justify-center ring-8 ring-green-50 shadow-inner">
                                            <CheckCircle className="w-14 h-14" />
                                        </div>
                                    ) : status?.status === 'failed' ? (
                                        <div className="w-28 h-28 bg-red-50 text-red-600 rounded-full flex items-center justify-center ring-8 ring-red-50 shadow-inner">
                                            <X className="w-14 h-14" />
                                        </div>
                                    ) : (
                                        <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center ring-8 ring-blue-50 shadow-inner relative">
                                            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                                            <Loader2 className="w-10 h-10 animate-pulse" />
                                        </div>
                                    )}
                                </div>

                                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {status?.status === 'completed' ? 'Extraction Complete!' :
                                        status?.status === 'failed' ? 'Extraction Failed' :
                                            'Processing Document...'}
                                </h2>
                                <p className="text-gray-500 mt-3 font-medium">
                                    {status?.service_status ? `Microservice Status: ${status.service_status.toUpperCase()}` : "Initializing Microservice..."}
                                </p>
                            </div>

                            {/* Logs / Steps */}
                            <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-8 text-left space-y-5 border border-gray-100">
                                <StepItem status={status?.status === 'completed' ? 'done' : 'processing'} label="Uploading Document" />
                                <StepItem status={status?.status === 'completed' ? 'done' : (status?.status === 'processing' ? 'processing' : 'waiting')} label="AI Analysis (Extraction Service)" />
                                <StepItem status={status?.status === 'completed' ? 'done' : (status?.status === 'processing' ? 'waiting' : 'waiting')} label="Structuring Questions" />
                            </div>

                            <div className="h-16 flex items-center justify-center">
                                {status?.status === 'completed' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <button
                                            onClick={() => navigate(`/exams/${examId}/extraction-v3/review/${jobId}`)}
                                            className="px-10 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                                        >
                                            Review Extracted Questions <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                )}

                                {status?.status === 'failed' && (
                                    <button
                                        onClick={() => { setJobId(null); setStatus(null); }}
                                        className="px-8 py-3 border border-gray-300 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

const StepItem = ({ status, label }: { status: 'waiting' | 'processing' | 'done', label: string }) => (
    <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500
            ${status === 'done' ? 'bg-green-100 text-green-600' :
                status === 'processing' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-200 text-gray-400'}`}>
            {status === 'done' && <CheckCircle className="w-5 h-5" />}
            {status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'waiting' && <div className="w-3 h-3 rounded-full bg-current" />}
        </div>
        <span className={`text-sm ${status === 'waiting' ? 'text-gray-400 font-normal' : 'text-gray-800 font-semibold'}`}>{label}</span>
    </div>
);

export default ExtractionV2Page;
