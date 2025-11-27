/**
 * ImportSummary Component
 * Display results after bulk import of questions
 */
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface ImportError {
  question_id: number;
  question_text: string;
  error: string;
}

interface ImportResult {
  success: boolean;
  total_questions: number;
  imported_count: number;
  failed_count: number;
  errors: ImportError[];
  message: string;
}

interface ImportSummaryProps {
  result: ImportResult;
  onViewQuestions: () => void;
  onClose: () => void;
}

const ImportSummary: React.FC<ImportSummaryProps> = ({
  result,
  onViewQuestions,
  onClose,
}) => {
  const successRate = result.total_questions > 0
    ? (result.imported_count / result.total_questions) * 100
    : 0;

  const isFullSuccess = result.imported_count === result.total_questions;
  const isPartialSuccess = result.imported_count > 0 && result.failed_count > 0;
  const isFullFailure = result.imported_count === 0 && result.failed_count > 0;

  return (
    <div className="space-y-6">
      {/* Header with Status Icon */}
      <div className="text-center">
        {isFullSuccess && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        )}
        {isPartialSuccess && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <AlertTriangle size={32} className="text-yellow-600" />
          </div>
        )}
        {isFullFailure && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isFullSuccess && 'Import Successful!'}
          {isPartialSuccess && 'Partial Import'}
          {isFullFailure && 'Import Failed'}
        </h2>
        
        <p className="text-gray-600">
          {result.message || 'Questions have been processed'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {result.total_questions}
          </div>
          <div className="text-sm text-blue-700">Total Questions</div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {result.imported_count}
          </div>
          <div className="text-sm text-green-700">Successfully Imported</div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-600 mb-1">
            {result.failed_count}
          </div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
      </div>

      {/* Success Rate Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Success Rate</span>
          <span className="font-bold text-gray-900">{successRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              successRate === 100
                ? 'bg-green-500'
                : successRate >= 50
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Error Details */}
      {result.errors && result.errors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <XCircle size={20} className="mr-2 text-red-500" />
            Failed Questions ({result.errors.length})
          </h3>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {result.errors.map((error, index) => (
              <div
                key={error.question_id || index}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <XCircle size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {error.question_text.substring(0, 100)}
                      {error.question_text.length > 100 && '...'}
                    </p>
                    <p className="text-xs text-red-700">
                      <span className="font-medium">Error:</span> {error.error}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Failed questions were not imported. You can fix the issues
              and try importing them again, or edit them manually in the question editor.
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isFullSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 mb-1">
                All questions imported successfully!
              </p>
              <p className="text-sm text-green-700">
                {result.imported_count} question{result.imported_count !== 1 ? 's have' : ' has'} been
                added to your exam. You can now view and manage them in the question editor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Partial Success Message */}
      {isPartialSuccess && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Partial import completed
              </p>
              <p className="text-sm text-yellow-700">
                {result.imported_count} question{result.imported_count !== 1 ? 's were' : ' was'} imported
                successfully, but {result.failed_count} failed. Review the errors above and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>

        {result.imported_count > 0 && (
          <button
            onClick={onViewQuestions}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>View Questions</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Additional Info */}
      <div className="text-center text-xs text-gray-500">
        Import completed at {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default ImportSummary;
