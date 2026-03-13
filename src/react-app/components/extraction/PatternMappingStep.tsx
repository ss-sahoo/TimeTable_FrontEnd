import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../hooks/useApi';
import { toast } from "react-toastify";

interface PatternMappingStepProps {
  examId: number;
  patternId: number;
  jobId: string;
  questions: any[];
  onComplete: (mappings: Record<number, any>, mismatches: any | null) => void;
}

export default function PatternMappingStep({
  examId,
  patternId,
  jobId,
  questions,
  onComplete,
}: PatternMappingStepProps) {
  const [patternStructure, setPatternStructure] = useState<any>(null);
  const [groupedQuestions, setGroupedQuestions] = useState<Record<string, any[]>>({});
  const [mappings, setMappings] = useState<Record<number, any>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadPatternStructure();
    groupQuestionsBySubject();
  }, []);

  const loadPatternStructure = async () => {
    try {
      const response = await api.get(
        `/questions/pattern-structure/${patternId}/?exam_id=${examId}`
      );
      console.log('Pattern structure response:', response.data); // Debug log
      setPatternStructure(response.data);
      
      // Auto-expand all subjects
      const subjects = Object.keys(response.data.subjects || {});
      setExpandedSubjects(new Set(subjects));
      
      if (Object.keys(response.data.subjects || {}).length === 0) {
        console.warn('No subjects found in pattern structure');
      }
    } catch (error: any) {
      console.error('Error loading pattern structure:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load pattern structure: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const groupQuestionsBySubject = () => {
    const grouped: Record<string, any[]> = {};
    
    questions.forEach((q) => {
      const subject = q.suggested_subject || q.assigned_subject || 'ambiguous';
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(q);
    });
    
    setGroupedQuestions(grouped);
  };

  const toggleSubject = (subject: string) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const handleAssignToSection = (questionId: number, sectionId: number, subject: string) => {
    setMappings(prev => ({
      ...prev,
      [questionId]: { sectionId, subject }
    }));
  };

  const handleBulkAssign = (questionIds: number[], sectionId: number, subject: string) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      questionIds.forEach((qId) => {
        newMappings[qId] = { sectionId, subject };
      });
      return newMappings;
    });
  };

  const handleContinue = async () => {
    setAnalyzing(true);
    
    try {
      // Analyze mismatches
      const response = await api.post('/questions/analyze-mismatches/', {
        job_id: jobId,
        exam_id: examId,
        pattern_id: patternId,
      });
      
      onComplete(mappings, response.data);
    } catch (error) {
      console.error('Error analyzing mismatches:', error);
      // Continue anyway
      onComplete(mappings, null);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading pattern structure...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Questions to Sections</h2>
        <p className="text-gray-700">
          Assign each extracted question to the appropriate section in your exam pattern
        </p>
        {patternStructure && (
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Total Required:</span>
              <span className="font-bold text-gray-900">{patternStructure.total_required || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Currently Filled:</span>
              <span className="font-bold text-green-600">{patternStructure.total_filled || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-bold text-indigo-600">{patternStructure.total_remaining || 0}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Pattern Structure */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg p-4 sticky top-4 border-2 border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Available Sections</h3>
            
            {patternStructure && Object.keys(patternStructure.subjects || {}).length > 0 ? (
              <div className="space-y-2">

                {Object.entries(patternStructure.subjects || {}).map(([subject, data]: [string, any]) => (
                  <div key={subject} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSubject(subject)}
                      className="w-full px-3 py-2 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium text-gray-900 capitalize">{subject}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {data.total_filled}/{data.total_required}
                        </span>
                        {expandedSubjects.has(subject) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedSubjects.has(subject) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="bg-gray-50"
                      >
                        <div className="p-2 space-y-1">
                          {data.sections?.map((section: any) => (
                            <div
                              key={section.section_id}
                              className="px-3 py-2 bg-white rounded border border-gray-200 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">
                                  {section.section_name}
                                </span>
                                {section.status === 'complete' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : section.status === 'overflow' ? (
                                  <AlertCircle className="w-4 h-4 text-orange-500" />
                                ) : null}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {section.question_type.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {section.current}/{section.required} filled
                                {section.remaining > 0 && (
                                  <span className="text-indigo-600 ml-1">
                                    ({section.remaining} needed)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No pattern sections found</p>
                <p className="text-gray-500 text-xs mt-1">
                  Please ensure your exam pattern has sections defined
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Questions by Subject */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Extracted Questions ({questions.length})</h3>
            
            {Object.keys(groupedQuestions).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedQuestions).map(([subject, subjectQuestions]) => (
                  <SubjectQuestionGroup
                    key={subject}
                    subject={subject}
                    questions={subjectQuestions}
                    patternStructure={patternStructure}
                    mappings={mappings}
                    onAssign={handleAssignToSection}
                    onBulkAssign={handleBulkAssign}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No questions to map</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={handleContinue}
          disabled={analyzing || Object.keys(mappings).length === 0}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Continue to Review</span>
          )}
        </button>
      </div>
    </div>
  );
}

// Sub-component for displaying questions grouped by subject
function SubjectQuestionGroup({
  subject,
  questions,
  patternStructure,
  mappings,
  onAssign,
  onBulkAssign,
}: {
  subject: string;
  questions: any[];
  patternStructure: any;
  mappings: Record<number, any>;
  onAssign: (questionId: number, sectionId: number, subject: string) => void;
  onBulkAssign: (questionIds: number[], sectionId: number, subject: string) => void;
}) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [bulkSection, setBulkSection] = useState<string>('');

  const toggleQuestion = (questionId: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map((q: any) => q.id)));
    }
  };

  const handleBulkAssign = () => {
    if (bulkSection && selectedQuestions.size > 0) {
      onBulkAssign(Array.from(selectedQuestions), parseInt(bulkSection), subject);
      setSelectedQuestions(new Set());
      setBulkSection('');
    }
  };

  const availableSections = patternStructure?.subjects?.[subject]?.sections || [];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedQuestions.size === questions.length}
              onChange={toggleAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <h4 className="font-semibold text-gray-900 capitalize">
              {subject} ({questions.length} questions)
            </h4>
          </div>

          {selectedQuestions.size > 0 && (
            <div className="flex items-center space-x-2">
              <select
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Assign to section...</option>
                {availableSections.map((section: any) => (
                  <option key={section.section_id} value={section.section_id}>
                    {section.section_name} ({section.remaining} needed)
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkSection}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Assign {selectedQuestions.size}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {questions.map((question: any) => (
          <QuestionMappingItem
            key={question.id}
            question={question}
            sections={availableSections}
            isSelected={selectedQuestions.has(question.id)}
            mapping={mappings[question.id]}
            onToggle={() => toggleQuestion(question.id)}
            onAssign={(sectionId) => onAssign(question.id, sectionId, subject)}
          />
        ))}
      </div>
    </div>
  );
}

// Sub-component for individual question mapping
function QuestionMappingItem({ 
  question, 
  sections, 
  isSelected, 
  mapping, 
  onToggle, 
  onAssign 
}: {
  question: any;
  sections: any[];
  isSelected: boolean;
  mapping: any;
  onToggle: () => void;
  onAssign: (sectionId: number) => void;
}) {
  return (
    <div className={`p-4 ${isSelected ? 'bg-indigo-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 line-clamp-2">{question.question_text}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {question.question_type.replace('_', ' ')}
            </span>
            <span>Confidence: {(question.confidence_score * 100).toFixed(0)}%</span>
            {question.detection_reasoning && (
              <span className="italic">{question.detection_reasoning}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <select
            value={mapping?.sectionId || ''}
            onChange={(e) => onAssign(parseInt(e.target.value))}
            className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select section...</option>
            {sections.map((section: any) => (
              <option key={section.section_id} value={section.section_id}>
                {section.section_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
