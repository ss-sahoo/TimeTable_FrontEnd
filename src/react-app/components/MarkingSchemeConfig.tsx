import React, { useState } from 'react';
import { 
  Calculator, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Settings,
  HelpCircle,
  Minus,
  Plus
} from 'lucide-react';
import { MarkingScheme } from '../../shared/types';

interface MarkingSchemeConfigProps {
  questionType: 'Single Correct MCQ' | 'Multiple Correct MCQ' | 'Numerical' | 'Subjective' | 'True/False' | 'Fill in the Blanks';
  markingScheme: MarkingScheme;
  onChange: (scheme: MarkingScheme) => void;
  disabled?: boolean;
}

export default function MarkingSchemeConfig({ 
  questionType, 
  markingScheme, 
  onChange, 
  disabled = false 
}: MarkingSchemeConfigProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (field: keyof MarkingScheme, value: any) => {
    onChange({
      ...markingScheme,
      [field]: value
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'Single Correct MCQ':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'Multiple Correct MCQ':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Numerical':
        return <Calculator className="w-4 h-4 text-purple-600" />;
      case 'Subjective':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'True/False':
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      case 'Fill in the Blanks':
        return <AlertCircle className="w-4 h-4 text-pink-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMarkingRules = (type: string) => {
    switch (type) {
      case 'Single Correct MCQ':
        return [
          '✅ If correct option is marked: Full marks',
          '⭕ If no option is marked: Zero marks',
          '❌ In Any other case: Deduct negative marks'
        ];
      case 'Multiple Correct MCQ':
        return [
          '✅ Correct options marked: Marks per correct option',
          '❌ Incorrect options marked: Deduct negative marks',
          '⭕ No options marked: Zero marks',
          '📊 Partial marking: Configurable per correct/incorrect option'
        ];
      case 'Numerical':
        return [
          '✅ Correct value (±tolerance): Full marks',
          '⭕ Unattempted: Zero marks',
          '❌ Wrong value: Deduct negative marks',
          '🔢 Decimal precision: Configurable rounding'
        ];
      case 'Subjective':
        return [
          '✅ Any attempt: Full marks (manual grading)',
          '⭕ No attempt: Zero marks'
        ];
      case 'True/False':
        return [
          '✅ Correct answer: Full marks',
          '⭕ No answer: Zero marks',
          '❌ Wrong answer: Deduct negative marks'
        ];
      case 'Fill in the Blanks':
        return [
          '✅ Correct answer: Full marks',
          '⭕ No answer: Zero marks',
          '❌ Wrong answer: Deduct negative marks'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#e5e7eb' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getQuestionTypeIcon(questionType)}
          <h3 className="text-sm font-semibold text-black">Marking Scheme - {questionType}</h3>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1 hover:bg-gray-100 rounded"
          style={{ color: '#6b6b6b' }}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-800 mb-2">Marking Rules:</h4>
          <ul className="space-y-1">
            {getMarkingRules(questionType).map((rule, index) => (
              <li key={index} className="text-xs text-blue-700">{rule}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Max Marks */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>
            Max Marks *
          </label>
          <input
            type="number"
            value={markingScheme.max_marks}
            onChange={(e) => handleChange('max_marks', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:outline-none"
            style={{
              borderColor: '#e5e7eb',
              color: '#000000'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3f5fd4';
              e.target.style.ringColor = '#3f5fd4';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
            min="1"
            disabled={disabled}
          />
        </div>

        {/* Negative Marking (in marks) */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>
            Negative Marking (marks)
          </label>
          <input
            type="number"
            value={markingScheme.negative_marks || 0}
            onChange={(e) => handleChange('negative_marks', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:outline-none"
            style={{
              borderColor: '#e5e7eb',
              color: '#000000'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3f5fd4';
              e.target.style.ringColor = '#3f5fd4';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
            min="0"
            disabled={disabled || questionType === 'Subjective'}
          />
          {questionType === 'Subjective' && (
            <p className="text-xs text-slate-500 mt-1">
              Negative marking disabled for subjective questions
            </p>
          )}
        </div>

        {/* Multiple Correct MCQ Specific */}
        {questionType === 'Multiple Correct MCQ' && (
          <>
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={markingScheme.partial_marking || false}
                  onChange={(e) => handleChange('partial_marking', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  style={{ accentColor: '#216865' }}
                  disabled={disabled}
                />
                <label className="text-xs font-medium" style={{ color: '#6b6b6b' }}>
                  Enable Partial Marking
                </label>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                If enabled, marks are awarded per correct option selected. If disabled, all-or-nothing marking.
              </p>
            </div>

            {markingScheme.partial_marking && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>
                  Marks per Correct Option
                </label>
                <input
                  type="number"
                  value={markingScheme.marks_per_correct_option ?? 1}
                  onChange={(e) => handleChange('marks_per_correct_option', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:outline-none"
                  style={{
                    borderColor: '#e5e7eb',
                    color: '#000000'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3f5fd4';
                    e.target.style.ringColor = '#3f5fd4';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                  min="0"
                  step="0.1"
                  disabled={disabled}
                />
              </div>
            )}
          </>
        )}

        {/* Numerical Specific */}
        {questionType === 'Numerical' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>
                Tolerance Range (±)
              </label>
              <input
                type="number"
                value={markingScheme.tolerance_range || 0}
                onChange={(e) => handleChange('tolerance_range', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:outline-none"
                style={{
                  borderColor: '#e5e7eb',
                  color: '#000000'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3f5fd4';
                  e.target.style.ringColor = '#3f5fd4';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                }}
                min="0"
                step="0.01"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6b6b6b' }}>
                Decimal Precision
              </label>
              <input
                type="number"
                value={markingScheme.decimal_precision || 2}
                onChange={(e) => handleChange('decimal_precision', parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:outline-none"
                style={{
                  borderColor: '#e5e7eb',
                  color: '#000000'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3f5fd4';
                  e.target.style.ringColor = '#3f5fd4';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                }}
                min="0"
                max="10"
                disabled={disabled}
              />
            </div>
          </>
        )}

        {/* Subjective Specific */}
        {questionType === 'Subjective' && (
          <div className="col-span-2">
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Info className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs font-medium text-orange-800">Manual Grading Required</p>
                <p className="text-xs text-orange-700">
                  Subjective questions require manual evaluation. Full marks will be awarded for any attempt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Marking Preview */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-xs font-semibold text-gray-800 mb-2">Marking Preview:</h4>
        <div className="text-xs text-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>Max Marks:</span>
            <span className="font-medium">{markingScheme.max_marks}</span>
          </div>
          <div className="flex justify-between">
            <span>Negative Marking:</span>
            <span className="font-medium">-{markingScheme.negative_marks || 0} marks</span>
          </div>
          {questionType === 'Multiple Correct MCQ' && markingScheme.partial_marking && (
            <div className="flex justify-between">
              <span>Per Correct Option:</span>
              <span className="font-medium">{markingScheme.marks_per_correct_option || 0}</span>
            </div>
          )}
          {questionType === 'Numerical' && (
            <>
              <div className="flex justify-between">
                <span>Tolerance Range:</span>
                <span className="font-medium">±{markingScheme.tolerance_range || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Decimal Precision:</span>
                <span className="font-medium">{markingScheme.decimal_precision || 2} places</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
