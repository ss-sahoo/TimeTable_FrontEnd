/**
 * QuestionBulkImport Container Component
 * Main workflow orchestrator for AI-powered question extraction and import
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import FileUploader from './FileUploader';
import DocumentPreAnalysis from './DocumentPreAnalysis';
import SubjectPreview from './SubjectPreview';
import ExtractionProgress from './ExtractionProgress';
import QuestionPreview from './QuestionPreview';
import SectionMapper from './SectionMapper';
import ImportSummary from './ImportSummary';
import { api } from '../../hooks/useApi';

interface PreAnalysisResult {
  job_id: string;
  is_valid: boolean;
  document_type: string;
  document_type_display: string;
  confidence: number;
  detected_subjects: string[];
  matched_subjects: string[];
  unmatched_subjects: string[];
  subject_question_counts: Record<string, number>;
  total_estimated_questions: number;
  error_message?: string;
  reason?: string;
  message?: string;
}

interface SubjectData {
  subject: string;
  question_count: number;
  content_preview: string;
  full_content_length: number;
  download_url: string;
}

interface QuestionBulkImportProps {
  examId: number;
  patternId: number;
  onClose: () => void;
  onImportComplete: () => void;
}

type WorkflowStep = 'upload' | 'pre-analysis' | 'subject-preview' | 'extracting' | 'preview' | 'mapping' | 'importing' | 'summary';

interface ExtractedQuestion {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  solution: string;
  explanation: string;
  difficulty: string;
  confidence_score: number;
  requires_review: boolean;
  suggested_subject: string;
  suggested_section_id: number | null;
  assigned_subject: string;
  assigned_section_id: number | null;
  structure?: any;
}

interface ImportResult {
  success: boolean;
  total_questions: number;
  imported_count: number;
  failed_count: number;
  errors: Array<{
    question_id: number;
    question_text: string;
    error: string;
  }>;
  message: string;
}

const QuestionBulkImport: React.FC<QuestionBulkImportProps> = ({
  examId,
  patternId,
  onClose,
  onImportComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [jobId, setJobId] = useState<string>('');
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [sectionMappings, setSectionMappings] = useState<Record<number, number>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preAnalysisResult, setPreAnalysisResult] = useState<PreAnalysisResult | null>(null);
  const [preAnalysisJobId, setPreAnalysisJobId] = useState<string>('');
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [confirmingPreAnalysis, setConfirmingPreAnalysis] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      // First, run pre-analysis
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pattern_id', patternId.toString());

      const response = await api.post('/questions/pre-analyze/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPreAnalysisResult(response.data);
      setPreAnalysisJobId(response.data.job_id);
      setCurrentStep('pre-analysis');
    } catch (err: any) {
      console.error('Pre-analysis failed:', err);
      setError(err.response?.data?.error || 'Failed to analyze document');
    } finally {
      setUploading(false);
    }
  };

  const handlePreAnalysisConfirm = async () => {
    if (!preAnalysisResult?.is_valid) return;

    setConfirmingPreAnalysis(true);
    setError('');

    try {
      const response = await api.post(`/questions/pre-analyze/${preAnalysisJobId}/confirm/`, {
        confirmed_subjects: preAnalysisResult.matched_subjects,
        exam_id: examId,
        proceed_to_extraction: true,
      });

      setJobId(response.data.extraction_job_id);
      setCurrentStep('extracting');
    } catch (err: any) {
      console.error('Confirm failed:', err);
      setError(err.response?.data?.error || 'Failed to start extraction');
    } finally {
      setConfirmingPreAnalysis(false);
    }
  };

  const handleViewSubjects = async () => {
    try {
      const response = await api.get(`/questions/pre-analyze/${preAnalysisJobId}/subjects/`);
      setSubjectData(response.data.subjects);
      setCurrentStep('subject-preview');
    } catch (err: any) {
      console.error('Failed to load subjects:', err);
      setError(err.response?.data?.error || 'Failed to load subject content');
    }
  };

  const handleDownloadSubject = async (subject: string) => {
    try {
      const response = await api.get(
        `/questions/pre-analyze/${preAnalysisJobId}/subjects/${subject.toLowerCase()}/download/`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${subject}_Questions.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Download failed:', err);
      setError('Failed to download file');
    }
  };

  const handleBackToPreAnalysis = () => {
    setCurrentStep('pre-analysis');
  };

  const handleExtractionComplete = () => {
    setCurrentStep('preview');
  };

  const handleExtractionError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('upload');
  };

  const handleQuestionsLoaded = (loadedQuestions: ExtractedQuestion[]) => {
    setQuestions(loadedQuestions);
  };

  const handleSelectionChange = (selectedIds: number[]) => {
    setSelectedQuestionIds(selectedIds);
  };

  const handleProceedToMapping = () => {
    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question to import');
      return;
    }
    setError('');
    setCurrentStep('mapping');
  };

  const handleMappingComplete = (mappings: Record<number, number>) => {
    setSectionMappings(mappings);
  };

  const handleImport = async () => {
    // Validate that all selected questions are mapped
    const unmappedQuestions = selectedQuestionIds.filter(id => !sectionMappings[id]);

    if (unmappedQuestions.length > 0) {
      setError(`${unmappedQuestions.length} question(s) are not assigned to any section`);
      return;
    }

    setError('');
    setImporting(true);
    setCurrentStep('importing');

    try {
      // Prepare import data
      const importData = {
        job_id: jobId,
        exam_id: examId,
        question_ids: selectedQuestionIds,
        section_mappings: sectionMappings,
      };

      const response = await api.post('/questions/bulk-import-extracted/', importData);

      setImportResult(response.data);
      setCurrentStep('summary');

      // If import was successful, notify parent
      if (response.data.success && response.data.imported_count > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      console.error('Import failed:', err);

      // Handle error response
      const errorMessage = err.response?.data?.error || 'Failed to import questions';
      const errorDetails = err.response?.data?.errors || [];

      setImportResult({
        success: false,
        total_questions: selectedQuestionIds.length,
        imported_count: 0,
        failed_count: selectedQuestionIds.length,
        errors: errorDetails,
        message: errorMessage,
      });

      setCurrentStep('summary');
    } finally {
      setImporting(false);
    }
  };

  const handleBackToPreview = () => {
    setCurrentStep('preview');
    setError('');
  };

  const handleViewQuestions = () => {
    onClose();
    // Navigate to question list (handled by parent)
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setJobId('');
    setQuestions([]);
    setSelectedQuestionIds([]);
    setSectionMappings({});
    setImportResult(null);
    setError('');
    setPreAnalysisResult(null);
    setPreAnalysisJobId('');
    setSubjectData([]);
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'upload':
        return 'Upload Question File';
      case 'pre-analysis':
        return 'Document Analysis';
      case 'subject-preview':
        return 'Subject Preview';
      case 'extracting':
        return 'Extracting Questions';
      case 'preview':
        return 'Review Extracted Questions';
      case 'mapping':
        return 'Assign to Sections';
      case 'importing':
        return 'Importing Questions';
      case 'summary':
        return 'Import Complete';
      default:
        return 'Bulk Import';
    }
  };

  const getStepNumber = (): string => {
    const steps: Record<WorkflowStep, string> = {
      'upload': '1',
      'pre-analysis': '2',
      'subject-preview': '2',
      'extracting': '3',
      'preview': '4',
      'mapping': '5',
      'importing': '6',
      'summary': '7',
    };
    return steps[currentStep] || '1';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                {getStepNumber()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              AI-powered question extraction and bulk import
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={importing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps - Updated Flow */}
        {currentStep !== 'summary' && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              {['Upload', 'Extract & Categorize', 'Review', 'Map', 'Import'].map((step, index) => {
                const stepKeys: WorkflowStep[] = ['upload', 'extracting', 'preview', 'mapping', 'importing'];
                // Map current step to the simplified flow
                let mappedStep = currentStep;
                if (currentStep === 'pre-analysis' || currentStep === 'subject-preview') {
                  mappedStep = 'extracting'; // Pre-analysis is part of extraction flow
                }
                const currentIndex = stepKeys.indexOf(mappedStep as WorkflowStep);
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;

                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span
                        className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                          }`}
                      >
                        {step}
                      </span>
                    </div>
                    {index < 4 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 transition-colors ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'upload' && (
            <div>
              <FileUploader
                onFileSelect={handleFileSelect}
                maxSizeMB={10}
              />
              {uploading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
                  <span className="text-gray-600">Analyzing document...</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 'pre-analysis' && preAnalysisResult && (
            <DocumentPreAnalysis
              result={preAnalysisResult}
              onConfirm={handlePreAnalysisConfirm}
              onReupload={handleStartOver}
              onViewSubjects={handleViewSubjects}
              isLoading={confirmingPreAnalysis}
            />
          )}

          {currentStep === 'subject-preview' && (
            <SubjectPreview
              jobId={preAnalysisJobId}
              subjects={subjectData}
              documentType={preAnalysisResult?.document_type || ''}
              totalQuestions={preAnalysisResult?.total_estimated_questions || 0}
              onBack={handleBackToPreAnalysis}
              onDownload={handleDownloadSubject}
            />
          )}

          {currentStep === 'extracting' && (
            <ExtractionProgress
              jobId={jobId}
              onComplete={handleExtractionComplete}
              onError={handleExtractionError}
            />
          )}

          {currentStep === 'preview' && (
            <QuestionPreview
              jobId={jobId}
              onQuestionsLoaded={handleQuestionsLoaded}
              onSelectionChange={handleSelectionChange}
            />
          )}

          {currentStep === 'mapping' && (
            <SectionMapper
              patternId={patternId}
              questions={questions}
              selectedQuestionIds={selectedQuestionIds}
              onMappingComplete={handleMappingComplete}
            />
          )}

          {currentStep === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Importing Questions...
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we add {selectedQuestionIds.length} question(s) to your exam
              </p>
            </div>
          )}

          {currentStep === 'summary' && importResult && (
            <ImportSummary
              result={importResult}
              onViewQuestions={handleViewQuestions}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer Actions */}
        {currentStep !== 'summary' && currentStep !== 'importing' && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div>
              {currentStep === 'mapping' && (
                <button
                  onClick={handleBackToPreview}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Review
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStep === 'preview' && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedQuestionIds.length} question(s) selected
                  </span>
                  <button
                    onClick={handleProceedToMapping}
                    disabled={selectedQuestionIds.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Mapping
                  </button>
                </>
              )}

              {currentStep === 'mapping' && (
                <>
                  <span className="text-sm text-gray-600">
                    {Object.keys(sectionMappings).length}/{selectedQuestionIds.length} mapped
                  </span>
                  <button
                    onClick={handleImport}
                    disabled={Object.keys(sectionMappings).length !== selectedQuestionIds.length}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Import Questions
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBulkImport;
