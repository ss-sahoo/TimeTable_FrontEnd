/**
 * DocumentPreAnalysis Component
 * Displays pre-analysis results including document type, detected subjects,
 * and allows user to confirm before proceeding to extraction
 */
import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  BookOpen,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface SubjectCount {
  [subject: string]: number;
}

interface PreAnalysisResult {
  job_id: string;
  is_valid: boolean;
  document_type: string;
  document_type_display: string;
  confidence: number;
  detected_subjects: string[];
  matched_subjects: string[];
  unmatched_subjects: string[];
  subject_question_counts: SubjectCount;
  total_estimated_questions: number;
  error_message?: string;
  reason?: string;
  message?: string;
}

interface DocumentPreAnalysisProps {
  result: PreAnalysisResult;
  onConfirm: () => void;
  onReupload: () => void;
  onViewSubjects: () => void;
  isLoading?: boolean;
}

const DocumentPreAnalysis: React.FC<DocumentPreAnalysisProps> = ({
  result,
  onConfirm,
  onReupload,
  onViewSubjects,
  isLoading = false,
}) => {
  const getDocumentTypeIcon = () => {
    switch (result.document_type) {
      case 'questions_with_answers':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'questions_only':
        return <FileText className="text-blue-500" size={24} />;
      default:
        return <XCircle className="text-red-500" size={24} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Invalid document - show error
  if (!result.is_valid) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <XCircle className="text-red-500" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Invalid Document
            </h3>
            <p className="text-sm text-gray-500">
              This document cannot be used for question extraction
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-medium text-red-800">
                {result.error_message || 'This document does not contain questions.'}
              </p>
              {result.reason && (
                <p className="text-sm text-red-600 mt-1">{result.reason}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onReupload}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={20} />
          <span>Upload a Different File</span>
        </button>
      </div>
    );
  }


  // Valid document - show analysis results
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-green-100 rounded-full">
          {getDocumentTypeIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Document Analysis Complete
          </h3>
          <p className="text-sm text-gray-500">
            {result.message || `Found ${result.total_estimated_questions} questions`}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
          {Math.round(result.confidence * 100)}% confidence
        </div>
      </div>

      {/* Document Type */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <BookOpen className="text-gray-500" size={20} />
          <span className="text-sm font-medium text-gray-700">Document Type</span>
        </div>
        <p className="text-lg font-semibold text-gray-900 ml-8">
          {result.document_type_display}
        </p>
      </div>

      {/* Subjects Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Detected Subjects ({result.matched_subjects.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.matched_subjects.map((subject) => (
            <div
              key={subject}
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <span className="font-medium text-blue-900">{subject}</span>
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                ~{result.subject_question_counts[subject] || '?'} questions
              </span>
            </div>
          ))}
        </div>

        {/* Unmatched subjects warning */}
        {result.unmatched_subjects.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Some subjects not in pattern
                </p>
                <p className="text-sm text-yellow-600">
                  {result.unmatched_subjects.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total Questions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">
            Total Estimated Questions
          </span>
          <span className="text-2xl font-bold text-green-800">
            {result.total_estimated_questions}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onViewSubjects}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileText size={20} />
          <span>Preview Subject Content</span>
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Proceed to Extraction</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Reupload option */}
      <div className="mt-4 text-center">
        <button
          onClick={onReupload}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Upload a different file
        </button>
      </div>
    </div>
  );
};

export default DocumentPreAnalysis;
