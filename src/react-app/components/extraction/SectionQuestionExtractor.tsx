/**
 * SectionQuestionExtractor Component
 * Extracts questions from each section and shows import preview with capacity
 * Connects to the new backend APIs:
 * - POST /api/questions/extract-by-section/
 * - POST /api/questions/section-import-preview/
 * - POST /api/questions/confirm-section-import/
 */
import React, { useState } from 'react';
import { api, getErrorMessage } from '../../hooks/useApi';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Package,
  Layers,
  BarChart3,
} from 'lucide-react';

interface ExtractedSection {
  section_name: string;
  section_type: string;
  questions: any[];
  total_extracted: number;
  expected_count: number;
  extraction_confidence: number;
  warnings: string[];
}

interface SectionMapping {
  pattern_section_id: number;
  pattern_section_name: string;
  subject: string;
  question_type: string;
  required_count: number;
  current_count: number;
  remaining_capacity: number;
  extracted_count: number;
  will_import_count: number;
  overflow_count: number;
  status: string;
}

interface ImportPreview {
  exam_id: number;
  pattern_id: number;
  subject: string;
  total_extracted: number;
  total_will_import: number;
  total_overflow: number;
  total_remaining_after_import: number;
  section_mappings: SectionMapping[];
  warnings: string[];
  recommendations: string[];
  can_proceed: boolean;
  requires_selection: boolean;
}

interface ConfirmationData {
  preview: ImportPreview;
  confirmation_message: string;
  options: { action: string; label: string; description: string }[];
  subject: string;
  can_proceed: boolean;
}

// Import target types
type ImportMode = 'auto' | 'subject' | 'section';

interface ImportTarget {
  mode: ImportMode;
  targetSubject?: string;
  targetSectionId?: number;
  targetSectionName?: string;
}

interface SectionQuestionExtractorProps {
  preAnalysisJobId: string;
  examId: string;
  patternId: string;
  matchedSubjects: string[];
  documentStructure: any;
  importTarget?: ImportTarget | null;
  onComplete: () => void;
  onBack: () => void;
}

const SectionQuestionExtractor: React.FC<SectionQuestionExtractorProps> = ({
  preAnalysisJobId,
  examId,
  patternId,
  matchedSubjects,
  documentStructure,
  importTarget,
  onComplete,
  onBack,
}) => {
  // Determine subjects to process based on import target
  const subjectsToProcess = importTarget?.mode === 'subject' || importTarget?.mode === 'section'
    ? [importTarget.targetSubject!].filter(Boolean)
    : matchedSubjects;

  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [extractionState, setExtractionState] = useState<'idle' | 'extracting' | 'preview' | 'importing' | 'done'>('idle');
  const [extractedSections, setExtractedSections] = useState<ExtractedSection[]>([]);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [importResults, setImportResults] = useState<{ subject: string; imported: number; skipped: number }[]>([]);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const currentSubject = subjectsToProcess[currentSubjectIndex];

  // Start extraction for current subject
  const handleStartExtraction = async () => {
    setExtractionState('extracting');
    setError('');

    try {
      // Step 1: Extract questions by section
      const extractResponse = await api.post('/questions/extract-by-section/', {
        pre_analysis_job_id: preAnalysisJobId,
        subject: currentSubject,
        document_structure: documentStructure,
        exam_id: examId,
      });

      const sections = extractResponse.data.sections || [];
      setExtractedSections(sections);

      // Step 2: Use extract-by-section response directly (skip redundant preview API)
      // Transform the response to match the preview format expected by UI
      const extractData = extractResponse.data;
      const totalExtracted = extractData.total_extracted || sections.reduce((sum: number, s: any) => sum + (s.total_extracted || 0), 0);

      // Create preview-like structure from extract response
      const previewData = {
        preview: {
          exam_id: parseInt(examId),
          pattern_id: parseInt(patternId),
          subject: currentSubject,
          total_extracted: totalExtracted,
          total_will_import: 0, // Will be calculated by confirm API
          total_overflow: 0, // Don't show overflow at extraction stage
          total_remaining_after_import: 0,
          section_mappings: sections.map((section: any) => ({
            pattern_section_name: section.section_name,
            question_type: section.section_type,
            extracted_count: section.total_extracted,
            will_import_count: 0,
            overflow_count: section.total_extracted,
            current_count: 0,
            required_count: section.expected_count || section.total_extracted,
            status: 'overflow'
          })),
          warnings: [],
          recommendations: ['Questions extracted successfully. Pattern mapping will be calculated during import.'],
          can_proceed: true,
          requires_selection: false
        },
        confirmation_message: `Found ${totalExtracted} questions for ${currentSubject}. Review the extracted sections below.`,
        options: [
          {
            action: 'import_all',
            label: `Import All (${totalExtracted} questions)`,
            description: 'Import all extracted questions'
          },
          {
            action: 'skip',
            label: 'Skip This Subject',
            description: 'Do not import any questions for this subject'
          }
        ],
        subject: currentSubject,
        can_proceed: true
      };

      setConfirmationData(previewData);
      setExtractionState('preview');

      // COMMENTED OUT: Preview API call (redundant - confirm API recalculates this anyway)
      /*
      const previewResponse = await api.post('/questions/section-import-preview/', {
        exam_id: parseInt(examId),
        pattern_id: parseInt(patternId),
        subject: currentSubject,
        extracted_sections: sections,
        import_target: importTarget ? {
          mode: importTarget.mode,
          target_subject: importTarget.targetSubject,
          target_section_id: importTarget.targetSectionId,
        } : null,
      });

      setConfirmationData(previewResponse.data);
      setExtractionState('preview');
      */
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setError(getErrorMessage(err, 'Failed to extract questions'));
      setExtractionState('idle');
    }
  };

  // Handle import confirmation
  const handleConfirmImport = async (action: string) => {
    if (action === 'skip') {
      // Skip this subject
      setImportResults(prev => [...prev, { subject: currentSubject, imported: 0, skipped: confirmationData?.preview.total_extracted || 0 }]);
      moveToNextSubject();
      return;
    }

    setExtractionState('importing');

    try {
      const response = await api.post('/questions/confirm-section-import/', {
        exam_id: parseInt(examId),
        pattern_id: parseInt(patternId),
        subject: currentSubject,
        action: action,
        extracted_sections: extractedSections,
        // Pass import target for targeted imports
        import_target: importTarget ? {
          mode: importTarget.mode,
          target_subject: importTarget.targetSubject,
          target_section_id: importTarget.targetSectionId,
        } : null,
      });

      setImportResults(prev => [...prev, {
        subject: currentSubject,
        imported: response.data.imported_count,
        skipped: response.data.skipped_count,
      }]);

      moveToNextSubject();
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(getErrorMessage(err, 'Failed to import questions'));
      setExtractionState('preview');
    }
  };

  const moveToNextSubject = () => {
    if (currentSubjectIndex < subjectsToProcess.length - 1) {
      setCurrentSubjectIndex(prev => prev + 1);
      setExtractionState('idle');
      setExtractedSections([]);
      setConfirmationData(null);
    } else {
      setExtractionState('done');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700';
      case 'overflow': return 'bg-amber-100 text-amber-700';
      case 'shortage': return 'bg-red-100 text-red-700';
      case 'complete': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Render extraction progress
  const renderExtracting = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="w-6 h-6 text-indigo-400" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mt-6">Extracting Questions...</h3>
      <p className="text-gray-600 mt-2">Processing {currentSubject} content</p>
      <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
        <Layers className="w-4 h-4" />
        <span>Analyzing sections and extracting questions</span>
      </div>
    </div>
  );

  // Render import preview
  const renderPreview = () => {
    if (!confirmationData) return null;
    const { preview, confirmation_message, options } = confirmationData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Package className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Preview: {currentSubject}</h2>
              <p className="text-sm text-gray-600 mt-1">{confirmation_message}</p>
            </div>
          </div>

          {/* Stats - Only show Extracted, hide others when 0 */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 text-center border border-indigo-100 flex-1 min-w-[120px]">
              <p className="text-3xl font-bold text-indigo-600">{preview.total_extracted}</p>
              <p className="text-sm text-gray-600">Extracted</p>
            </div>
            {preview.total_will_import > 0 && (
              <div className="bg-white rounded-lg p-4 text-center border border-green-100 flex-1 min-w-[120px]">
                <p className="text-3xl font-bold text-green-600">{preview.total_will_import}</p>
                <p className="text-sm text-gray-600">Will Import</p>
              </div>
            )}
            {preview.total_overflow > 0 && (
              <div className="bg-white rounded-lg p-4 text-center border border-amber-100 flex-1 min-w-[120px]">
                <p className="text-3xl font-bold text-amber-600">{preview.total_overflow}</p>
                <p className="text-sm text-gray-600">Overflow</p>
              </div>
            )}
            {preview.total_remaining_after_import > 0 && (
              <div className="bg-white rounded-lg p-4 text-center border border-blue-100 flex-1 min-w-[120px]">
                <p className="text-3xl font-bold text-blue-600">{preview.total_remaining_after_import}</p>
                <p className="text-sm text-gray-600">Still Needed</p>
              </div>
            )}
          </div>
        </div>

        {/* Extracted Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span>Extracted Sections</span>
          </h3>

          {/* Show sections from extractedSections (from extract-by-section API response) */}
          {extractedSections && extractedSections.length > 0 ? (
            extractedSections.map((section: any, index: number) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">{section.section_name || `Section ${index + 1}`}</h4>
                    <p className="text-sm text-gray-500 mt-1">Type: {section.section_type || 'mixed'}</p>
                    {section.expected_count && (
                      <p className="text-xs text-gray-400 mt-1">Expected: {section.expected_count} questions</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-indigo-600">{section.total_extracted || 0}</p>
                    <p className="text-xs text-gray-500">Questions</p>
                  </div>
                </div>

                {/* Question preview (first 3 questions) */}
                {section.questions && section.questions.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.section_name ? null : section.section_name)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                    >
                      <span>{expandedSection === section.section_name ? 'Hide' : 'Show'} Questions ({section.questions.length})</span>
                      <span>{expandedSection === section.section_name ? '▲' : '▼'}</span>
                    </button>

                    {expandedSection === section.section_name && (
                      <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                        {section.questions.slice(0, 10).map((q: any, qIndex: number) => (
                          <div key={qIndex} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="font-medium text-gray-900">
                              Q{q.question_number || qIndex + 1}: {q.structure?.nested_type ? `[${q.structure.nested_type.toUpperCase()}]` : ''}
                            </p>
                            <p className="text-gray-700 mt-1 line-clamp-3">{q.question_text}</p>
                            {q.correct_answer && (
                              <p className="text-green-700 mt-1 font-medium">Answer: {q.correct_answer}</p>
                            )}
                          </div>
                        ))}
                        {section.questions.length > 10 && (
                          <p className="text-xs text-gray-500 text-center">... and {section.questions.length - 10} more questions</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : preview.section_mappings && preview.section_mappings.length > 0 ? (
            preview.section_mappings.map((mapping: any, index: number) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{mapping.pattern_section_name || `Section ${index + 1}`}</h4>
                    <p className="text-sm text-gray-500">Type: {mapping.question_type}</p>
                  </div>
                  {mapping.status && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(mapping.status)}`}>
                      {mapping.status.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Question Count Details */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{mapping.extracted_count || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Questions Extracted</p>
                  </div>
                  {mapping.expected_count !== undefined && (
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{mapping.expected_count}</p>
                      <p className="text-xs text-blue-600 mt-1">Expected</p>
                    </div>
                  )}
                  {mapping.will_import_count !== undefined && (
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{mapping.will_import_count}</p>
                      <p className="text-xs text-green-600 mt-1">Will Import</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800">No sections extracted. Please check the extraction response.</p>
            </div>
          )}
        </div>

        {/* Warnings */}
        {preview.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Warnings</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {preview.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {preview.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {preview.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-3">
            {options.map((option) => (
              <button
                key={option.action}
                onClick={() => handleConfirmImport(option.action)}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${option.action === 'import_all'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : option.action === 'skip'
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render importing state
  const renderImporting = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-16 h-16 animate-spin text-green-600" />
      <h3 className="text-xl font-semibold text-gray-900 mt-6">Importing Questions...</h3>
      <p className="text-gray-600 mt-2">Adding questions to {currentSubject}</p>
    </div>
  );

  // Render completion state
  const renderDone = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
        <p className="text-gray-600">All subjects have been processed</p>
      </div>

      {/* Results Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Import Summary</h3>
        {importResults.map((result, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="font-medium text-gray-900">{result.subject}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{result.imported}</p>
                <p className="text-xs text-gray-500">Imported</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-400">{result.skipped}</p>
                <p className="text-xs text-gray-500">Skipped</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-indigo-900">Total Imported</span>
          <span className="text-2xl font-bold text-indigo-600">
            {importResults.reduce((sum, r) => sum + r.imported, 0)} questions
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <span>Continue to Questions</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Render idle state (start extraction)
  const renderIdle = () => (
    <div className="space-y-6">
      {/* Import Target Info */}
      {importTarget && importTarget.mode !== 'auto' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-indigo-900">
                {importTarget.mode === 'subject'
                  ? `Importing to subject: ${importTarget.targetSubject}`
                  : `Importing to section: ${importTarget.targetSectionName} (${importTarget.targetSubject})`
                }
              </p>
              <p className="text-sm text-indigo-700">
                {importTarget.mode === 'section'
                  ? 'Only matching question types will be imported'
                  : 'Questions will fill sections in order'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {subjectsToProcess.map((subject, index) => (
          <React.Fragment key={subject}>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${index < currentSubjectIndex
              ? 'bg-green-100 text-green-700'
              : index === currentSubjectIndex
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500'
              }`}>
              {index < currentSubjectIndex ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">{index + 1}</span>
              )}
              <span className="text-sm font-medium">{subject}</span>
            </div>
            {index < subjectsToProcess.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Subject Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-200 text-center">
        <div className="p-4 bg-indigo-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <FileText className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Extract Questions: {currentSubject}</h2>
        <p className="text-gray-600 mb-6">
          Subject {currentSubjectIndex + 1} of {subjectsToProcess.length}
        </p>
        <button
          onClick={handleStartExtraction}
          className="px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-lg font-semibold flex items-center space-x-3 mx-auto"
        >
          <Layers className="w-6 h-6" />
          <span>Start Extraction</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {extractionState === 'idle' && renderIdle()}
      {extractionState === 'extracting' && renderExtracting()}
      {extractionState === 'preview' && renderPreview()}
      {extractionState === 'importing' && renderImporting()}
      {extractionState === 'done' && renderDone()}
    </div>
  );
};

export default SectionQuestionExtractor;
