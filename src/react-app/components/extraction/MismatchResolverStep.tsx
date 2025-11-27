import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';

interface MismatchResolverStepProps {
  mismatches: any;
  questions: any[];
  mappings: Record<number, any>;
  onResolved: () => void;
}

export default function MismatchResolverStep({
  mismatches,
  questions,
  mappings,
  onResolved,
}: MismatchResolverStepProps) {
  const [deselectedQuestions, setDeselectedQuestions] = useState<Set<number>>(new Set());

  if (!mismatches || !mismatches.summary?.has_mismatches) {
    // No mismatches, proceed directly
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Mismatches Found!
        </h3>
        <p className="text-gray-600 mb-6">
          All questions fit perfectly within the pattern requirements.
        </p>
        <button
          onClick={onResolved}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Continue to Finalize
        </button>
      </div>
    );
  }

  const { mismatches: mismatchList, summary } = mismatches;

  const toggleQuestion = (questionId: number) => {
    setDeselectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const autoSelectLowestConfidence = (mismatch: any) => {
    // Find questions for this section
    const sectionQuestions = questions.filter((q) => {
      const mapping = mappings.get(q.id);
      return mapping?.sectionId === mismatch.section_id;
    });

    // Sort by confidence (lowest first)
    const sorted = [...sectionQuestions].sort(
      (a, b) => a.confidence_score - b.confidence_score
    );

    // Deselect the lowest confidence questions up to excess count
    const toDeselect = sorted.slice(0, mismatch.excess);
    const newDeselected = new Set(deselectedQuestions);
    toDeselect.forEach((q) => newDeselected.add(q.id));
    setDeselectedQuestions(newDeselected);
  };

  const canContinue = () => {
    // Check if all overflow mismatches are resolved
    return mismatchList.every((mismatch: any) => {
      if (mismatch.status !== 'overflow') return true;
      
      const sectionQuestions = questions.filter((q) => {
        const mapping = mappings[q.id];
        return mapping?.sectionId === mismatch.section_id;
      });
      
      const selectedCount = sectionQuestions.filter(
        (q) => !deselectedQuestions.has(q.id)
      ).length;
      
      return selectedCount <= mismatch.required;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resolve Mismatches</h2>
        <p className="text-gray-600 mt-2">
          Some sections have overflow or shortage. Please review and resolve.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Overflow</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {summary.total_overflow}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            {summary.sections_with_overflow} sections affected
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Shortage</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {summary.total_shortage}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {summary.sections_with_shortage} sections affected
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Total Issues</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {mismatchList.length}
          </p>
          <p className="text-xs text-gray-600 mt-1">sections need attention</p>
        </div>
      </div>

      {/* Mismatch List */}
      <div className="space-y-4">
        {mismatchList.map((mismatch: any) => (
          <MismatchCard
            key={`${mismatch.subject}-${mismatch.section_id}`}
            mismatch={mismatch}
            questions={questions}
            mappings={mappings}
            deselectedQuestions={deselectedQuestions}
            onToggleQuestion={toggleQuestion}
            onAutoSelect={() => autoSelectLowestConfidence(mismatch)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={onResolved}
          disabled={!canContinue()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Finalize
        </button>
      </div>
    </div>
  );
}

function MismatchCard({
  mismatch,
  questions,
  mappings,
  deselectedQuestions,
  onToggleQuestion,
  onAutoSelect,
}: {
  mismatch: any;
  questions: any[];
  mappings: Record<number, any>;
  deselectedQuestions: Set<number>;
  onToggleQuestion: (questionId: number) => void;
  onAutoSelect: () => void;
}) {
  const isOverflow = mismatch.status === 'overflow';
  const isShortage = mismatch.status === 'shortage';

  // Get questions for this section
  const sectionQuestions = questions.filter((q: any) => {
    const mapping = mappings[q.id];
    return mapping?.sectionId === mismatch.section_id;
  });

  const selectedCount = sectionQuestions.filter(
    (q: any) => !deselectedQuestions.has(q.id)
  ).length;

  const isResolved = isOverflow ? selectedCount <= mismatch.required : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg overflow-hidden ${
        isOverflow
          ? 'border-orange-200 bg-orange-50'
          : 'border-blue-200 bg-blue-50'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${isOverflow ? 'bg-orange-100' : 'bg-blue-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOverflow ? (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            ) : (
              <Info className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <h4 className="font-semibold text-gray-900">
                {mismatch.subject} - {mismatch.section_name}
              </h4>
              <p className="text-sm text-gray-600">{mismatch.message}</p>
            </div>
          </div>
          {isResolved && (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          )}
        </div>

        <div className="mt-2 flex items-center space-x-6 text-sm">
          <span>
            <span className="font-medium">Required:</span> {mismatch.required}
          </span>
          <span>
            <span className="font-medium">Extracted:</span> {mismatch.extracted}
          </span>
          <span>
            <span className="font-medium">Current:</span> {mismatch.current}
          </span>
          {isOverflow && (
            <span className="text-orange-700">
              <span className="font-medium">Excess:</span> {mismatch.excess}
            </span>
          )}
          {isShortage && (
            <span className="text-blue-700">
              <span className="font-medium">Shortage:</span> {mismatch.shortage}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isOverflow && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-700">
                Please deselect {mismatch.excess} question(s):
              </p>
              <button
                onClick={onAutoSelect}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Auto-select lowest confidence
              </button>
            </div>

            <div className="space-y-2">
              {sectionQuestions.map((question: any) => (
                <div
                  key={question.id}
                  className={`p-3 rounded border ${
                    deselectedQuestions.has(question.id)
                      ? 'bg-gray-100 border-gray-300 opacity-60'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={!deselectedQuestions.has(question.id)}
                      onChange={() => onToggleQuestion(question.id)}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {question.question_text}
                      </p>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        <span>Confidence: {(question.confidence_score * 100).toFixed(0)}%</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {question.question_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Selected: {selectedCount} / {mismatch.required} (
              {selectedCount > mismatch.required ? (
                <span className="text-orange-600 font-medium">
                  {selectedCount - mismatch.required} too many
                </span>
              ) : (
                <span className="text-green-600 font-medium">✓ Resolved</span>
              )}
              )
            </div>
          </>
        )}

        {isShortage && (
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Only {mismatch.extracted} questions found, but {mismatch.shortage} more needed.
              You'll need to add {mismatch.shortage} questions manually after import.
            </p>
            <div className="mt-3 flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Continue Anyway
              </button>
              <button className="px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-50">
                Cancel Import
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
