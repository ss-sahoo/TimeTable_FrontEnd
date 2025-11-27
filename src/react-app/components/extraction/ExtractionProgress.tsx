/**
 * ExtractionProgress Component
 * Displays real-time extraction progress
 */
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../../hooks/useApi';

interface ExtractionProgressProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

interface ProgressData {
  job_id: string;
  status: string;
  progress_percent: number;
  total_questions_found: number;
  questions_extracted: number;
  estimated_time_remaining?: number;
  error_message?: string;
}

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({
  jobId,
  onComplete,
  onError,
}) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const pollStatus = async () => {
      try {
        const response = await api.get(`/questions/extraction-status/${jobId}/`);
        const data = response.data as ProgressData;
        setProgress(data);

        if (data.status === 'completed') {
          setPolling(false);
          onComplete();
        } else if (data.status === 'failed') {
          setPolling(false);
          onError(data.error_message || 'Extraction failed');
        }
      } catch (error) {
        console.error('Failed to fetch extraction status:', error);
        setPolling(false);
        onError('Failed to check extraction status');
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, polling, onComplete, onError]);

  if (!progress) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'failed':
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <Loader2 className="animate-spin text-blue-500" size={24} />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'pending':
        return 'Waiting to start...';
      case 'processing':
        return 'Extracting questions...';
      case 'completed':
        return 'Extraction complete!';
      case 'failed':
        return 'Extraction failed';
      default:
        return progress.status;
    }
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        {getStatusIcon()}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getStatusText()}
          </h3>
          {progress.estimated_time_remaining && progress.status === 'processing' && (
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              Estimated time remaining: {formatTime(progress.estimated_time_remaining)}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress.progress_percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              progress.status === 'completed'
                ? 'bg-green-500'
                : progress.status === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Questions Found</p>
          <p className="text-2xl font-bold text-gray-900">
            {progress.total_questions_found}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Questions Extracted</p>
          <p className="text-2xl font-bold text-gray-900">
            {progress.questions_extracted}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {progress.error_message && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{progress.error_message}</p>
        </div>
      )}

      {/* Processing Steps */}
      {progress.status === 'processing' && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 30 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Parsing file</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 70 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Extracting questions with AI</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 90 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Validating questions</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractionProgress;
