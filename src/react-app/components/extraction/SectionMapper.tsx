/**
 * SectionMapper Component
 * Map extracted questions to exam pattern sections
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../hooks/useApi';
import { AlertCircle, CheckCircle, MapPin } from 'lucide-react';

interface ExtractedQuestion {
  id: number;
  question_text: string;
  question_type: string;
  suggested_subject: string;
  suggested_section_id: number | null;
  assigned_subject: string;
  assigned_section_id: number | null;
}

interface PatternSection {
  id: number;
  name: string;
  subject: string;
  question_type: string;
  start_question: number;
  end_question: number;
  marks_per_question: number;
  total_questions_in_section: number;
  available_slots: number;
}

interface SectionMapperProps {
  patternId: number;
  questions: ExtractedQuestion[];
  selectedQuestionIds: number[];
  onMappingComplete: (mappings: Record<number, number>) => void;
}

const SectionMapper: React.FC<SectionMapperProps> = ({
  patternId,
  questions,
  selectedQuestionIds,
  onMappingComplete,
}) => {
  const [sections, setSections] = useState<PatternSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mappings, setMappings] = useState<Record<number, number>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  // Get selected questions (memoized to prevent infinite loops)
  const selectedQuestions = React.useMemo(() => 
    questions.filter(q => selectedQuestionIds.includes(q.id)),
    [questions, selectedQuestionIds]
  );

  useEffect(() => {
    fetchSections();
  }, [patternId]);

  useEffect(() => {
    // Auto-assign based on suggestions only when sections are first loaded
    if (sections.length > 0 && Object.keys(mappings).length === 0) {
      autoAssignSuggestions();
    }
  }, [sections.length]);

  useEffect(() => {
    // Validate mappings whenever they change
    if (Object.keys(mappings).length > 0) {
      validateMappings();
    }
  }, [mappings]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patterns/patterns/${patternId}/sections/`);
      // Handle paginated response
      const sectionsData = response.data.results || response.data;
      setSections(Array.isArray(sectionsData) ? sectionsData : []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      setError('Failed to load pattern sections');
    } finally {
      setLoading(false);
    }
  };

  const autoAssignSuggestions = () => {
    const newMappings: Record<number, number> = {};
    
    selectedQuestions.forEach(question => {
      // Try to use suggested section if available
      if (question.suggested_section_id) {
        const section = sections.find(s => s.id === question.suggested_section_id);
        if (section && section.question_type === question.question_type) {
          newMappings[question.id] = section.id;
          return;
        }
      }

      // Otherwise, find first matching section by type and subject
      const matchingSection = sections.find(s => 
        s.question_type === question.question_type &&
        s.subject.toLowerCase() === question.suggested_subject?.toLowerCase()
      );

      if (matchingSection) {
        newMappings[question.id] = matchingSection.id;
      }
    });

    setMappings(newMappings);
    onMappingComplete(newMappings);
  };

  const validateMappings = () => {
    const errors: Record<number, string> = {};
    const sectionCounts: Record<number, number> = {};

    // Count questions per section
    Object.entries(mappings).forEach(([, sectionId]) => {
      sectionCounts[sectionId] = (sectionCounts[sectionId] || 0) + 1;
    });

    // Validate each mapping
    selectedQuestions.forEach(question => {
      const sectionId = mappings[question.id];
      
      if (!sectionId) {
        errors[question.id] = 'No section assigned';
        return;
      }

      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        errors[question.id] = 'Invalid section';
        return;
      }

      // Check question type match
      if (section.question_type !== question.question_type) {
        errors[question.id] = `Type mismatch: Section requires ${getQuestionTypeLabel(section.question_type)}`;
        return;
      }

      // Check section capacity
      const totalInSection = section.total_questions_in_section + sectionCounts[sectionId];
      const sectionCapacity = section.end_question - section.start_question + 1;
      
      if (totalInSection > sectionCapacity) {
        errors[question.id] = `Section full (${totalInSection}/${sectionCapacity})`;
      }
    });

    setValidationErrors(errors);
  };

  const updateMapping = (questionId: number, sectionId: number) => {
    const newMappings = { ...mappings, [questionId]: sectionId };
    setMappings(newMappings);
    onMappingComplete(newMappings);
  };

  const bulkAssignBySubject = (subject: string, sectionId: number) => {
    const newMappings = { ...mappings };
    
    selectedQuestions.forEach(question => {
      if (question.suggested_subject?.toLowerCase() === subject.toLowerCase()) {
        const section = sections.find(s => s.id === sectionId);
        if (section && section.question_type === question.question_type) {
          newMappings[question.id] = sectionId;
        }
      }
    });

    setMappings(newMappings);
    onMappingComplete(newMappings);
  };

  const getQuestionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      single_mcq: 'Single Correct MCQ',
      multiple_mcq: 'Multiple Correct MCQ',
      numerical: 'Numerical',
      subjective: 'Subjective',
      true_false: 'True/False',
      fill_blank: 'Fill in the Blanks',
    };
    return labels[type] || type;
  };

  const getSubjects = (): string[] => {
    return Array.from(new Set(selectedQuestions.map(q => q.suggested_subject).filter(Boolean)));
  };

  const getSectionsForSubject = (subject: string): PatternSection[] => {
    return sections.filter(s => s.subject.toLowerCase() === subject.toLowerCase());
  };

  const getQuestionCountBySection = (): Record<number, number> => {
    const counts: Record<number, number> = {};
    Object.values(mappings).forEach(sectionId => {
      counts[sectionId] = (counts[sectionId] || 0) + 1;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">
          No sections found in this exam pattern. Please create sections first.
        </p>
      </div>
    );
  }

  const questionCounts = getQuestionCountBySection();
  const subjects = getSubjects();
  const hasErrors = Object.keys(validationErrors).length > 0;
  const allMapped = selectedQuestions.every(q => mappings[q.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Assign Questions to Sections
        </h3>
        <div className="flex items-center space-x-2">
          {allMapped && !hasErrors ? (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle size={16} className="mr-1" />
              All questions mapped
            </span>
          ) : (
            <span className="flex items-center text-sm text-yellow-600">
              <AlertCircle size={16} className="mr-1" />
              {Object.keys(validationErrors).length} validation errors
            </span>
          )}
        </div>
      </div>

      {/* Bulk Assignment by Subject */}
      {subjects.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-3">
            Quick Assign by Subject
          </h4>
          <div className="space-y-2">
            {subjects.map(subject => {
              const subjectSections = getSectionsForSubject(subject);
              const subjectQuestions = selectedQuestions.filter(
                q => q.suggested_subject?.toLowerCase() === subject.toLowerCase()
              );

              return (
                <div key={subject} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 w-32">
                    {subject}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({subjectQuestions.length} questions)
                  </span>
                  <select
                    onChange={(e) => bulkAssignBySubject(subject, parseInt(e.target.value))}
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5"
                    defaultValue=""
                  >
                    <option value="">Select section...</option>
                    {subjectSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name} - {getQuestionTypeLabel(section.question_type)}
                        {' '}({section.total_questions_in_section}/{section.end_question - section.start_question + 1})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Question Mapping */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">
          Individual Question Assignments
        </h4>
        
        {selectedQuestions.map((question, index) => {
          const assignedSectionId = mappings[question.id];
          const assignedSection = sections.find(s => s.id === assignedSectionId);
          const error = validationErrors[question.id];
          const compatibleSections = sections.filter(
            s => s.question_type === question.question_type
          );

          return (
            <div
              key={question.id}
              className={`p-4 border rounded-lg ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Q{index + 1}: {question.question_text.substring(0, 80)}
                        {question.question_text.length > 80 && '...'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {getQuestionTypeLabel(question.question_type)}
                        </span>
                        {question.suggested_subject && (
                          <span className="text-xs text-gray-500">
                            Suggested: {question.suggested_subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <select
                      value={assignedSectionId || ''}
                      onChange={(e) => updateMapping(question.id, parseInt(e.target.value))}
                      className={`w-full text-sm border rounded px-3 py-2 ${
                        error
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <option value="">Select section...</option>
                      {compatibleSections.map(section => {
                        const count = questionCounts[section.id] || 0;
                        const capacity = section.end_question - section.start_question + 1;
                        const current = section.total_questions_in_section;
                        const total = current + count;
                        
                        return (
                          <option key={section.id} value={section.id}>
                            {section.name} ({section.subject}) - {getQuestionTypeLabel(section.question_type)}
                            {' '}[{total}/{capacity} questions]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {error && (
                    <div className="mt-2 flex items-center text-xs text-red-600">
                      <AlertCircle size={12} className="mr-1" />
                      {error}
                    </div>
                  )}

                  {assignedSection && !error && (
                    <div className="mt-2 text-xs text-green-600">
                      ✓ Assigned to {assignedSection.name} ({assignedSection.marks_per_question} marks)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Assignment Summary
        </h4>
        <div className="space-y-2">
          {sections.map(section => {
            const count = questionCounts[section.id] || 0;
            if (count === 0) return null;

            const capacity = section.end_question - section.start_question + 1;
            const current = section.total_questions_in_section;
            const total = current + count;
            const percentage = (total / capacity) * 100;

            return (
              <div key={section.id} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {section.name} ({section.subject})
                    </span>
                    <span className="text-xs text-gray-500">
                      {total}/{capacity} questions
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percentage > 100
                          ? 'bg-red-500'
                          : percentage > 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">
                  +{count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SectionMapper;
