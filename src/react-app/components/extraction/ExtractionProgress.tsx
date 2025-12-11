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
  // V2 fields
  completeness?: number;
  has_latex?: boolean;
  type_distribution?: Record<string, number>;
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

        // Handle completion states - 'completed' and 'partial' both mean extraction is done
        if (data.status === 'completed' || data.status === 'partial') {
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
      case 'partial':
        return <CheckCircle className="text-yellow-500" size={24} />;
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
      case 'partial':
        return 'Extraction partially complete';
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
                : progress.status === 'partial'
                ? 'bg-yellow-500'
                : progress.status === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Questions Found</p>
          <p className="text-2xl font-bold text-gray-900">
            {progress.total_questions_found}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Extracted</p>
          <p className="text-2xl font-bold text-gray-900">
            {progress.questions_extracted}
          </p>
        </div>
        {progress.completeness !== undefined && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Completeness</p>
            <p className={`text-2xl font-bold ${
              progress.completeness >= 95 ? 'text-green-600' : 
              progress.completeness >= 80 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {progress.completeness.toFixed(0)}%
            </p>
          </div>
        )}
        {progress.has_latex && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">LaTeX Detected</p>
            <p className="text-2xl font-bold text-purple-700">✓</p>
          </div>
        )}
      </div>

      {/* Type Distribution */}
      {progress.type_distribution && Object.keys(progress.type_distribution).length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-700 mb-2">Question Types Detected:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(progress.type_distribution).map(([type, count]) => (
              <span key={type} className="text-xs px-2 py-1 bg-white text-blue-700 rounded border border-blue-200">
                {type.replace('_', ' ')}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {progress.error_message && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{progress.error_message}</p>
        </div>
      )}

      {/* Processing Steps - Updated with new flow */}
      {progress.status === 'processing' && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 15 ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
              }`}
            />
            <span className="text-sm text-gray-600">Step 1: Parsing file</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 25 ? 'bg-green-500' : 
                progress.progress_percent >= 15 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Step 2: Pre-analyzing content (counting questions)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 75 ? 'bg-green-500' : 
                progress.progress_percent >= 30 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Step 3: Extracting ALL questions with AI</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 85 ? 'bg-green-500' : 
                progress.progress_percent >= 75 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Step 4: Categorizing questions by subject</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 95 ? 'bg-green-500' : 
                progress.progress_percent >= 85 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Step 5: Saving extracted questions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                progress.progress_percent >= 100 ? 'bg-green-500' : 
                progress.progress_percent >= 95 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">Step 6: Finalizing extraction</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractionProgress;
