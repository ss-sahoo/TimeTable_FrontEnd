/**
 * ImportTargetSelector Component
 * Allows users to choose where to import questions:
 * - Auto-distribute (default behavior)
 * - Import to specific subject
 * - Import to specific section within a subject
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../hooks/useApi';
import {
  Target,
  Layers,
  BookOpen,
  ChevronDown,
  AlertTriangle,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  question_type: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
  questions_added?: number;
}

interface SubjectCapacity {
  subject: string;
  sections: {
    section_id: number;
    section_name: string;
    question_type: string;
    required: number;
    current: number;
    remaining: number;
    completion_percent: number;
  }[];
  total_required: number;
  total_filled: number;
  total_remaining: number;
}

export type ImportMode = 'auto' | 'subject' | 'section';

export interface ImportTarget {
  mode: ImportMode;
  targetSubject?: string;
  targetSectionId?: number;
  targetSectionName?: string;
}

interface DetectedSection {
  name: string;
  type_hint: string;
  question_range?: string;
  question_count?: number;
  format_description?: string;
  marks_per_question?: number | null;
  negative_marking?: number | null;
}

interface DocumentStructure {
  has_instructions?: boolean;
  instructions_text?: string;
  marking_scheme?: {
    correct_marks?: number;
    negative_marks?: number;
    description?: string;
  };
  sections?: DetectedSection[];
  question_numbering_format?: string;
  answer_format?: string;
  total_sections?: number;
  total_questions_detected?: number;
}

interface ImportTargetSelectorProps {
  examId: string;
  patternId: string;
  matchedSubjects: string[];
  extractedQuestionCount: number;
  documentStructure?: DocumentStructure | null;
  onBack: () => void;
  onProceed: (target: ImportTarget) => void;
}

const ImportTargetSelector: React.FC<ImportTargetSelectorProps> = ({
  examId,
  patternId,
  matchedSubjects,
  extractedQuestionCount,
  documentStructure,
  onBack,
  onProceed,
}) => {
  const [importMode, setImportMode] = useState<ImportMode>('auto');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [patternSections, setPatternSections] = useState<PatternSection[]>([]);
  const [subjectCapacities, setSubjectCapacities] = useState<SubjectCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch pattern sections and capacity
  useEffect(() => {
    const fetchPatternData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch pattern with sections
        const patternRes = await api.get(`/patterns/patterns/${patternId}/?exam_id=${examId}`);
        const sections = patternRes.data.sections || [];
        setPatternSections(sections);

        // Calculate capacity per subject
        const subjectMap = new Map<string, SubjectCapacity>();
        
        for (const section of sections) {
          const subject = section.subject || 'General';
          const required = section.end_question - section.start_question + 1;
          const current = section.questions_added || 0;
          
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, {
              subject,
              sections: [],
              total_required: 0,
              total_filled: 0,
              total_remaining: 0,
            });
          }
          
          const subjectData = subjectMap.get(subject)!;
          subjectData.sections.push({
            section_id: section.id,
            section_name: section.name,
            question_type: section.question_type,
            required,
            current,
            remaining: required - current,
            completion_percent: required > 0 ? (current / required) * 100 : 0,
          });
          subjectData.total_required += required;
          subjectData.total_filled += current;
          subjectData.total_remaining += (required - current);
        }

        setSubjectCapacities(Array.from(subjectMap.values()));
        
        // Set default subject if available
        if (matchedSubjects.length > 0) {
          setSelectedSubject(matchedSubjects[0]);
        }
      } catch (err: any) {
        console.error('Failed to fetch pattern data:', err);
        setError(err.response?.data?.error || 'Failed to load pattern data');
      } finally {
        setLoading(false);
      }
    };

    fetchPatternData();
  }, [examId, patternId, matchedSubjects]);

  // Get sections for selected subject
  const subjectSections = patternSections.filter(s => s.subject === selectedSubject);
  
  // Get capacity for selected subject
  const selectedSubjectCapacity = subjectCapacities.find(s => s.subject === selectedSubject);
  
  // Get selected section details
  const selectedSection = selectedSectionId 
    ? patternSections.find(s => s.id === selectedSectionId)
    : null;
  const selectedSectionCapacity = selectedSubjectCapacity?.sections.find(
    s => s.section_id === selectedSectionId
  );

  // Format question type for display
  const formatQuestionType = (type: string) => {
    const typeMap: Record<string, string> = {
      'single_mcq': 'Single MCQ',
      'multiple_mcq': 'Multiple MCQ',
      'numerical': 'Numerical',
      'subjective': 'Subjective',
      'true_false': 'True/False',
      'fill_blank': 'Fill in Blank',
    };
    return typeMap[type] || type;
  };

  // Get warnings based on selection
  const getWarnings = (): string[] => {
    const warnings: string[] = [];
    
    if (importMode === 'subject' && selectedSubjectCapacity) {
      if (extractedQuestionCount > selectedSubjectCapacity.total_remaining) {
        warnings.push(
          `You have ${extractedQuestionCount} questions but only ${selectedSubjectCapacity.total_remaining} slots remaining in ${selectedSubject}. Extra questions will be skipped.`
        );
      }
      if (selectedSubjectCapacity.total_filled > 0) {
        warnings.push(
          `${selectedSubject} already has ${selectedSubjectCapacity.total_filled} questions added.`
        );
      }
    }
    
    if (importMode === 'section' && selectedSectionCapacity) {
      if (extractedQuestionCount > selectedSectionCapacity.remaining) {
        warnings.push(
          `You have ${extractedQuestionCount} questions but only ${selectedSectionCapacity.remaining} slots remaining in this section. Extra questions will be skipped.`
        );
      }
      if (selectedSectionCapacity.current > 0) {
        warnings.push(
          `This section already has ${selectedSectionCapacity.current}/${selectedSectionCapacity.required} questions.`
        );
      }
      if (selectedSection) {
        warnings.push(
          `Only questions matching type "${formatQuestionType(selectedSection.question_type)}" will be imported.`
        );
      }
    }
    
    return warnings;
  };

  const handleProceed = () => {
    const target: ImportTarget = {
      mode: importMode,
    };
    
    if (importMode === 'subject') {
      target.targetSubject = selectedSubject;
    } else if (importMode === 'section') {
      target.targetSubject = selectedSubject;
      target.targetSectionId = selectedSectionId || undefined;
      target.targetSectionName = selectedSection?.name;
    }
    
    onProceed(target);
  };

  const warnings = getWarnings();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-600">Loading pattern structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Target className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Import Target</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose where to import your {extractedQuestionCount} extracted questions
            </p>
          </div>
        </div>
      </div>

      {/* Detected Document Structure */}
      {documentStructure && (documentStructure.sections?.length || documentStructure.has_instructions) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Detected Document Structure</span>
          </h3>
          
          {/* Instructions/Marking Scheme */}
          {documentStructure.has_instructions && documentStructure.marking_scheme && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Marking Scheme Detected</h4>
              {documentStructure.marking_scheme.description && (
                <p className="text-sm text-blue-700">{documentStructure.marking_scheme.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-2">
                {documentStructure.marking_scheme.correct_marks && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    +{documentStructure.marking_scheme.correct_marks} for correct
                  </span>
                )}
                {documentStructure.marking_scheme.negative_marks && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                    {documentStructure.marking_scheme.negative_marks} for wrong
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Detected Sections */}
          {documentStructure.sections && documentStructure.sections.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📑 Question Types Found ({documentStructure.sections.length} sections)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {documentStructure.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-gray-800">{section.name}</span>
                        {section.question_range && section.question_range !== 'Unknown' && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Q: {section.question_range})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {section.marks_per_question && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {section.marks_per_question > 0 ? '+' : ''}{section.marks_per_question} marks
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                        {section.type_hint?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question/Answer Format */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-600">
            {documentStructure.question_numbering_format && documentStructure.question_numbering_format !== 'auto-detect' && (
              <div>
                <span className="font-medium">Numbering:</span> {documentStructure.question_numbering_format}
              </div>
            )}
            {documentStructure.answer_format && documentStructure.answer_format !== 'auto-detect' && (
              <div>
                <span className="font-medium">Answer Format:</span> {documentStructure.answer_format}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Mode Selection */}
      <div className="space-y-4">
        {/* Option 1: Auto-distribute */}
        <label
          className={`block p-5 border-2 rounded-xl cursor-pointer transition-all ${
            importMode === 'auto'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start space-x-4">
            <input
              type="radio"
              name="importMode"
              value="auto"
              checked={importMode === 'auto'}
              onChange={() => setImportMode('auto')}
              className="mt-1 w-5 h-5 text-indigo-600"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-gray-900">Auto-distribute</span>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Questions will be automatically mapped to matching sections based on subject and question type.
                This is the default behavior.
              </p>
            </div>
          </div>
        </label>

        {/* Option 2: Specific Subject */}
        <label
          className={`block p-5 border-2 rounded-xl cursor-pointer transition-all ${
            importMode === 'subject'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start space-x-4">
            <input
              type="radio"
              name="importMode"
              value="subject"
              checked={importMode === 'subject'}
              onChange={() => {
                setImportMode('subject');
                setSelectedSectionId(null);
              }}
              className="mt-1 w-5 h-5 text-indigo-600"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Import to specific subject</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                All questions will be imported into the selected subject. Sections will be filled in order.
              </p>
              
              {importMode === 'subject' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subject
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Choose a subject...</option>
                      {subjectCapacities.map((sc) => (
                        <option key={sc.subject} value={sc.subject}>
                          {sc.subject} ({sc.total_filled}/{sc.total_required} filled, {sc.total_remaining} remaining)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {/* Subject capacity preview */}
                  {selectedSubjectCapacity && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Capacity</span>
                        <span className="text-sm text-gray-500">
                          {selectedSubjectCapacity.total_filled}/{selectedSubjectCapacity.total_required}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{
                            width: `${Math.min(100, (selectedSubjectCapacity.total_filled / selectedSubjectCapacity.total_required) * 100)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedSubjectCapacity.total_remaining} slots remaining
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Option 3: Specific Section */}
        <label
          className={`block p-5 border-2 rounded-xl cursor-pointer transition-all ${
            importMode === 'section'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start space-x-4">
            <input
              type="radio"
              name="importMode"
              value="section"
              checked={importMode === 'section'}
              onChange={() => setImportMode('section')}
              className="mt-1 w-5 h-5 text-indigo-600"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Import to specific section</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                All questions will be imported into a specific section. Only matching question types will be imported.
              </p>
              
              {importMode === 'section' && (
                <div className="mt-4 space-y-4">
                  {/* Subject selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Subject
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSubject}
                        onChange={(e) => {
                          setSelectedSubject(e.target.value);
                          setSelectedSectionId(null);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Choose a subject...</option>
                        {subjectCapacities.map((sc) => (
                          <option key={sc.subject} value={sc.subject}>
                            {sc.subject}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Section selector */}
                  {selectedSubject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Section
                      </label>
                      <div className="relative">
                        <select
                          value={selectedSectionId || ''}
                          onChange={(e) => setSelectedSectionId(Number(e.target.value) || null)}
                          className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Choose a section...</option>
                          {subjectSections.map((section) => {
                            const capacity = selectedSubjectCapacity?.sections.find(
                              s => s.section_id === section.id
                            );
                            return (
                              <option key={section.id} value={section.id}>
                                {section.name} - {formatQuestionType(section.question_type)} 
                                ({capacity?.current || 0}/{capacity?.required || 0} filled)
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  
                  {/* Section capacity preview */}
                  {selectedSectionCapacity && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {selectedSection?.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedSectionCapacity.remaining === 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {formatQuestionType(selectedSection?.question_type || '')}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            selectedSectionCapacity.completion_percent >= 100
                              ? 'bg-green-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${Math.min(100, selectedSectionCapacity.completion_percent)}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {selectedSectionCapacity.current}/{selectedSectionCapacity.required} questions
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedSectionCapacity.remaining} remaining
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </label>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-2">Important Notes</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info box for section mode */}
      {importMode === 'section' && selectedSection && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Question Type Filter</h4>
              <p className="text-sm text-blue-700">
                Only questions of type <strong>"{formatQuestionType(selectedSection.question_type)}"</strong> will 
                be imported into this section. Other question types will be skipped.
              </p>
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
          ← Back to Review
        </button>
        <button
          onClick={handleProceed}
          disabled={
            (importMode === 'subject' && !selectedSubject) ||
            (importMode === 'section' && (!selectedSubject || !selectedSectionId))
          }
          className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
            (importMode === 'subject' && !selectedSubject) ||
            (importMode === 'section' && (!selectedSubject || !selectedSectionId))
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <span>Continue to Import</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ImportTargetSelector;
