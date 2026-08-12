import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Package, FileText, Tag } from 'lucide-react';
import { api, getErrorMessage } from '../../hooks/useApi';

interface FinalizationStepProps {
  examId: number;
  patternId: number;
  jobId: string;
  mappings: Record<number, any>;
  onComplete: () => void;
}

export default function FinalizationStep({
  examId,
  patternId,
  jobId,
  mappings,
  onComplete,
}: FinalizationStepProps) {
  const [summary, setSummary] = useState<any>(null);
  const [, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [patternSections, setPatternSections] = useState<any[]>([]);

  useEffect(() => {
    loadPatternAndQuestions();
  }, [jobId, mappings, patternId]);

  const loadPatternAndQuestions = async () => {
    try {
      setLoading(true);
      // Fetch pattern to get section ranges
      const patternResponse = await api.get(`/patterns/patterns/${patternId}/`);
      const sections = patternResponse.data.sections || [];
      setPatternSections(sections);
      
      // Now load questions
      await loadQuestionsAndCalculateSummary();
    } catch (error) {
      console.error('Failed to load pattern:', error);
      await loadQuestionsAndCalculateSummary();
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsAndCalculateSummary = async () => {
    try {
      // Fetch the extracted questions
      const response = await api.get(`/questions/extracted/${jobId}/`);
      const allQuestions = response.data.questions || [];
      
      // Filter to only mapped questions
      const mappedQuestionIds = Object.keys(mappings).map(id => parseInt(id));
      const mappedQuestions = allQuestions.filter((q: any) => 
        mappedQuestionIds.includes(q.id)
      );
      
      setQuestions(mappedQuestions);
      
      // Calculate summary
      const bySubject: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const sectionsAffected: Set<number> = new Set();
      
      mappedQuestions.forEach((q: any) => {
        // Count by subject
        const mapping = mappings[q.id];
        if (mapping && mapping.subject) {
          bySubject[mapping.subject] = (bySubject[mapping.subject] || 0) + 1;
          sectionsAffected.add(mapping.sectionId);
        }
        
        // Count by type
        const type = q.question_type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });
      
      setSummary({
        totalQuestions: mappedQuestions.length,
        bySubject,
        byType,
        sectionsAffected: sectionsAffected.size,
      });
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Fallback to basic summary
      setSummary({
        totalQuestions: Object.keys(mappings).length,
        bySubject: {},
        byType: {},
        sectionsAffected: new Set(Object.values(mappings).map((m: any) => m.sectionId)).size,
      });
    }
  };

  const handleFinalize = async () => {
    setShowConfirmDialog(false);
    setImporting(true);

    try {
      // Prepare mappings for API with question numbers
      // Group by section to assign sequential question numbers
      const sectionGroups: Record<number, any[]> = {};
      
      Object.entries(mappings).forEach(([questionId, mapping]) => {
        const sectionId = mapping.sectionId;
        if (!sectionGroups[sectionId]) {
          sectionGroups[sectionId] = [];
        }
        sectionGroups[sectionId].push({
          questionId: parseInt(questionId),
          subject: mapping.subject,
          sectionId: sectionId,
        });
      });
      
      // Fetch existing questions for each section to determine next available numbers
      const sectionQuestionCounts: Record<number, number> = {};
      for (const sectionId of Object.keys(sectionGroups)) {
        try {
          const response = await api.get(`/questions/questions/?pattern_section=${sectionId}${examId ? `&exam=${examId}` : ''}`);
          const existingQuestions = response.data?.results || response.data || [];
          sectionQuestionCounts[parseInt(sectionId)] = existingQuestions.length;
        } catch (error) {
          console.error(`Failed to fetch existing questions for section ${sectionId}:`, error);
          sectionQuestionCounts[parseInt(sectionId)] = 0;
        }
      }
      
      // Assign question numbers within each section
      const mappingsArray: any[] = [];
      Object.entries(sectionGroups).forEach(([sectionIdStr, group]) => {
        const sectionId = parseInt(sectionIdStr);
        const section = patternSections.find(s => s.id === sectionId);
        
        if (!section) {
          console.error(`Section ${sectionId} not found in pattern`);
          return;
        }
        
        // Get the starting absolute question number for this section
        const absoluteStart = section.start_question;
        const existingCount = sectionQuestionCounts[sectionId] || 0;
        
        group.forEach((item, index) => {
          // Calculate absolute question number
          const absoluteQuestionNumber = absoluteStart + existingCount + index;
          // Calculate subject-local question number (1-based within section)
          const subjectLocalNumber = existingCount + index + 1;
          
          mappingsArray.push({
            extracted_question_id: item.questionId,
            subject: item.subject,
            section_id: item.sectionId,
            question_number: absoluteQuestionNumber, // Absolute question number in exam
            question_number_in_pattern: subjectLocalNumber, // Subject-local question number
          });
        });
      });

      const response = await api.post('/questions/bulk-import-extracted/', {
        job_id: jobId,
        question_ids: Object.keys(mappings).map(id => parseInt(id)),
        mappings: mappingsArray,
      });

      setImportResult(response.data);
      
      // Wait a moment to show success, then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        error: getErrorMessage(error, 'Import failed'),
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Loading summary...</span>
      </div>
    );
  }

  if (importing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Importing Questions...
        </h3>
        <p className="text-gray-600">
          Please wait while we import {Object.keys(mappings).length} questions into your exam.
        </p>
        <div className="mt-6 w-full max-w-md">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-indigo-600 h-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (importResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {importResult.success ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Import Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              {importResult.imported_count} questions have been imported successfully.
            </p>
            {importResult.failed_count > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md">
                <p className="text-sm text-yellow-800">
                  {importResult.failed_count} questions failed to import.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">Redirecting to question list...</p>
          </>
        ) : (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Import Failed
            </h3>
            <p className="text-gray-600 mb-6">{importResult.error}</p>
            <button
              onClick={() => setImportResult(null)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review & Finalize</h2>
        <p className="text-gray-600 mt-2">
          Review the import summary and finalize to add questions to your exam.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <SummaryCard
          icon={Package}
          title="Total Questions"
          value={Object.keys(mappings).length}
          color="indigo"
        />
        <SummaryCard
          icon={FileText}
          title="Sections Affected"
          value={summary?.sectionsAffected || 0}
          color="blue"
        />
        <SummaryCard
          icon={Tag}
          title="Question Types"
          value={Object.keys(summary?.byType || {}).length}
          color="purple"
        />
      </div>

      {/* Detailed Summary */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Import Details</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* By Subject */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">By Subject</h4>
            <div className="space-y-2">
              {Object.entries(summary?.bySubject || {}).map(([subject, count]) => (
                <div key={subject} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{subject}</span>
                  <span className="text-sm font-medium text-gray-900">{count} questions</span>
                </div>
              ))}
              {Object.keys(summary?.bySubject || {}).length === 0 && (
                <p className="text-sm text-gray-500 italic">No subject breakdown available</p>
              )}
            </div>
          </div>

          {/* By Type */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">By Question Type</h4>
            <div className="space-y-2">
              {Object.entries(summary?.byType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{type.replace('_', ' ')}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
              {Object.keys(summary?.byType || {}).length === 0 && (
                <p className="text-sm text-gray-500 italic">No type breakdown available</p>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Questions will be added to the selected sections</li>
              <li>Question numbers will be assigned automatically</li>
              <li>You can edit questions after import</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={() => setShowConfirmDialog(true)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          Finalize Import
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          questionCount={Object.keys(mappings).length}
          onConfirm={handleFinalize}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, color }: any) {
  const colorClasses = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-center space-x-3 mb-3">
        <Icon className="w-6 h-6" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function ConfirmDialog({ questionCount, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Import
            </h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to import {questionCount} questions into your exam?
            This action cannot be undone.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirm Import
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
