import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, CheckCircle, XCircle, FileWarning, RefreshCw, X, Download, FileText, Layers, BookOpen, Target } from 'lucide-react';
import { api, getErrorMessage } from '../hooks/useApi';

// Import existing components
import FileUploader from '../components/extraction/FileUploader';
import StepIndicator from '../components/extraction/StepIndicator';
import SubjectContentPreview from '../components/extraction/SubjectContentPreview';
import SectionQuestionExtractor from '../components/extraction/SectionQuestionExtractor';
import ImportTargetSelector, { ImportTarget } from '../components/extraction/ImportTargetSelector';

interface DocumentSection {
  name: string;
  type_hint: string;
  question_range: string;
  question_count?: number;
  format_description: string;
  marks_per_question?: number | null;
  negative_marking?: number | null;
  start_marker?: string;
}

interface MarkingScheme {
  correct_marks?: number;
  negative_marks?: number;
  partial_marks?: number | null;
  description?: string;
}

interface DocumentStructure {
  has_instructions: boolean;
  instructions_text: string;
  marking_scheme?: MarkingScheme;
  sections: DocumentSection[];
  question_numbering_format: string;
  answer_format: string;
  total_sections: number;
  total_questions_detected?: number;
}

interface SectionsBySubject {
  [subject: string]: {
    sections: DocumentSection[];
    has_instructions?: boolean;
    instructions_text?: string;
    error?: string;
  };
}

interface ValidationResult {
  isValid: boolean;
  documentType: string;
  documentTypeDisplay: string;
  confidence: number;
  detectedSubjects: string[];
  matchedSubjects: string[];
  documentStructure?: DocumentStructure | null;
  detectedSectionsPerSubject?: SectionsBySubject | null;
  errorMessage?: string;
  reason?: string;
}

// Helper to parse document structure from API response
const parseDocumentStructure = (data: unknown): DocumentStructure | null => {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  return {
    has_instructions: Boolean(d.has_instructions),
    instructions_text: String(d.instructions_text || ''),
    marking_scheme: (d.marking_scheme as MarkingScheme) || {},
    sections: (d.sections as DocumentSection[]) || [],
    question_numbering_format: String(d.question_numbering_format || 'auto-detect'),
    answer_format: String(d.answer_format || 'auto-detect'),
    total_sections: Number(d.total_sections || 0),
    total_questions_detected: Number(d.total_questions_detected || 0),
  };
};

interface BulkImportState {
  currentStep: number;
  preAnalysisJobId: string | null;
  // Validation states
  isValidating: boolean;
  validationResult: ValidationResult | null;
  showValidationModal: boolean;
  // Import target selection
  importTarget: ImportTarget | null;
  totalEstimatedQuestions: number;
  // Per-subject sections (cached from pre-analysis)
  sectionsBySubject: SectionsBySubject | null;
}

// Enhanced steps - includes structure analysis, target selection, and question extraction
const STEPS = [
  { id: 1, name: 'Upload', icon: Upload, description: 'Upload question file' },
  { id: 2, name: 'Analyze', icon: Layers, description: 'AI detects sections & structure' },
  { id: 3, name: 'Categorize', icon: BookOpen, description: 'Content categorized by subject' },
  { id: 4, name: 'Review', icon: Download, description: 'Review categorized content' },
  { id: 5, name: 'Target', icon: Target, description: 'Select import destination' },
  { id: 6, name: 'Import', icon: CheckCircle, description: 'Extract questions and import' },
];

// Document Structure View Component - Shows detected sections
interface DocumentStructureViewProps {
  documentStructure?: DocumentStructure | null;
  matchedSubjects: string[];
  sectionsBySubject?: SectionsBySubject | null;
  onBack: () => void;
  onProceed: () => void;
}

const DocumentStructureView: React.FC<DocumentStructureViewProps> = ({
  documentStructure,
  matchedSubjects,
  sectionsBySubject,
  onBack,
  onProceed,
}) => {
  const sections = documentStructure?.sections || [];
  const hasStructure = sections.length > 0;
  const hasSubjectSections = sectionsBySubject && Object.keys(sectionsBySubject).length > 0;

  // Calculate total sections from per-subject data
  const totalSubjectSections = hasSubjectSections
    ? Object.values(sectionsBySubject!).reduce((sum, s) => sum + (s.sections?.length || 0), 0)
    : 0;

  // Get section type badge color
  const getSectionTypeColor = (typeHint: string) => {
    const colors: Record<string, string> = {
      'single_mcq': 'bg-blue-100 text-blue-700',
      'multiple_mcq': 'bg-purple-100 text-purple-700',
      'numerical': 'bg-green-100 text-green-700',
      'true_false': 'bg-yellow-100 text-yellow-700',
      'fill_blank': 'bg-orange-100 text-orange-700',
      'matching': 'bg-pink-100 text-pink-700',
      'assertion_reason': 'bg-indigo-100 text-indigo-700',
      'comprehension': 'bg-teal-100 text-teal-700',
      'subjective': 'bg-red-100 text-red-700',
      'unknown': 'bg-gray-100 text-gray-700',
      'mixed': 'bg-gray-100 text-gray-700',
    };
    return colors[typeHint] || colors['unknown'];
  };

  // Format type hint for display
  const formatTypeHint = (typeHint: string) => {
    const labels: Record<string, string> = {
      'single_mcq': 'Single MCQ',
      'multiple_mcq': 'Multiple MCQ',
      'numerical': 'Numerical',
      'true_false': 'True/False',
      'fill_blank': 'Fill in Blank',
      'matching': 'Match the Following',
      'assertion_reason': 'Assertion-Reason',
      'comprehension': 'Comprehension',
      'subjective': 'Subjective',
      'unknown': 'Unknown',
      'mixed': 'Mixed',
    };
    return labels[typeHint] || typeHint;
  };

  // Get subject color
  const getSubjectColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: 'bg-blue-100' },
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', icon: 'bg-green-100' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', icon: 'bg-purple-100' },
      { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'bg-amber-100' },
      { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', icon: 'bg-pink-100' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Layers className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Structure Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI has analyzed your document and detected the following structure
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
            <p className="text-3xl font-bold text-amber-600">
              {hasSubjectSections ? totalSubjectSections : sections.length}
            </p>
            <p className="text-sm text-gray-600">Total Sections</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
            <p className="text-3xl font-bold text-blue-600">{matchedSubjects.length}</p>
            <p className="text-sm text-gray-600">Subjects</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
            <p className="text-3xl font-bold text-green-600">
              {documentStructure?.question_numbering_format?.includes('Q') ? 'Q1, Q2...' : '1, 2...'}
            </p>
            <p className="text-sm text-gray-600">Numbering</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-amber-100">
            <p className="text-3xl font-bold text-purple-600">
              {documentStructure?.has_instructions ? '✓' : '✗'}
            </p>
            <p className="text-sm text-gray-600">Instructions</p>
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      {documentStructure?.has_instructions && documentStructure.instructions_text && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">📋 Document Instructions Detected</h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {documentStructure.instructions_text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Per-Subject Sections (NEW - Enhanced View) */}
      {hasSubjectSections ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gray-600" />
            <span>Sections by Subject ({totalSubjectSections} sections across {Object.keys(sectionsBySubject!).length} subjects)</span>
          </h3>

          <div className="space-y-6">
            {Object.entries(sectionsBySubject!).map(([subject, subjectData], subjectIndex) => {
              const color = getSubjectColor(subjectIndex);
              const subjectSections = subjectData.sections || [];

              return (
                <div key={subject} className={`${color.bg} border ${color.border} rounded-xl overflow-hidden`}>
                  {/* Subject Header */}
                  <div className={`p-4 ${color.icon} border-b ${color.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${color.icon} rounded-lg flex items-center justify-center`}>
                          <BookOpen className={`w-5 h-5 ${color.text}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{subject}</h4>
                          <p className="text-xs text-gray-600">
                            {subjectSections.length} section(s) detected
                          </p>
                        </div>
                      </div>
                      {subjectData.has_instructions && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Has Instructions
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject Sections */}
                  <div className="p-4">
                    {subjectSections.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subjectSections.map((section, sectionIndex) => (
                          <div
                            key={sectionIndex}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className={`w-6 h-6 ${color.icon} rounded-full flex items-center justify-center text-xs font-bold ${color.text}`}>
                                  {sectionIndex + 1}
                                </span>
                                <h5 className="font-medium text-gray-900 text-sm">{section.name}</h5>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSectionTypeColor(section.type_hint)}`}>
                                {formatTypeHint(section.type_hint)}
                              </span>
                            </div>
                            {section.question_range && section.question_range !== 'Unknown' && (
                              <p className="text-xs text-gray-500">Questions: {section.question_range}</p>
                            )}
                            {section.format_description && (
                              <p className="text-xs text-gray-500 mt-1">{section.format_description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No specific sections detected for this subject
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : hasStructure ? (
        /* Fallback: Document-level Sections (Original View) */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <span>Detected Sections ({sections.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-indigo-600">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{section.name}</h4>
                      {section.question_range && section.question_range !== 'Unknown' && (
                        <p className="text-xs text-gray-500">Questions: {section.question_range}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getSectionTypeColor(section.type_hint)}`}>
                    {formatTypeHint(section.type_hint)}
                  </span>
                </div>

                {section.format_description && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                    {section.format_description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Specific Sections Detected</h3>
          <p className="text-sm text-gray-500">
            The document appears to have a general structure without distinct sections.
            Content will be categorized by subject in the next step.
          </p>
        </div>
      )}

      {/* Format Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Question Numbering Format</p>
          <p className="text-lg font-semibold text-gray-900">
            {documentStructure?.question_numbering_format || 'Not detected'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Answer Format</p>
          <p className="text-lg font-semibold text-gray-900">
            {documentStructure?.answer_format || 'Not detected'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Upload
        </button>
        <button
          onClick={onProceed}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <span>Continue to Subject Categorization</span>
          <BookOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Subject Categorization Component - Shows subjects with their content
interface SubjectCategorizationProps {
  matchedSubjects: string[];
  documentStructure?: DocumentStructure | null;
  onBack: () => void;
  onProceed: () => void;
}

const SubjectCategorization: React.FC<SubjectCategorizationProps> = ({
  matchedSubjects,
  documentStructure,
  onBack,
  onProceed,
}) => {
  // Get subject color
  const getSubjectColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-teal-100 text-teal-700 border-teal-200',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subject Categorization</h2>
            <p className="text-sm text-gray-600 mt-1">
              Content has been categorized into {matchedSubjects.length} subject(s)
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
            <p className="text-3xl font-bold text-indigo-600">{matchedSubjects.length}</p>
            <p className="text-sm text-gray-600">Subjects Found</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
            <p className="text-3xl font-bold text-purple-600">{documentStructure?.total_sections || 0}</p>
            <p className="text-sm text-gray-600">Sections</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-100">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
            <p className="text-sm text-gray-600">Ready to Review</p>
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-gray-600" />
          <span>Detected Subjects</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchedSubjects.map((subject, index) => (
            <div
              key={subject}
              className={`rounded-xl p-5 border-2 ${getSubjectColor(index)}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{subject}</h4>
                  <p className="text-sm opacity-75">Content separated</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's Next Info */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Ready for Review</h3>
            <p className="text-sm text-green-800">
              In the next step, you'll be able to preview the content for each subject and download
              individual files. You can review the categorization and make any necessary adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to Structure
        </button>
        <button
          onClick={onProceed}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <span>Review & Download Files</span>
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function BulkImportPage() {
  const { examId, patternId } = useParams<{ examId: string; patternId: string }>();
  const navigate = useNavigate();
  const [autoCreateMode, setAutoCreateMode] = useState(false);
  const [autoCreateConfig, setAutoCreateConfig] = useState({
    examTitle: '',
    patternName: '',
    totalDuration: '',
    startInHours: '24',
  });

  const [state, setState] = useState<BulkImportState>({
    currentStep: 1,
    preAnalysisJobId: null,
    isValidating: false,
    validationResult: null,
    showValidationModal: false,
    importTarget: null,
    totalEstimatedQuestions: 0,
    sectionsBySubject: null,
  });

  const handleFileSelect = async (file: File) => {
    // Fast path: auto create pattern + exam + import directly from PDF
    if (autoCreateMode) {
      setState(prev => ({ ...prev, isValidating: true, showValidationModal: false }));
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (autoCreateConfig.examTitle.trim()) formData.append('exam_title', autoCreateConfig.examTitle.trim());
        if (autoCreateConfig.patternName.trim()) formData.append('pattern_name', autoCreateConfig.patternName.trim());
        if (autoCreateConfig.totalDuration.trim()) formData.append('total_duration', autoCreateConfig.totalDuration.trim());
        if (autoCreateConfig.startInHours.trim()) formData.append('start_in_hours', autoCreateConfig.startInHours.trim());

        const response = await api.post('/questions/auto-create-exam-from-pdf/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const newExamId = response?.data?.exam?.id;
        const newPatternId = response?.data?.pattern?.id;

        if (newExamId && newPatternId) {
          navigate(`/pattern/${newPatternId}/questions?examId=${newExamId}`);
          return;
        }

        setState(prev => ({ ...prev, isValidating: false }));
      } catch (error: unknown) {
        console.error('Auto create exam from PDF failed:', error);
        setState(prev => ({
          ...prev,
          isValidating: false,
          validationResult: {
            isValid: false,
            documentType: 'error',
            documentTypeDisplay: 'Error',
            confidence: 0,
            detectedSubjects: [],
            matchedSubjects: [],
            errorMessage: getErrorMessage(error, 'Failed to auto-create exam from PDF'),
            reason: 'Please try again or use the guided extraction flow.',
          },
          showValidationModal: true,
        }));
      }
      return;
    }

    setState(prev => ({ ...prev, isValidating: true, showValidationModal: true }));

    try {
      // Pre-analyze the file to validate and categorize by subject
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pattern_id', patternId!);

      const preAnalysisResponse = await api.post('/questions/pre-analyze/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = preAnalysisResponse.data;

      const validationResult: ValidationResult = {
        isValid: result.is_valid,
        documentType: result.document_type,
        documentTypeDisplay: result.document_type_display,
        confidence: result.confidence,
        detectedSubjects: result.detected_subjects || [],
        matchedSubjects: result.matched_subjects || [],
        documentStructure: parseDocumentStructure(result.document_structure),
        detectedSectionsPerSubject: result.detected_sections_per_subject || null,
        errorMessage: result.error_message,
        reason: result.reason,
      };

      // Store sections by subject from pre-analysis
      const sectionsBySubject = result.detected_sections_per_subject || null;

      setState(prev => ({
        ...prev,
        isValidating: false,
        validationResult,
        preAnalysisJobId: result.job_id,
        showValidationModal: true,
        totalEstimatedQuestions: result.total_estimated_questions || 0,
        sectionsBySubject,
      }));

    } catch (error: unknown) {
      console.error('Pre-analysis failed:', error);
      setState(prev => ({
        ...prev,
        isValidating: false,
        validationResult: {
          isValid: false,
          documentType: 'error',
          documentTypeDisplay: 'Error',
          confidence: 0,
          detectedSubjects: [],
          matchedSubjects: [],
          errorMessage: getErrorMessage(error, 'Failed to analyze file'),
          reason: 'The file could not be processed. Please try a different file.',
        },
        showValidationModal: true,
      }));
    }
  };

  const handleProceedToAnalysis = () => {
    // Move to step 2 (structure analysis)
    setState(prev => ({
      ...prev,
      showValidationModal: false,
      currentStep: 2
    }));
  };

  const handleProceedToReview = () => {
    // Move to step 4 (review & download)
    setState(prev => ({
      ...prev,
      currentStep: 4
    }));
  };

  const handleCancelValidation = () => {
    setState(prev => ({
      ...prev,
      showValidationModal: false,
      validationResult: null,
      isValidating: false,
      preAnalysisJobId: null,
    }));
  };

  const handleBackToUpload = () => {
    setState(prev => ({
      ...prev,
      currentStep: 1,
      preAnalysisJobId: null,
      validationResult: null,
    }));
  };

  const handleComplete = () => {
    navigate(`/pattern/${patternId}/questions?examId=${examId}`);
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    } else {
      navigate(-1);
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-semibold text-indigo-900">Auto Create Exam from PDF</p>
                  <p className="text-xs text-indigo-700">Creates new pattern + exam + imports questions/options/answers/types automatically.</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={autoCreateMode}
                  onChange={(e) => setAutoCreateMode(e.target.checked)}
                />
              </label>

              {autoCreateMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <input
                    type="text"
                    value={autoCreateConfig.examTitle}
                    onChange={(e) => setAutoCreateConfig(prev => ({ ...prev, examTitle: e.target.value }))}
                    placeholder="Exam title (optional)"
                    className="px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={autoCreateConfig.patternName}
                    onChange={(e) => setAutoCreateConfig(prev => ({ ...prev, patternName: e.target.value }))}
                    placeholder="Pattern name (optional)"
                    className="px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    value={autoCreateConfig.totalDuration}
                    onChange={(e) => setAutoCreateConfig(prev => ({ ...prev, totalDuration: e.target.value }))}
                    placeholder="Duration in minutes (optional)"
                    className="px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    value={autoCreateConfig.startInHours}
                    onChange={(e) => setAutoCreateConfig(prev => ({ ...prev, startInHours: e.target.value }))}
                    placeholder="Start in hours"
                    className="px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            <FileUploader
              onFileSelect={handleFileSelect}
              acceptedFileTypes={['.txt', '.docx', '.doc', '.pdf', '.jpg', '.jpeg', '.png']}
              maxSizeMB={10}
            />
          </div>
        );

      case 2:
        // Structure Analysis step - show detected sections
        if (!state.validationResult) {
          return <div className="text-red-500">Error: No analysis data available</div>;
        }
        return (
          <DocumentStructureView
            documentStructure={state.validationResult.documentStructure}
            matchedSubjects={state.validationResult.matchedSubjects}
            sectionsBySubject={state.sectionsBySubject}
            onBack={handleBackToUpload}
            onProceed={() => setState(prev => ({ ...prev, currentStep: 3 }))}
          />
        );

      case 3:
        // Categorization step - show subjects
        if (!state.validationResult) {
          return <div className="text-red-500">Error: No analysis data available</div>;
        }
        return (
          <SubjectCategorization
            matchedSubjects={state.validationResult.matchedSubjects}
            documentStructure={state.validationResult.documentStructure}
            onBack={() => setState(prev => ({ ...prev, currentStep: 2 }))}
            onProceed={handleProceedToReview}
          />
        );

      case 4:
        // Review & Download step - show subject content preview
        if (!state.preAnalysisJobId || !state.validationResult) {
          return <div className="text-red-500">Error: No analysis data available</div>;
        }
        return (
          <SubjectContentPreview
            preAnalysisJobId={state.preAnalysisJobId}
            matchedSubjects={state.validationResult.matchedSubjects}
            documentStructure={state.validationResult.documentStructure}
            onBack={() => setState(prev => ({ ...prev, currentStep: 3 }))}
            onProceed={() => setState(prev => ({ ...prev, currentStep: 5 }))}
          />
        );

      case 5:
        // Target Selection step - choose where to import
        if (!state.preAnalysisJobId || !state.validationResult) {
          return <div className="text-red-500">Error: No analysis data available</div>;
        }
        return (
          <ImportTargetSelector
            examId={examId!}
            patternId={patternId!}
            matchedSubjects={state.validationResult.matchedSubjects}
            extractedQuestionCount={state.totalEstimatedQuestions}
            documentStructure={state.validationResult.documentStructure}
            onBack={() => setState(prev => ({ ...prev, currentStep: 4 }))}
            onProceed={(target) => setState(prev => ({
              ...prev,
              currentStep: 6,
              importTarget: target
            }))}
          />
        );

      case 6:
        // Extract & Import step - extract questions and import to exam
        if (!state.preAnalysisJobId || !state.validationResult) {
          return <div className="text-red-500">Error: No analysis data available</div>;
        }
        return (
          <SectionQuestionExtractor
            preAnalysisJobId={state.preAnalysisJobId}
            examId={examId!}
            patternId={patternId!}
            matchedSubjects={state.validationResult.matchedSubjects}
            documentStructure={state.validationResult.documentStructure}
            importTarget={state.importTarget}
            onBack={() => setState(prev => ({ ...prev, currentStep: 5 }))}
            onComplete={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Content Categorizer
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Upload your question file and get it categorized by subject
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StepIndicator steps={STEPS} currentStep={state.currentStep} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* File Validation Modal */}
      <AnimatePresence>
        {state.showValidationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Loading State */}
              {state.isValidating && (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analyzing Document...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Please wait while we validate your file
                  </p>
                </div>
              )}

              {/* Invalid File Result */}
              {!state.isValidating && state.validationResult && !state.validationResult.isValid && (
                <>
                  <div className="bg-red-50 p-6 border-b border-red-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-red-100 rounded-full">
                          <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-red-800">
                            Invalid File
                          </h3>
                          <p className="text-sm text-red-600">
                            This file cannot be used for question import
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelValidation}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <FileWarning className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            {state.validationResult.errorMessage || 'This document does not contain valid questions.'}
                          </p>
                          {state.validationResult.reason && (
                            <p className="text-sm text-red-600 mt-1">
                              {state.validationResult.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Accepted file formats:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Question banks with numbered questions (Q1, Q2, etc.)</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>MCQ files with options (A, B, C, D)</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Files with answers/solutions (optional)</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={handleCancelValidation}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Upload a Different File</span>
                    </button>
                  </div>
                </>
              )}

              {/* Valid File Result - Show Structure & Subjects Summary */}
              {!state.isValidating && state.validationResult && state.validationResult.isValid && (
                <>
                  <div className="bg-green-50 p-6 border-b border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-800">
                            Document Analyzed Successfully
                          </h3>
                          <p className="text-sm text-green-600">
                            {state.validationResult.documentTypeDisplay}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelValidation}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-green-500" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Detected Sections - Always show this section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <Layers className="w-4 h-4" />
                        <span>Detected Question Types:</span>
                      </h4>
                      {state.validationResult.documentStructure?.sections &&
                        state.validationResult.documentStructure.sections.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {state.validationResult.documentStructure.sections.map((section, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <span className="font-medium text-gray-800 truncate">{section.name}</span>
                                {section.question_range && section.question_range !== 'Unknown' && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    (Q{section.question_range})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium whitespace-nowrap ml-2">
                                {section.type_hint?.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 text-center">
                          Section structure will be detected during extraction
                        </div>
                      )}
                    </div>

                    {/* Subjects Preview */}
                    {state.validationResult.matchedSubjects.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Subjects:</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {state.validationResult.matchedSubjects.map((subject) => (
                            <span
                              key={subject}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancelValidation}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProceedToAnalysis}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Layers className="w-5 h-5" />
                        <span>View Analysis</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
